# Local Codex smoke verification — 2026-10-29

Result: passed one bounded live task using `openai-codex` / `gpt-6-luna` in an isolated developer test instance. This verifies this task's model and tool loop; it is not full MuseOrg acceptance.

- The normal API stored the approved OAuth connection using the application's encrypted credential flow. No API key was used.
- The normal bot creation route created Chief with the existing first-onboarding idempotency key. Its automatic introduction reached a question, then was cancelled before the explicit test task.
- The user task requested one `remember` call with a unique document path and exact synthetic content. The task completed.
- An independent authenticated `memory/list` request read the resulting document. Its content exactly matched the requested value plus the memory writer's trailing newline; its revision was 1. The verification client did not write the document itself.
- The task recorded two model turns: the tool-call turn and the final response. Both recorded provider-reported usage through Pi.
- The browser displayed the same task and its completed state.

Reported monetary costs came from `pi-catalog-estimate`. They do not establish a subscription charge or the remaining subscription allowance; both remain unknown from this check.

The temporary browser-login selector change was reverted after authentication. The submission configuration continues to require the configured personal API-key provider and blocks subscription sign-in. This check does not verify Meta inference, Meta connectors, other coworkers, coding repair, pull-request creation or merging, computer use, or the complete application workflow.

## Follow-up on 30 October

After restarting the local database and application services, authenticated reads
confirmed the same OAuth connection, Chief, completed run and exact memory content
were still present. This was a readback of the existing result, not another live
model task or an interrupted-run recovery test.

The provider-policy follow-up passed 43 focused offline tests and the API
TypeScript check. It rejects incompatible defaults, role choices, new coworker
pins, duplicated pins and routine overrides before credential validation. Explicit
clears, unrelated edits, generic development and scripted fixtures remain allowed.
