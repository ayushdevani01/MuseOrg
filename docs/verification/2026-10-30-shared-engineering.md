# Shared-computer engineering acceptance — 30 October 2026

Result: passed one real local repair, independent peer review and shared-computer
restart using the ordinary authenticated application API and worker.

## Scope and task

Engineer and Reviewer were created as continuing coworkers on the isolated local
test account, each pinned to `openai-codex` / `gpt-6-luna`. Both used the same real
Docker Team Computer. No external accounts, publishing, deployment or merges were
used. The test service uses Python's standard library, already present in the
computer image; this does not establish a JavaScript project toolchain.

A new shared directory contained an HTTP service with a routing defect, a brief,
and four fixed acceptance tests. Before dispatch, an independent container test
run reproduced three failures: the landing page, health endpoint and health query
returned the wrong status. The unknown-path test already passed.

Engineer received one user task. The harness did not repair the implementation,
copy an employee's result into another conversation, or manually dispatch the
Reviewer task.

## Observed proof

| Boundary | Result |
| --- | --- |
| Real computer | Docker provisioned a running graphical computer; normal API uploads wrote files through the sandbox adapter |
| Repair | Engineer read the shared brief/code/tests, changed the implementation and ran actual shell commands |
| Peer handoff | One `message_bot` request durably delivered from Engineer to Reviewer and queued a `bot_message` run |
| Independent review | Reviewer read the same files, ran its own shell checks and wrote a structured review report |
| Peer result | One result delivery returned from Reviewer to Engineer and queued the final Engineer run |
| Terminal work | All three repair/review/result runs completed; no user message relay was needed |
| File identity | Database computer references matched; API reads through both coworker contexts returned identical implementation hashes |
| Fixed criteria | The acceptance-test and brief hashes were unchanged; the implementation hash changed |
| HTTP behavior | An independent container rerun passed all four original functional HTTP tests |
| Review provenance | The review report named the four test identifiers and its implementation hash matched the repaired file |
| Persistence | After all work was idle, the computer was stopped through Engineer and booted through Reviewer; implementation, tests and report retained identical hashes, and independent HTTP tests still passed |
| Downloadable source | After correcting source-file support, a separate one-call attachment task produced `server.py` as `text/plain`; authenticated artifact download matched the repaired source bytes exactly |

The main flow recorded 22 tool invocations/completions and 21 model turns. Five
Engineer shell commands and three Reviewer shell commands were recorded. Some
diagnostic shell commands failed before correction. The original `.py` attachment
was rejected; Engineer recovered by attaching a text copy. That gap was then
fixed and the original source attachment was verified separately rather than
counting the fallback as proof of original-file support.

The repair/review estimate was $0.00373858. The one-call source attachment check
added an estimate of $0.00022178, totaling $0.00396036 for those checks. Creation
greetings are excluded from that figure. These are bundled catalog estimates,
not verified subscription charges or remaining allowance. No judge model was
used; assertions concern HTTP responses, file hashes, structured report fields,
tool events and run states.

The temporary test tool restrictions were removed after completion. Engineer
uses the ordinary engineering role template and Reviewer a reusable review
profile. Their identities, conversations and shared artifacts remain available.
Unrelated coworkers, account connections and MCP assignments were preserved.

## Gaps fixed

1. **Windows computer boot:** the supervisor applied POSIX UID/GID and directory
   execute-bit checks to Windows `stat` results. The Windows path now accounts
   for placeholder IDs and its file-mode representation, preserving root-junction
   rejection. Linux descriptor-based containment and ownership checks are
   unchanged. This is a compatibility preflight, not proof of Windows ACLs; actual
   guest access was verified through the live sandbox. Node documents the
   [Windows file-mode limitation](https://nodejs.org/docs/latest-v24.x/api/fs.html#file-modes).
2. **Docker volume paths:** volume subpaths now use forward slashes regardless
   of the supervisor host's path separator. Native bind paths remain native.
3. **Code artifacts:** Python and common JavaScript/TypeScript source extensions
   map to the existing plain-text attachment type, including when a picker
   reports an executable or HTML MIME type. No executable MIME type was added.

## Regression checks

- 109 focused unit tests passed; 20 platform-specific tests skipped on Windows.
  The Unix command/control self-test is Linux-specific, and POSIX permission
  assertions are not represented as Windows permission tests.
- Seven additional offline checks ran against the actual source inside a Linux
  Node container, covering missing/symlink roots, read-only git objects, foreign
  ownership, unreadable files, directory permissions and moved-directory escape.
  All passed.
- 19 artifact-adapter unit tests passed.
- Core and sandbox-supervisor TypeScript checks passed; changed files passed
  Biome and the diff whitespace check.
- The live app displayed the peer request/result exchange and downloadable source
  artifact. Local screenshots contain synthetic task data only.

## Remaining acceptance

This passes one direct specialist task, one peer request/result round trip,
shared-file use and a completed-computer stop/start. It does not establish useful
parallel temporary workers, mid-run worker-crash recovery, scheduled work with
the client closed, later-session contextual recall, arbitrary authenticated
browser work, requirement-revision propagation, Meta operations, or the full
PR/CI/merge/deployment demonstration. Those requirements remain open in the
[MuseOrg goal](../MUSEORG_GOAL.md).
