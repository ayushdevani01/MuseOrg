# MuseOrg foundation

MuseOrg adapts [Rakazo](https://github.com/elie222/rakazo), pinned at
[`c5574e2c66b644bbe82af55af4a816b89b34d29a`](https://github.com/elie222/rakazo/tree/c5574e2c66b644bbe82af55af4a816b89b34d29a).
The upstream Apache-2.0 license and existing notices are retained. The original
workspace package names remain in place while the product is adapted.

This repository starts with an attributed source snapshot; Rakazo's original
Git commits are not part of its published history. Subsequent commits record
MuseOrg changes. Open-source credit remains in this document, the README,
licenses and source notices. The source snapshot is pre-existing work, separate
from the features implemented for MuseOrg during the hackathon.

The lockfile pins [Pi](https://github.com/earendil-works/pi) 1.3.0. Its native
`meta` provider implements the Responses transport; MuseOrg reuses it rather than maintaining a second
Meta agent loop. Provider support in source is distinct from live account access.

Integration logos use paths from [Simple Icons](https://github.com/simple-icons/simple-icons):
the MCP marks are pinned to 13.21.0 and the popular-app additions to 11.15.0.
Their CC0-1.0 notice is retained in
[the icon license](packages/core/src/mcp-preset-icons.LICENSE.md). Brand marks identify
the available setup routes; they do not imply partnership or connected accounts.

Integration discovery caches metadata from
[integrations.sh](https://github.com/UsefulSoftwareCo/integrations)'s public
index for searching within MuseOrg. Its
[MIT notice](apps/api/src/integration-catalog-data.LICENSE.md) is retained.

Initial MuseOrg changes cover private account bootstrap, required personal model
connections, Meta onboarding, and reusable coworker profiles. The full product
requirements remain in [the goal](docs/MUSEORG_GOAL.md); this initial slice does
not complete the launch or website-repair demonstrations.

Development uses Node 24.22.1 and pnpm 9.15.0. No hosted provider is required for
the deterministic offline test path. Live Meta model verification is recorded in
[the verification notes](docs/verification/2026-11-02-meta-and-integrations.md).
Social publishing, ads, and messaging account setup remains separate; no live
connection is implied by passing fixture tests.
