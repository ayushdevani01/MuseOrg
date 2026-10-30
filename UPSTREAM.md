# MuseOrg foundation

MuseOrg adapts [Rakazo](https://github.com/elie222/rakazo), pinned at
[`c5574e2c66b644bbe82af55af4a816b89b34d29a`](https://github.com/elie222/rakazo/tree/c5574e2c66b644bbe82af55af4a816b89b34d29a).
The upstream Apache-2.0 license and existing notices are retained. The original
workspace package names remain in place while the product is adapted.

The lockfile pins Pi 1.3.0. Its native `meta` provider implements the Responses
transport; MuseOrg reuses that implementation rather than maintaining a second
Meta agent loop. Provider support in source is distinct from live account access.

Initial MuseOrg changes cover private account bootstrap, required personal model
connections, Meta onboarding, and reusable coworker profiles. The full product
requirements remain in [the goal](docs/MUSEORG_GOAL.md); this initial slice does
not complete the launch or website-repair demonstrations.

Development uses Node 24.22.1 and pnpm 9.15.0. No hosted provider is required for
the deterministic offline test path. Meta and other account setup is deferred;
no live connection is implied by passing fixture tests.
