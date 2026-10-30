# MuseOrg: expanded harness and product shortlist

This follow-up expands the initial runtime-focused review. It incorporates the user's preference for a smaller foundation, searches of the web and X, and inspection of closer coworker products. It supersedes the initial OpenClaw-first recommendation. No candidate has been installed, benchmarked, or tested with the user's Meta account.

## Revised recommendation

**Pi is the preferred small execution engine. Rakazo is the strongest complete product starting point found in this review.** Rakazo already combines Pi with persistent coworkers, shared computers, web chat, delegation and connectors. Evaluate adopting its relevant web/server/worker/computer stack before rebuilding those pieces.

If that application is more infrastructure than we want to own, use Pi with a smaller MuseOrg application, taking reusable pieces from pi-web and reviewing pi-messenger for coordination. That route has a smaller starting surface and more employee-product work. It is not an already-tested combination.

These are source-based engineering judgments. No source or social post establishes a universally best harness, or performance on our two demonstrations.

## The three serious routes

| Route | What we get | What we still need | Assessment |
| --- | --- | --- | --- |
| **Adapt Rakazo** | Pi runtime; models per bot; persistent conversations; groups/peer messages; shared Team Computers; browser, shell, files; subagents; web UI; Composio/Pipedream/MCP; approval UI | Prove Meta model transport; Voice/SAM/Image skills/tools; campaign action policy; changed-requirement behavior; our new product contributions | Best match for reusing a nearly complete coworker product |
| **Pi + small MuseOrg app, using pi-web as a base/reference** | Embeddable/RPC Pi engine; Go HTTP server; Svelte PWA; saved sessions; SSE; SQLite queues; cron | Employee identities/roster; group-chat semantics; shared task state; integration onboarding; policies; browser setup | Best route when codebase control and compactness matter most |
| **Build around TrueForge** | Generic TS harness; UI/API/SDK and embeddable UI; saved agents; persisted sessions; MCP/skills; sandbox; concurrent child agents; runtime approval state | Independent peer coworkers, shared company computer, Meta Responses configuration/adapter and our policy semantics | Middle route between a small kernel and a complete coworker application |

`regnull/openbot` and `nightly-labs/openbot` are separate projects. Do not mix their licenses or capabilities.

## Rakazo: closest complete product

