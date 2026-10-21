# ainie-knowfind Version History & Policy

> **Versioning Rule Policy:**
> - Every change (whether feature request or bug fix) **MUST increment the version number by 1**.
> - Every release entry **MUST explicitly specify** whether the change was triggered by `[User Request]`, `[Bug Fix]`, or `[Refactor / Maintenance]`.
> - A version bump must update **every** place the version is stored: this file,
>   `package.json` `"version"`, `src/version.ts` `APP_VERSION` (which is what
>   `/health` and the MQTT telemetry payload report), and `package-lock.json`
>   `"version"` — tracked since `26.10.20-010`, and it carries the version in
>   **two** places, the top-level field and `packages[""].version`. A
>   changelog-only bump silently desyncs from what the running app displays.
> - The lockfile resyncs on its own: run `npm install` after editing
>   `package.json`, rather than hand-editing it. Check with
>   `npm pkg get version` against
>   `python3 -c "import json;print(json.load(open('package-lock.json'))['version'])"`.

---

## Version 26.10.22-017

**Release Date:** 2026-10-22
**Status:** Done

- **[Bug Fix] Model output is untrusted input.** A dry run crashed on file 2
  of 12 with `ValueError: could not convert string to float: 'High'` — the
  model returned a word where a number was expected and one unguarded
  `float()` aborted the whole batch. Confidence and category are now coerced
  defensively (unit interval, 0-100, percent strings, word scale,
  case-insensitive category matching, `Others`/`0.0` fallbacks). Lengthening
  the prompt is what changed the output shape, so this will keep happening
  whenever the prompt moves. Nine tests, the first being the exact crashing
  string.

- **[Bug Fix] The `Personal` rule matched on topic rather than on what a
  document is.** `steuerT-spec1` — a commercial product spec whose text opens
  *"Product and features system covers the full German small-business
  compliance cycle"* — was filed `Personal` at 95% because it mentions tax.
  The instruction now says `Personal` means **your own** records and that a
  spec, dashboard or piece of software *about* tax or health is not Personal.

- **[User Request] Weak verdicts are labelled.** Apps Scripts are now
  exportable (`...script+json`), but Google Sites and Forms cannot be exported
  at all and were being classified from the filename while reporting 95%
  confidence. Any verdict reached on under 50 characters of text is marked
  `title_only` — `?` in the console, `[title only - weak]` in the report, plus
  a summary count — so a confident-looking guess is visibly separated from a
  verdict that actually read the document.

## Version 26.10.22-016

**Release Date:** 2026-10-22
**Status:** Done

- **[Bug Fix] The agent classifies on document text now, not just filenames.**
  Detail in `agent/versions.md` entry 13.

  The first local dry run finished 12/12 cleanly but got at least two badly
  wrong — `define the api` filed as **Personal at 100% confidence** when it is
  an API specification. Confident misfiling is worse than failure, and it is
  precisely what the dry-run gate exists to catch.

  The cause was missing input, not a weak model. Measured on a 200-file sample
  of the real Drive: **6 files had a description; 104 were Google Docs.** The
  classifier was working from a few title words. Those Docs export as plain
  text in one API call, which turns `define the api` into *"An enterprise
  RESTful and MCP API specification for SteuerTom..."*.

  Model size was tested and rejected as the fix: `qwen2.5:14b-instruct` ran 3x
  slower and emitted invalid JSON on 4 of 5 files.

## Version 26.10.22-015

**Release Date:** 2026-10-22
**Status:** Done

- **[User Request] The agent classifies on a local model by default.**
  `CLASSIFIER_BACKEND` selects `ollama` (default) or `gemini`; the local path
  runs `qwen2.5:7b-instruct` on deepthought01 over the tailnet. Full detail in
  `agent/versions.md` entry 12.

  Measured, not assumed, when asking whether a Pro subscription could lift the
  Gemini cap:

  | Option | Result |
  |---|---|
  | Gemini API key, free tier | 20 requests/day/model |
  | Google AI Pro subscription | **does not affect API limits** — tiers come from Cloud billing, not consumer subscriptions |
  | `gemini` CLI (Code Assist) | would give ~1000/day, but unauthenticated on thevault; needs interactive login |
  | `claude` CLI | not logged in; this org has Claude Code subscription access disabled |
  | Local Ollama | **unlimited**, ~19s/file, works today |

  Beyond quota, the `Personal` domain is tax documents, passports and medical
  records. Classifying those through a third-party API contradicts the Reality
  Isolation rule the taxonomy encodes; local inference keeps them on the
  tailnet.

- **[Bug Fix] Six tests were secretly hitting the network.** They patched
  `call_gemini` while `classify_batch` had moved to dispatching through
  `classify()`, so they fell through to the real local model — 49 seconds of
  live inference in a suite that claimed to be offline. Repointed, plus a new
  guard test asserting `classify_batch` never reaches a backend directly.
  28 tests, 0.09s.

