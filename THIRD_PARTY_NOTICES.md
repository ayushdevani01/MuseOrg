# Third-party notices

MuseOrg adapts Rakazo and Pi as described in [UPSTREAM.md](UPSTREAM.md). Their
licenses and existing notices remain in the source distribution.

The product skill bundle adapts `frontend-design`, `webapp-testing` and
`internal-comms` from [Anthropic Agent Skills](https://github.com/anthropics/skills)
at commit `dbd4588f9e1033efb41dad4bef2f7947c8993d44`. Each reviewed directory has
its own Apache-2.0 license, retained alongside an upstream instruction snapshot
under `skills/vendor/anthropic/`.

Whitespace is normalized in the saved upstream snapshots; their substantive
text and license notices are retained. Runtime instructions are adapted separately.

MuseOrg's adapted `SKILL.md` files remove assumed client/company history, use the
actual Pi tools and project/authority contracts, and require observable evidence.
The browser-testing procedure uses DOM readiness and installed tooling; the
original lifecycle helper and examples are not shipped as executable resources.
The bundled HTTP checker and browser reference are original MuseOrg resources.

`skills/manifest.json` records the source revision and input blob for each adapted
skill. The generated runtime catalog records content/resource hashes and loads
only a selected body/resource. No rights to unrelated Anthropic document skills
are inferred from these three directories' licenses.

Bundled integration marks retain their
[Simple Icons CC0 notice](packages/core/src/mcp-preset-icons.LICENSE.md).
