# Local model testing

Codex subscription authentication is a temporary development option for testing
MuseOrg before Meta account setup. The foundation already includes the
`openai-codex` connection and OAuth flow; this option adds no new authentication
dependency. It is not the submission's model or a new product login method.

## Start an isolated test instance

Use the task-owned launcher under `.tmp/`. Keep the normal configuration and
the tracked `.env.example` set to `REQUIRED_PERSONAL_MODEL_PROVIDER=meta`.
The launcher overrides only its child process environment:

```js
process.env.NODE_ENV = "development";
process.env.AGENT_RUNTIME = "pi";
process.env.REQUIRED_PERSONAL_MODEL_PROVIDER = "";
```

The empty value is intentional. Deleting the variable would let root environment
loading restore the Meta requirement. Run only on loopback, using a dedicated
test database, data directory and disposable MuseOrg account. Do not share its
queue, session cookies or application secrets with the normal instance. Keep
launcher state, credentials and generated data ignored by Git.

The override exposes the existing generic model-connection flow. The account
owner completes OAuth approval in the browser. Do not read, import or print the
desktop application's authentication cache. MuseOrg persists its own connection
through the existing encrypted credential store; never put tokens in this file,
the launcher source, browser storage or test reports.

OpenAI documents ChatGPT sign-in as subscription access. Eligible requests consume
the account's existing usage allowance and available credits, subject to its
limits; this does not create free API credits or unlimited inference. See
[authentication](https://learn.chatgpt.com/docs/auth) and
[ChatGPT plan usage](https://learn.chatgpt.com/docs/sign-in-with-chatgpt).
Browser OAuth and encrypted connection persistence were verified in the isolated
instance on 29 October 2026. Device-code authorization was rejected despite a
fresh, visually checked code; its cause was not established. The existing
adapter's login selector was temporarily changed to its supported browser method
for this connection, then restored. The account's device-code switch was also
restored to its original off setting.

One real Chief task subsequently completed with `openai-codex/gpt-6-luna`.
It called `remember`, saved the requested document, and passed exact independent
readback at revision 1. The web UI displayed the result. Usage records represent
two model turns; recorded costs are catalog estimates, not verified subscription
charges. See the [verification record](verification/2026-10-29-local-codex-smoke.md).
This proves the bounded tool loop, not the remaining MuseOrg acceptance flows.

## Test ordinary coworkers

Choose a model returned as available to the connected account; do not assume a
particular model ID or reuse the Meta-only role defaults. Create or update the
four ordinary coworker profiles through the existing authenticated API, assigning
the selected provider/model before an intro run can start.

Generic onboarding already creates Chief with `spawnKey=onboarding:first`.
Reuse that exact Chief and update its role instructions/model. Create Engineer,
Creative and Growth with their template spawn keys; do not create a second Chief
using the Meta onboarding key. Retrying setup must preserve the same four profiles.

Exercise the real MuseOrg runtime: tool calls, shared-artifact handoffs, peer work,
memory retrieval and interruption/recovery. Record observable effects and failures.
A successful greeting does not establish these capabilities. Offline tests remain
the default; live runs consume allowance and are explicitly opted into.

## Remove the temporary setup before submission

1. Stop new test work and cancel or drain active runs and pending sign-ins in the
   isolated instance.
2. Remove the test profiles/model pins. If intentionally retaining any profile,
   reconnect and validate Meta first, then update all its model choices and pins
   before exercising it again.
3. Disconnect the exact temporary model connection through MuseOrg. This cancels
   its pending sign-ins and removes its stored credential and associated model
   preferences. Confirm that no temporary connection remains in the test account.
4. Stop the test API, worker, web and supervisor processes. Remove only the
   isolated database, data directory and launcher state created for this test.
   Resolve and verify every target before deleting it; preserve useful redacted
   verification evidence separately. Never use a volume-wide prune or remove the
   normal instance's data.
5. Remove the temporary launcher/overrides and restart the normal instance with
   the Meta policy. Verify both API and worker enforce it, the production
   connection catalog offers the intended Meta setup, and temporary subscription
   sign-in cannot be started or completed through production routes. Retained
   development connections must also be rejected when selected as defaults,
   role models or new coworker/routine overrides. Clearing an override stays
   available; unrelated edits must not require a new connection.
6. Run real Meta acceptance checks before release: an accepted model request,
   multi-step tool work, relevant media operations and the representative project
   workflows. Passing Codex-backed tests does not replace these checks.

Do not run global `codex logout`, delete the Codex authentication cache, or revoke
unrelated sessions. The maintainer's desktop/CLI sign-in is outside this temporary
instance and must remain intact. Review repository status and the public diff for
credentials or private test data before publishing.
