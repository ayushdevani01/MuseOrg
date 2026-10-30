# MuseOrg: second plan verification

Date: 27 October 2026. Requested by the user: reread the original chat attachment and verify the implementation plan without losing MuseOrg's goal.

## Verification performed

- Reread the **entire 913-line, 89,737-byte attachment**, not just its final assistant summary. SHA-256: `F6DCF212BD638440E800F49805F4D622EF09C4AC9E007D69191B80CED5E9E889`.
- Distinguished direct user intent, the accepted application at lines 455–459/470, later user corrections and unaccepted assistant suggestions.
- Compared the current design, implementation plan, skills audit and context against that source plus the live-chat requests for coding repair and browser fallback.
- Ran two independent read-only reviews: original-intent traceability and technical feasibility/skills adoption. Reviewers checked targeted pinned upstream sources; the original-intent reviewer also read all 913 lines.
- Checked all 29 local Markdown links across eight documents: zero broken links. Checked the workspace's current file inventory; it remains a planning workspace with no imported application runtime to execute.

This verifies the documents' coverage and identified assumptions. It is **not a test pass for an application**, deployed service, model call or connector.

## Conclusion

The plan retains the central product: a continuing organization of AI employees with their own chats/responsibilities/memory, shared computer/artifacts, peer delegation, temporary parallel workers, headless ongoing work, visible supervision and changes propagated across work. The two demonstration stories do not replace that product goal.

The baseline remains **proposed Rakazo + Pi**, subject to boot, Meta transport, persistence, authority and deployment gates. Source review supports trying that base; it does not establish compatibility or performance in the user's environment.

## Findings corrected

| Finding in the previous plan | Correction | Remaining verification |
| --- | --- | --- |
| A successful one-post/one-reply slice could be mistaken for full application completion | Separate demo-slice status from the full requirement set; added canonical requirement IDs and retained all named workplace/Meta channels | Real evidence for every required operation; blocked items remain outstanding |
| Hiring was present but placed after some demo-specific work | Custom hiring is now P0 with a concrete create/configure/task/revisit proof | Hire a role through the UI and execute an ordinary workplace task using the same engine |
| Memory storage was described more clearly than later use/inheritance | Added later-session recall, durable preferences, source-linked compaction and bounded child briefing | Restart/new session reuses actual prior artifacts/settings and gives a child the permitted context |
| Always-on work was demonstrated mainly by FAQ handling | Added configurable ongoing responsibilities, timezone-aware schedule and offline execution proof | Scheduled responsibility runs without an open client and can be paused/revoked |
| Public browser QA was explicit while authenticated fallback was outside the main path | Added required W8B with actual browser-only task, explicit Team-profile authority or isolated role-sensitive handling | Live authenticated task, reconnect/cancel/login failures; no unsupported fine-grained isolation claim |
| Accepted text's localization and Meta Ads MCP route were too implicit | Explicit brief locale/localized asset proof and intended MCP client/account-access gate; alternate transport must be recorded | Actual localized asset and MCP access/tool test; an alternative Ads API is not proof of MCP |
| Skill prose could introduce fictional prior client feedback | Expanded adaptation rule for both frontend-design and canvas-design | Reviewed bundle contains only real user context and passes role-model evaluation |

The existing shared-computer correction remains essential: Team directories and browser profiles are mutually accessible; private DM/memory and broker credentials remain server-side. A whole-Team browser-profile grant does not provide per-role OS isolation. Protected publishing/spend/merge retains its own authorization/receipt path.

Follow-up intent review found no remaining material scope drift in the corrected documents. Its provenance clarification was incorporated: scheduling is a supporting design choice for the user's ongoing/offline-work goal; specific schedule examples were assistant suggestions, not a separate user-selected protocol.

## Source checks and limits

- Pinned Rakazo manifest/deployment/skill-loader claims and initial skill licenses were independently checked again. No new material contradiction was found in those inspected claims.
- The intended Meta media, model and connector paths remain live acceptance gates. No user credential, account eligibility or API call success has been established.
- Attempts in this pass to reopen the official Meta Ads MCP overview/get-started pages through the web tool did not return their contents. Custom-client/account availability was therefore **not reconfirmed** from those pages. The plan explicitly tracks the intended MCP route for actual authentication/tool testing instead of assuming it works.
- The exact hierarchy, three-pane layout, chief-only writes, OptMem requirement, old two-minute demo timing, universal personal-account access and automatic compatibility claims in earlier assistant messages were not adopted as user requirements. Current event materials set the three-minute demo; recheck submission details before release.

## Documents to use from here

1. [Product goal and requirement contract](../MUSEORG_GOAL.md) — scope and source evidence.
2. [Design](../superpowers/specs/2026-10-27-museorg-design.md) — behavior and architecture.
3. [Implementation plan](../superpowers/plans/2026-10-27-museorg-implementation-plan.md) — ordered work, gates and tests.
4. [Skills audit](../SKILLS_AUDIT.md) — what to adopt, adapt and evaluate.

During implementation, update each requirement's actual status and evidence. Documents and planned tests alone do not fulfill the product goal.
