# MuseOrg: product goal and requirement contract

Verified against all 913 lines of the original attachment on 27 October 2026, plus the user's later requests in this chat. This is the scope reference for implementation and review. Architecture choices can change; requirements must not disappear when the demo is simplified.

## The product we are building

**MuseOrg is a continuing organization of AI employees that a user hires, talks to, supervises and equips to do real work.** Employees have their own identities, responsibilities, conversations and useful memory. They share a persistent computer and project artifacts, communicate with peers, delegate to temporary parallel workers, use connectors/browser/terminal tools and continue working while the user is away.

Meta Growth is a specialty within this organization. The product launch and website-repair stories demonstrate a general capability. Neither story is a fixed workflow that defines everything the product can do.

Role profiles and skills supply expertise to one reusable runtime. Hiring another kind of employee must not require another bespoke agent backend. Chief is a useful coordinator; a mandatory rigid hierarchy was not chosen by the user.

Scheduled responsibilities are a supporting planning choice for sustained work. The user explicitly committed to offline/headless work and webhooks; the attachment's particular schedule examples came from assistant suggestions. Likewise, exact memory algorithms, UI layout and mailbox protocol remain implementation choices, provided the requested behavior is preserved.

## Source of the requirements

Original source: a privately supplied 913-line project brief. Line numbers below refer to that attachment, which is not distributed with this repository.

- **66:** user describes specialized employee chats, email/GitHub/everything, collaboration and Meta marketing on top.
- **392–404:** user adopts the persistent coworker organization description: separate chats/responsibilities/memory, shared computer, background work, four roles and requirement changes.
- **455–459, confirmed at 470:** exact accepted application; preserve the named models, workplace/Meta services, multimodal media, deployed page, cross-platform staging, scoped inbound replies and approval behavior.
- **517, 555:** user prefers a reusable harness/connectors/Markdown expertise and asks for the employee product layer: hiring, work visibility and organization.
- **632:** user explicitly asks for peer communication, useful parallel agents and context about past work.
- **837:** user says to deliver what was claimed in the application.
- **Later live chat:** add the outage → fix → PR → CI → authorized merge → deploy demonstration; preserve broad computer/browser fallback and preference for a smaller reusable foundation.

## Required behavior and proof

The full acceptance proofs below remain outstanding. The initial account, connection and hiring slice has [separate implementation evidence](CORE_IMPLEMENTATION.md), including offline, browser and database tests. A partial slice does not complete these broader requirements.

| ID | Requirement | Implementation and acceptance proof |
| --- | --- | --- |
| ORG-01 | Hire/configure continuing employees, beyond four seeded profiles | W2/W11: create a custom role from description or editable template, choose capabilities/skills, give it work and revisit the same identity |
| ORG-02 | Individual and group chats; talk directly to any employee | W3/W11: task a specialist directly, then collaborate in a group without making Chief a mandatory relay |
| ORG-03 | Shared persistent computer, filesystem, terminal and real browser capability | W0/W4/W8B: one employee uses another's saved artifact; actual terminal/browser work; authenticated fallback proof for an authorized browser-only task |
| ORG-04 | Peers delegate and employees use useful parallel workers | W3: two specialists and bounded child workers do useful work; result/artifact handoffs do not require user copying |
| ORG-05 | Remember past work and user preferences; workers receive relevant context | W3/W4: after a later session/restart, retrieve the prior project's artifacts/decisions and honor a saved preference; child uses a scoped briefing without user retelling |
| ORG-06 | Prompt, event and schedule driven work continues offline | W3/W8: close client; a scheduled responsibility and a verified external event run, persist results and are visible after reconnect |
| ORG-07 | See who is doing what and manage it | W11: real employee/task/child/tool/artifact states and blockers; pause/cancel/resume, correction during work and scope revocation |
| ORG-08 | Change requirements once; relevant work updates automatically | W6/W9: correction in a specialist DM updates page, visuals and staged campaign; stale approval is unusable |
| ORG-09 | Reusable harness and modular expertise | W1/W2: same runtime executes marketing, engineering and an ordinary workplace task; a custom role needs no new workflow backend |
| INT-01 | Gmail, Calendar and Slack connect to organizational work | W8: verified account operations; Chief can prepare an evidence-backed work brief from an authorized thread/calendar/channel |
| INT-02 | GitHub and deployment support real engineering delivery | W10: PR/check/merge/deployment chain with current SHA and healthy user path |
| INT-03 | Instagram, Facebook Pages and Threads distribution | W8/W9: actual account-validated drafts/staging for all three; verify each publishing operation before claiming that channel works |
| INT-04 | Both Instagram and WhatsApp inbound handling within approved scope | W8/W9: eligible real event and one permitted reply on each; duplicate events do not duplicate replies; exceptions escalate |
| INT-05 | Meta Ads staging and intended Meta Ads MCP route | W8/W9: check actual MCP client/account access; verify authorized campaign/assets/paused state; record any alternative transport and outstanding MCP claim explicitly |
| META-01 | Wonder/Spark and Voice/SAM/Image contribute real useful outputs | W1/W7: live model loops plus real transcript, decoded mask/composite and generated image; media feeds the shared project |
| META-02 | Segmented and localized campaign visuals from supplied inputs | W7/W9: explicit target locale/brand/text, real mask/composite and a reviewed localized variant that preserves supplied facts |
| AUTH-01 | Backend-enforced publishing/spend/out-of-scope messaging authority | W5/W6: frozen payload/account/budget/revision, valid grant or exact approval, stale-action rejection and real receipts; routine granted work proceeds automatically |
| DEMO-01 | Product launch across roles | W9: uploaded voice/video → live deployed page + media + current cross-platform/ad staging + authorized action/replies |
| DEMO-02 | Website outage repair through restoration | W10: evidence-led diagnosis → fix/test → real PR → successful CI → authorized merge → deployment → verified healthy revision |

Work packages refer to the [implementation plan](./superpowers/plans/2026-10-27-museorg-implementation-plan.md).

## Scope versus the short demonstration

A three-minute video can show representative actions from genuine runs; it cannot show every integration and all provider/CI waiting time. The complete requirement set above still needs its own evidence matrix. One successful post and one FAQ reply establish a useful vertical slice, not completion of every named channel.

A blocked account, MCP route or browser operation stays an outstanding requirement. An honest partial release may still be useful, but must not be labeled the full MuseOrg goal achieved. Changes to the user's required scope need to be stated directly.

## What we deliberately did not inherit as user decisions

The original chat includes assistant claims/proposals, not all of which were accepted or correct. These do not become requirements merely because they appear there:

- A strict CEO → Chief → specialists hierarchy, specialists forbidden to spawn workers, or Chief-only writes.
- Exactly three panes, a mandatory binary-tree memory visualization, exact mailbox names or a serial single-owner demo pipeline.
- OptMem as the required memory implementation, automatic Claude-tool/script compatibility, or an existing Anthropic `github-deploy` skill.
- Universal personal-account access, guaranteed zero app-review blockers, automatic model compatibility or a guarantee to do every human task.
- Raw publishing credentials placed in the shared shell. The accepted application also promises role-scoped authority and backend approval enforcement; those need a trusted execution boundary.

Rakazo + Pi remains a proposed implementation foundation with adoption tests. The product goal is independent of that choice.
