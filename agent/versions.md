# versions.md — gdrive-agent (MoneypenneyAgent)

## 15 — 2026-10-22

`[Bug Fix]` A single untrusted field killed an entire run.

The v14 dry run crashed on file 2 of 12:

```
ValueError: could not convert string to float: 'High'
```

The model returned `"confidence": "High"` instead of a number, and
`float(verdict.get("confidence", 0))` was called unguarded — so one unusual
field aborted the whole batch. Lengthening the prompt in v14 is what changed
the output shape, which is the general lesson: **model output is input, and
every field of it is untrusted.**

`coerce_confidence()` now accepts the unit interval, a 0-100 scale, percent
strings, and the word scale (`very high`/`high`/`medium`/`low`/...), clamps to
0-1, and returns `0.0` for anything it cannot read — including `None`, `{}`
and booleans, since `isinstance(True, int)` is `True` in Python and would
otherwise coerce to 1.0. `coerce_category()` matches domains
case-insensitively and falls back to `Others`.

Both are applied in `classify_batch` and in the report writer, which had the
same unguarded `float()`.

Nine tests added, the first of which is the exact string that crashed the live
run. 48 total.

## 14 — 2026-10-22

`[Bug Fix]` Two residual misclassifications, two distinct causes.

Content extraction fixed the worst case (`define the api`: Personal 100% ->
AI Code Development 95%). Inspecting what remained:

- **`GDRive Xfer` is an Apps Script, `SteuerTom Dashboard` is a Google Site.**
  Neither was exportable, so both were classified from the title alone and
  both landed in `Personal` at 95%. Apps Script *can* export, as
  `application/vnd.google-apps.script+json` — added. Sites and Forms cannot,
  and nothing will change that.
- **`steuerT-spec1` had its full text and still went to `Personal`.** The
  content is *"Product and features system covers the full German
  small-business compliance cycle... the product's main differentiator"* — a
  commercial product spec. The word "tax" was pulling it into Personal. The
  `CRITICAL` instruction was too blunt: it listed topics, so the model matched
  on topic.

  It now says `Personal` means **your own** records — your filed returns, your
  passport, your medical history — and states explicitly that a spec,
  dashboard, business plan or piece of software *about* tax or health is not
  Personal, and should be classified by what the document **is** rather than
  what it discusses.

`[User Request]` **Weak verdicts are now labelled.** A classification reached
with under 50 characters of text is marked `title_only`: `?` instead of `-` in
the console, `[title only - weak]` in the markdown report, and a summary line
counting them. A high confidence number on a filename-only guess is exactly
how the earlier mistakes looked authoritative, so the report now distinguishes
"read the document" from "guessed from the name" regardless of what the model
claims.

Five tests added. 39 total.

## 13 — 2026-10-22

`[Bug Fix]` Classify on the document's **text**, not just its filename.

The first local dry run classified 12/12 without error but got at least two
badly wrong, both over-applying the "Personal takes absolute precedence" rule:

```
define the api   -> Personal 100%     (it is an API specification)
GDRive Xfer      -> Personal  95%
```

100% confidence on a wrong answer is the worst case: not hedging, confidently
misfiling. The cause was not the model. Measured on a 200-file sample of the
real Drive, **only 6 files had any description at all** — so `snippet` was
empty and the classifier was guessing from a handful of title words. `define
the api` actually opens: *"An enterprise RESTful and MCP API specification for
SteuerTom, derived directly..."*

`fetch_snippet()` now exports Google-native files as text
(`document`/`presentation` -> `text/plain`, `spreadsheet` -> `text/csv`),
collapses whitespace and truncates to `--snippet-chars` (default 4000). Types
Drive cannot export, such as PDF, fall back to the description as before. An
export failure logs and degrades to the title rather than aborting the run.
104 of those 200 sampled files are Google Docs, so this covers about half the
corpus immediately.

Model size was tested and is **not** the fix: `qwen2.5:14b-instruct` was three
times slower (18s vs 6.4s per file) and returned invalid JSON on 4 of 5 files.
`qwen2.5:7b-instruct` stays the default.

Six tests added for the export path, including fallback-on-failure,
truncation, and `--snippet-chars 0` disabling it. Five existing batch tests
passed a `mock.Mock` args object with no `snippet_chars`, which raised
`TypeError` on the comparison — fixed.

## 12 — 2026-10-22

`[User Request]` Pluggable classifier backend, defaulting to a **local model**.

