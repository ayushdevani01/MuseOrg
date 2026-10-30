# MuseOrg: project context

Recorded on 2026-10-26; implementation update on 2026-10-28. The user approved the Rakazo + Pi baseline with independent authenticated accounts, one private organization per account, and personal Meta model onboarding. Source is imported and core changes are under verification; no live Meta account is verified. Account setup is deferred at the user's request.

The original 913-line attachment was reread in full on 2026-10-27 for a second verification. Use [MUSEORG_GOAL.md](./MUSEORG_GOAL.md) as the concise scope reference and [the verification record](./verification/2026-10-27-plan-audit.md) for findings/corrections. A representative demo slice is separate from fulfillment of all submitted capabilities.

## 1. Current state

- The user confirmed hackathon acceptance only. Model API access, cloud infrastructure, and connected demo accounts are not established.
- The initially empty project now contains the pinned upstream source. See [UPSTREAM.md](../UPSTREAM.md) and [the access inventory](./ACCESS_MATRIX.md). Local dependencies are installed; database/browser verification is in progress.
- The complete 913-line attachment was read. Primary sources were checked independently for models, integrations, prior art, skills, and memory.
- Claims about reusable Shipyard/LaunchPad infrastructure occur in the attachment. Their code, present availability, and actual deployment stack have not been inspected in this workspace.

Source conversation: the privately supplied project brief. Line references below refer to the original attachment as inspected on this date; the private attachment is not distributed with this repository.

## 2. Product intent established by the user

MuseOrg is an always-on workspace for a continuing team of specialized AI coworkers. Marketing is one specialty within the team. A product launch is the first demonstration of the broader organization.

The user wants to:

- Hire coworkers with identities, responsibilities, their own conversations, and useful memory.
- Talk to a coworker individually or involve coworkers in group conversations.
- Connect workplace services such as email and GitHub, alongside Meta publishing, messaging, and advertising services.
- Let coworkers communicate, delegate, and work together without the user relaying every message or copying files.
- Let employees use parallel, temporary subagents for substantial work.
- Revisit previous work with enough context for the team to continue it.
- Understand who is working, what they are doing, what is blocked, and what needs user input.
- Change requirements during execution and have the relevant work brought up to date.
- Continue work while the client is closed.

The user repeatedly prefers reusing an existing general agent harness and connector infrastructure, with coworker profiles and domain expertise supplied through Markdown. A separate hardcoded backend workflow for each employee does not match that preference.

Key user statements: lines 66, 470, 517, 555, 632, and 837. The final sentence of a previous assistant response is not evidence that the user accepted its design.

## 3. Application commitments

At line 470, the user says the preceding technical application was submitted and they were selected. That submitted version appears at lines 455–459 and is broader than some earlier simplified drafts.

| Commitment | Observable evidence to target |
| --- | --- |
| Persistent coworkers in individual and group chats | Stable identities and conversations that remain available across visits |
| Shared cloud computer, filesystem, and terminal | Coworkers use the same project artifacts without manual transfers |
| Headless execution, durable peer queues, and webhook listeners | Backend work and event handling continue without an open browser |
| Role-scoped credentials | The execution layer limits which external capabilities a role can use |
| Chief of Staff, Staff Engineer, Creative Director, Growth Operator | Four configured roles participating in useful work |
| Meta model suite | Actual model requests and usable outputs; not labels in the interface |
| Gmail, Calendar, Slack, GitHub, and Meta services in the described vision | A connector inventory with honest status for each promised capability |
| Product video and voice brief become a landing page and creative assets | Working page, source files, rendered assets, and execution evidence |
| Prepared Meta distribution and an ad campaign | Concrete content, account, destination, and campaign details |
| Requirement changes propagate | A correction updates affected outputs and supersedes stale pending actions |
| Backend approval gates | Publishing and spending cannot bypass the authorized execution path |
| Inbound messaging within an approved scope | Automatic replies are explicitly enabled and constrained; exceptions escalate |

The more general final application wording at lines 422–434 also promises separate coworker memory and approval for messages outside a user-approved scope.

These are product commitments. The exact implementation, demo depth per integration, and delivery sequence still need to be selected. Do not silently drop named capabilities or represent placeholders as working integrations.

## 4. Intended demonstration

