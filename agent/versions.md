# versions.md — gdrive-agent (MoneypenneyAgent)

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
