# Initial core implementation

Updated 1 November 2026. This describes the initial implementation slice of the
[MuseOrg goal](MUSEORG_GOAL.md). The subsequent continuing-coworker and delivery
work is documented in [shared projects](PROJECT_WORK.md) and
[core verification](CORE_VERIFICATION.md).

## Foundation and changes

The pinned [Rakazo foundation](../UPSTREAM.md) already supplies authentication,
tenant boundaries, conversations, bot profiles, background execution, model
connections, secret encryption and computer adapters. Those are upstream
capabilities being adapted, not newly invented MuseOrg infrastructure.

MuseOrg adds:

- Independent private-account bootstrap with collision and concurrent-signup
  safeguards. The initial product has one human owner per organization.
- An optional, provider-neutral deployment policy requiring a personal API-key
  connection. The MuseOrg configuration selects `meta`.
- A backend connection check requiring an accepted model request before saving
  under that policy. Missing, rejected or inconclusive checks do not save a key.
- A common execution guard covering interactive and background work. Removing
  the personal connection cannot silently substitute host credentials or credits.
- Meta setup, selected coworker hiring and recovery when a connection is removed.
  Keys are password inputs and are not written to browser storage.
- Chief, Engineer, Creative and Growth as ordinary reusable profiles. Model
  assignment is validated and saved atomically before an intro run is queued.
- Native Meta protocol conformance checks against the pinned Pi implementation,
  including streaming tools and reasoning checkpoint replay.
- Isolation of inherited provider credentials in deterministic offline tests.
- Provider-policy enforcement on subscription sign-in, credential persistence and
  model catalogs, so the submission's Meta setup does not expose development OAuth.
  Defaults, roles and explicit coworker/routine model choices enforce the same
  provider before credential validation. Clearing overrides remains available.

Web and Electron share the web onboarding UI. Native mobile has the shared API
guards but no new Meta-specific onboarding screen in this slice; live work stays
blocked until its account has an eligible connection.

## Verification

| Check | Result |
| --- | --- |
| Offline auth, bootstrap and execution policy | 177 passed |
| UI, contract and atomic bot creation | 60 passed |
| Catalog, native protocol, connection check, environment and compose configuration | 119 passed |
| Credential-isolation setup | 6 passed |
| Focused Meta/personal API connection cases | 12 passed; unrelated router cases excluded |
| Core TypeScript checks and their dependencies | 18 tasks passed |
| Web, API and worker production builds and generators | Passed |
| Local database migrations/runtime role | Applied successfully |
| Local development services | Web/API respond successfully; worker and sandbox supervisor ready |
| Browser signup/hiring/reload/account isolation | 3 passed; screenshots visually reviewed |
| Database-backed authorization suite | 30 passed with isolated PostgreSQL and restricted runtime role |
| Provider policy, model selection, connection setup and model pin checks | 43 offline tests passed; final API TypeScript check passed |

Provider tests above use explicit fake keys and offline transports. A separate,
isolated development instance has completed browser OAuth and saved its own
encrypted Codex connection through the ordinary API. This uses the account's
subscription allowance; no API key or desktop authentication cache was imported.
The temporary login-method edit was restored, and the account's temporary
device-code setting was restored to off. See [local testing](LOCAL_MODEL_TESTING.md).

A live development task then completed with Codex: Chief called `remember`,
and independent memory readback matched the requested document at revision 1.
The authenticated web UI displayed the completed conversation. This verifies one
path through the API, queue, worker, model, tool and persisted result; it does not
establish peer coordination or recovery. See the [verification record](verification/2026-10-29-local-codex-smoke.md).
After a service restart on 30 October, authenticated reads confirmed the saved
connection, coworker, completed run and exact memory content were retained.

No live Meta inference, social account action, media generation, deployment or
website-repair demonstration has been verified. Account setup is deferred at the
user's request for those services.

## Remaining work

One real two-coworker engineering slice now passes: Engineer repaired a local
HTTP service on the Docker Team Computer, Reviewer independently checked the
same shared files and returned its result through durable peer messaging, and
the repaired files/report survived a computer stop/start. Fixed acceptance tests
passed independently and a downloaded source artifact matched the repaired file.
Windows boot compatibility, Docker volume separators and source attachment types
were corrected along the way. See the [shared engineering evidence](verification/2026-10-30-shared-engineering.md).

Integration setup is now visible through Add integration, with custom MCP,
OpenAPI and GraphQL forms plus six official MCP presets and bundled logos shared
across surfaces. Public Cloudflare/OpenAI documentation servers passed live
discovery. One bounded low-cost Chief task successfully called the assigned
OpenAI Docs MCP through the worker. Account-required presets still need their
own authorization; mobile OAuth-only management explicitly defers to web. See
the [catalog acceptance record](verification/2026-10-30-integration-catalog.md).

Continue the existing implementation plan: verify peer work and shared artifacts,
restart recovery, scoped memory, changed requirements and stale approvals; then
complete media/integration adapters and both demonstrations. The full requirement
contract remains authoritative. [Creator research](HARNESS_CREATOR_AUDIT.md)
adds Celorga's approval/evidence records as a reference, without another harness
migration.
