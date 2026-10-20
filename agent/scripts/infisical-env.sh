#!/usr/bin/env bash
# Load GEMINI_API_KEY into the environment. Source, don't run:
#
#   source scripts/infisical-env.sh
#
# System of record is Infisical (project gdrive-agent, env prod) on thevault.
# thevault holds no Infisical identity of its own, so the value is materialised
# into a mode-600 .env by scripts/refresh-secret.sh, run from theguardian.
# Deliberately NOT named load-secrets.sh (that matches *secret* gitignore rules).
# Never echoes a value.
_repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$_repo/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$_repo/.env"
  set +a
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "[!] GEMINI_API_KEY not set and no usable $_repo/.env" >&2
  echo "    Refresh it from Infisical, on theguardian:" >&2
  echo "      python3 ~/refresh-gdrive-secret.py" >&2
  unset _repo
  return 1 2>/dev/null || exit 1
fi

case "$GEMINI_API_KEY" in
  \'*|\"*|@/*)
    echo "[!] GEMINI_API_KEY looks quoted or is an '@file' literal - refusing." >&2
    echo "    Infisical dotenv export single-quotes values; strip them." >&2
    unset GEMINI_API_KEY _repo
    return 1 2>/dev/null || exit 1 ;;
esac

export GEMINI_API_KEY
echo "[v] GEMINI_API_KEY loaded (${#GEMINI_API_KEY} chars)."
unset _repo
