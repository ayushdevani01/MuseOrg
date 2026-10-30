# MuseOrg: full implementation plan

Prepared: **27 October 2026, Asia/Kolkata (IST)**. Updated 28 October: implementation has started with the user's approval. The pinned source and dependencies are present; private-account policy, Meta onboarding and coworker profiles are being verified. Live model access, deployed infrastructure and end-to-end demonstrations remain outstanding. The user deferred Meta account setup until the final integration stage.

## 1. Decision and intended result

**Adapt Rakazo's existing coworker application and Pi execution engine. Build MuseOrg's organization behavior, Meta integration, skills and two verifiable demonstrations on top.** This foundation is approved for implementation; adoption checks below still need evidence. Pi 1.3.0 already supplies the native Meta reasoning transport.

Read alongside the [design](../specs/2026-10-27-museorg-design.md), [skills audit](../../SKILLS_AUDIT.md), [context](../../PROJECT_CONTEXT.md) and [foundation comparison](../../HARNESS_SHORTLIST.md). Requirements in those documents outrank incidental implementation examples here. Dates below are targets with explicit access dependencies, not guaranteed completion estimates.

Scope reference: [MuseOrg goal and requirement contract](../../MUSEORG_GOAL.md). Read its requirement IDs before implementing or reducing scope. The original attachment was reread in full for the [second verification](../../verification/2026-10-27-plan-audit.md); this plan includes the resulting corrections.

The finished product should let a founder hire/configure persistent coworkers, chat individually or in groups, share a computer and artifacts, delegate work, change requirements, inspect results and allow bounded ongoing work. It must demonstrate a real Meta-assisted product launch and a real website repair through PR, CI, authorized merge, deployment and health verification.

The new contribution is **the Meta-powered organization and its reliable cross-role execution**, including shared revision propagation, native media, scoped external actions, evidence and both complete use cases. Rebranding an unchanged base is insufficient.

## 2. Source baseline and adoption checks

