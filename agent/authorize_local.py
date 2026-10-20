#!/usr/bin/env python3
"""Complete Google OAuth consent on a machine WITH a browser.

thevault is headless, so the InstalledAppFlow cannot run there. Run this on
wopr; it opens your browser, you approve, and it writes token.json next to
itself. Then copy token.json to thevault (scripts/authorize-local.sh does
both steps for you).

Prints no secret values.
"""
import json
import os
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/drive"]
BASE = os.path.dirname(os.path.abspath(__file__))


def probe_client(client_id, client_secret):
    """Is this OAuth client still alive in Google Cloud?

    A deleted client answers 401 deleted_client; a live one answers 400
    invalid_grant to a deliberately bogus refresh token. Costs one request
    and saves a hang on a callback that will never arrive.
    """
    import urllib.error
    import urllib.parse
    import urllib.request

    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": "probe-not-a-real-token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    try:
        urllib.request.urlopen(req, timeout=15)
        return True, ""
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read() or b"{}").get("error", "")
        except Exception:
            err = ""
        if err == "invalid_grant":
            return True, ""            # client is live, our fake token isn't
        return False, err or ("HTTP %s" % e.code)
    except Exception as e:
        # Network trouble is not evidence the client is dead.
        print("[i] Could not reach Google to pre-check the client (%s); "
              "continuing anyway." % type(e).__name__)
        return True, ""


def main():
    creds_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        BASE, "credentials.json")
    if not os.path.exists(creds_path):
        sys.exit(f"[!] No OAuth client file at {creds_path}")

    with open(creds_path) as fh:
        kind = next(iter(json.load(fh)))
    if kind != "installed":
        sys.exit(f"[!] OAuth client is type {kind!r}; this flow needs a "
                 "'installed' (Desktop app) client.")

    with open(creds_path) as fh:
        cfg = json.load(fh)["installed"]
    alive, why = probe_client(cfg["client_id"], cfg["client_secret"])
    if not alive:
        sys.exit(
            "[!] This OAuth client is not usable: %s\n"
            "    The client in %s no longer exists in Google Cloud.\n"
            "    Create a new Desktop app client, then:\n"
            "      ./scripts/stage-client.sh ~/Downloads/client_secret_*.json"
            % (why, os.path.basename(creds_path)))
    print("[v] OAuth client is live.")
    print("[*] Requesting scope: https://www.googleapis.com/auth/drive")
    print("    This is FULL read/write access to your entire Drive.")
    flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
    creds = flow.run_local_server(port=0, open_browser=True)

    out = os.path.join(BASE, "token.json")
    with open(out, "w") as fh:
        fh.write(creds.to_json())
    os.chmod(out, 0o600)
    print(f"[v] Wrote {out} (mode 600). Copy it to thevault next.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\n[!] Cancelled before consent completed; no token written.")