`CLASSIFIER_BACKEND` selects `ollama` (default) or `gemini`. The local path
calls `qwen2.5:7b-instruct` on deepthought01 over the tailnet
(`OLLAMA_HOST`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`).

Why local is the default, not a fallback:

- **No quota.** The Gemini free tier allows 20 requests/day/model, which
  cannot organise a Drive of any size. Measured alternatives: a Google AI Pro
  subscription does **not** raise Gemini *API* limits (tiers come from Cloud
  billing, not consumer subscriptions); `gemini` CLI via Code Assist would
  (~1000/day) but is unauthenticated on thevault and needs an interactive
  browser login; `claude` CLI is not logged in and this org has Claude Code
  subscription access disabled.
- **Privacy.** The `Personal` domain is explicitly tax documents, passports
  and medical records. Classifying those on a third-party API contradicts the
  Reality Isolation rule the taxonomy itself encodes. Local inference keeps
  them on the tailnet.
- **It works.** `qwen2.5:7b-instruct` classified the real file
  `SteuerTom Dashboard` as `Personal` at 0.85 with correct tax reasoning.
  ~19s/file on deepthought01 (8 CPU cores, 30GB, no GPU): ~4 min for 12 files,
  ~5h for 1000. Slower than Gemini, but unmetered.

A backend failure is flagged with `BACKEND_FAILURE:` and counted, never
disguised as a low-confidence `Others` — same rule as the Gemini path.

`[Bug Fix]` Six existing tests patched `call_gemini`, but `classify_batch` now
dispatches through `classify()`. They were falling through to the **real local
model**: the suite took 49 seconds of live inference while pretending to be
offline. Repointed at `classify()`, and added a guard test asserting
`classify_batch` never reaches a backend directly. Suite is back to 0.09s,
28 tests.

## 11 — 2026-10-21

`[Bug Fix]` Stop the batch when the daily Gemini quota is gone, instead of
retrying into it.

The first full 25-file dry run classified 3 files and then failed 22 with HTTP
429. The cause is not rate pacing — it is a hard daily cap:

```
quotaId:    GenerateRequestsPerDayPerProjectPerModel-FreeTier
quotaValue: 20
retryDelay: 33092s   (~9.2 hours)
```

**20 requests per day, per model, on the free tier.** The backoff added in v01
made this worse: it retried each of the 22 files five times against a quota
that could not recover for nine hours.

`_classify_429()` now distinguishes a transient per-minute limit (still
retried) from an exhausted per-day quota or any `RetryInfo.retryDelay` over two
minutes (never retried). `QuotaExhausted` propagates out of the retry loop and
`classify_batch` stops the run, keeps the rows it already classified, and
reports the quota id, the daily allowance, and the hours until reset.

Five tests added, and two of them immediately caught a real bug: the error
detail `@type` is `type.googleapis.com/google.rpc.QuotaFailure`, so splitting
on `/` leaves `google.rpc.QuotaFailure` and never matches `QuotaFailure`. The
detection would have silently never fired. Split on `.` instead.

Verified against the live API: the agent now stops immediately with an
actionable message. 21/21 tests pass.

**Operational consequence:** at 20 classifications per day this cannot organise
a Drive of any size. Billing on the Google Cloud project is the real fix.

## 10 — 2026-10-21

`[Bug Fix]` / `[Refactor / Maintenance]` First run against real Drive, and two
fixes it forced.

- **`gemini-2.5-flash` is retired** — 10/10 classifications failed with
  `404 Not Found`. Default is now `gemini-3.5-flash`, measured working against
  the live API; `gemini-3.8-flash` (what the UI uses) returned 503 then
  read-timeouts. Override with `GEMINI_MODEL`.
- **Taxonomy now read from the shared `taxonomy.json`** instead of a local
  `CATEGORIES` list, so the agent and the UI cannot drift. It is looked up next
  to `agent_daemon.py` first, then one level up; `scripts/deploy-to-vault.sh`
  ships it to thevault.
- **The prompt now includes each domain's description and key signals.** It had
  been sending bare category names — far weaker than the taxonomy already held.

Drive OAuth now works end to end: the agent lists real files and classifies
them. Still dry-run only; nothing has been moved.

The 404 was visible only because v01 logs Gemini errors distinctly rather than
letting them fall through as low-confidence `Others`. The source spec's bare
`except` would have reported ten confident-looking `Others` results and moved
ten files on no judgement at all.

## 09 — 2026-10-20

`[Refactor / Maintenance]` Moved into the `ainie-knowfind` repo as `agent/`,
released there as `26.10.20-007`. The standalone `gdrive-agent` repo (commit
`4cd8da7`, never pushed) is superseded; this directory is now the source of
truth and the deploy source for `thevault:~/gdrive-agent`.

Rationale: `ainie-knowfind` was already the "autonomous document classifier"
on the `GDrive-Organiser` remote, but it classified a mock corpus and had no
Google dependency. This is the half that touches real Drive. Keeping them in
one repo stops the shared nine-category taxonomy drifting apart.

## 08 — 2026-10-20

`[Refactor / Maintenance]` `GEMINI_MODEL` is now read from the environment
(default unchanged: `gemini-2.5-flash`, as the source spec specified).

Reason: the sibling project **`ainie-knowfind`** (git remote
`GDrive-Organiser`, deployed at `knowfind.tail2227aa.ts.net`) is an autonomous
document classifier sharing this exact taxonomy — "Adaptive Living",
"Financing/Investment" and the rest — but runs **`gemini-3.8-flash`**. It has
no Google API dependency and classifies `src/data/mockCorpus.ts`, so it is the
UI over mock data while this project is the backend that touches real Drive.
The model choice affects classification quality, so it is Oliver's call rather
than something to change silently; making it configurable lets either be used
without a code edit.

Worth revisiting whether the taxonomy should live in one shared place rather
than being defined independently in both repos.

## 07 — 2026-10-20

`[Refactor / Maintenance]` Added `tests/test_agent.py` — 16 offline tests
against a stub Drive service. No network, no credentials, no real Drive, so
they run on thevault today while OAuth is still blocked.

What they pin down:

- **Dry run is inert.** A full classify-and-report pass makes zero
  `files().create` and zero `files().update` calls while still writing both
  report files. This is the property the whole design rests on, so it is
  asserted rather than eyeballed.
- **Folder lookup is root-scoped** (`'root' in parents` present in every
  query), creates nothing without `--apply`, reports duplicate root folders
  instead of guessing, picks deterministically when it must, and escapes an
  apostrophe in a category name.
- **The ledger records original parents before the move**, and `--revert`
  restores exactly those parents and nulls the `appProperties`. A row with no
  target folder is skipped rather than orphaned.
- **Already-processed files are filtered client-side**; the undocumented
  `not appProperties has` form appears only under `--server-filter`.
- **Backoff retries a 429 and does not retry a 404.**
- An unknown category falls back to `Others`, and a Gemini API failure stays
  flagged rather than being disguised as a low-confidence classification.

Run with: `./venv/bin/python -m unittest discover -s tests -v`

## 06 — 2026-10-20

`[Bug Fix]` `scripts/stage-client.sh` refused to guess between multiple glob
matches. Invoking it as `./scripts/stage-client.sh ~/Downloads/client_secret_*.json`
expanded to every matching file and the shell passed the **alphabetically
first** one, which was the dead `1067245220704-…` client — so the script
cheerfully restaged the exact client we had just removed. It now exits when
`$# > 1`, listing each candidate with its modification date.

The v05 liveness probe caught the bad restage immediately, which is what it was
added for. Re-removed the dead client from the repo and thevault afterwards.

## 05 — 2026-10-20

`[Bug Fix]` `authorize_local.py` now pre-checks that the OAuth client still
exists before opening a browser, so a deleted client fails in about a second
instead of hanging forever on a callback that will never arrive — the failure
mode that cost a round trip at v03.

- `probe_client()` posts a deliberately bogus refresh token to
  `oauth2.googleapis.com/token`. Verified against both cases: a deleted client
  answers **401 `deleted_client`**, a live one answers **400 `invalid_grant`**.
  Network failure is explicitly *not* treated as evidence the client is dead —
  it warns and continues.
- Ctrl+C now exits with a one-line message instead of a `KeyboardInterrupt`
  traceback.
- Fixed `json` being imported inside `main()` only, which made the probe's
  error-body parse raise `NameError` and report a bare "HTTP 401" instead of
  naming `deleted_client`. Caught by testing the probe against the known-dead
  client rather than assuming it worked.

Order of guards is now: wrong client type (`web` vs `installed`) → client
liveness → consent.

## 04 — 2026-10-20

`[Refactor / Maintenance]` `scripts/authorize-local.sh` now points at
`stage-client.sh` when no client is present, instead of vaguely telling the
operator to "copy the file there". Removed the dead `ainie-486910` client from
both the repo and `thevault:~/gdrive-agent/` so it cannot be retried by
accident — an earlier shell was still hanging on its callback. The Gemini key
in `thevault:~/gdrive-agent/.env` was left untouched.

## 03 — 2026-10-20

`[Bug Fix]` The staged OAuth client was dead. Google returned
`Error 401: deleted_client` ("The OAuth client was deleted") during consent —
the `installed` client from Google project `ainie-486910`
(`1067245220704-…`) no longer exists; the JSON in ~/Downloads was a stale copy
of a deleted client. No code change could recover it; a new Desktop client must
be created in the Google Cloud Console.

- Added `scripts/stage-client.sh` to install a freshly downloaded client into
  both the repo and thevault at mode 600, after asserting it is an `installed`
  (Desktop app) client rather than a `web` one. It also deletes any existing
  `token.json` on both sides, since a client change invalidates it.
- Noted the failure mode: `run_local_server` does not surface this error. The
  browser shows it and never redirects, so the script just hangs on the
  callback. Kill it rather than waiting.

## 02 — 2026-10-20

`[User Request]` Wired the Gemini key to Infisical, per Oliver's choice to
source it from `ainie-spdesk`.

- Created Infisical project **`gdrive-agent`** (`c823f3ba-…`) and copied the
  single key `GEMINI_API_KEY` from `ainie-spdesk/prod` into its `prod`
  environment. Verified by SHA-256 fingerprint on read-back, not by exit code.
  Only that one key was copied — `ainie-spdesk/prod` is the estate's
  root-of-trust vault and must never be blanket-replicated.
- `scripts/refresh-secret.py` (runs on **theguardian**, the only host holding a
  machine identity) materialises the value into `thevault:~/gdrive-agent/.env`
  at mode 600 via `umask 077`, then verifies by fingerprint. The value never
  passes through the workstation and is never printed.
- `scripts/infisical-env.sh` rewritten to source that `.env` and to **refuse**
  a value that is single-quoted or an `@/path` literal — the two Infisical
  write/export failure modes that have silently corrupted secrets before.

Known limitation: thevault has no Infisical identity of its own, so refreshes
must be driven from theguardian using `ainie-spdesk-deploy`. Minting a
dedicated `gdrive-agent` identity requires the admin console — the API refuses
to attach an auth method to a new identity (403 `edit-auth`).

## 01 — 2026-10-20

`[User Request]` Initial creation. Google Drive auto-classification agent
provisioned on **thevault** (`~/gdrive-agent`), source of truth in this repo.

Classifies Drive files into nine fixed categories via Gemini and reparents them
into root-level category folders. Built from a design Oliver supplied as a PDF,
with seven defects in that design corrected before deployment:

1. **Dry-run is now the default.** The source spec moved files immediately with
   no preview. `--apply` is an explicit opt-in; without it no `files().update`
   or `files().create` call is reachable.
2. **Root-scoped folder lookup.** The spec matched `name = '<category>'`
   anywhere in Drive, so it could file documents into an unrelated nested
   folder. Now scoped to `'root' in parents`, with duplicates reported rather
   than silently picked.
3. **Reversal ledger.** `removeParents` strips every existing parent. Original
   parent IDs are now written to `ledger/apply-*.jsonl` (fsynced) *before* each
   mutation, and mirrored into `appProperties.prior_parents`. `--revert <ledger>`
   undoes a batch.
4. **Backoff.** Exponential backoff with jitter on HTTP 429/5xx for both the
   Drive and Gemini calls; the spec had none and would have been throttled.
5. **Query syntax not assumed.** The spec's
   `not appProperties has { key=... and value=... }` is not a documented Drive
   v3 query form. Client-side filtering on `appProperties` is the default;
   `--server-filter` opts into the server form for anyone who wants to test it.
6. **Batch cap.** `--limit` (default 25) instead of a hardcoded 30.
7. **Gemini failures are visible.** The spec's bare `except` disguised API
   outages as low-confidence `Others` classifications. Failures are now logged
   distinctly, counted, flagged in the report, and carry an `API_FAILURE:`
   reason prefix.

Also deliberately **not** carried over from the spec: the 120-second polling
daemon loop. Nothing is scheduled; the agent runs only when invoked.

Consent cannot run on thevault (headless), so `authorize_local.py` +
`scripts/authorize-local.sh` perform it on the workstation and ship `token.json`
over at mode 600.
