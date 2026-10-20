#!/usr/bin/env bash
# Install a freshly downloaded Google OAuth client into the repo and onto
# thevault, at mode 600. Validates the client type before doing anything.
#
#   ./scripts/stage-client.sh ~/Downloads/client_secret_XXXX.json
#
# Prints no secret values.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT="${VAULT:-iaadmin@100.111.123.21}"
SRC="${1:-}"

if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "usage: $0 <downloaded client_secret_*.json>" >&2
  exit 1
fi

# A glob like ~/Downloads/client_secret_*.json expands to EVERY match and the
# shell hands us the alphabetically first one, which is rarely the new one.
# Refuse rather than guess.
if [ "$#" -gt 1 ]; then
  echo "[!] $# files matched; I will not guess which is the new client." >&2
  echo "    Pass one exact path. Candidates, newest first:" >&2
  for f in "$@"; do
    printf '      %s  %s\n' "$(date -r "$f" '+%Y-%m-%d %H:%M')" "$f" >&2
  done
  exit 1
fi

KIND="$(python3 -c "import json,sys; print(next(iter(json.load(open(sys.argv[1])))))" "$SRC")"
if [ "$KIND" != "installed" ]; then
  echo "[!] This is a '$KIND' client. You need a **Desktop app** client." >&2
  echo "    Google Cloud Console > Credentials > Create credentials >" >&2
  echo "    OAuth client ID > Application type: Desktop app" >&2
  exit 1
fi

PROJ="$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d['installed'].get('project_id','?'))" "$SRC")"
echo "[v] Desktop client for Google project: $PROJ"

install -m 600 "$SRC" "$REPO/credentials.json"
echo "[v] staged $REPO/credentials.json (600)"

# A client change invalidates any existing token.
rm -f "$REPO/token.json"
scp -q "$REPO/credentials.json" "$VAULT:gdrive-agent/credentials.json"
ssh "$VAULT" 'chmod 600 ~/gdrive-agent/credentials.json; rm -f ~/gdrive-agent/token.json'
echo "[v] staged on thevault (600); stale token.json removed from both"
echo
echo "Next: ./scripts/authorize-local.sh"