## Version 26.10.20-014

**Release Date:** 2026-10-21
**Status:** Done

- **[Bug Fix] The agent now stops when the daily Gemini quota is exhausted**
  rather than retrying into it. See `agent/versions.md` entry 11 for the
  detail. Short version: the free tier allows **20 `generateContent` requests
  per day per model**, the first full dry run burned them and then retried 22
  files five times each against a quota with a 9.2-hour reset. Transient
  per-minute limits are still retried; a per-day cap never is.

  Two of the five new tests immediately caught a real bug in the detection
  itself — the error `@type` is
  `type.googleapis.com/google.rpc.QuotaFailure`, so splitting on `/` yields
  `google.rpc.QuotaFailure` and matches nothing, meaning the guard would have
  silently never fired.

  **This is a product constraint, not just a bug.** At 20 classifications a day
  the agent cannot organise a Drive of any size. Enabling billing on the Google
  Cloud project is the real fix.

## Version 26.10.20-013

**Release Date:** 2026-10-21
**Status:** Done

- **[Refactor / Maintenance] The nine-domain taxonomy now has one source:
  `taxonomy.json`.** It had been declared in **five** places, not the two
  previously noted: `src/types/classifier.ts` (the rich `OPERATIONAL_DOMAINS`
  metadata), the `enum` inside `CLASSIFICATION_JSON_SCHEMA`, a second
  `OPERATIONAL_DOMAINS` in `server.ts`, and `CATEGORIES` in
  `agent/agent_daemon.py`.

  TypeScript cannot derive a string-literal union from a JSON import — JSON
  imports widen to `string` — so the literal list is **generated** into
  `src/types/taxonomy.generated.ts` by `scripts/gen-taxonomy.mjs`. Everything
  else derives from one of those two. `npm run lint` now runs
  `gen-taxonomy.mjs --check` first, so a stale generated file fails the build
  and therefore the pre-push hook. Verified by tampering with the generated
  file: lint exits 1 and names the fix; restored, it exits 0.

  `classifier.ts` keeps only presentation (colour, icon) and throws at startup
  if `taxonomy.json` names a domain it has no colour for.

  The agent reads `taxonomy.json` directly, looking next to itself first and
  then one level up. `agent/taxonomy.json` is gitignored — the repo keeps one
  copy, and `agent/scripts/deploy-to-vault.sh` ships it to thevault as a deploy
  artefact.

- **[Bug Fix] `gemini-2.5-flash` is retired; the default is now
  `gemini-3.5-flash`.** The first real dry run failed **10 out of 10**
  classifications with `404 Not Found` on that model. Measured against the live
  API with Oliver's key: `gemini-2.5-flash` 404s (despite still being listed by
  `ListModels`), `gemini-3.8-flash` — what the UI uses — returns 503 and then
  read-timeouts, and `gemini-3.5-flash` answers reliably. Still overridable via
  `GEMINI_MODEL`.

  The failure was visible only because of the v01 decision to log Gemini errors
  distinctly instead of letting them fall through as low-confidence `Others`.
  The source spec's bare `except` would have reported ten confident-looking
  `Others` classifications and moved ten files on no judgement at all.

- **[Refactor / Maintenance] The agent's prompt now carries the full domain
  descriptions and key signals** from `taxonomy.json`. It had been sending the
  bare category names, a far weaker prompt than the taxonomy already contained.

## Version 26.10.20-012

**Release Date:** 2026-10-21
**Status:** Done

- **[User Request] Added `package-lock.json` to the versioning policy** as a
  fourth place the version is stored, now that the lockfile is tracked
  (`26.10.20-010`).

  Two details that make it easy to get wrong, so they are stated explicitly in
  the policy block rather than left to be rediscovered: the lockfile carries
  the version **twice** — the top-level `"version"` and `packages[""].version`
  — and it should be resynced by running `npm install`, never hand-edited.
  This exact desync happened at `26.10.20-011`: the lockfile was left at `010`
  after the bump and only caught on inspection.

## Version 26.10.20-011

**Release Date:** 2026-10-21
**Status:** Done

- **[Refactor / Maintenance] Removed `bun.lock`.** `75ddb50` brought it from a
  bun-based environment, leaving two lockfiles for two package managers in one
  repo. Nothing referenced bun — not `Dockerfile`, `docker-compose.yml`, the
  `deploy/` scripts, nor any npm script — and the image builds with
  `npm install`, so only `package-lock.json` ever affected the build. The bun
  lockfile was 671 lines of state that could silently disagree with the npm one.

  npm is now the single package manager of record. Verified after removal:
  `tsc --noEmit` and `vite build` both exit 0, 1673 modules transformed.

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
