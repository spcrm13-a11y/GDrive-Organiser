#!/usr/bin/env python3
"""Materialise GEMINI_API_KEY from Infisical into thevault:~/gdrive-agent/.env

Runs on theguardian (the only host holding the machine identity). The value
never touches the workstation and is never printed - only its length and
SHA-256 prefix are reported, so a bad write is still detectable.
"""
import hashlib, json, os, subprocess, sys, urllib.request, urllib.error, urllib.parse

API = os.environ.get("INFI_API", "https://thevault.tail2227aa.ts.net:8443/api")
PROJECT_ID = "c823f3ba-3887-447e-81d5-97142b2e0506"   # gdrive-agent
KEY = "GEMINI_API_KEY"
ENV = "prod"
TARGET_HOST = os.environ.get("TARGET_HOST", "thevault")
TARGET_PATH = "gdrive-agent/.env"


def req(method, path, token=None, body=None, params=None):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


creds = json.load(open("/home/iaadmin/.infisical-spdesk-credentials.json"))
st, body = req("POST", "/v1/auth/universal-auth/login",
               body={"clientId": creds.get("clientId"),
                     "clientSecret": creds.get("clientSecret")})
if st != 200:
    sys.exit("[!] login failed HTTP %s: %s" % (st, body))
tok = body["accessToken"]

st, body = req("GET", "/v3/secrets/raw/" + KEY, tok,
               params={"workspaceId": PROJECT_ID, "environment": ENV,
                       "secretPath": "/"})
if st != 200:
    sys.exit("[!] read %s failed HTTP %s: %s" % (KEY, st, body))
val = body["secret"]["secretValue"]
fp = hashlib.sha256(val.encode()).hexdigest()[:16]
print("[v] read %s  len=%d sha256:%s" % (KEY, len(val), fp))

if val[:1] in ("'", '"') or val.startswith("@/"):
    sys.exit("[!] value is quoted or an '@file' literal - refusing to deploy it")

# umask 077 so the file is never briefly world-readable
remote = ("umask 077 && mkdir -p gdrive-agent && cat > %s && "
          "chmod 600 %s && echo REMOTE_OK" % (TARGET_PATH, TARGET_PATH))
p = subprocess.run(["ssh", "-o", "BatchMode=yes", TARGET_HOST, remote],
                   input=("%s=%s\n" % (KEY, val)).encode(),
                   capture_output=True, timeout=60)
if p.returncode != 0 or b"REMOTE_OK" not in p.stdout:
    sys.exit("[!] remote write failed rc=%s: %s"
             % (p.returncode, p.stderr.decode()[:300]))

# verify what actually landed, by fingerprint, without printing it
verify = ("python3 -c \"import hashlib,sys;"
          "v=open('%s').read().split('=',1)[1].rstrip(chr(10));"
          "print(len(v), hashlib.sha256(v.encode()).hexdigest()[:16])\"" % TARGET_PATH)
p = subprocess.run(["ssh", "-o", "BatchMode=yes", TARGET_HOST, verify],
                   capture_output=True, timeout=60)
got = p.stdout.decode().strip()
print("[v] on %s      len=%s sha256:%s" % (TARGET_HOST, *got.split()))
print("MATCH" if got == "%d %s" % (len(val), fp) else "MISMATCH")