The recurring demonstration in the conversation is:

1. A user provides product footage and a spoken brief.
2. The team divides the work. Engineering and creative tasks use real shared artifacts.
3. The Engineer produces a working landing page; Creative produces campaign visuals; Growth prepares distribution.
4. The user changes an offer, design requirement, or other shared constraint through chat.
5. Relevant coworkers update affected work and replace stale proposals without manual context transfer.
6. The user can leave and return to the same project and task state.
7. A permitted external action produces a verifiable external result. Authorized inbound replies can demonstrate continuing responsibilities.

This is a capability test, not a requirement to encode that sequence as a fixed product pipeline. The participant guide requires a three-minute demo video; that supersedes earlier two-minute presentation assumptions. Execution timings in the attachment were estimates, not tested performance.

## 5. Important distinctions for the design

The following are engineering interpretations to evaluate, not user-approved architecture:

- **Coworker:** persistent identity, role, permissions, skills, and memory.
- **Conversation:** a place where the user and one or more coworkers communicate. Group conversations mean a conversation and a coworker cannot always be the same object.
- **Task/run:** a durable unit of work with status, inputs, outputs, and execution history.
- **Worker/subagent:** a temporary executor working for a coworker, without necessarily becoming a new hired employee.

Keeping these concepts distinct would support both persistent relationships and parallel work. A logical task owner could coordinate several workers; ownership does not inherently require serial execution.

Separate current instructions, task state, artifacts, and remembered history. A compressed memory summary should not determine the current campaign budget, approval status, or authoritative brief revision.

## 6. What Markdown can and cannot supply

Markdown can describe a role, explain an API, teach a workflow, provide command examples, and record useful instructions. Existing tools can execute much of the domain work.

The surrounding software still needs to provide or integrate:

- Durable execution, retries, recovery, and protection against repeating external actions.
- Employee and task lifecycle, peer message routing, cancellation, and delivery of user changes.
- OAuth or other authentication, token renewal, connector availability, and authenticated webhook intake.
- Shared artifact references, concurrent editing boundaries, and detection of stale outputs.
- Memory ownership, retrieval, and appropriate sharing.
- An enforceable external-action boundary and an audit trail.
- Observable status, progress, artifacts, and failure recovery in the interface.

An agent instructed to call `request_approval` can bypass that instruction if unrestricted shell access also exposes publishing credentials and unrestricted network access. Approval therefore needs enforcement at the execution/credential boundary. Similarly, labeling credentials by role is insufficient if every process can read every token.

Shared files make artifacts accessible. They do not automatically tell another agent which requirement changed or whether its earlier output is stale. The system needs an explicit way to communicate changes and associate outputs with their inputs.

Browser reconnection tests client independence. Process or container restart tests recovery. These are different demonstrations.

