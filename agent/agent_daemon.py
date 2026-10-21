#!/usr/bin/env python3
"""MoneypenneyAgent - Google Drive auto-classifier.

DRY-RUN BY DEFAULT. Nothing in Drive is modified unless --apply is passed.

Modes:
  (default)   classify a batch and write a report of PROPOSED moves
  --apply     actually reparent + tag files, recording a reversal ledger
  --revert F  undo a prior --apply batch using its ledger file
"""
import argparse
import datetime as dt
import json
import os
import random
import sys
import time

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

VERSION = "11"
AGENT_TAG = "MoneypenneyAgent"
SCOPES = ["https://www.googleapis.com/auth/drive"]
# Sibling project ainie-knowfind (same taxonomy, mock corpus) runs
# gemini-3.8-flash. Override here rather than editing the source.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
RETRYABLE = {429, 500, 502, 503, 504}

BASE = os.path.dirname(os.path.abspath(__file__))


def load_taxonomy():
    """The nine domains come from taxonomy.json, shared with the UI.

    Never re-list them here: the TypeScript side derives its literal union
    from the same file via scripts/gen-taxonomy.mjs, so a name added in one
    place reaches both. Looked up next to this script first (how it is
    deployed) then one level up (how it sits in the repo).
    """
    for candidate in (os.path.join(BASE, "taxonomy.json"),
                      os.path.join(os.path.dirname(BASE), "taxonomy.json")):
        if os.path.exists(candidate):
            with open(candidate) as fh:
                return json.load(fh)["domains"], candidate
    sys.exit(
        "[!] taxonomy.json not found next to agent_daemon.py or one level up.\n"
        "    It is the shared source of truth for the nine domains and must be\n"
        "    deployed alongside the agent (scripts/deploy-to-vault.sh does this)."
    )


DOMAINS, TAXONOMY_PATH = load_taxonomy()
CATEGORIES = [d["domain"] for d in DOMAINS]

BASE = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------
# retry
# --------------------------------------------------------------------------
def with_backoff(fn, what, attempts=6):
    """Run fn(), retrying on 429/5xx with exponential backoff + jitter."""
    delay = 1.0
    for i in range(attempts):
        try:
            return fn()
        except HttpError as e:
            code = getattr(e.resp, "status", None)
            if code not in RETRYABLE or i == attempts - 1:
                raise
            log(f"    [retry] {what}: HTTP {code}, sleeping {delay:.1f}s "
                f"({i + 1}/{attempts - 1})")
        except requests.RequestException as e:
            if i == attempts - 1:
                raise
            log(f"    [retry] {what}: {type(e).__name__}, sleeping {delay:.1f}s "
                f"({i + 1}/{attempts - 1})")
        time.sleep(delay + random.uniform(0, delay * 0.3))
        delay = min(delay * 2, 60)


class QuotaExhausted(Exception):
    """A daily quota is gone. Retrying is pointless and wastes the next day's
    budget, so this is deliberately NOT in the retryable path."""

    def __init__(self, quota_id, value, retry_after_s):
        self.quota_id = quota_id
        self.value = value
        self.retry_after_s = retry_after_s
        super().__init__(f"{quota_id} ({value}/day), retry in {retry_after_s}s")


def _classify_429(resp):
    """Tell a transient rate-limit apart from an exhausted daily quota."""
    try:
        err = resp.json().get("error", {})
    except Exception:
        return None
    quota_id, value, delay = None, None, 0
    for det in err.get("details", []):
        # "type.googleapis.com/google.rpc.QuotaFailure" -- split on "/" alone
        # leaves "google.rpc.QuotaFailure", which matches nothing.
        kind = det.get("@type", "").rsplit(".", 1)[-1]
        if kind == "QuotaFailure":
            for v in det.get("violations", []):
                quota_id = v.get("quotaId", "")
                value = v.get("quotaValue")
        elif kind == "RetryInfo":
            raw = str(det.get("retryDelay", "0s")).rstrip("s")
            try:
                delay = int(float(raw))
            except ValueError:
                delay = 0
    # A per-day cap, or any wait longer than a couple of minutes, is not
    # something a retry loop should sit through.
    if (quota_id and "PerDay" in quota_id) or delay > 120:
        return QuotaExhausted(quota_id or "unknown", value, delay)
    return None


def log(msg):
    print(msg, flush=True)


def stamp():
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


