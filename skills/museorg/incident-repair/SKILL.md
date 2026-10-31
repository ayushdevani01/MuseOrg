---
name: incident-repair
description: Diagnose, repair and verify a failing website or service.
---

Record the failing URL, response or user path and deployed revision before editing.
Inspect permitted logs and the repository. Reproduce the failure with the existing
tests or a meaningful regression; do not change criteria to accept the defect.

Work in an isolated branch/worktree for the repair. Give parallel reviewers or
investigators separate output paths and a bounded briefing with current facts,
prior decisions and artifact references. Do not share write credentials with the
computer or ask a reviewer to pretend checks passed.

Make the smallest supported change. Run the service's tests and applicable build,
type or lint checks. Inspect the diff and ask for useful independent review when
appropriate. Keep failed diagnostic attempts in the evidence.

Use github-delivery for connected remote delivery. A local passing test is an
intermediate result: recovery requires the deployed revision and actual user path
to be healthy. Report the PR, checked head, merge, deployment and verification.
If any stage is blocked or unknown, keep the incident open and state the blocker.
