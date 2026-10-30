# Access and verification

Updated 30 October 2026. Hackathon acceptance and isolated local Codex testing
are confirmed. Meta and workplace account setup remains deferred while
independent core development continues.
Store credentials only in the application's connection flow or ignored local
configuration, never in this inventory.

| Capability | Configuration | Verification | Next dependency |
| --- | --- | --- | --- |
| Local web/API/worker | Source imported; dependencies installed | Web/API respond successfully; worker and supervisor ready | Peer/shared-artifact and recovery verification |
| Private accounts | Existing auth and tenant scoping adapted | Offline regressions, 3 browser scenarios and 30 database authorization tests passed | Live deployment verification |
| Meta Spark/Wonder | Native Pi provider; personal-key onboarding implemented | Offline protocol/preflight tests passed; live untested | User connects account at final integration stage |
| Meta Voice/Image/SAM | Planned | Untested | Model adapters and eventual access |
| Shared computer | Real Docker Team Computer; Windows boot corrected | Two coworkers repaired/reviewed one service through real shell tools; shared files survived stop/start | Browser-only work, parallel-worker and mid-run recovery verification |
| GitHub/deployment demo | Planned | Untested | Authorized demo repository and deployment |
| MCP and custom API integrations | Visible MCP/OpenAPI/GraphQL setup; six official MCP presets with logos | Public documentation MCPs discovered; one live worker tool call; offline and browser regressions passed | Third-party account authorization and intended operations |
| Workplace integrations | Existing managed connector framework remains optional | No workplace account operation verified | Intended account and operation |
| Meta publishing, inboxes and Ads | Setup deferred | Untested | Eligible assets, permissions and authorized operation |

Passing an offline fixture test proves a software contract. It does not establish
an external account connection, production operation, or completion of the full
MuseOrg requirement set.
