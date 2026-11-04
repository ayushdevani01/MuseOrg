---
name: webapp-testing
description: Verify web behavior with browser actions and regression evidence.
license: Apache-2.0; see LICENSE.txt
---

Adapted for MuseOrg from the pinned Anthropic skill identified in the bundle manifest.

Establish the URL, current project revision and acceptance criteria. Keep existing
tests intact unless the user's requested behavior changes their contract. First
reproduce the reported failure, then inspect the relevant source and logs.

Use browser_navigate, browser_snapshot and browser_act on the coworker's computer
for normal browser verification. Discover controls from the rendered page before
acting. A streaming application may never become network-idle: wait for an
observable ready element or meaningful HTTP response instead. For graphical
fallback, observe before coordinate actions and after uncertain transitions.

Read references/browser-checks.md with skill_read(resource=...) when planning
browser assertions. The scripts/check_url.py resource is a small optional HTTP
readiness check; copy it into the authorized project before executing it.

Test one important user path and its relevant failure case. Inspect console or
server errors when needed, capture actual screenshots, and attach useful evidence.
Use an installed Playwright setup if the project already has one; do not assume
Python Playwright or browser binaries are present. When the computer already has
browser tools, do not launch another Chromium/Chrome process from shell for a
screenshot. Serve the page over HTTP and use those tools. Manage any server you start
with a bounded lifetime and preserve its logs. Do not stop shared browser/display
processes or unrelated services.

Separate observed behavior from inferred causes. Return the tested revision,
commands, browser actions and unresolved issues. Account changes and protected
external writes still require their existing authority.
