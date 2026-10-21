# ainie-knowfind Version History & Policy

> **Versioning Rule Policy:**
> - Every change (whether feature request or bug fix) **MUST increment the version number by 1**.
> - Every release entry **MUST explicitly specify** whether the change was triggered by `[User Request]`, `[Bug Fix]`, or `[Refactor / Maintenance]`.
> - A version bump must update **every** place the version is stored: this file,
>   `package.json` `"version"`, and `src/version.ts` `APP_VERSION` (which is what
>   `/health` and the MQTT telemetry payload report). A changelog-only bump
>   silently desyncs from what the running app displays.

---

## Version 26.10.20-010

**Release Date:** 2026-10-20
**Status:** Done

- **[User Request] `package-lock.json` is now tracked.** npm is the lockfile of
  record. The Dockerfile runs plain `npm install`, which honours a lockfile
  when one is present, so **the deployed image moves from floating versions to
  pinned ones**. That is the point, but it is a real change in build behaviour:
  a dependency will no longer silently pick up a new minor between builds.

- **[Bug Fix] Dropped the unused `esbuild` devDependency.** Generating the
  lockfile surfaced an `ERESOLVE` that the earlier lock-less installs had
  masked: `75ddb50` added `esbuild@^0.25.0`, while `vite@8.3.5` declares a peer
  of `^0.27.0 || ^0.28.0`. Nothing in the source imports esbuild — it appeared
  only in `package.json` — and both vite and tsx bundle their own copy, so the
  dependency was removed rather than bumped. Package count fell 337 -> 310.

  Verified: `tsc --noEmit` and `vite build` both exit 0, 1673 modules
  transformed, unchanged from 26.10.20-009.

  Still outstanding: `bun.lock`, which `75ddb50` brought, is still tracked
  alongside `package-lock.json`. Two lockfiles for two package managers will
  drift. Only the npm one affects the Docker build.

## Version 26.10.20-009

**Release Date:** 2026-10-20
**Status:** Done

- **[User Request] Renamed the npm package to `ainie-organizer`**, finishing
  the brand rename that `75ddb50` started in the UI and `metadata.json`
  ("Ainie ORganizer - Autonomous Document Classifier"). npm names must be
  lowercase, hence `ainie-organizer` rather than the display capitalisation.

  **Only `package.json` `"name"` changed.** Every live identifier containing
  `knowfind` or `ainie-knowfind` was deliberately left alone, following the
  same rule applied to DeskInt/spdesk — the product gets renamed, the running
  identifiers do not:

  - `knowfind.tail2227aa.ts.net` (nginx `server_name`, and the Authentik
    hostname, which the app standard treats as a permanent choice)
  - `smartplanet/telemetry/knowfind` and `APP_NAME = 'knowfind'` in `health.ts`
    — the telemetry listener derives the node from the topic's last segment, so
    changing it would orphan every historical row in `sp_operations.Telemetry`
  - container names `ainie-knowfind-app`, `ainie-knowfind-edge`,
    `knowfind-authentik-outpost`, the `knowfind-tailscale` sidecar (whose
    hostname is stateful and would be stranded by a rename), and the deploy
    path `/home/iaadmin/ainie-knowfind`

  Nothing reads `package.json` `"name"` at runtime, so this is cosmetic and
  deploy-neutral. Verified: `tsc --noEmit` and `vite build` both exit 0.

## Version 26.10.20-008

**Release Date:** 2026-10-20
**Status:** Done

