# OpenOrg creator and related projects

Verified 2026-10-28. This is a source review, not a claim that these projects have been installed or tested in MuseOrg.

## Identify the project first

The original attachment explicitly links **[nightly-labs/openbot](https://github.com/nightly-labs/openbot)**. It does not name OpenOrg. There is also a distinct agent workspace called OpenOrg: **[aviaviavi/celorga](https://github.com/aviaviavi/celorga)**, formerly OpenOrg and Org2, as its [pinned README](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/README.org) confirms. The user's latest spelling alone does not establish which creator they intended. Both relevant profiles were checked; they must not be conflated.

## Literal OpenOrg: aviaviavi

The [creator's profile](https://github.com/aviaviavi) links Org2 (now Celorga), Toodles, and other projects. Repository metadata distinguishes original projects from forks.

| Project | Verified overlap | MuseOrg decision |
| --- | --- | --- |
| [Celorga](https://github.com/aviaviavi/celorga) | File-backed context, agent work records, approvals, reusable workflows, MCP, native Mac/iPhone clients and a headless host. [README](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/README.org). | Reference the work/evidence and approval contracts. Keep the existing Pi/Rakazo foundation. |
| [olai fork](https://github.com/aviaviavi/olai) | A fork of [juspay/olai](https://github.com/juspay/olai), serving a Git-backed file outliner through browser and MCP. It has agent chat and scoped wakeups. [Architecture](https://github.com/aviaviavi/olai/blob/37770c2e787d264961408f2d4232e335520c138b/docs/architecture.md). | Reference only for now. It is not a drop-in persistent-coworker backend; its package declares [AGPL-3.0-or-later](https://github.com/aviaviavi/olai/blob/37770c2e787d264961408f2d4232e335520c138b/package.json). |
| [Toodles](https://github.com/aviaviavi/toodles) | Scans and edits source TODOs through a web interface. [README](https://github.com/aviaviavi/toodles/blob/503f35f1b713ebe4daf7b7e2f9e7563e33e3a060/README.md); [MIT license](https://github.com/aviaviavi/toodles/blob/503f35f1b713ebe4daf7b7e2f9e7563e33e3a060/LICENSE). | Skip as a core dependency. A later coding skill can inspect source TODOs without adding a second task system. |
| [curl-runnings](https://github.com/aviaviavi/curl-runnings) | Declarative JSON API integration tests. [README](https://github.com/aviaviavi/curl-runnings/blob/2ba56d4b7835d57f560815e8aff799b9c5e1f0d6/README.md); [MIT license](https://github.com/aviaviavi/curl-runnings/blob/2ba56d4b7835d57f560815e8aff799b9c5e1f0d6/LICENSE). | Optional reference for outage-demo HTTP assertions. Existing test tools already cover this boundary. |

The profile also contains [hyprnote](https://github.com/aviaviavi/hyprnote) and [org-parser](https://github.com/aviaviavi/org-parser), which repository metadata identifies as forks. They are not evidence of additional original coworker products.

### The useful Celorga pattern

At commit `8db3db99cfb71429825ec17c44c2d0fedef07908`, [agent-run.schema.json](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/spec/v0/agent-run.schema.json) groups the goal, acceptance criteria, context hashes, plan, artifacts, approvals, validations and events. [agentRun.ts](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/src/agentRun.ts) fingerprints approval material, checks it when deciding, and refuses completion with pending approvals. [guardedFile.ts](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/src/guardedFile.ts) rejects writes against a stale expected revision.

**Recommendation (our inference):** use these as reference cases for MuseOrg's changed-brief demo: preserve the prior evidence, revise the artifact, and bind authorization to the current action and content. Implement through MuseOrg's existing contracts and backend authorization. These source patterns do not establish complete enforcement of account, content or spending scope across every connector, shell and browser tool. Celorga's [Apache-2.0 license](https://github.com/aviaviavi/celorga/blob/8db3db99cfb71429825ec17c44c2d0fedef07908/LICENSE) permits assessment for reuse with its terms and notices; no code was copied in this review.

## Attached OpenBot: nightly-labs

The [organization](https://github.com/nightly-labs) has several adjacent repositories, but names can mislead:

- [infeld-skills](https://github.com/nightly-labs/infeld-skills) documents a project-scoped knowledge MCP service, including current facts, historical lookup and source provenance. Its [actual skill](https://github.com/nightly-labs/infeld-skills/blob/main/skills/infeld/SKILL.md) describes evidence retrieval, not coworker execution. Keep it as a possible optional knowledge integration; the repository contains no license file in the inspected tree. Do not install or copy it as a default dependency.
- [trackall-integrations](https://github.com/nightly-labs/trackall-integrations) is a DeFi positions registry, as its [README](https://github.com/nightly-labs/trackall-integrations/blob/main/README.md) confirms. It is not the missing Gmail/Meta/GitHub connector bundle.
- [electron-hybrid](https://github.com/nightly-labs/electron-hybrid) patches phone passkeys into Electron; its [README](https://github.com/nightly-labs/electron-hybrid/blob/main/README.md) limits the supported binary to macOS arm64. It does not solve the web onboarding or agent-computer requirement, so skip for this build.

OpenBot main was inspected at `5c20fe828e51391cb8b702bacee39d8814228e9f`. Its current [license](https://github.com/nightly-labs/openbot/blob/5c20fe828e51391cb8b702bacee39d8814228e9f/LICENSE) is PolyForm Noncommercial; [v0.1.11](https://github.com/nightly-labs/openbot/blob/v0.1.11/LICENSE) has Apache-2.0. Rewriting code by hand does not by itself erase license obligations. Keep the current base and existing attribution; assess any concrete reuse against its exact source version.

## Result

No additional harness is needed for the current core slice. Celorga's approval/evidence records are the strongest new reference found. The other repositories are optional later tools or unrelated to the promised demos. Meta account setup and live provider validation remain deferred as requested; this research does not change that scope.
