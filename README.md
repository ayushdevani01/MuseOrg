# MuseOrg

Persistent AI coworkers that share a computer, collaborate in chat and carry
out work with connected tools.

MuseOrg is a work in progress for the Meta Global AI Developer Hackathon.
Users can hire and task coworkers directly; Chief, Engineer, Creative and Growth
are starter profiles on the same reusable runtime.

## Current state

- Private account setup and personal Meta model-key onboarding are implemented.
- A live development run verified shared-computer repair and independent peer
  review, durable messages, retained files after restart and downloadable source.
- MCP, OpenAPI and GraphQL setup is available, with six MCP presets. Public
  documentation MCP discovery and one real worker tool call are verified.
- Meta reasoning has offline protocol coverage. Live Meta inference, Meta media,
  social account actions, coordinated requirement changes and both complete
  demonstrations remain unfinished.

The live development checks used an isolated temporary Codex connection; they
do not prove Meta model behavior. Submission configuration requires a personal
Meta API-key connection.

See [implementation status](docs/CORE_IMPLEMENTATION.md),
[verification records](docs/verification/), [account access status](docs/ACCESS_MATRIX.md)
and the [full product goal](docs/MUSEORG_GOAL.md).

## Run from source

Use Node 24 and pnpm 9.15.0, with Docker running.

```sh
git clone https://github.com/ayushdevani01/MuseOrg.git
cd MuseOrg
pnpm install --frozen-lockfile
cp .env.example .env
```

Set fresh local database passwords and put the matching passwords in
`DATABASE_URL` and `DATABASE_MIGRATION_URL`. Generate independent long random
values for `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY`, `SCREEN_PROXY_SECRET` and
`SANDBOX_SUPERVISOR_TOKEN` in the ignored `.env`. The example contains placeholders.
For Docker Desktop, also set `SANDBOX_CONTROL_VIA_LOOPBACK=true`. Keep
`REQUIRED_PERSONAL_MODEL_PROVIDER=meta` for the submission configuration; connect
the model through onboarding instead of putting a personal model key in source.

```sh
pnpm sandbox:build
pnpm dev
```

The development launcher manages its local database and prints the web address.
Hosted deployment and third-party account connections need their own setup.
The [upstream setup reference](README.upstream.md) describes inherited runtime
options; its published images and downloads are Rakazo artifacts and do not
contain these MuseOrg changes.

## Verification

```sh
pnpm db:generate
pnpm check
pnpm exec vitest run packages/core/src/mcp-presets.test.ts
```

Unit tests use deterministic fixtures by default. The verification records
separate offline checks from live model, computer and connector operations.
Do not run the Electron E2E suite as routine local verification; CI runs it
under a virtual display.

## Foundation and license

MuseOrg adapts Apache-2.0 [Rakazo](https://github.com/elie222/rakazo) at the
[pinned starting revision](https://github.com/elie222/rakazo/tree/c5574e2c66b644bbe82af55af4a816b89b34d29a)
and its Pi runtime. Existing auth, conversations, queues, computers, memory and
connector infrastructure are inherited capabilities. The original Git history,
[license](LICENSE), notices and [upstream README](README.upstream.md) are retained.
Workspace package names remain `@rakazo/*`.

[UPSTREAM.md](UPSTREAM.md) records the boundary between reused components and
MuseOrg additions. [The hackathon checklist](docs/HACKATHON.md) records repository
and submission requirements, remaining deliverables and opt-in publishing jobs.