# --------------------------------------------------------------------------
# auth
# --------------------------------------------------------------------------
def get_drive_service():
    """Load an existing token. Never launches an interactive flow.

    thevault is headless; consent is performed on the workstation by
    authorize_local.py and token.json is copied over.
    """
    token_path = os.path.join(BASE, "token.json")
    if not os.path.exists(token_path):
        sys.exit(
            "[!] No token.json found at %s\n"
            "    This host is headless and cannot run the consent flow.\n"
            "    Run authorize_local.py on a machine with a browser, then\n"
            "    copy the resulting token.json here with mode 600." % token_path
        )
    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as fh:
                fh.write(creds.to_json())
            os.chmod(token_path, 0o600)
        else:
            sys.exit("[!] token.json is invalid and cannot be refreshed. "
                     "Re-run authorize_local.py.")
    return build("drive", "v3", credentials=creds, cache_discovery=False)


# --------------------------------------------------------------------------
# classification
# --------------------------------------------------------------------------
def _domain_brief():
    """One line per domain, with the description and key signals the UI uses.

    The original spec sent only the bare category names, which is a far weaker
    prompt than the taxonomy already contains.
    """
    out = []
    for d in DOMAINS:
        signals = "; ".join(d.get("keySignals", []))
        out.append(f"- {d['domain']}: {d['description']}"
                   + (f" Typical signals: {signals}." if signals else ""))
    return "\n".join(out)


PROMPT = """You are an autonomous document classifier. Classify the document
into EXACTLY ONE of these domains:

{domains}

CRITICAL: Taxes, invoices, medical records, passports, personal shipping/flights go to 'Personal'.

Document Title: {name}
Snippet: {snippet}

Return JSON with keys: category, confidence, reason."""


def call_gemini(api_key, name, snippet=""):
    """Classify one file. Returns (verdict_dict, api_failed_bool)."""
    if not api_key:
        return {"category": "Others", "reason": "No API key provided",
                "confidence": 0.0}, True

    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent")
    body = {
        "contents": [{"parts": [{"text": PROMPT.format(
            domains=_domain_brief(), name=name, snippet=snippet)}]}],
        "generationConfig": {"temperature": 0.1,
                             "responseMimeType": "application/json"},
    }

    def _post():
        r = requests.post(url, json=body, timeout=30,
                          headers={"x-goog-api-key": api_key})
        if r.status_code == 429:
            fatal = _classify_429(r)
            if fatal:
                raise fatal
        if r.status_code in RETRYABLE:
            raise requests.RequestException(f"HTTP {r.status_code}")
        r.raise_for_status()
        return r

    try:
        resp = _post_with_backoff(_post)
        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw), False
    except QuotaExhausted:
        raise
    except Exception as e:
        # Distinct from a genuine low-confidence 'Others' classification.
        log(f"    [!] GEMINI FAILURE for {name!r}: {type(e).__name__}: {e}")
        return {"category": "Others", "reason": f"API_FAILURE: {e}",
                "confidence": 0.0}, True


def _post_with_backoff(fn, attempts=5):
    delay = 1.0
    for i in range(attempts):
        try:
            return fn()
        except QuotaExhausted:
            raise                      # never retry an exhausted daily quota
        except requests.RequestException:
            if i == attempts - 1:
                raise
            time.sleep(delay + random.uniform(0, delay * 0.3))
            delay = min(delay * 2, 60)


# --------------------------------------------------------------------------
# drive helpers
# --------------------------------------------------------------------------
def resolve_category_folders(service, create):
    """Find each category folder AT THE DRIVE ROOT ONLY.

    The original spec searched by name across the whole Drive, which would
    happily match a nested folder of the same name. Scoping to 'root' in
    parents is the fix. Duplicates are reported, never silently picked.
    """
    folders, missing, dupes = {}, [], {}
    for cat in CATEGORIES:
        safe = cat.replace("\\", "\\\\").replace("'", "\\'")
        q = (f"name = '{safe}' and "
             "mimeType = 'application/vnd.google-apps.folder' and "
             "trashed = false and 'root' in parents")
        res = with_backoff(
            lambda: service.files().list(
                q=q, fields="files(id,name)", pageSize=10,
                spaces="drive").execute(),
            f"folder lookup {cat}")
        found = res.get("files", [])
        if len(found) > 1:
            dupes[cat] = [f["id"] for f in found]
        if found:
            folders[cat] = sorted(found, key=lambda f: f["id"])[0]["id"]
        elif create:
            f = with_backoff(
                lambda: service.files().create(
                    body={"name": cat,
                          "mimeType": "application/vnd.google-apps.folder"},
                    fields="id").execute(),
                f"folder create {cat}")
            folders[cat] = f["id"]
            log(f"    [+] created root folder {cat!r}")
        else:
            missing.append(cat)
    return folders, missing, dupes