- **[Refactor / Maintenance] Merged the diverged `GDrive-Organiser` history.**
  A commit made elsewhere on 2026-10-19 (`75ddb50`, "AI chat assistant and
  brand rename") had branched from `f6feefb`, *before* this repo's deployment
  and versioning work, so neither side contained the other. It brought
  `/api/chat`, `ChatbotDrawer`, `VoiceConversationStudio` and a `ws` dependency;
  it lacked `health.ts`, `docker-compose.yml`, `nginx.conf`, `versions.md` and
  `src/version.ts` entirely, and had reset `package.json` to
  `react-example@0.0.0`.

  Resolution kept this repo's identity and release discipline and took their
  feature work:

  - `package.json` — our name and version, our `mqtt` (**their side had dropped
    it**, which would have silently killed MQTT telemetry), plus their `ws`,
    `@types/ws` and `esbuild`.
  - `server.ts` — their `server.listen` (they wrap express in an `http` server
    so the Live API websocket can share the port) with our
    `startTelemetry(Boolean(apiKey))` call preserved inside it. `registerHealth`
    and `/api/chat` both survive.
  - `src/version.ts` kept; their branch had deleted it, and `/health` plus the
    telemetry payload read `APP_VERSION` from it.

  Verified after merging: `tsc --noEmit` exits 0, `vite build` exits 0 and
  transforms 1673 modules (1671 before, i.e. the new components are included).

  Note: their branch brought a `bun.lock` while local tooling uses npm. Neither
  lockfile is committed and `Dockerfile` runs plain `npm install`, so the build
  is unaffected — but the two package managers should be reconciled.

## Version 26.10.20-007

**Release Date:** 2026-10-20
**Status:** Done

- **[User Request] Absorbed the real-Drive backend into this repo as `agent/`.**
  Until now this repo was a classifier UI over `src/data/mockCorpus.ts` with no
  Google dependency at all, while a separate `gdrive-agent` project held the
  Python daemon that actually reads and reparents Drive files. Both defined the
  same nine-category taxonomy independently, which would have drifted. They now
  share one repo and one `GDrive-Organiser` remote.

  `agent/` is **dry-run by default** — no `files().create` or `files().update`
  is reachable without `--apply`. Every move is recorded to an fsynced ledger
  *before* it happens and is undoable via `--revert`. 16 offline tests
  (`agent/tests/`, stub Drive service, no credentials needed) assert exactly
  those properties. Its own change history is in `agent/versions.md`.

  Note the two halves still disagree on the model: the UI uses
  `gemini-3.8-flash`, the backend defaults to `gemini-2.5-flash` from its
  source spec, now overridable via the `GEMINI_MODEL` env var. **The taxonomy
  is still declared twice** — once in `src/types/classifier.ts`, once in
  `agent/agent_daemon.py`. Unifying it is the obvious next step and was
  deliberately not folded into this commit.

  The agent is **not yet operational**: OAuth consent is outstanding, pending a
  new Google Desktop client. Nothing is scheduled — no daemon, no cron, no
  timer. Secrets stay in Infisical (project `gdrive-agent`); nothing sensitive
  is committed.

## Version 26.10.15-006

**Release Date:** 2026-10-15
**Status:** Done

- **[Bug Fix] Telemetry was published in a shape the listener discards.** The
  reporter sent the `/health` object as-is to `smartplanet/telemetry/knowfind`,
  and no row ever appeared in `sp_operations.Telemetry`. Reading
  `telemetry-listener`'s own `listener.py` on theguardian gives the real
  contract: the node comes from the topic's last segment, and the handler reads
  `ts` plus a **`metrics`** map, inserting one row per entry (numbers into
  `value`, anything else into `value_text`). **A payload with no `metrics` key
  returns early and logs nothing at all** — so the failure was invisible from
  both ends: the app reported `mqtt: ok` because it was publishing happily, and
  the listener never complained because it was doing exactly what it was told.
  `/health` keeps its rich shape for HTTP callers; the MQTT path now wraps it in
  `{ts, metrics}` with `status`, `version`, `uptime_seconds`, `schema_version`
  and one `dep_<name>` entry per dependency. `schema_version` publishes as the
  string `"none"`, not `0`, for the same reason `/health` reports `null`.

## Version 26.10.15-005

**Release Date:** 2026-10-15
**Status:** Done

- **[Bug Fix] `AUTHENTIK_HOST_BROWSER` pointed at the app's own hostname, so
  login looped.** It names the host that serves the Authentik **login flow**,
  not the app. Set to `https://knowfind.tail2227aa.ts.net`, the outpost sent the
  browser to `/application/o/authorize/` on a hostname that does not serve
  Authentik; `curl -L` gave up after 50 redirects. Now
  `https://theguardian.tail2227aa.ts.net`, which is what all four live outposts
  checked (deskint, docucenter, spcentral, agentframe) use. `auth.ai-nie.com` is
  the plan of record for this (`SP-nginx/passkey-auth-hosts-20261012.md`,
  `sp_operations.Tasks` 3349) but does not resolve yet, so adopting it here
  would have been aspirational rather than working. Noted in compose that moving
  that hostname later invalidates every passkey enrolled against the old one.

- **[Bug Fix] The deploy script never reloaded the edge.** `nginx.conf` is a
  file bind mount, so compose does not recreate the container when its contents
  change and a running nginx never re-reads it. Two config fixes in a row
  therefore appeared to deploy and changed nothing. The script now runs
  `nginx -t` and `nginx -s reload` on the edge before verifying.

- **[Bug Fix] The public-exposure check reported a hard stop on every deploy.**
  It grepped *all* containers for `82.165.242.39`, which always matches
  theguardian's shared `nginx-proxy` — legitimately bound there on 443. A check
  that cries wolf every run is how a real finding gets ignored, so it is now
  scoped to this compose project.

## Version 26.10.15-004

**Release Date:** 2026-10-15
**Status:** Done

- **[Bug Fix] The edge kept dialing a dead outpost IP after the outpost was
  recreated.** Fixing 26.10.15-003 put the outpost on the right network, but the
  edge still answered `500`: nginx resolves a literal upstream name **once, at
  config load**, so recreating `knowfind-authentik-outpost` left the edge
  connecting to the old container IP. The symptom chain hides the cause —
  `connect() failed (111: Connection refused)` in the edge log, `auth request
  unexpected status: 502`, and a bare `500` at the browser. The outpost is now
  reached through `set $knowfind_outpost` and the `resolver 127.0.0.11
  valid=10s` already in the config, so a recreated container is picked up within
  ten seconds and the edge no longer needs restarting in lockstep with it.
  Because a `proxy_pass` containing a variable does not get the remaining
  request URI appended, each outpost URI is now spelled out — using `$uri`, not
  `$request_uri`, since in the `auth_request` subrequest the latter is still the
  parent request's path and would send the outpost the app's URL instead of
  `/outpost.goauthentik.io/auth/nginx`.

## Version 26.10.15-003

**Release Date:** 2026-10-15
**Status:** Done

- **[Bug Fix] The Authentik outpost could not reach `authentik-server-1`, so
  every request to the app returned 500.** `knowfind-authentik-outpost` was
  attached to the `smartplanet` network only, but `authentik-server-1` is
  attached **only** to `sp_docucenter_internal` — a historical name, created by
  the Docucenter stack, that the Authentik server never moved off. The outpost
  logged `dial tcp: lookup authentik-server-1 ... no such host` in a loop; nginx
  logged `auth request unexpected status: 502` and answered the browser a bare
  `500`, so nothing in the edge's own log named the real cause. The outpost now
  joins both networks, which is exactly what the live `deskint-authentik-outpost`
  does. Declared in compose as `authentik_internal` with
  `name: sp_docucenter_internal`, so the alias explains itself at the point of
  use instead of the misleading name spreading further.

## Version 26.10.15-002

**Release Date:** 2026-10-15
**Status:** Done

- **[Bug Fix] Removed the unused `esbuild` devDependency, which broke the image
  build.** `npm install` failed with `ERESOLVE could not resolve` inside the
  Docker build: the AI Studio template pinned `esbuild@^0.25.0` at the root
  while `vite@8.3.4` requires a newer one. Nothing in this repo invokes esbuild
  — `grep -rn esbuild` matched only the `package.json` line declaring it, and
  Vite bundles its own copy — so the dependency was dropped rather than papered
  over with `--legacy-peer-deps`, which would have left an unused package
  pinning a conflicting version for the next person to rediscover.

- **[Bug Fix] `deploy/deploy-knowfind-guardian.sh` validated the edge config off
  the network.** `nginx -t` ran in a throwaway container with no
  `--network smartplanet`, so `knowfind-authentik-outpost` could not resolve and
  a valid config failed the test with `host not found in upstream`. The script
  now starts the outpost and app first, then validates on that network. The edge
  names the outpost literally (matching the proven DeskInt edge) rather than
  going through a `set $var` indirection, so the name genuinely must resolve at
  config load — both for the test and for nginx's own startup.

## Version 26.10.15-001

**Release Date:** 2026-10-15
**Status:** Done

- **[User Request] Deployed to theguardian on its own tailnet hostname.** Oliver
  asked for this app (cloned from `github.com/spcrm13-a11y/GDrive-Organiser`) to
  run "on the same server as deskint". DeskInt turned out to be on **theguardian**
  (`100.118.202.99`), not thevault — `ainie-spdesk/INSTANCE.md` still claims
  thevault and `/spdesk/`, which is stale; the live stack is `ainie-spdesk-*`
  containers behind `ainie-spdesk-edge` and the `spdesk-tailscale` sidecar that
  owns the `deskint` tailnet name. Added, per
  `SP-nginx/docs/per-app-hostnames.md` (the standard for all new apps):
  - `Dockerfile` — single image: `vite build` for `dist/`, `tsx server.ts` to
    serve it plus `/api/*`. `NODE_ENV` is set at run time, not build time, or
    `npm install` would skip the `vite`/`tsx` dev dependencies the build needs.
  - `docker-compose.yml` — `app` (loopback `4011` for debugging only),
    `edge` (nginx, no host port), `outpost` (own Authentik proxy),
    `tailscale` (sidecar owning the `knowfind` tailnet name), all on the
    external `smartplanet` network.
  - `nginx.conf` — the edge: Authentik `auth_request` forward-auth, the
    `X-Knowfind-Authenticated` trusted-proxy marker plus `X-Authentik-*`
    identity headers, and the stale-`?relogin=1`-state handling that the
    DeskInt edge learned the hard way.
  - `deploy/deploy-knowfind-guardian.sh` and `deploy/write-env.py` — sync,
    regenerate `.env` from Infisical, rebuild, re-apply the Tailscale serve
    config, verify, and hard-stop if anything bound to theguardian's public IP.
  - Authentik: `KnowFind Forward Auth` provider (`forward_single`,
    `external_host = https://knowfind.tail2227aa.ts.net`, OAuth redirect URIs
    regenerated via `set_oauth_defaults()`), application `knowfind`, a dedicated
    `KnowFind Dedicated Outpost`, and policy bindings for **Smartplanet Admins /
    Operators / Standard Users** — authorization from groups, never a list of
    people in source.
  - **No `base` path change was needed.** On its own hostname the app is served
    at `/`, so the AI Studio Vite config works unmodified. Under a subpath it
    would not have.

- **[User Request] `/health` and MQTT state reporting** (`health.ts`,
  `src/version.ts`), per `SMARTPLANET_APP_STANDARD.md`. One payload, two
  surfaces: `GET /health` on demand, and the same object published to
  `smartplanet/telemetry/knowfind` every 60s — the topic family
  `telemetry-listener` on theguardian already consumes into
  `sp_operations.Telemetry`. No second topic, listener or table was added;
  `sp_operations.server_telemetry` died unnoticed for 134 days because two
  collection paths existed and only one was watched. `schemaVersion` is
  reported as `null`, not `0`: this app has no database, and "not applicable"
  must not look like "schema 0". A missing `GEMINI_API_KEY` reports
  `degraded`, not `unhealthy`, because the deterministic rules engine still
  answers every classify request. Added the `mqtt` dependency.

- **[Refactor / Maintenance] Secrets anchored in Infisical.** `GEMINI_API_KEY`
  is read from the Infisical project **`ainie-spdesk`**, env `prod` (Oliver:
  that is where the key already lives). `KNOWFIND_AUTHENTIK_TOKEN`,
  `KNOWFIND_TS_AUTHKEY` and `SMARTPLANET_MQTT_PASSWORD` were created in that
  same project rather than copied into a second store.
  - **Known deviation:** `SP-nginx/new-app-onboarding.md` step 2 wants one
    Infisical project per app with its own `<app>-deploy` machine identity.
    Both machine identities available on theguardian are project-scoped, so
    creating a new project needs admin credentials this session did not have.
    Recorded here rather than silently skipped.
  - `SMARTPLANET_MQTT_PASSWORD` previously existed **only** in the
    `telemetry-listener` container's environment — one ephemeral place, which
    is the exact failure mode the "anchor the truth" doctrine exists to end.
    It is now in Infisical as well.
  - `KNOWFIND_TS_AUTHKEY` is ephemeral + reusable + preauthorized and
    **expires in 90 days (2027-01-13)**. The sidecar's persisted state keeps the
    node registered past that, but a node that is cleanly stopped after expiry
    cannot re-register — mint a new key then.

- **[Refactor / Maintenance] Renamed the package** from the AI Studio default
  `react-example` to `ainie-knowfind`, and replaced the AI-Studio-oriented
  `.env.example` with the real deployment's variables.

### Known gaps, deliberately not closed in this release

- **No Google Drive integration exists.** Despite the name, there is no
  `googleapis` dependency, no OAuth, and no Drive API call anywhere. `server.ts`
  serves `/api/classify`, `/api/classify-batch`, `/api/status` and `/health`, and
  the "Drive workspace" view renders `src/data/mockCorpus.ts` (319 lines of
  sample documents). What is deployed is a working Gemini classifier over sample
  data, not a Drive organizer.
- **No `@smartplanet/app-core`.** `auth/`, `nav/`, `settings/`, `schema/` and
  `conformance/` are not consumed; the app is an AI Studio applet with an
  Authentik gate in front of it. Authentication is conformant (the edge is the
  only thing that authenticates, and the app sees only headers), but the shared
  core is not adopted. Per `SMARTPLANET_APP_STANDARD.md` that is a defect, and
  closing it is a refactor rather than a deploy.
- **`/health` is behind the Authentik gate**, so an unauthenticated HTTP probe
  cannot read it. On-host probes use `http://127.0.0.1:4011/health`. The MQTT
  push path is unaffected, and that is what makes the app alertable.