Redis Pub/Sub alone is not a durable task queue: its documentation specifies at-most-once delivery and loss when a subscriber misses a message. Any reuse of that transport needs a durable source of task and event state. [Redis delivery semantics](https://redis.io/docs/latest/develop/pubsub/)

## 7. Verified Meta model facts

The official catalog documents `muse-wonder-1.0`, `muse-spark-1.3`, `muse-image-1.0`, `muse-voice-transcribe-1.0`, and `sam-3.1`. Wonder and Spark have 1,048,576-token context windows. Documentation availability does not establish this user's API entitlement. Wonder Full is a separate Muse Code subscription offering, not the API model. [Model catalog](https://dev.meta.ai/docs/models)

Meta documents `https://api.meta.ai/v1` and OpenAI SDK compatibility. This establishes an API integration path; it does not supply MuseOrg's organizational services. [Quickstart](https://dev.meta.ai/docs/quickstart)

Speech uses dedicated transcription interfaces. Transcription is not speech synthesis. Segmentation produces masks/geometry, so composing campaign assets or assembling edited video remains a separate processing step. [Speech guide](https://dev.meta.ai/docs/speech-to-text), [model capabilities](https://dev.meta.ai/docs/models)

User-specific model availability still requires an authenticated check and successful requests. Do not infer working access from hackathon acceptance.

## 8. Integration constraints

| Service | Verified boundary |
| --- | --- |
| Instagram | Official API access targets professional Business/Creator accounts. Universal access to a person's entire consumer account is not established. Messaging has its own eligibility and conversation restrictions. |
| WhatsApp | Cloud API is a Business Account and business-number integration. It is not evidence of access to an existing personal account's entire inbox or history. |
| Threads | Its own authorization and permission scopes apply. Content, replies, and insights are documented. A supported DM API was not verified. |
| Cross-platform access | A common API facade can normalize requests; it does not remove each platform's authentication, permission, account, and review requirements. |

Primary sources: [Meta's Instagram collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7), [WhatsApp Cloud API registration](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api?entity=folder-13382743-148258e1-3240-4eed-8a78-049bb1d1fe25), [Threads collection](https://www.postman.com/meta/threads/collection/dht3nzz/threads-api).

WhatsApp non-template replies are allowed within the customer-service window; approved templates are required outside it. Platform opt-in and escalation requirements also apply. MuseOrg approval does not replace platform eligibility. [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/)

The attachment's universal claims about one token and instant Standard Access without review blockers are not established. Intended accounts and actions must be checked separately. Ayrshare/Unipile coverage, pricing and Graph API version claims were not fully verified in this review. A later October 27 check confirmed official Meta Ads MCP custom-client/authentication documentation; actual user account eligibility and token/asset access remain unverified. See [Meta integration and setup](./META_INTEGRATION_SETUP.md).

## 9. Reusable projects: verified findings

### Grok Bot

Official docs support the reference experience: persistent coworkers, shared computing resources, individual context, collaboration, parallel work, and continuing cloud operation. The attachment's exact `SandRunScheduler` internals are not established by those official product docs. [Overview](https://docs.x.ai/grok-bot/overview), [computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)

### OpenBot

The current project documents persistent agents, task queues, peer messaging, channel ownership/delegation, headless hosting, per-agent workspaces, and a shared directory. The earlier claim that all sharing requires manual file transfer is inaccurate. Its current license is PolyForm Noncommercial 1.0.0; the README says versions through 0.1.11 retain Apache-2.0. Reuse requires choosing and assessing a specific version. No version has been adopted. [README](https://github.com/nightly-labs/openbot/blob/main/README.md), [license](https://github.com/nightly-labs/openbot/blob/main/LICENSE)

### OptMem

OptMem implements an append-only log, binary-tree summaries, regex recall, and expansion of summaries. Its prompt treats parallel sessions as one identity and excludes subagents from writing memory. Distinct employee memories and shared organizational knowledge need additional design. Its performance figures are author-reported. The inspected repository did not establish the attachment's claimed MIT license. No adoption decision has been made. [Repository and memory rules](https://github.com/VictorTaelin/OptMem)

### Anthropic skills

The relevant frontend, web artifact, web testing, canvas, and theme skills exist. The repository distinguishes Apache-2.0 examples from source-available document skills; it is not uniformly Apache-2.0. The claimed `github-deploy` skill was not present in the inspected skill directory. Skills are reusable expertise, not a substitute for runtime services. [Repository](https://github.com/anthropics/skills), [skill directory](https://github.com/anthropics/skills/tree/main/skills)

The October 22 announcement concerns donation of the Agent Skills standard and associated assets, not a blanket relicensing of every skill implementation. [Official announcement](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation)

### Paperclip

Paperclip is an MIT-licensed organizational layer for agents and is relevant to roles, tasks, budgets, and governance. It is a candidate for inspection, not a selected MuseOrg dependency. [Repository](https://github.com/paperclipai/paperclip), [license](https://github.com/paperclipai/paperclip/blob/master/LICENSE)

## 10. Suggestions that remain open

The attachment does not establish approval of:

- A strict CEO → Chief → specialist hierarchy or a rule forbidding specialists from creating workers.
- Chief-only write access to shared state documents. Earlier examples contradict this by having Engineer update the same document.
- A particular three-pane interface or visual memory-tree inspector.
- Exact inbox modes called `STEER`, `QUEUE`, and `NOTIFY`.
- One task owner per channel, fixed directory ownership, or a particular dependency graph implementation.
- OptMem, any other memory library, a database, a queue implementation, a backend language, or a cloud vendor.
- Forking OpenBot, using Paperclip, writing a new agent loop, or another runtime foundation.

These may be useful proposals. They should be evaluated against the product requirements rather than inherited as decisions.

## 11. Next decisions and evidence

Rakazo + Pi is approved and imported as the implementation baseline. See the [design](./superpowers/specs/2026-10-27-museorg-design.md), [implementation plan](./superpowers/plans/2026-10-27-museorg-implementation-plan.md), [skills audit](./SKILLS_AUDIT.md) and [current execution evidence](./CORE_IMPLEMENTATION.md). Local services boot; live model, shared work, restart recovery and protected-action adoption gates remain outstanding.

The user deferred Meta account setup until the final integration stage. Continue independent core development first, then record live success or failure per operation when authorized accounts are connected. An installed connector does not establish a working account connection.

The design proposes employee hiring, work ownership, bounded peer communication, server-side scoped memory, supervision and requirement revision propagation. These are planning decisions, not claims that the user explicitly chose every implementation detail. The generic-harness preference and submitted application commitments remain the requirements.

## 12. Participant guide and official rules

Read on 2026-10-26 through the user's existing browser session: [Participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details), [Official Rules and Event Waiver](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver). These add concrete event requirements beyond the earlier public application page.

### Submission and timing

- Incorporate Meta models and address one of the two stated themes.
- Public repository, accessible video, and a three-minute demo video showing the work built during the event. The guide identifies code and the live product as judging artifacts too.
- Maximum four people; solo participation allowed. One submission per team, with contributors identified.
- Deadline: November 4, 2026 at 9:00 PM Eastern, which is **November 5 at 7:30 AM IST**.
- Kickoff: October 26 at noon Eastern, or **October 26 at 9:30 PM IST**. The guide separately labels October 27–November 4 as the building period; it does not clearly reconcile that with implementation on kickoff day.

### Reuse and original contributions

The guide says the demo must identify features/code/functionality built during the event. It explicitly allows startups to extend existing products while identifying new work.

The separate official rules also allow participants to include open-source software or hardware when its license is followed and the submission enhances or builds on it. The clause applies to participants generally. Reusing a compliant agent harness is therefore compatible with the rules; presenting its existing features as new MuseOrg work would conflict with the guide. This does not establish that any particular OpenBot version is an eligible dependency.

### Project judging rubric

| Category | Weight |
| --- | --- |
| Impact | 30% |
| Use of Meta AI tooling | 25% |
| Technical depth and execution | 20% |
| Demo | 25% |

These are project judging weights, distinct from the earlier application-selection criteria. There is also a $5,000 Best Agentic Use-Case bonus category. Eligibility for an award does not predict a result.

### Access resources

The guide offers $150 in Meta Model API credits per accepted participant, claimed individually through its linked form and distributed in batches. It says a valid payment method is required to make API calls and describes a temporary card preauthorization. Credits must be claimed by the submission deadline. No claim form was submitted and no billing settings were changed in this review.

### Implications for MuseOrg

The design should make our new organizational capabilities observable: persistent identities, real handoffs, useful parallel execution, propagated requirement changes, and enforced approvals. Reused runtime features should be credited explicitly. A cohesive demonstration can show how model outputs feed subsequent work and produce a practical result. Adding models or connectors without a useful role is not itself evidence of impact or execution quality.

## 13. Latest scope clarification: general work and a coding demo

The user has now explicitly added a second demonstration alongside Meta marketing: a website goes down, the coworker investigates, fixes the problem, creates a PR, merges it, and restores the working site. This should use the same general runtime with appropriate tools, skills, accounts and policy.

The user wants broad computer-based capability and browser fallback when native integrations are absent. Treat this as the intended capability range, not a guarantee that every human task is executable or will succeed. Browser sessions, external permissions and observable verification still matter.

The user subsequently clarified that OpenClaw appears too broad and requested a wider search, including X, for smaller engines and closer existing products. The expanded source-based recommendation is **Pi as the execution engine**, with **Rakazo** as the strongest complete product starting point found, or a smaller MuseOrg application using Pi/pi-web components. Neither route has been adopted or tested. See [HARNESS_SHORTLIST.md](./HARNESS_SHORTLIST.md) for current findings and [HARNESS_RESEARCH.md](./HARNESS_RESEARCH.md) for the initial runtime comparison.