[Repository](https://github.com/elie222/rakazo), [Apache-2.0 license](https://github.com/elie222/rakazo/blob/main/LICENSE).

Source confirms models stored per bot, group records, peer messaging, persistent runs and external-effect records. The worker composes a Pi runtime with Postgres/Graphile job machinery. Team Computers provide shared artifacts with bot-specific home folders. The inspected worker supports temporary subagents as well as persistent peer bots. [Schema](https://github.com/elie222/rakazo/blob/main/packages/db/prisma/schema.prisma), [worker composition](https://github.com/elie222/rakazo/blob/main/apps/worker/src/index.ts), [computer design](https://github.com/elie222/rakazo/blob/main/docs/computer-runtime.md).

The inspected custom OpenAI-compatible provider uses Chat Completions. We need to prove streaming, tool calls and reasoning handling against Meta, or add/use the appropriate Responses adapter. A configurable endpoint alone is not a completed compatibility test. [Provider adapter](https://github.com/elie222/rakazo/blob/main/packages/adapters/src/pi-openai-compatible-provider.ts).

Existing approval modes/cards save UI work, but exact account/content/asset/budget enforcement across connectors, shell and browser requires an audit. Deploying the web version still involves API, worker, database and computer/supervisor services. Optional desktop/mobile and provider support increase repository size; they are not necessary features for our first web demo. [Self-hosting](https://github.com/elie222/rakazo/blob/main/docs/self-host.md).

## Small Pi route

[pi-web](https://github.com/ygncode/pi-web) is an MIT-licensed beta Go service with a Svelte PWA and one Pi RPC process per session. Its source documents session browsing/forking, model controls, SSE, SQLite chat queues and scheduling. It saves existing execution and UI plumbing, but a saved coding session is not automatically a persistent employee. [Architecture](https://github.com/ygncode/pi-web/blob/main/docs/architecture/backend.md), [license](https://github.com/ygncode/pi-web/blob/main/LICENSE).

[pi-messenger](https://github.com/nicobailon/pi-messenger) supplies peer registration, file-backed inboxes, steering delivery, task crews and file reservations. Its package declares MIT; the inspected repository lacked a separate license file. Its integration with pi-web and MuseOrg's permission model is untested. [Package metadata](https://github.com/nicobailon/pi-messenger/blob/main/package.json), [implementation](https://github.com/nicobailon/pi-messenger/blob/main/index.ts).

Pi's SDK supports custom role prompts, tools, persisted sessions, streaming and steering. Its core deliberately leaves subagents to extensions/host applications. We can retain a strong reusable execution loop while implementing only the organization-specific behavior. [Pi SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md).

## regnull/openbot: smaller organization-focused base

This MIT project implements actors/inboxes, one active turn per bot, bounded global concurrency, shared threads, per-bot memory, Markdown skills, HTTP/file/shell tools and MCP. Its documented example already coordinates Chief, Engineer, Reviewer and QA around a merge. It uses LangGraph checkpoint persistence rather than Pi. The provider factory has a fixed list; a native Meta path and temporary subagents were not established. Browser operation also needs an added tool. [Repository](https://github.com/regnull/openbot), [providers](https://github.com/regnull/openbot/blob/main/backend/openbot/runtime/providers.py), [persistence](https://github.com/regnull/openbot/blob/main/backend/openbot/runtime/persistence.py), [skills](https://github.com/regnull/openbot/blob/main/backend/openbot/skills.py).

## TrueForge: a middle route

TrueForge is MIT and provides generic harness, API and embeddable UI facilities. Local mode uses one process with SQLite and is explicitly intended for localhost. Shared deployment uses Postgres and Redis. It saves more runtime/application work than bare Pi, while supplying less existing coworker-organization behavior than Rakazo. [Repository](https://github.com/truefoundry/trueforge).

Its sandbox can continue between turns by retaining a sandbox ID. Root and child subagents share that sandbox; independent root sessions do not automatically share a company computer. Daytona is the documented provider, with lifecycle limits that need deliberate configuration. [Session implementation](https://github.com/truefoundry/trueforge/blob/main/packages/trueforge-core/src/agent-session/SessionHandle.ts), [subagents](https://github.com/truefoundry/trueforge/blob/main/docs/key-features/subagents.mdx), [sandbox](https://github.com/truefoundry/trueforge/blob/main/docs/sandbox.mdx).

The current custom provider selects Chat Completions, while its OpenAI provider selects Responses and accepts a base-URL override. Meta needs a live test of the appropriate path or a small adapter. Persisted approvals exist, but pending approvals block ordinary messages; our mid-flight-change behavior must cancel/reject the pending action before steering and replacing it. [Model adapter](https://github.com/truefoundry/trueforge/blob/main/packages/trueforge-core/src/core/llm/VercelAILLM.ts), [approval validation](https://github.com/truefoundry/trueforge/blob/main/packages/trueforge-core/src/core/runtime/AgentThread.ts).

## Other projects inspected

| Project | Useful finding | Why it is not the leading route |
| --- | --- | --- |
| [OpenTeam](https://github.com/raghavpillai/openteam) | Pi; shared workspace; persistent bot desktops; groups; routines; delegation; GPL-3.0 | Inspected docs specify one model for every bot and no approval step; established clients are desktop/iPhone, rather than a ready browser product |
| [Zosma Cowork](https://github.com/zosmaai/zosma-cowork) | Relatively compact Pi-based cowork UI and native SDK daemon; approval bridge; experimental Docker/fleet | Docs and implementation differ in maturity claims; organization semantics and cloud path need validation |
| [OpenWork](https://github.com/different-ai/openwork) | Existing OpenCode-powered cowork product and headless orchestration | Broad application; MIT core is separate from enterprise `ee/` licensing |
| [TrueForge](https://github.com/truefoundry/trueforge) | MIT; TS HTTP/SDK/UI harness; MCP, skills, approvals and subagents; local SQLite mode | Existing sandbox integration centers on Daytona; employee/group organization and shared computer need checking |
| [apollace/pi-cowork](https://github.com/apollace/pi-cowork) | Small Flask/SQLite board, Pi processes, queues and handoffs | Explicitly stateless agents fit a task board better than persistent employee conversations |
| [NanoClaw](https://github.com/nanocoai/nanoclaw) | Container-focused assistant with channels and skills | Native Claude Agent SDK integration is not proof of direct Muse model compatibility |
| [nanobot](https://github.com/HKUDS/nanobot) | Compact-assistant architecture worth reference | Current scope is larger than old minimal-line-count descriptions; no reason to replace a proven coding kernel with it based on size alone |

OpenTeam's limitations are stated in its own [launch write-up](https://openteam.so/blog/introducing-openteam) and [model guide](https://openteam.so/docs/configuration/models). GPL is an actual reuse license with obligations, not a blanket prohibition on commercial software. We have not selected its licensing model for MuseOrg.

## What "smaller" means here

Approximate source-text measurements from inspected GitHub trees, filtering source-like extensions and excluding named tests/docs/vendor/build/generated paths:

| Project | Filtered source files | Source text |
| --- | ---: | ---: |
| pi-web | 264 | 1.62 MB |
| regnull/openbot | 224 | 1.37 MB |
| Zosma Cowork | 322 | 1.95 MB |
| OpenTeam | 1,091 | 8.84 MB |
| Rakazo | 1,477 | 11.14 MB |
| OpenWork | 3,196 | 29.95 MB |

These are maintenance-surface indicators, not installed size, RAM use, runtime performance or identical-functionality comparisons. A larger product can still require less new MuseOrg code because it already implements our employee experience.

## X research

Indexed X searches initially yielded no useful direct results. Searching X through the browser did work. Relevant findings included:

- [Rakazo creator's August 13 launch](https://x.com/elie2222/status/2087898602890744089): describes the Pi harness and model/sandbox flexibility. The current repository, not this announcement, supports the technical comparison above.
- [October 25 user report](https://x.com/Prospernwo/status/2114086560610058263): reports three bots on an 8 GB VPS and criticizes speed. This is an anecdote, not our capacity test or benchmark.
- [Creator's September 4 hi.new announcement](https://x.com/elie2222/status/2095889712770699678): bot-to-bot and group communication as a separate product idea. It has not been evaluated as a MuseOrg dependency.

Social discussion helped discover products and possible issues. It does not establish the best harness or prove the Meta/coding workflows.

## Rules and licensing

The hackathon's [official rules](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver) permit open-source components when their licenses are followed and the submission builds upon them. The [participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details) separately requires identifying the functionality developed during the event. We can credit a base and demonstrate our new work.

Hand-retyping or closely translating restricted implementation is not an automatic license reset. Independently implementing behavior and architecture is different from carrying over protected expression. The U.S. Copyright Office describes the distinction between program expression and functional ideas; that source is not a personalized ruling for this project's jurisdictions. [Software copyright guidance](https://www.copyright.gov/circs/circ61.pdf), [derivative-work definition](https://www.copyright.gov/title17/92chap1.html#101).

The specific `nightly-labs/openbot` options are:

- Current main: PolyForm Noncommercial 1.0.0, requiring assessment of the intended use rather than assuming permissive reuse. [Current license](https://github.com/nightly-labs/openbot/blob/main/LICENSE).
- v0.1.11: verified Apache-2.0 snapshot. It can be assessed as a permissive base with required notices, without importing later restricted changes. [Tagged license](https://github.com/nightly-labs/openbot/blob/v0.1.11/LICENSE).
- That older tag has Electron/SolidJS UI, queues, messages/files, persistence and an embedded browser, but only Codex/Claude engine integrations, hardcoded model selection and no ready headless/cloud service. Porting it to the planned Meta web product is substantial adapter/server work. [Tagged README](https://github.com/nightly-labs/openbot/blob/v0.1.11/README.md), [agent interface](https://github.com/nightly-labs/openbot/blob/v0.1.11/src/backend/agent-client.ts), [Electron browser](https://github.com/nightly-labs/openbot/blob/v0.1.11/src/backend/browser-host.ts).

## Next decision

The leading choice is between reusing the **Rakazo product around Pi** and building a **smaller MuseOrg application around Pi**. **TrueForge** is a credible middle alternative when we want its existing approval/API/UI facilities. All preserve the general harness plus skills approach. The main tradeoff is existing employee/computer/integration functionality versus application size and control.

Before adopting either route, prove actual Meta tool execution, a peer handoff, a shared artifact, a user correction, browser verification and an enforceable external-action policy. Research has narrowed the decision; it has not completed those tests.
