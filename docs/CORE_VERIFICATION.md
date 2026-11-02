# Core verification

Updated 1 November 2026. Scope: the continuing-coworker runtime, packaged skills,
shared project revisions, scoped authority and the engineering delivery demo.
The existing broad CI backlog is outside this verification pass.

## Verified flows

| Flow | Evidence |
| --- | --- |
| Independent helpers | Two overlapping helpers computed separate, checkable workplace artifacts and inherited the saved reporting preference. Original synthetic inputs were unchanged. |
| Memory after restart | A later user turn after service restart read the saved preference and wrote its structured values correctly. |
| Work with the UI closed | A real one-shot routine woke the worker and produced the scheduled artifact. Browser inventory had no MuseOrg UI tab open. |
| Authenticated events | An invalid bearer was rejected. A valid synthetic webhook produced its structured response; duplicate delivery did not create another run. Unattended arbitrary file writes remained blocked. |
| Browser fallback | The coworker used only browser tools to sign in to a disclosed local fixture and submit its protected form. The fixture independently verified its session and CSRF token. |
| Cancellation | Stopping a parent also stopped its live helper; the delayed output was absent after its deadline. |
| Worker-crash recovery | The command was claimed and its exact pending turn persisted before dispatch. After the worker was killed and its lease reclaimed, the run completed on its second attempt. An independent check found exactly one start entry and the expected completed artifact. |
| Shared correction | Two coworkers registered different dependencies. A correction woke the affected coworker, regenerated its output, preserved the unrelated output and superseded the old approval/run. |
| Project settings | The authenticated browser test created a project, saved a correction from revision 1 to 2 and opened its action scopes against the real API and isolated database. |
| Scoped delivery | A real coworker diagnosed a disclosed public website failure, reproduced the unchanged regression test, made the repair and opened a real PR. The verified head passed checks and review observations, merged through the trusted adapter and deployed through Pages. Both the coworker and an independent browser verified the real user interaction; the deployment receipt matched the merge revision. |

The live tests used the isolated development model connection, without changing
the submission's personal-provider policy. They do not establish live Meta model,
media or workplace-account compatibility. Fixtures contained synthetic data.
Private runtime logs, cookies, connection bindings and transcripts are not tracked.

On 2 November, a separate [live Meta verification](verification/2026-11-02-meta-and-integrations.md)
completed a tool loop and in-app memory/file/report tasks with `muse-spark-1.3`.
That establishes Meta Spark model compatibility for those flows. It does not
establish Meta media, social publishing, advertising or messaging operations.

## Recovery regression

The first controlled worker-crash test exposed an approval-exempt command that
remained `intended` after dispatch. Without a durable pending model turn, the
restarted model reconstructed and repeated it. A provider quota error also
interrupted an earlier recovery attempt; neither was treated as a passing result.

The fix claims journaled effects before dispatch, saves the exact pending turn
before execution, and serializes checkpoint writes. Gate-assigned occurrences
are saved before the destination is called. Restored in-flight helpers return an
explicit interrupted result instead of automatically starting another helper.

The final live crash rerun passed after independently checking its original start
ledger and completed artifact. The ledger contained one start entry across two
worker attempts. This verifies the controlled command scenario; it does not imply
arbitrary external systems support exactly-once writes. Uncertain effects remain
subject to receipt reconciliation. Offline tests cover dispatch claims,
interrupted-effect refusal, checkpoint ordering, lease failure and helper
interruption. Existing approval, secret and helper-context regressions also pass.

## Reproducible checks

- `pnpm skills:generate --check` checks the versioned embedded skill bundle.
- Focused Vitest suites cover project policies, provider conformance and runtime
  replay. PostgreSQL project tests additionally cover RLS, stale revisions,
  concurrent budget reservations, revocation and exactly-once settlement.
- `apps/web/e2e/projects.spec.ts` walks project creation and revision through the
  real authenticated UI/API/database flow, and captures its settings screenshot.
  Its isolated test server uses the scripted runtime and fake sandbox.
- API, worker and web type checks and production builds verify the shared code
  and bundled skill contents. Secret scans cover staged changes before commits.

Database checks require an explicitly isolated local test database and
`VERIFY_DATABASE=1`. No provider judge is used: the assertions concern structured
contracts, byte hashes, persisted states, real receipts and observable effects.
Natural-language response quality is not scored by keyword matching.
