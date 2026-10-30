# Shared engineering acceptance

Run one bounded engineering task through the ordinary application API and worker
using the existing isolated development model connection. Use two continuing
coworkers, Engineer and Reviewer, on one Docker Team Computer. Preserve unrelated
coworkers, connections, assignments and files.

Seed a small dependency-free HTTP service with a reproducible routing defect and
fixed functional acceptance tests in a new shared project directory. Engineer
must diagnose and repair the implementation, run tests, and ask Reviewer for an
independent review using the product's peer messaging tool. Reviewer must read
the same shared files, rerun the tests and return structured results through peer
messaging. No human copies an employee's output into the other's conversation.

Verify the initial failing test, final HTTP behavior, unchanged acceptance-test
hash, implementation hash, both coworkers' shared-computer identity, actual shell
commands, peer delivery/wakeup/result events and terminal run states. Read back
the files through the API. When all work is idle, stop and boot the computer and
confirm the shared artifacts survive without another model call.

Use the connected low-cost test model, bounded prompts and a local watchdog.
Make no external writes, account grants, publishing, deployment or merges. No
model judges are needed for observable HTTP, file and event contracts. A pass
establishes one real peer handoff and shared-computer repair slice; it does not
establish useful parallel subagents, arbitrary browser work, all crash recovery,
or completion of the full MuseOrg demonstrations.
