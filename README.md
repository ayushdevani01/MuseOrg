# MuseOrg

Persistent AI coworkers that share a computer, collaborate in chat and carry
out work with connected tools.

MuseOrg is a beta for the Meta Global AI Developer Hackathon. Users hire and
task continuing coworkers directly. Chief of Staff, Staff Engineer, Creative
Director and Meta Growth Operator are selected starter profiles on the same
runtime; custom coworkers use that runtime too.

## Current state

- The hosted beta requires an invite after signup and uses a server-held Meta
  model connection. Workspace access and computer boot are blocked before
  admission. Computers start on demand as isolated Linux containers on EC2.
- Model-ready users can hire the four starter roles without entering a personal
  key or choosing different models for each coworker. Retrying a partial hire
  reuses its saved coworkers. Web and Electron share this onboarding; native
  mobile accounts redeem invitations on web and use ordinary coworker hiring.
- Shared files, durable peer messages, parallel helpers, preferences after
  restart, background work and controlled worker recovery have live evidence.
- MCP, OpenAPI and GraphQL setup includes popular presets and local logos.
  Each user authorizes their own app accounts; shared model funding does not
  share the operator's social accounts.
- Hiring includes role choices and optional skills.sh search, preview and import.
  Imported instructions and supporting text files are available to the runtime.
  Preview and import were checked through the live application and runtime.
- Live Meta Spark tool work, video/audio transcription, SAM segmentation,
  transparent cutouts and image editing have verified saved artifacts.
- A four-coworker launch produced a working page, native Meta artwork and six
  review drafts. One shared headline correction woke the affected coworkers and
  updated those deliverables. See the [rehearsal and its limits](docs/verification/2026-11-04-four-coworker-launch.md).
- The engineering demo repaired a disclosed website failure, opened a PR,
  passed its checks, required authorized merging and verified the deployed
  revision through a real browser interaction.
- An employee used the official Meta Ads MCP to create and read back a paused
  campaign, upload generated artwork and verify its stored image. No ad set,
  delivery budget, payment method or active ad was configured.

Social draft files are review candidates, not proof of platform publishing.
Facebook, Instagram and Threads publishing/replies remain separate verification
work. Google and WhatsApp account
setup is deferred. Account connections can require fresh authorization.

Earlier core development checks used an isolated temporary Codex connection.
The hosted beta has its own database and native Meta connection; those temporary
development credentials are not part of its deployment. See the
[Meta evidence](docs/verification/2026-11-04-video-rehearsal.md) and
[beta configuration](docs/beta-release.md).

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
For Docker Desktop, also set `SANDBOX_CONTROL_VIA_LOOPBACK=true`.
Self-hosted deployments can configure their own model connection. To require
personal Meta keys, set `REQUIRED_PERSONAL_MODEL_PROVIDER=meta`. For the invite
beta's shared connection, follow [beta configuration](docs/beta-release.md).
Real invite codes and model credentials belong in the server environment.

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
connector infrastructure are inherited capabilities. Git history starts with a
clearly attributed source import followed by MuseOrg changes. The upstream
[license](LICENSE), notices and [README](README.upstream.md) are retained.
Workspace package names remain `@rakazo/*`.

[UPSTREAM.md](UPSTREAM.md) records the boundary between reused components and
MuseOrg additions. [The hackathon checklist](docs/HACKATHON.md) records repository
and submission requirements, remaining deliverables and opt-in publishing jobs.