def list_candidates(service, days, limit, server_filter=False):
    """Files not yet processed by this agent.

    The spec used  not appProperties has { key='processed_by' and value='...' }
    which is NOT a documented Drive v3 query form. We filter client-side by
    default and only use the server form when --server-filter is passed.
    """
    cutoff = (dt.datetime.now() - dt.timedelta(days=days)).strftime(
        "%Y-%m-%dT00:00:00Z")
    q = (f"modifiedTime >= '{cutoff}' and trashed = false and "
         "mimeType != 'application/vnd.google-apps.folder'")
    if server_filter:
        q += (" and not appProperties has "
              "{ key='processed_by' and value='" + AGENT_TAG + "' }")

    out, token, scanned = [], None, 0
    while len(out) < limit:
        res = with_backoff(
            lambda: service.files().list(
                q=q, pageSize=100, pageToken=token, spaces="drive",
                fields=("nextPageToken, files(id,name,description,parents,"
                        "appProperties,mimeType,modifiedTime)")).execute(),
            "candidate listing")
        for f in res.get("files", []):
            scanned += 1
            if (f.get("appProperties") or {}).get("processed_by") == AGENT_TAG:
                continue
            out.append(f)
            if len(out) >= limit:
                break
        token = res.get("nextPageToken")
        if not token:
            break
    return out, scanned


# --------------------------------------------------------------------------
# modes
# --------------------------------------------------------------------------
def classify_batch(service, api_key, args):
    files, scanned = list_candidates(service, args.days, args.limit,
                                     args.server_filter)
    folders, missing, dupes = resolve_category_folders(
        service, create=args.apply)

    if dupes:
        log("[!] Duplicate root folders found - NOT guessing:")
        for cat, ids in dupes.items():
            log(f"    {cat!r}: {len(ids)} folders at root")
    if missing and not args.apply:
        log(f"[i] Would create {len(missing)} root folder(s): "
            f"{', '.join(missing)}")

    log(f"[*] Scanned {scanned} file(s), {len(files)} unprocessed "
        f"(limit {args.limit}, window {args.days}d)")
    if not files:
        log("[v] Nothing to do.")
        return []

    rows, api_failures = [], 0
    for f in files:
        try:
            verdict, failed = call_gemini(api_key, f["name"],
                                          f.get("description", ""))
        except QuotaExhausted as q:
            hours = q.retry_after_s / 3600.0
            log("")
            log(f"[!] DAILY QUOTA EXHAUSTED after {len(rows)} file(s).")
            log(f"    {q.quota_id} allows {q.value} request(s) per day for "
                f"{GEMINI_MODEL}.")
            log(f"    Resets in about {hours:.1f}h. Stopping now rather than "
                f"retrying - retries cannot succeed and would only")
            log(f"    burn into tomorrow's budget. The {len(files) - len(rows)} "
                f"remaining file(s) were not classified.")
            log("    Options: enable billing on the Google Cloud project, or "
                "run smaller batches with --limit.")
            break
        api_failures += failed
        cat = verdict.get("category", "Others")
        if cat not in CATEGORIES:
            cat = "Others"
        rows.append({
            "file_id": f["id"],
            "name": f["name"],
            "mime_type": f.get("mimeType"),
            "modified": f.get("modifiedTime"),
            "original_parents": f.get("parents", []),
            "target_category": cat,
            "target_folder_id": folders.get(cat),
            "confidence": verdict.get("confidence", 0.0),
            "reason": str(verdict.get("reason", ""))[:200],
            "api_failed": failed,
        })
        mark = "!" if failed else "-"
        log(f"  {mark}> [{cat}] ({float(verdict.get('confidence', 0)) * 100:.0f}%) "
            f"{f['name']!r}")

    if api_failures:
        log(f"[!] {api_failures}/{len(files)} classification(s) came from an "
            f"API FAILURE, not real judgement. Treat those as unclassified.")
    return rows


