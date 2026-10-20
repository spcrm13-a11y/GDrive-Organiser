#!/usr/bin/env bash
# One command to authorize Drive access from wopr and ship the token to thevault.
# Run this on your Mac (it needs a browser). Prints no secret values.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT="${VAULT:-iaadmin@100.111.123.21}"
CLIENT="${CLIENT:-$REPO/credentials.json}"

if [ ! -f "$CLIENT" ]; then
  echo "[!] No OAuth client at $CLIENT" >&2
  echo "    Create a Desktop app OAuth client in the Google Cloud Console," >&2
  echo "    download the JSON, then stage it:" >&2
  echo "      ./scripts/stage-client.sh ~/Downloads/client_secret_*.json" >&2
  exit 1
fi

if [ ! -x "$REPO/.venv-auth/bin/python" ]; then
  echo "[*] Creating local auth venv..."
  python3 -m venv "$REPO/.venv-auth"
  "$REPO/.venv-auth/bin/pip" install --quiet --upgrade pip
  "$REPO/.venv-auth/bin/pip" install --quiet google-auth-oauthlib
fi

"$REPO/.venv-auth/bin/python" "$REPO/authorize_local.py" "$CLIENT"

echo "[*] Copying token.json to $VAULT:~/gdrive-agent/ ..."
scp -q "$REPO/token.json" "$VAULT:gdrive-agent/token.json"
ssh "$VAULT" 'chmod 600 ~/gdrive-agent/token.json'
echo "[v] Token installed on thevault (mode 600)."
echo
echo "Next, on thevault:"
echo "  cd ~/gdrive-agent && source scripts/infisical-env.sh && \\"
echo "    ./venv/bin/python agent_daemon.py --limit 25"
