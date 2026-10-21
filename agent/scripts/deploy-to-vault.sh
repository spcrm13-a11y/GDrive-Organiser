#!/usr/bin/env bash
# Deploy the agent to thevault. Ships taxonomy.json from the repo root so the
# host copy stays a deploy artefact, never a second source of truth.
# Never copies secrets: .env, credentials.json and token.json live on the host.
set -euo pipefail

REPO_AGENT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$REPO_AGENT/.." && pwd)"
VAULT="${VAULT:-iaadmin@100.111.123.21}"

[ -f "$REPO_ROOT/taxonomy.json" ] || { echo "[!] taxonomy.json missing at repo root" >&2; exit 1; }

rsync -a --delete \
  --exclude 'venv/' --exclude '.venv-auth/' --exclude '__pycache__/' \
  --exclude '.env' --exclude 'token.json' --exclude 'credentials.json' \
  --exclude 'client_secret*.json' \
  --exclude 'ledger/*.jsonl' --exclude 'reports/*.json' --exclude 'reports/*.md' \
  "$REPO_AGENT/" "$VAULT:gdrive-agent/"

# the shared taxonomy is not inside agent/ in the repo -- ship it explicitly
scp -q "$REPO_ROOT/taxonomy.json" "$VAULT:gdrive-agent/taxonomy.json"

ssh "$VAULT" 'cd ~/gdrive-agent && ./venv/bin/python agent_daemon.py --version \
  && ./venv/bin/python -m unittest discover -s tests 2>&1 | tail -3'
echo "[v] deployed"
