#!/usr/bin/env bash
# Deploy ainie-knowfind to theguardian (100.118.202.99).
#
# Run from a workstation with tailnet SSH access:
#     ./deploy/deploy-knowfind-guardian.sh
#
# What it does, in order: sync the repo, regenerate .env from Infisical,
# rebuild, bring the stack up, re-apply the Tailscale serve config, and verify.
# Every step is idempotent -- running it twice is a no-op plus a rebuild.
set -euo pipefail

GUARDIAN_IP="${GUARDIAN_IP:-100.118.202.99}"
GUARDIAN_USER="${GUARDIAN_USER:-iaadmin}"
REMOTE_DIR="${REMOTE_DIR:-/home/iaadmin/ainie-knowfind}"
LOCAL_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOSTNAME_FQDN="knowfind.tail2227aa.ts.net"

echo "==> syncing $LOCAL_REPO -> $GUARDIAN_USER@$GUARDIAN_IP:$REMOTE_DIR"
# No --delete: it would remove the server-side .env (and with it every secret)
# on the next run. .env is excluded for the same reason -- it is generated
# remotely from Infisical, and must never be pushed from a workstation.
rsync -az --human-readable \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.DS_Store' \
  "$LOCAL_REPO/" "$GUARDIAN_USER@$GUARDIAN_IP:$REMOTE_DIR/"
echo "    ok"

ssh "$GUARDIAN_USER@$GUARDIAN_IP" REMOTE_DIR="$REMOTE_DIR" HOSTNAME_FQDN="$HOSTNAME_FQDN" bash -s << 'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"

echo "==> regenerating .env from Infisical"
# Secrets live in the Infisical project `ainie-spdesk`, env `prod` -- that is
# where GEMINI_API_KEY already was, and the knowfind-specific keys were added
# alongside it rather than copied into a second place. Deviation from
# one-project-per-app is deliberate and recorded in versions.md 26.10.15-001.
#
# Values flow Infisical -> .env (mode 0600) -> container environment. They are
# never echoed: this writes the file and prints only the key count.
python3 deploy/write-env.py
echo "    ok ($(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' .env) keys)"

echo "==> starting the outpost and app first"
# The edge config names knowfind-authentik-outpost literally (matching the
# proven deskint edge), so both "nginx -t" below and nginx's own startup
# resolve it at config load -- it has to exist first. The app is reached
# through "set $knowfind_app" instead and needs no such ordering, but
# building it here keeps the edge from briefly 502-ing.
docker compose up -d --build outpost app

echo "==> validating edge nginx config"
# On the smartplanet network, or the upstream container names do not resolve
# and a perfectly good config fails the test.
docker run --rm --network smartplanet \
  -v "$REMOTE_DIR/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine nginx -t 2>&1 | tail -2

echo "==> starting the rest of the stack"
docker compose up -d --build

echo "==> reloading the edge config"
# nginx.conf is a FILE bind mount: compose does not recreate the edge when its
# contents change, and a running nginx never re-reads it on its own. Without
# this, a config fix appears to deploy and changes nothing -- which cost two
# rounds of misdiagnosis on 2026-10-15.
docker exec ainie-knowfind-edge nginx -t >/dev/null 2>&1 \
  && docker exec ainie-knowfind-edge nginx -s reload \
  && echo "    ok" \
  || echo "    (edge freshly created, no reload needed)"

echo "==> waiting for the app to answer locally"
for i in $(seq 1 30); do
  if curl -fsS -m 3 http://127.0.0.1:4011/health >/dev/null 2>&1; then
    echo "    ok after ${i}s"
    break
  fi
  sleep 1
  [ "$i" = 30 ] && { echo "    x app did not answer /health in 30s"; docker compose logs --tail=40 app; exit 1; }
done

echo "==> re-applying the Tailscale serve config"
# Idempotent, and cheap insurance: the serve config is what makes the hostname
# answer at all, and a sidecar that lost its state silently serves nothing.
docker exec knowfind-tailscale tailscale serve --bg --https=443 http://ainie-knowfind-edge:80 >/dev/null
docker exec knowfind-tailscale tailscale serve status

echo "==> verifying"
echo -n "    /health (local)        : "
curl -fsS -m 5 http://127.0.0.1:4011/health | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["status"], "v"+d["version"], {k:v["state"] for k,v in d["dependencies"].items()})'
echo -n "    edge -> app            : "
docker exec ainie-knowfind-edge sh -c 'wget -qO- --server-response http://ainie-knowfind-app:3000/health 2>&1 | grep -m1 HTTP/' | tr -s ' '
echo -n "    https://$HOSTNAME_FQDN/ : "
curl -s -o /dev/null -w '%{http_code}\n' -m 10 "https://$HOSTNAME_FQDN/" || echo "unreachable"

echo "==> public-exposure check (this stack only)"
# Scoped to this compose project on purpose. theguardian's shared nginx-proxy
# is legitimately bound to 82.165.242.39:443 -- an unscoped grep matches it and
# reports a hard stop on every single deploy, which is how a real finding would
# get ignored. See SP-nginx/external-exposure-audit.md.
if docker compose ps --format '{{.Name}}\t{{.Ports}}' | grep '82\.165\.242\.39'; then
  echo "    x HARD STOP: a knowfind container is bound to theguardian's public IP"
  exit 1
fi
echo "    ok -- no knowfind container is bound to 82.165.242.39"
docker compose ps --format '    {{.Name}}  {{.Status}}  {{.Ports}}'
REMOTE

echo
echo "Deployed. https://$HOSTNAME_FQDN/ (Authentik login, tailnet only)"
