# MuseOrg harness research

Reviewed on 2026-10-26 against current primary documentation and selected source files. This is a comparison and recommendation, not an adopted design. No candidate has been installed or tested with this user's Meta account.

## Recommendation

The expanded review in [HARNESS_SHORTLIST.md](./HARNESS_SHORTLIST.md) supersedes this initial runtime-focused recommendation. It incorporates the user's preference for a smaller base and closer existing coworker products. The current finalists are **Rakazo around Pi** for maximum product reuse and **a smaller MuseOrg application around Pi** for control and compactness. No foundation has been selected or tested.

The initial review favored OpenClaw Gateway with its own runtime and direct Meta provider, based on its existing facilities. The evidence below remains useful comparison material; OpenClaw is no longer the default recommendation for this project.

Three independent reviews covered full runtimes, embeddable engines, and connectors/browser execution. The recommendations differ by integration goal: OpenClaw for maximum ready-made organization facilities; Pi for a small TypeScript kernel under our control. This recommendation favors the user's stated preference to reuse as much working runtime infrastructure as possible.

## Shortlist

| Candidate | Verified facilities | Main tradeoff for MuseOrg |
| --- | --- | --- |
| [OpenClaw](https://github.com/openclaw/openclaw), MIT | Multiple named agents, independent state/history, peer messaging, subagents, skills, browser/terminal, Gateway client protocol, direct Meta provider | Larger existing platform; shared projects and MuseOrg supervision must fit its supported interfaces |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent), MIT | Profiles, memory/skills, delegation, browser/terminal, HTTP Runs/SSE, A2A and Kanban coordination | Several coordination surfaces to choose between; custom Meta endpoint path still needs a live compatibility test |
| [Pi](https://github.com/earendil-works/pi), MIT | Embeddable TypeScript sessions, custom prompts/tools, persistence, streaming, steering, blocking hooks, MCP | Built-in core deliberately omits subagents; more employee coordination would be ours |
| [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk), MIT | Python SDK and remote server, Docker workspaces, events, persistence, browser tools, parallel delegation, confirmation policies | Strong execution toolkit; persistent organization identities and cross-chat work remain product integration |
| [OpenCode](https://github.com/anomalyco/opencode), MIT | Headless HTTP/OpenAPI server, JS SDK, SSE, sessions, custom agents, subagents, permission responses | More existing coding-product assumptions; use as a service rather than private-module imports |
| [eve](https://github.com/vercel/eve), Apache-2.0 | Filesystem-defined agents, durable workflows, tools/skills, subagents, approvals, coding/git extensions, custom providers | Default sandbox ownership is per session; a shared company computer needs an explicit adaptation |

The licenses describe the inspected repositories. Plugins, model services, hosted connectors, and other dependencies need their own applicable terms. A repository's activity or star count is not evidence that MuseOrg's exact workflows work.

## OpenClaw integration path

Official documentation recommends supervising the installed executable and controlling it through Gateway WebSocket RPC. It documents client packages, event subscriptions, approval surfaces, and reconnect reconciliation. That lets us build a separate product UI without editing its databases or relying on private runtime modules. [Embedding](https://docs.openclaw.ai/gateway/embedding), [client contract](https://docs.openclaw.ai/gateway/clients)

Each employee can have its own identity, state directory, model configuration, and session history. The docs expressly warn against sharing an `agentDir`; shared project files should be separate from those identity stores. Peer session tools and spawned workers already exist. [Multi-agent model](https://docs.openclaw.ai/concepts/multi-agent), [session tools](https://docs.openclaw.ai/concepts/session-tool), [subagents](https://docs.openclaw.ai/tools/subagents)

The official external `@openclaw/meta-provider` uses the Responses API, `MODEL_API_KEY`, `https://api.meta.ai/v1`, and documented Wonder/Spark model references. This is stronger compatibility evidence than a generic base-URL setting, but still not a successful call from our environment. [Meta provider](https://docs.openclaw.ai/providers/meta)

The separate Muse Code runtime plugin has different boundaries: OpenClaw's native messaging/spawn/browser tools do not pass through, live steering is unavailable, and several OpenClaw sandbox and approval modes cannot be enforced. It should not be selected simply because it also uses Meta models. [Muse runtime limitations](https://docs.openclaw.ai/plugins/muse)

## Other engines: evidence and caveats

Hermes supports Python embedding and an HTTP API for runs, streaming, steering, approvals and stopping. Profiles provide distinct persistent contexts. Its A2A and Kanban features support coordination; however, detached subagent results through the HTTP API do not automatically begin a new model turn. Pick and test the intended wake mechanism. [Programmatic integration](https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration), [API](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server), [profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles), [Kanban](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban)

Pi supports replacing its coding prompt and choosing its tools, so it can be a general coworker kernel. Current sources include native MCP support and use the `earendil-works/pi` repository/package naming. Custom providers support Completions and Responses. Our own peer-message/spawn tools would supply organization behavior beyond its core. [SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md), [MCP](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md), [provider configuration](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models-configuration.md)

OpenHands SDK supplies remote execution, browser tooling, delegation and confirmation facilities. OpenCode supplies an existing headless service with streamed events. Both deserve consideration if the first candidate fails a necessary integration test. [OpenHands server](https://docs.openhands.dev/sdk/guides/agent-server/overview), [browser](https://docs.openhands.dev/sdk/guides/agent-browser-use), [delegation example](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/01_standalone_sdk/25_agent_delegation.py), [OpenCode server](https://opencode.ai/docs/server/), [SDK](https://opencode.ai/docs/sdk/)

eve handles workflow checkpoints and parked approvals; interrupted steps can rerun, so side effects still require idempotency. It supports self-hosting and direct provider models. Its sandbox is normally per session, which differs from MuseOrg's shared-computer intention. [Durability](https://eve.dev/docs/concepts/execution-model-and-durability), [model configuration](https://eve.dev/docs/agent-config), [coding/git extensions](https://eve.dev/docs/code-extension)

Meta's own Muse Code SDK is another official programmatic interface. Its SDK repository is MIT, but the host binary is separate and its README labels the SDK a Developer Preview. It is an option for a coding worker, not evidence that the whole organization is implemented. [SDK repository](https://github.com/meta-models/muse-code-sdk)

## Connectors and browser fallback

Composio provides discovery, connection and execution facilities, including per-user accounts. It is a candidate for avoiding separate hand-written OAuth implementations for every supported service. Enabling a toolkit does not connect a user's account. Its SDK is MIT; its hosted service is a separate dependency. [Toolkits](https://docs.composio.dev/docs/toolkits), [multiple accounts](https://docs.composio.dev/docs/authentication/managing-multiple-connected-accounts), [SDK license](https://github.com/ComposioHQ/composio/blob/next/LICENSE)

Verified catalog boundaries include professional Instagram, Facebook Pages and WhatsApp Business. Threads and Meta Ads toolkits require our own OAuth/token setup rather than Composio-managed OAuth. [Instagram](https://docs.composio.dev/toolkits/instagram), [Facebook](https://docs.composio.dev/toolkits/facebook), [WhatsApp](https://docs.composio.dev/toolkits/whatsapp), [Threads](https://docs.composio.dev/toolkits/threads), [Meta Ads](https://docs.composio.dev/toolkits/metaads)

Connected API accounts do not automatically authenticate a browser or terminal git transport. Composio does not expose provider tokens as a supported export mechanism; use its tools/proxy or separately provision the required transport. [Token custody](https://docs.composio.dev/docs/security/token-custody)

Use the chosen runtime's browser first. If it is insufficient, [agent-browser](https://github.com/vercel-labs/agent-browser) or [Playwright MCP](https://github.com/microsoft/playwright-mcp), both Apache-2.0, can supply an adapter. [browser-use](https://github.com/browser-use/browser-use), MIT, also supplies its own browser agent loop. Adding all three would duplicate responsibilities without a demonstrated need.

Browser access broadens the reachable work. It does not guarantee task completion, grant missing permissions, keep sessions valid indefinitely, or remove MFA/CAPTCHA and site restrictions. Separate employee browser sessions or coordinated ownership are needed when they interact concurrently. An action attempted in a UI needs visible outcome verification.

## Both demos through the same runtime

### Meta launch

Voice and product footage → brief and delegated tasks → landing page and assets → staged distribution → authorized publishing and verified result. A changed requirement must reach affected tasks and supersede stale proposals.

### Coding incident recovery

The user now explicitly wants a second demonstration: a website is down, the bot diagnoses and fixes it, creates a PR, merges it, and restores the site.

A credible controlled incident should provide a deployed demo application with a reproducible defect, repository checkout, relevant runtime logs, install/test commands, deployment access and a health check. The agent should investigate from evidence rather than receive a prewritten patch.

The complete proof is: observe failure → diagnose → branch and fix → tests/browser verification → real PR → required checks/reviews → merge within the configured authority → deployment → verify the public site has recovered.

GitHub API authentication alone does not supply production logs, private git transport, or deployment control. Merging is supported when the account has permission and repository rules permit it. Required checks/reviews and merge queues still apply. Verify the actual merged and deployed state rather than treating an accepted request as completion. [Merge API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request), [merge requirements](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request)

## Remaining MuseOrg work

We should reuse runtime facilities for sessions, tools, browser execution, skills, workers and scheduling wherever they work. MuseOrg still needs a coherent hiring/chat/supervision experience, shared project artifacts, task ownership, requirement propagation, integration onboarding, and domain-specific authority for external actions. Some of this will be configuration or plugins; some will be product code. The selected runtime should determine how little we need to write.

Skills provide API expertise and operational procedures. The execution boundary must enforce the user's policy even when a worker uses shell or browser instead of a predefined connector. A human approval can authorize a continuing scope; automatic merging or routine replies need not require repeated approval when already authorized and supported by platform rules.

## Acceptance checks before adoption

With working credentials and an agreed implementation approach, prove:

1. Meta streaming and a real shell/tool loop through the selected runtime.
2. Two persistent employees exchanging a task and shared artifact.
3. Parallel workers and a mid-task correction reaching the relevant work.
4. Browser operation with visible verification and explicit session handling.
5. Reconnection and restart behavior, including reconciliation of an interrupted action.
6. One authenticated connector action and one correctly enforced external-action policy.

These are proposed adoption checks, not completed tests. No runtime, cloud, connectors or product scaffold was installed during this research.
