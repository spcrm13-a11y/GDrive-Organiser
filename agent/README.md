# gdrive-agent — MoneypenneyAgent

Classifies Google Drive files into nine categories with Gemini and files them
into root-level folders. **Dry-run by default — it changes nothing unless you
pass `--apply`.**

Version: see [`versions.md`](versions.md). Current: **09**.

## Where it runs

| | |
|---|---|
| Source of truth | this repo (`/Volumes/DockerData/Projects/ainie-knowfind/agent`) |
| Deploy target | `thevault:~/gdrive-agent` (Ubuntu 24.04, Python 3.12.3) |

Edits belong **in the repo**, then deploy. Editing `~/gdrive-agent` on the host
directly gets overwritten by the next deploy.

## Categories

`Personal` · `Financing/Investment` · `Smartplanet` · `Ainie` ·
`Adaptive Living` · `Masonic` · `AI Code Development` · `Strategy` · `Others`

Taxes, invoices, medical records, passports and personal shipping/flights are
pinned to `Personal` by the classifier prompt. Anything the model returns that
isn't in the list falls back to `Others`.

## One-time setup

1. **OAuth client.** Needs a **Desktop app** (`installed`) client, not a web
   one. Place it at `credentials.json` in this repo (gitignored).
2. **Authorize** — on a machine with a browser:
   ```bash
   ./scripts/authorize-local.sh
   ```
   Opens Google consent, writes `token.json` (mode 600), copies it to thevault.

   > Scope is `https://www.googleapis.com/auth/drive` — **full read/write to
   > your entire Drive**, which is what reparenting arbitrary files requires.
   > The token on thevault can therefore touch everything.

3. **Gemini key.** Lives in Infisical, loaded at runtime:
   ```bash
   source scripts/infisical-env.sh
   ```

## Running it

```bash
cd ~/gdrive-agent
source scripts/infisical-env.sh

# Preview only — writes reports/dryrun-*.md, changes nothing
./venv/bin/python agent_daemon.py --limit 25

# Execute, after reading the report
./venv/bin/python agent_daemon.py --limit 25 --apply

# Undo a batch
./venv/bin/python agent_daemon.py --revert ledger/apply-<stamp>.jsonl
```

| Flag | Default | |
|---|---|---|
| `--apply` | off | perform the moves; without it nothing is modified |
| `--limit N` | 25 | files per batch |
| `--days N` | 425 | `modifiedTime` lookback window |
| `--revert L` | — | undo a prior apply from its ledger |
| `--server-filter` | off | use the undocumented `not appProperties has` query |

## Tests

16 offline tests, no credentials or network needed:

```bash
./venv/bin/python -m unittest discover -s tests -v
```

They assert that a dry run mutates nothing, that the ledger is written before
any move, and that `--revert` restores the original parents exactly.

## Safety properties

- No mutation path is reachable without `--apply`.
- Every move is recorded to an fsynced ledger **before** it happens.
- Already-processed files are skipped via `appProperties.processed_by`.
- Backoff on 429/5xx.
- **No daemon, no cron, no systemd timer.** It runs when you run it.

## Not committed

`.env`, `credentials.json`, `client_secret*.json`, `token.json`, `ledger/*.jsonl`,
`reports/*`. Secrets live in Infisical.