def write_report(rows, args):
    os.makedirs(os.path.join(BASE, "reports"), exist_ok=True)
    tag = stamp()
    jpath = os.path.join(BASE, "reports", f"dryrun-{tag}.json")
    mpath = os.path.join(BASE, "reports", f"dryrun-{tag}.md")
    with open(jpath, "w") as fh:
        json.dump({"version": VERSION, "generated": tag, "mode": "dry-run",
                   "proposals": rows}, fh, indent=2)

    by_cat = {}
    for r in rows:
        by_cat.setdefault(r["target_category"], []).append(r)
    with open(mpath, "w") as fh:
        fh.write(f"# MoneypenneyAgent dry-run {tag}\n\n")
        fh.write(f"{len(rows)} proposed move(s). **Nothing was changed.**\n\n")
        for cat in CATEGORIES:
            items = by_cat.get(cat)
            if not items:
                continue
            fh.write(f"## {cat} ({len(items)})\n\n")
            for r in items:
                flag = " **[API FAILURE]**" if r["api_failed"] else ""
                fh.write(f"- `{r['name']}` - {float(r['confidence']) * 100:.0f}%"
                         f"{flag}\n  - {r['reason']}\n")
            fh.write("\n")
    log(f"[v] Report: {mpath}")
    log(f"[v] Data:   {jpath}")
    return jpath


def apply_batch(service, rows):
    """Reparent + tag. Writes the reversal ledger BEFORE each mutation."""
    os.makedirs(os.path.join(BASE, "ledger"), exist_ok=True)
    lpath = os.path.join(BASE, "ledger", f"apply-{stamp()}.jsonl")
    moved = 0
    with open(lpath, "a") as ledger:
        for r in rows:
            if not r.get("target_folder_id"):
                log(f"    [skip] no target folder for {r['name']!r}")
                continue
            # Durable reversal record lands on disk before Drive changes.
            ledger.write(json.dumps({
                "file_id": r["file_id"], "name": r["name"],
                "original_parents": r["original_parents"],
                "new_parent": r["target_folder_id"],
                "ts": dt.datetime.now().isoformat(),
            }) + "\n")
            ledger.flush()
            os.fsync(ledger.fileno())

            prev = ",".join(r["original_parents"])
            with_backoff(
                lambda: service.files().update(
                    fileId=r["file_id"],
                    addParents=r["target_folder_id"],
                    removeParents=prev,
                    body={"appProperties": {
                        "processed_by": AGENT_TAG,
                        "topic_tag": r["target_category"],
                        "confidence": str(r["confidence"]),
                        "reason": r["reason"][:120],
                        "prior_parents": prev[:120],
                    }},
                    fields="id").execute(),
                f"move {r['name']}")
            moved += 1
            log(f"  -> moved {r['name']!r} to [{r['target_category']}]")
    log(f"[v] Moved {moved} file(s). Ledger: {lpath}")
    log(f"[i] Undo with: python3 agent_daemon.py --revert {lpath}")
    return moved


def revert_batch(service, path):
    n = 0
    with open(path) as fh:
        entries = [json.loads(line) for line in fh if line.strip()]
    for e in reversed(entries):
        orig = ",".join(e["original_parents"])
        if not orig:
            log(f"    [skip] {e['name']!r} had no recorded parent")
            continue
        with_backoff(
            lambda: service.files().update(
                fileId=e["file_id"], addParents=orig,
                removeParents=e["new_parent"],
                body={"appProperties": {
                    "processed_by": None, "topic_tag": None,
                    "confidence": None, "reason": None,
                    "prior_parents": None}},
                fields="id").execute(),
            f"revert {e['name']}")
        n += 1
        log(f"  <- restored {e['name']!r}")
    log(f"[v] Reverted {n} file(s).")
    return n


# --------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(
        description="MoneypenneyAgent - Drive classifier (dry-run by default)")
    p.add_argument("--apply", action="store_true",
                   help="ACTUALLY move and tag files. Off by default.")
    p.add_argument("--revert", metavar="LEDGER",
                   help="Undo a prior --apply batch from its ledger file")
    p.add_argument("--limit", type=int, default=25,
                   help="max files per batch (default 25)")
    p.add_argument("--days", type=int, default=425,
                   help="modifiedTime lookback window (default 425)")
    p.add_argument("--server-filter", action="store_true",
                   help="use the undocumented 'not appProperties has' query "
                        "form instead of filtering client-side")
    p.add_argument("--version", action="version", version=f"MoneypenneyAgent {VERSION}")
    args = p.parse_args()

    service = get_drive_service()

    if args.revert:
        revert_batch(service, args.revert)
        return

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        log("[!] GEMINI_API_KEY not set - every file will fall back to "
            "'Others'. Load it first: source scripts/infisical-env.sh")

    mode = "APPLY (will modify Drive)" if args.apply else "DRY-RUN (no changes)"
    log(f"[*] MoneypenneyAgent v{VERSION} - {mode}")

    rows = classify_batch(service, api_key, args)
    if not rows:
        return
    if args.apply:
        apply_batch(service, rows)
    else:
        write_report(rows, args)
        log("[i] Nothing was changed. Review the report, then re-run with "
            "--apply to execute.")


if __name__ == "__main__":
    main()