Pin upstream [`elie222/rakazo@c5574e2c66b644bbe82af55af4a816b89b34d29a`](https://github.com/elie222/rakazo/tree/c5574e2c66b644bbe82af55af4a816b89b34d29a), Apache-2.0. The inspected root manifest specifies `pnpm@9.15.0`, Node `^22.22.2 || ^24.0.0 || >=26.0.0`. Choose the supported Node 24 line and record the exact installed patch; preserve the lockfile. Its adapters pin Pi packages at `1.3.0` and Graphile Worker at `0.17.3`; old prose mentioning different Pi versions does not override manifests.

Import the base deliberately without overwriting this workspace's research/plans. Record upstream remote, commit, licenses and local changes. Do not begin by rewriting packages or renaming every upstream symbol. Exclude optional desktop/mobile/marketing apps from deployment; leave dependency surgery until the web path works.

The source confirms relevant modules, not production success on our environment. Gate adoption on:

1. Local web/API/worker/Postgres/computer boot; one real model tool loop.
2. Two coworkers exchanging a task and reading the same artifact.
3. Conversation/run/artifact survival across worker restart.
4. Model transport extensibility and an enforceable protected-action boundary.
5. Usable web deployment with stable HTTPS callbacks.

Resolve a focused Meta adapter mismatch within the baseline. If the application cannot pass those structural gates after the first day's bounded spike, document the failure and revised estimate before switching to Pi + pi-web. Do not maintain two foundations in parallel or declare a fallback proven without testing it.

## 3. Delivery priorities and completion rules

| Priority | Deliverable | Completion evidence |
| --- | --- | --- |
| P0 | Deployed durable organization with four roles, DMs/groups, shared files, delegation, headless runs | Close browser, restart worker, resume correct task without duplicate effects |
| P0 | Hiring, ongoing responsibilities and reusable expertise | Configure a custom employee, execute an ordinary workplace task and a scheduled responsibility using the same runtime |
| P0 | Useful memory and contextual delegation | Later session retrieves real prior artifacts/preferences; a child receives relevant permitted history without user retelling |
| P0 | Actual Meta reasoning, voice, SAM and image use | Request/model metadata plus usable transcript, masks/overlay and image artifacts |
| P0 | Launch workflow with correction propagation | Working tested page and fresh campaign artifacts; old approval cannot publish |
| P0 | Coding repair workflow | Real failing site, reproduced issue, fix, PR, passing CI, authorized merge, deployment and matching healthy revision |
| P0 | Action grants/approvals, dedupe and honest statuses | Denial/recovery tests plus provider receipts; no fabricated success cards |
| P0 | First Meta vertical slice: one publishing destination and one eligible inbound FAQ channel | Actual post/readback and one scoped reply; this proves the mechanism, not the entire channel scope |
| P0 | Real Meta Ads preparation | Verified account and assets; paused campaign created only with authority, readback matches approved parameters; activation/spend only if separately granted |
| P1 | Remaining named workplace/Meta operations, including both IG/WhatsApp inboxes and cross-platform distribution | Live operation evidence per requirement, including intended Meta Ads MCP route; blocked item remains outstanding |
| P1 | Authenticated browser fallback | Real browser-only task within actual account/profile authority, with evidence and honest isolation limits |
| P2 | Additional design themes, exports and visual polish | Added only after both deployed stories pass |

P1 is delivery order, not permission to silently remove an application promise. If access prevents a named capability, keep its operation blocked with a reason and disclose the limitation in the submission. A draft/export can remain useful but is not proof of publishing, sending or spending.

Track two separate results: **demo slice verified** and **full requirement set fulfilled**. The short video can select representative real runs. Full completion requires every applicable ID in `MUSEORG_GOAL.md` to have evidence, including named channels and general coworker behavior; any blocked/untested requirement prevents that completion claim. A disclosed partial event submission does not redefine the original MuseOrg goal.

## 4. Prerequisites and parallel work

Only hackathon acceptance is confirmed. Maintain `docs/ACCESS_MATRIX.md` during implementation with owner, operation, required account/app/scopes, configured status, last test, receipt and blocker. Never store secrets there.

| Input | Needed for | First check |
| --- | --- | --- |
| Meta developer key and available model catalog | Real reasoning and media tests | Authenticated catalog + smallest supported request per intended model |
| Credits/payment setup and a user-chosen cost ceiling | Model/cloud use | User verifies entitlement/billing; do not assume the event credit is active |
| Linux hosting access and HTTPS hostname | Headless work, OAuth callbacks and webhooks | Deploy a health endpoint and verify public TLS/callback reachability |
| User-owned GitHub demo repository and deployment | Outage, PR, checks, merge and deploy | Clone permission, broker push/PR/check read, exact merge rules and deploy receipt |
| Product video, recorded voice brief and brand/offer | Launch demo | Use user-owned or licensed inputs; verify files decode and facts are supplied |
| Workplace accounts/apps | Gmail, Calendar and Slack | OAuth plus intended read/draft/send or event operation, not only account listing |
| Meta business/social accounts/apps | Instagram, Pages, Threads, WhatsApp and Ads | Verify eligibility, scopes, assets, app mode, receiver and intended test operation |
| Explicit action scopes | Publication, replies, merge/deploy, optional ad activation | Save account/resource/budget/expiry constraints; no broad implied authority from OAuth |

Without live keys, build the UI/state machine, runtime integration, media conversion/parsing with labeled fixtures, policies, sample website and test harness. With keys, run genuine smoke tests immediately. Authentication and platform eligibility may require the user; development of independent work continues while those steps are pending.

Use three implementation lanes when available: (A) runtime/state, (B) media/connectors/policy, (C) web/sample-site/QA. They can be AI work branches with one human owner; this does not assume three additional teammates. Share typed contracts first. One owner integrates schema/contract changes to avoid conflicting migrations.

## 5. Target schedule and gates

Official [rules](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver) give the deadline as **4 November, 9:00 PM Eastern = 5 November, 07:30 AM IST**. The [participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details) requires a public repository, working product/code links, a three-minute video and clear disclosure of event-built functionality. Recheck the portal before submission. The guide lists $150 credits with a self-claim/payment setup process; that is not confirmation of our account's balance.

| IST target | Deliverable | Exit gate |
| --- | --- | --- |
| Oct 27 | Access inventory, pinned base, local boot, stable HTTPS, model loop, sample site CI/deploy | G0: base runs and blockers have owners; public callback route exists |
| Oct 28 evening | Four roles, hiring, persistent coordination/shared files, restart test, all five model/media smoke tests | G1: live transport works and durable state survives interruption |
| Oct 29 | Voice/video to genuine transcript, SAM masks/overlay, image and tested landing page | G2: real launch artifacts tied to one project revision |
| Oct 30 | Meta draft/approval/publish, Ads staging, FAQ receiver and correction invalidation | G3: live receipts and stale-action rejection |
| Oct 31 | Full outage → PR → checks → authorized merge → deploy → verified site | G4: coding evidence chain complete |
| Nov 1 | Both stories integrated, parallel employees, ordinary workplace task, memory, schedules and browser fallback | G5: general coworker proofs and deployed stories run without manual context relaying |
| Nov 2 | Recovery, duplicate webhooks, expired auth, ambiguous effects, skill evaluations | G6: failure/restart matrix passes or known limitation is disclosed |
| Nov 3, 20:00 | Repeat real flows, full requirement evidence, attribution, setup and feature freeze | G7: reproducible release candidate; demo-slice and full-scope status reported separately |
| Nov 4 | Record/edit three-minute genuine demo, clean-browser validation, submit and save receipt | G8: submission links accessible and receipt retained before deadline |

Account/app access is on the critical path from day one. If a required Meta operation remains blocked on Oct 28, investigate a permitted test account/app setup or another verified channel while preserving the blocked capability's status. Do not wait until recording day to discover an account is ineligible.

## 6. Work packages

Paths marked **existing** are confirmed in the pinned upstream tree. Paths marked **new** are proposed; they do not already exist locally. Prefer a small extension of an existing module when it preserves the same contract. Tests listed here verify meaningful state/effect boundaries, not every low-impact visual edit.

### W0 — Import, boot and establish evidence (Oct 27)

Dependencies: none. Owner: foundation/integration lane.

Existing: root `package.json`, lockfile, `docs/self-host.md`, `infra/compose/*`, `infra/sandboxes/*`, `apps/api`, `apps/worker`, `apps/web`.

New: `docs/UPSTREAM.md`, `docs/ACCESS_MATRIX.md`, `docs/DECISIONS.md`, `docs/verification/` and deployment runbook.

Steps:

1. Preserve current docs; initialize/import with recorded upstream provenance and lockfile. Inspect applicable upstream instructions before edits.
2. Set supported Node/pnpm and Docker requirements. Use a Linux runtime for hosted computer work; if using WSL, keep runtime data in its Linux filesystem per upstream instructions. Keep the user-facing workspace/doc links accessible.
3. Boot Postgres, API, worker and computer/supervisor following inspected self-host instructions. Configure auth/session secrets without exposing them in logs or Git.
4. Run existing checks once to record baseline failures before changes. Build the computer image and prove shell, files and browser work.
5. Deploy source-built web/API/worker with stable HTTPS and persistent database/computer/artifact storage. Allow only required ingress and protected supervisor traffic.
6. Create a user-owned disposable demo site/repo with CI, known healthy baseline, health/version endpoint and a real deploy path. Keep MuseOrg's control plane separate so breaking the demo does not break the repair tool.

Done: base UI login, one local/shared file, browser screenshot, public health/callback endpoint and a healthy versioned demo site. No secret appears in downloaded artifacts or repository history.

Important: upstream `compose:down` invokes **`down -v`**. Do not use it for routine restarts: it deletes persistent volumes. Add/document a non-destructive stop/restart path before storing real work.

### W1 — Prove Meta reasoning through Pi (Oct 27–28)

Dependencies: W0 local stack; live tests require Meta key/catalog.

Existing: `packages/adapters/src/pi-openai-compatible-provider.ts`, `pi-runtime-models.ts`, `pi-runtime-stream.ts`, `pi-models.ts`, `apps/api/src/routes/models.ts`.

New if required: `packages/adapters/src/meta-responses-provider.ts`, provider contract tests and credential-gated live smoke tests.

Steps:

1. Query the authenticated catalog at `https://api.meta.ai/v1/models`; record exact usable models. Intended IDs are `muse-spark-1.3` and `muse-wonder-1.0`; availability is account-dependent until tested.
2. Test the existing transport only where the actual API supports it. Current custom provider imports the Chat Completions path; a base URL field is not proof of Responses compatibility.
3. Implement/register a focused Responses provider if needed, reusing Pi types, cancellation, streaming and usage reporting. Follow current [Meta documentation](https://dev.meta.ai/) for request/event shapes; do not invent OpenAI field equivalence.
4. Verify multi-turn tool-call IDs/results, required reasoning state replay, streamed text/tool arguments, error/finish states, abort, malformed output and an interrupted stream. Preserve protocol state across checkpoint/resume without displaying private model reasoning as user-facing work evidence.
5. Exercise a useful loop: inspect a file → run a failing command → interpret the tool error → fix/rerun → factual completion. Test both role models.
6. Configure per-role models with no silent non-Meta fallback in the submitted Meta proof. Show a clear model-unavailable blocker if no approved fallback exists.

Done: actual tool loops for Spark and Wonder, saved model IDs/usage/request IDs where returned, recoverable stream errors and a resumed conversation. Never save API keys or sensitive raw headers in evidence.

### W2 — Configure roles and adapted skill bundles (Oct 28)

Dependencies: W0; evaluate after W1.

Existing: `Bot`, `AgentSkill`, `packages/adapters/src/skill-tools.ts`, `builtin-skills.ts`, `run-instructions.ts`, `apps/api/src/agent-skills.ts`.

New: `config/museorg/roles/`, `skills/vendor/anthropic/`, `skills/museorg/`, `skills/manifest.json`, bundle/resource resolver, `THIRD_PARTY_NOTICES.md`.

Steps:

1. Seed four persistent profiles with responsibilities, success criteria, model, skill versions and capabilities. Chief coordinates; Engineer builds/repairs; Creative handles media/brand; Growth handles distribution/inbox.
2. Vendor/adapt only `frontend-design`, `webapp-testing`, `internal-comms` initially, at the audited commit with license/hash/change records. Add original procedures listed in the skills audit.
3. Publish role-filtered descriptions in the existing catalog. `skill_read` resolves a pinned body; referenced scripts/resources resolve inside a read-only bundle with traversal protection. Install actual script dependencies in the computer image.
4. Disable runtime self-modification of role permissions, reviewed bundles and model/policy grants. Coworkers can propose a new skill as an artifact for review.
5. Expose hiring/configuration using existing bot creation/settings and the same engine. Proposed UI: enter a role/responsibility or choose an editable template, review model/skills/connections/authority, hire, then land in that employee's DM. Keep the same ID/history across visits; support responsibility edits and pause/archive without losing prior work. No hardcoded per-role execution pipeline or automatic permission expansion from a role description.

Done: correct skills load for each role; irrelevant triggers do not load the full catalog; user hires a custom role that executes a permitted ordinary workplace task using the same runtime, then revisits it with identity/history intact. Development helpers invoking Claude are not mistaken for Meta-ready runtime tools.

### W3 — Durable project work and peer coordination (Oct 28)

Dependencies: W0; use W2 profiles; W1 for real autonomy tests.

Existing: schema Task/Run/Ticket/Bot/ChatGroup, `bot-messages.ts`, `run-execution.ts`, `run-lifecycle.ts`, `run-wakeup.ts`, `pi-runtime-subagent.ts`, `apps/worker/src/index.ts`.

New: project/revision contracts, migration(s), `packages/core/src/project-work.ts`, `packages/adapters/src/project-work.ts`, typed API routes and outbox processing as needed.

Steps:

1. Add Project/ProjectRevision and links to existing visible Tickets and execution Tasks/Runs. Define owner, current revision, dependency inputs, status/blocker and output links without creating another queue.
2. Use existing run leases/fences/checkpoints and Graphile jobs. Ensure accepted user tasks and peer handoffs are durably recorded before acknowledgement.
3. Define task/steer/notification envelopes with source, destination, correlation, revision, result contract and hop limit. Deduplicate handoffs and completion notifications.
4. Enforce one active employee turn, global/child limits from the design, and a configurable model/tool/time budget. Reserve global slots for foreground human work; do not let a waiting parent occupy all capacity required by its children.
5. Propagate only authorized project context to peers. Group visibility does not mean all bots should run on every message.
6. Implement child cancellation and return results/artifacts to the parent. Persistent work can resume after crash; interrupted temporary workers may be marked interrupted and requeued by their parent with the same effect/delegation dedupe keys. Do not imply that every in-memory child stack survives a restart.
7. Build a bounded child briefing from relevant current decisions, prior task/summary links, preferences and artifacts allowed by inherited scope. Parent integrates child results and writes durable notes once; children do not duplicate global memory entries.
8. Reuse Routine/schedule jobs to configure an ongoing responsibility with timezone, trigger, role, connections, allowed actions, budget and next run. Accept/persist human input during long child/media/shell jobs; expose job handles and cancellation so steering does not wait for the full job to finish.

Done: Chief and directly tasked specialists can delegate useful parallel work; child receives relevant prior context; long-running work remains steerable; duplicate notifications and bot chatter cannot generate an unbounded loop. Close the browser and let a scheduled responsibility complete, then reconnect to its result. Restart mid-run leaves a recoverable, truthful state.

### W4 — Artifacts, scoped memory and safe shared files (Oct 28–29)

Dependencies: W3 contracts; can develop beside W1/W2.

Existing: Artifact versions/hashes, MemoryDocument/MemoryRevision, `apps/api/src/artifacts.ts`, `memory-tools.ts`, `memory-context.ts`, `computer-workspace.ts`, `workspace-file-tools.ts`.

New: project artifact provenance links, scoped retrieval helpers, artifact inspection UI and code-worktree reservation records if not already covered.

Steps:

1. Keep one shared project directory and per-bot working directories. Upstream Team bots share the OS user and can read the whole computer, including browser profiles; these paths organize work and are not private security boundaries. Keep private DM/memory/session state server-side and audit imports/exports/caches so it is not automatically copied to shared disk. Add immutable artifact registration with producing task/run/revision, MIME/hash and input dependencies. Validate file paths, upload size/type and access before serving.
2. Retain existing artifact families/versions rather than duplicate them. Freeze the exact bytes used for approval; later workspace edits create new versions.
3. Give concurrent code workers separate worktrees/reservations. The Engineer owns integration; prevent two agents from overwriting the same active source file.
4. Use private role notes, scoped conversation/history search and shared project facts with source IDs. Limit retrieved context; current structured project/task state overrides old summaries.
5. Implement memory inspect/edit/delete and scope checks in trusted worker tools. Do not broadcast private DM history by default or persist the private context in shared computer logs. A user/coworker export to shared disk is explicitly shared. No vector DB or external memory service on the critical path. Separate computers are required later if workloads need mutually untrusted OS-level isolation.
6. Persist uploads/media/files with backup coverage and authorized download URLs. Publish only selected media that external platforms need to fetch.
7. Record task outcomes with source events/artifacts and user-stated preferences after work completes; retrieve relevant history on later tasks. Summarize older context with raw-source links retained for drill-down. Use existing search/compaction where suitable; do not require OptMem or an extra observer model call for every turn.

Done: another coworker can inspect an artifact without copying files manually; private notes remain scoped; old offer text in memory does not override the latest revision; code workers cannot silently clobber each other. In a later session after restart, ask to reuse a previous launch: employee finds its real artifacts/settings, honors a saved preference and gives a child the relevant context without the user re-uploading or retelling it.

### W5 — Enforce authority and reconcile effects (Oct 28–30)

Dependencies: W3/W4 contract baseline; required before live mutating W8/W9/W10 operations.

Existing: `packages/core/src/action-approval.ts`, `approval-effect-key.ts`, adapters `run-tool-gate.ts`, `approval-effect.ts`, `run-effects.ts`, `composio-connector.ts`, API `mcp-approval.ts`, existing approval UI.

New: `packages/core/src/action-intent.ts`, `scope-grant.ts`, broker handlers, typed operation registry and approval detail contracts; extend ExternalEffect instead of a parallel journal.

Steps:

1. Define explicit operations for demo-critical reads/writes. For writes bind account/resource/destination, frozen payload/artifact hashes, revision, budget, expiry and expected PR head SHA. An arbitrary connector action name cannot choose its own risk class.
2. Add user-granted reusable scopes and exact-intent approvals. Reuse UI/cards but show real content, target, spend, grant and supersession reason. An LLM auto-review can advise, never grant more authority.
3. Enforce roles/subagent scope in protected tools executed directly by Pi in the trusted worker, deriving identity from server-side run context. Keep OAuth/model/publishing tokens and all broker bearer credentials outside the Team Computer. Do not trust a role/run ID supplied by a shell process or put authority in env/files/process arguments that same-user peers can read. Disable raw protected connector operations that bypass these contracts.
4. Keep shared demo browser profiles free of privileged GitHub/social sessions. A low-privilege browser-only application can use a deliberate whole-Team profile grant under W8B; do not claim per-role isolation for it. Role-restricted/sensitive authenticated profiles need isolated trusted handling. Remove host admin/control credentials from shell/network reach. Audit supervisor tokens/control sockets as well as broker identity: Team peers can inspect same-user processes and browser profiles. Test identity-theft attempts and role spoofing; prove that a shell/browser workaround cannot reach the protected operations in the deployed topology.
5. Use a transactional claim for valid lease/current revision/authorization, with budget reservation before dispatch. Record idempotency key and provider receipt. Unknown outcome enters reconciliation; do not blindly retry posts, sends, spend or merge.
6. Budget grants reserve aggregate allowance in the database across parallel workers, not one limit per action. Final accounting uses actual known cost; uncertainty holds the reservation until reconciled. User can revoke a grant for future dispatches.
7. Serialize conflicting revision updates and effect claims for a project. A requirement change stops undispatched old intents; already dispatched actions finish into a receipt/correction path.

Done: stale content, wrong account, excess spend, unauthorized role, expired grant, changed PR head and duplicate/crashed effect cases cannot silently dispatch. Direct local work still runs without approval friction. Record limits of browser/egress enforcement rather than claiming a universal desktop policy.

### W6 — Mid-flight corrections (Oct 29–Nov 1)

Dependencies: W3/W4/W5.

Existing: SteeringMessage, run messages/checkpoints, group/chat APIs.

New: revision patch/invalidation/notification logic and stale/superseded UI.

Steps:

1. Turn an unambiguous shared-project instruction into a structured revision patch with source message and expected current version; resolve concurrent updates with compare-and-swap/rebase. Derive edit authority from the authenticated initiating human message or an explicit scoped grant/delegation, not from a model-supplied source ID. Check project/field scope. Quoted website/email/repository instructions cannot change the user brief or expand action grants.
2. Track producing/consuming artifacts and task dependencies. Atomically advance revision, invalidate affected outputs/approvals and enqueue relevant owner notifications. When dependencies are incomplete, invalidate conservatively.
3. Deliver steering at a safe boundary; don't append contradictory instructions only to a hidden prompt. The employee acknowledges the new requirement and updates its output or records a blocker.
4. Allow correction while a user approval is pending. Close/supersede that approval without blocking the new human message; show the replacement when ready.
5. Retain older outputs/receipts as history. Mark in-flight stale results and distinguish a dispatched external action requiring correction.

Done: while page/creative runs and publication approval is pending, change the offer. Page, assets and caption refresh; the previous approval cannot publish; irrelevant tasks do not restart unnecessarily.

### W7 — Native Meta media tools (Oct 28 smoke tests; Oct 29 complete)

Dependencies: W0 storage/image; W1 establishes shared credential/telemetry conventions, not necessarily media transport.

New: `packages/adapters/src/meta-media/` (transcribe, segment, image, parse/render, errors), typed tool contracts and persistent media jobs; `skills/museorg/meta-media/`.

Steps:

1. Upload and validate voice/video, persist source bytes/checksum and technical metadata; bound size/duration and record processing progress.
2. Convert unsupported browser audio to supported mono PCM16 WAV at 16/24 kHz with pinned FFmpeg tooling. Call **`POST /v1/asr/transcribe`**, multipart **`request` JSON and `audio` WAV**, using `muse-voice-transcribe-1.0` per [official speech recipe](https://dev.meta.ai/docs/speech-to-text). Recorded audio comes first; realtime WebSocket is optional polish.
3. Call **`POST /v1/responses`**, model `sam-3.1`, with text prompt and `input_video` using supported `video_url` or uploaded `file_id`. Follow [segmenting](https://dev.meta.ai/docs/sam/segmenting) and [client libraries](https://dev.meta.ai/docs/sam/client-libraries). Output is special-token text: parse with the official `@meta-sam/parser` or `meta_sam_parser`, decode masks, then render an actual overlay/cutout/composite. Store raw response, masks and rendered asset separately.
4. Generate/edit with `muse-image-1.0` through the documented Responses image call or `/v1/images/generations` / `/v1/images/edits`; follow [image docs](https://dev.meta.ai/docs/image-generation). Decode image bytes/base64 into a real artifact and validate output type/dimensions.
5. Use returned/verified fields from current recipes, not guessed OpenAI-compatible payload options. Pin parser versions and a representative sanitized fixture for repeatable decoding tests.
6. Reconcile persistent media jobs after interruption; retries respect provider limits and avoid duplicate billable requests when outcome is unknown. Empty segmentation/no-match and provider failure become clear blockers or revised prompts, not invented masks.
7. Add target locale and approved localized copy/brand to the brief. Produce at least one localized visual/caption variant from supplied facts and check glyphs, text fit, wording and offer consistency. Use image generation plus deterministic text composition where needed; do not assume an image model renders exact product copy reliably.

Done by Oct 28 evening: one live request/output per media model plus Spark/Wonder proof. Done by Oct 29: a user-provided voice/video produces transcript, decoded masks, visible overlay/cutout and generated/localized campaign imagery that other coworkers can use.

### W8 — Connect accounts and verify operations (start Oct 27; target Oct 30)

Dependencies: W0 public HTTPS; W5 before writes; provider account/app access.

Existing: Composio connector/catalog, Connection/AgentConnection, `apps/api/src/routes/connections.ts`, inbound/webhook handlers.

New: per-operation capability map, health/readback checks, signed receiver/event dedupe and explicit integration status UI. Use native adapters only for genuine gaps.

| Integration | Prove with the actual account | Conditions to check |
| --- | --- | --- |
| GitHub | Fetch repo/issue/check logs; broker creates branch/PR; merge within policy | Git transport vs OAuth are distinct; repository rules/reviews/checks/merge queue; no admin bypass |
| Gmail | Fetch a chosen real thread; create an authorized draft; send only within grant/approval | Requested scopes, account identity, recipient/content; distinguish draft from sent message |
| Calendar | List selected calendar; create/read back an authorized disposable event | Calendar ID, timezone, attendees and whether invitations send notifications |
| Slack | Read allowed channel/event; authorized test reply and readback | Workspace install, channel membership/scopes, event receiver and retry dedupe |
| Instagram | Eligible account/media publish readback and scoped inbound reply | Professional account, correct login/API path/scopes, reachable media, app mode/review |
| Facebook Pages | Approved Page post plus readback | Page identity/token/permissions, asset ownership and app mode |
| Threads | Publish/read back an approved test post | Own OAuth app/config if managed OAuth unavailable; real refresh/expiry behavior |
| WhatsApp | Receive real eligible test message and send one scoped reply | WABA/test number, recipient eligibility, subscribed webhook, allowed reply window/template policy |
| Meta Ads | Check intended Meta Ads MCP route; read account/assets; preview then authorized paused campaign/ad set/ad; read back | Verify custom-client authentication and account access, own app/token as required, billing/assets, targeting/budget, active vs paused states |
| Deployment | Read real logs and release status, deploy the approved commit, fetch health/version | Explicit ownership, credentials in trusted layer, real revision mapping |

Use [Composio authentication](https://docs.composio.dev/docs/authentication), [triggers](https://docs.composio.dev/docs/triggers) and current toolkit pages for [Calendar](https://docs.composio.dev/toolkits/googlecalendar), [Slack](https://docs.composio.dev/toolkits/slack), [Instagram](https://docs.composio.dev/toolkits/instagram), [Facebook](https://docs.composio.dev/toolkits/facebook), [Threads](https://docs.composio.dev/toolkits/threads), [WhatsApp](https://docs.composio.dev/toolkits/whatsapp), [Meta Ads](https://docs.composio.dev/toolkits/metaads). Verify available actions against actual configured auth; tool availability is not account permission. Follow [WhatsApp business messaging policy](https://whatsappbusiness.com/policy/) for the intended reply.

Steps:

1. Prefer the existing Composio path; avoid adding a second connector platform without a capability gap.
2. Separate OAuth success from each operation test and from trigger activation. Signed receiver must verify provider signature/secret and replay window, dedupe provider event IDs, persist, acknowledge promptly and enqueue work.
3. Store connection identity/scopes/provider references privately; role sees a capability, not raw token. Handle expiry/reauthorization with a concrete blocker.
4. Test public callback routes from the platform. Managed Gmail/Calendar triggers may take approximately 15 minutes; use explicit fetch or a pre-arrived event for the short video and disclose that mechanism.
5. Save sanitized external IDs/URLs/status evidence. Do not label a simulated request, upload-only object or paused ad as a successful publish or running campaign.
6. The accepted application names Meta Ads MCP specifically. Check the [official overview](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview), actual client auth and account/tool access before deciding the Ads transport. Finding the server does not establish MuseOrg can authenticate. If using Composio/native Marketing API for a blocked MCP route, record the transport change and keep MCP status unverified/blocked; do not claim that MCP works. Route all protected MCP writes through W5 as well.

Done for the first slice: one publishing and one inbound channel pass the real launch story. Done for the full requirement set: verify named workplace operations, cross-platform staging/publishing capability and both Instagram/WhatsApp scoped replies, with real account evidence. An unavailable account/operation stays a material outstanding requirement, even when a partial submission discloses it honestly.

### W8B — General browser fallback (target Nov 1)

Dependencies: W0 live browser, W3/W4 artifacts/tasks and W5 authority. This is a required capability proof for the broader organization; it is not a third fixed product workflow.

Existing: computer/SandboxProvider browser tools, `run-tools-computer.ts`, `run-tool-gate.ts`, artifact and takeover surfaces. New only as needed: profile-authority records, trusted browser-operation handlers and browser-only task verification.

Steps:

1. Select an actual user-owned low-privilege application/workspace with an authenticated browser UI and no enabled native connector. Start with a bounded ordinary task, such as inspecting/updating a permitted item and saving proof; the task must require browser interaction.
2. If using the shared Team Computer, explicitly grant the Team that profile/account's authority. All Team coworkers can access its session; shared files/browser state are not role-isolated. Use a dedicated profile/account that contains no unrelated privileged sessions. Ordinary work inside that existing grant proceeds without repeated approval.
3. Where the user needs per-role isolation, use a separate computer/browser controlled by trusted tool handlers, with server-derived identity and protected control endpoints. Reuse provider lifecycle capabilities rather than inventing a second agent engine. Do not expose its profile, CDP/control token or session to the shared workload shell.
4. Protected social publishing/spend/merge remains a typed W5 intent. If it must use the web UI, implement a tested browser executor for that exact operation with frozen payload, precondition checks, authorization and readback. Raw privileged browser access cannot simultaneously promise exact per-action enforcement. Unsupported cases become a blocker/takeover.
5. Verify actual before/after state, browser evidence and the saved output; test a missing selector, expired login and task cancellation. Record whether the operation has whole-profile authority or finer enforced scope.

Done: employee completes a real authenticated browser-only task, shares its result and can resume after reconnect. Do not claim arbitrary website success or protected-operation support beyond the verified executor/profile scope. This closes the planned capability gap only after its live test passes.

### W9 — Launch workflow and scoped FAQ (Oct 29–30)

Dependencies: W1–W8 relevant surfaces.

New: `skills/museorg/project-brief/`, `growth-operations/`, `scoped-inbox/`, pinned landing-page starter and demonstration scenario/evidence script. Reuse normal tool-based employee execution.

Steps:

1. Chief turns voice transcript and supplied facts into a shared brief with constraints, brand/offer, assets, destinations and permitted actions. Do not infer missing product claims from a promotional style prompt.
2. Assign Engineer and Creative parallel work with explicit shared artifact inputs. Engineer builds, tests and deploys a reproducible live page using the configured starter. Creative uses SAM and Image outputs plus the current page/brand artifacts to make real media variants, including the target locale.
3. Growth loads current page/brand/assets, prepares destination-specific captions and campaign payloads with target IDs/budget. Produce preview artifacts before any external write.
4. Inject a genuine chat correction while work or approval is pending. W6 refreshes affected outputs and approvals.
5. User approves exact content or a matching grant authorizes it. Broker publishes and records readback; stage the Ads objects paused unless activation has valid authority. Activation, if demonstrated, verifies delivery status and budget rather than assuming create success means delivery.
6. Activate specific FAQ scopes grounded in approved facts and eligible channel policy. Route real inbound questions through both Instagram and WhatsApp for full-scope proof, reply once per event and record results. The short video may show one representative channel. An unsupported question escalates. Closing the browser does not stop the listener/worker.

Done: live page at mobile/desktop widths, transcript, actual segmentation render, generated creative, current approved payload, post/ad receipts and scoped inbound reply all linked to project/run evidence. Changed requirement appears consistently across affected outputs.

### W10 — Outage repair, PR, merge and deployment (Oct 27 site setup; Oct 31 complete)

Dependencies: W0 sample site, W1 Engineer model, W3/W4 tasks/files, W5 GitHub/deploy grants, W8 GitHub/log/deploy operations.

New: `skills/museorg/incident-repair/`, `github-delivery/`, `browser-verification/`, demo incident fixture/runbook and real deployment verification adapter.

Steps:

1. Keep a known healthy demo service with a useful HTTP health endpoint and deployed Git SHA. Introduce a documented reversible defect in the demo service. Record that the incident is intentionally seeded for demonstration, while all diagnosis/fix/remote operations are real.
2. User tasks Engineer through MuseOrg. Engineer checks live URL/browser, deployment logs and repo state; records observed failure and reproduces it locally. No pre-scripted patch disguised as investigation.
3. Create isolated worktree/branch and make the smallest supported fix. Run a meaningful regression plus existing build/type/lint checks appropriate to that service. Review the diff; temporary reviewer may identify issues using Wonder within inherited scope.
4. Trusted Git broker receives a scoped validated patch/commit bundle for the authorized public demo repo. Push a new branch and open a real PR. Do not inject write credentials into the agent's computer; never execute repository hooks in the trusted credential environment.
5. Read actual CI/check status/logs and associate them with the exact head SHA. Failure blocks merge; Engineer may iterate through another commit/check cycle.
6. Merge only if the grant permits this repo/change class, expected head is unchanged, required checks/reviews are satisfied and repository rules permit it. Honor a configured merge queue. Changes to workflows/policies/secrets or broader infrastructure require separate authority.
7. Observe or trigger the existing authorized deployment for the merged SHA. Follow actual deploy status; poll with bounded backoff and show pending rather than fixed while still deploying.
8. Verify live health + deployed revision + a browser/user-path regression. Report success with PR/check/merge/deploy URLs/IDs and a concise incident report. A different deployed SHA or still-broken route fails completion.
9. If deployment regresses, use the approved rollback scope or propose an exact rollback action, record result and keep incident open until verified.

Use actual [GitHub job logs](https://docs.github.com/en/rest/actions/workflow-jobs#download-job-logs-for-a-workflow-run) and [merge API semantics](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request). Prefer connected provider/tooling where it exposes these operations; do not invent successful Actions IDs or bypass repository protection.

Done: evidence chain from broken service through reproduced bug, regression test, PR, green checks, merge and matching healthy deployed version. Auto-merge is a configured product capability, not authorization to merge an arbitrary real repository during development.

### W11 — Web product integration (Oct 28–Nov 1)

Dependencies: W2–W8 contracts, develop alongside backend.

Existing: `apps/web/src/pages/GroupPanel.tsx`, `pages/shell/*`, `components/SubagentCard.tsx`, `components/ApprovalRulesSettings.tsx`, existing chat/artifact/connection components.

New only where necessary: project brief/revision inspector, work/dependency view, artifact provenance preview and exact action detail components.

Steps:

1. Adapt roster, role settings, DMs/groups, shared computer and artifact surfaces to MuseOrg. Preserve existing working chat behavior.
   Include custom hiring, editable ongoing responsibilities/schedules, connection/profile authority and persistent memory inspection as employee controls; four seeded chats alone do not demonstrate hiring.
2. Show real employee/task/worker states, owner, latest requirement, blockers and next action. Distinguish waiting for user, waiting for platform, failed, stale and finished.
3. Add upload/recorded-voice entry, media previews and source/derived artifacts. Provide meaningful feedback for upload/processing failure.
4. Approval cards show destination/account/content/assets/budget, scope and revision. Permit edit/correction, reject, approve and inspect prior version; stale buttons cannot dispatch.
5. Reconnect using durable event cursor; do not create duplicate runs/messages when retrying a request or refreshing the browser.
6. Expose pause/cancel/resume, scope revocation and connection expiry. Use evidence-based status and usage; no decorative invented productivity metrics.

Done: both flows usable from the deployed browser without developer-terminal orchestration, accessible controls and a clean mobile/desktop critical path. Visual polish is bounded by the event timeline.

### W12 — Reliability, skill evaluation and release proof (Nov 1–3)

Dependencies: both useful slices; start individual checks as soon as their modules exist.

New: focused Vitest/database tests in relevant packages, Playwright end-to-end specs, sanitized fixture/evidence manifest and recovery runbook.

Steps:

1. Run the verification matrix below with a fake provider where useful for controlled failure injection; label fixtures. Then run credential-gated genuine provider/browser stories separately.
2. Test browser close, worker kill/restart, stale lease, pending approval correction, provider timeout, duplicate webhook and stream interruption at meaningful boundaries.
3. Restore database + artifact/computer volume backup into an isolated instance and verify a prior conversation/artifact/task. A successful backup command alone is insufficient.
4. Evaluate initial skills on intended models with positive/negative triggers, useful outputs and failure handling. Record actual latency/usage/interventions. Keep changes small if no measured benefit.
5. Verify request logs redact secrets; protected credentials cannot be obtained through ordinary tool responses or browser profiles. Test untrusted page/message instructions trying to publish or change policy.
6. Run both deployed stories repeatedly with fresh project/run IDs. Retain genuine evidence and record human assistance. Investigate failures; do not replace them with mocked success cards.
7. Prove generality outside the two demos: hire/configure an ordinary workplace employee, prepare a factual brief using permitted Gmail/Calendar/Slack information, run one scheduled responsibility while offline and complete W8B's browser-only task. Revisit prior work in a new session and delegate a context-dependent child task. Update every requirement ID's actual status/evidence, separating planned, blocked, tested and fulfilled.

Done: critical matrix and general coworker proofs pass, material limitations documented, recoverable release candidate and repeatable real demo available by feature freeze. Report full-scope fulfillment separately; a blocked named requirement is not a passed requirement.

### W13 — Attribution, demonstration and submission (Nov 3–4)

Dependencies: W12 release candidate.

New: public README/setup, `THIRD_PARTY_NOTICES.md`, `docs/DEMO.md`, release/evidence notes and submission checklist.

Steps:

1. Explain what came from Rakazo/Pi/skills and exactly what MuseOrg added during the event. Preserve licenses, notices and relevant modified-file attribution. Hand-retyping restricted source is not a license reset; reuse allowed code with attribution or implement original functionality.
2. Document local/hosted setup, model/connector requirements, optional integrations and known limitations. Provide a safe demo environment; never publish real tokens or private account data in the public repo/video.
3. Record genuine runs and edit to three minutes. Suggested allocation: 0:00–0:15 organization/shared computer; 0:15–0:55 voice/video/page/media; 0:55–1:30 correction + approvals + publication/FAQ; 1:30–2:40 outage/PR/checks/merge/deploy; 2:40–3:00 healthy version/headless evidence/limits. Label cuts and time lapses; elapsed provider/CI time is not promised to fit in three minutes.
4. Show Meta request/model evidence and usable results; tie media to the product story instead of adding unrelated model calls for a checklist.
5. Validate public repo, product and video links from a clean browser. Compare submission fields with the current portal and include all requested links/disclosures.
6. Submit before the official deadline and retain the confirmation/receipt. Actual publication/submission is a later authorized action; this document does not claim it is done.

## 7. Contract details to implement first

These are semantic contracts, not invented existing endpoints. Add them to the existing typed oRPC/contracts style rather than creating a parallel REST API solely for this plan.

| Contract | Required information / invariant |
| --- | --- |
| Create/update project brief | Project, expected current revision, structured patch, source message, actor; return immutable revision and affected work |
| Assign/delegate work | Project/revision, parent/owner, inputs, result contract, capabilities/budget, dedupe/correlation and notification destination |
| Register output | Immutable bytes/hash, MIME, producing run/task/revision, input dependencies, access scope and artifact family/version |
| Propose action | Typed operation, connection/account/resource, canonical payload/assets/revision, constraints, expected PR head and idempotency key |
| Authorize action/scope | Authenticated human authority, exact intent or explicitly bounded grant, expiry/revocation and budget reservation rules |
| Dispatch/reconcile effect | Valid lease + current authority/revision claim; receipt, failure or uncertain result; never duplicate blindly |
| Receive event | Verified provider signature, stable event ID, connection/channel, minimal persisted payload and enqueue result |
| Stream status | Durable event ID/cursor, run/task/actor, real transition/artifact/effect, redacted payload and replay dedupe |

Domain state examples: work `queued → running → waiting_user / waiting_external / blocked → completed / failed / cancelled`; artifact `current / stale`; intent `proposed → authorized → claimed → dispatched → succeeded / failed / uncertain`, with `rejected / superseded / expired` terminal states before dispatch. Map to compatible existing run statuses; do not fork upstream lifecycle semantics unnecessarily.

## 8. Verification matrix

| Test | Level | Required observation |
| --- | --- | --- |
| Two jobs target one coworker | Database/worker | Only one owns an active lease; losing/stale worker cannot commit effects |
| Two specialists + temporary workers | Runtime | Useful parallel completion within global limits; no child-slot starvation |
| Human correction during a long child/media/shell job | Runtime/E2E | Message persists promptly; parent/worker can steer or cancel without waiting for the whole job; no conflicting second employee loop |
| Hire custom employee and ordinary workplace task | Live E2E | Stable identity/history, configurable expertise, permitted Gmail/Calendar/Slack-backed brief using the same engine |
| Scheduled responsibility with browser closed | Worker/live E2E | Durable timezone-aware wakeup and saved result appear after reconnect; paused responsibility stops future work |
| Later-session recall and context-dependent child | Runtime/live E2E | Relevant prior artifacts/preferences found without retelling; child gets permitted context; no duplicate global memory writes |
| Authenticated browser-only task | Browser/live E2E | Real before/after result and evidence within granted profile authority; isolated role profile required where claimed |
| Peer notification loop | Runtime | Dedupe/hop/budget stops repeated wakes; human input remains responsive |
| Worker restart and browser reconnect | Integration/E2E | Durable tasks/events/artifacts recover; interrupted children truthful; no duplicate message/effect |
| Private DM/memory retrieval by another role | Authorization/topology | Trusted tool denies access unless shared; no private context caches on shared disk; shared Team files are honestly presented as mutually readable; current brief overrides stale summary |
| Correction during generation and pending approval | Database/E2E | New revision invalidates affected outputs; old approval rejected; fresh artifacts shown |
| Untrusted content asks to change brief/grants | Authorization/runtime | No edit authority from quoted content or invented source ID; model cannot expand a user action grant |
| Wrong account/hash/revision/expired grant | Broker | No remote dispatch; reason visible |
| Parallel spend requests | Database/broker | Aggregate reservation never exceeds the granted budget |
| Crash/timeout after remote mutation | Broker/provider fixture + live readback | Unknown outcome reconciled before retry; uncertainty visible if unrecoverable |
| Shell/browser or peer tries protected mutation/identity theft | Deployed topology | No token/session/broker bearer/control-plane route to bypass server-bound identity; role spoof denied; failure blocks the role-enforcement claim |
| Invalid/duplicate webhook | API/worker | Reject bad signature; one durable event/run/reply for a duplicate |
| SAM no match/corrupt audio/media API error | Media | Clear failure or rework; no fake masks/transcript/success |
| Meta tool loop stream interruption | Adapter | Correct tool IDs/state, abort/error behavior and recoverable continuation |
| CI red / changed PR head / required review | GitHub delivery | Merge blocked until exact current requirements satisfied |
| Merge succeeds but deploy fails/wrong SHA | Deployment/E2E | Incident remains open; no 'fixed' until live health/revision/user path passes |
| Genuine launch and repair | Live E2E | Real artifacts and provider receipts, no manual context transfers or hidden terminal patches |
| Full submitted integration and localization scope | Live evidence audit | Workplace services, cross-platform distribution, both IG/WhatsApp replies, Ads/MCP status and localized asset checked per requirement; representative demo alone cannot pass all rows |
| Backup restore | Recovery | Prior conversation, task and artifact load in isolated restored instance |

Existing verified repository commands (run after importing the pinned source):

```text
pnpm check
pnpm test
pnpm build
pnpm test:pi
pnpm sandbox:build
pnpm db:migrate
pnpm dev
pnpm --filter @rakazo/web e2e
```

These commands exist upstream; **they have not been run in this docs-only workspace**. Configure required environments/database/browser dependencies first; run targeted meaningful tests during each package and the required build/check/unit/web E2E suites for the release candidate. `test:pi` includes offline/emulator coverage and does not replace live Meta compatibility. Add a clearly named credential-gated live script only after implementing it; do not document a nonexistent command as already working.

## 9. Evidence and operating rules

Each real verification run gets a manifest with project/revision/run IDs, source commit, model IDs, timestamps, artifact hashes, sanitized request/response IDs, provider URLs/receipts, PR head/check/merge SHA, deployed version, result and any human intervention. Large outputs remain artifacts; logs link to them. Never retain secrets/private raw reasoning for a flashy trace.

Use bounded retry/backoff for rate limits and transient reads; fail fast on invalid auth/schema/permissions until corrected. Background schedules are persistent server jobs. Provide stop/resume and a watchdog for stuck work using existing lease machinery. The founder can review exact pending effects and revoke scopes. Do not auto-resume an uncertain external mutation by replaying it.

Set explicit deployment/runtime cost ceilings during setup. Use measured model usage and provider pricing available at implementation time; this plan makes no unsupported token/VM cost promises. Scope grants for actual ad spend are separate from model/cloud budgets.

## 10. First execution sequence and honest release boundary

Start with W0 and W1 while opening the access matrix, deploy callback HTTPS immediately, and set up the repair demo's repo/CI/service in parallel. Then W2/W3/W4/W5 produce the shared contracts for UI, skills and media. Complete one real slice early; do not spend the first days cloning a broad connector catalog or polishing the roster.

Both demonstrations, durability and action/revision correctness are release gates. If a required account remains unavailable, report the missing step and ship only the capabilities genuinely proven. Do not represent this plan, unrun tests, synthetic fixtures or OAuth badges as a completed MuseOrg implementation.

The continuing organization also needs its own proof: custom hiring, ordinary tasks, scheduled responsibilities, memory reuse, contextual delegation, work visibility and browser fallback. Keep [the full goal contract](../../MUSEORG_GOAL.md) alongside the demonstration checklist throughout implementation.

Document validation: initial builder review plus a second original-attachment/feasibility review completed. Shared-computer privacy and broker identity findings were corrected, and the second audit strengthened full-scope, memory, hiring, scheduled work and browser-fallback acceptance. See [verification record](../../verification/2026-10-27-plan-audit.md). Product code, build commands and live acceptance tests remain unrun.
