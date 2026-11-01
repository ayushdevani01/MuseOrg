# Access and verification

Updated 1 November 2026. Hackathon acceptance and isolated local Codex testing
are confirmed. Meta and workplace account setup remains deferred while
independent core development continues.
Store credentials only in the application's connection flow or ignored local
configuration, never in this inventory.

| Capability | Configuration | Verification | Next dependency |
| --- | --- | --- | --- |
| Local web/API/worker | Compiled API/worker, web and supervisor running locally | Saved memory, overlapping helpers, scheduled/event work, cancellation and worker-crash recovery verified | Live deployment verification |
| Private accounts | Existing auth and tenant scoping adapted | Offline regressions, 3 browser scenarios and 30 database authorization tests passed | Live deployment verification |
| Meta Spark/Wonder | Native Pi provider; personal-key onboarding implemented | Offline protocol/preflight tests passed; live untested | User connects account at final integration stage |
| Meta Voice/Image/SAM | Planned | Untested | Model adapters and eventual access |
| Shared computer | Real Docker Team Computer; Windows boot corrected | Shared artifacts, parallel helpers, authenticated browser fixture and interrupted-run recovery verified | No core demonstration dependency |
| Shared projects and authority | Tenant-scoped revisions, dependencies, output hashes and expiring scoped budgets | UI/API/database regression; concurrent budget/RLS tests; real correction woke the affected coworker and superseded stale work | Native mobile grant-management form remains deferred |
| GitHub/deployment demo | Optional trusted host adapter with owner/space/repository binding | Coworker repaired a disclosed public failure, opened a PR, passed matching-head checks, merged and verified the deployed interaction and revision | Other accounts need their own explicit binding and permissions |
| MCP and custom API integrations | Visible MCP/OpenAPI/GraphQL setup; six official MCP presets with logos | Public documentation MCPs discovered; one live worker tool call; offline and browser regressions passed | Third-party account authorization and intended operations |
| Workplace integrations | Existing managed connector framework remains optional | No workplace account operation verified | Intended account and operation |
| Meta publishing, inboxes and Ads | Setup deferred | Untested | Eligible assets, permissions and authorized operation |

Passing an offline fixture test proves a software contract. It does not establish
an external account connection, production operation, or completion of the full
MuseOrg requirement set.
