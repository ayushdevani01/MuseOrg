# Anthropic Agent Skills: MuseOrg adoption audit

Research date: 27 October 2026. This is a source inspection and adoption proposal, not a claim that these skills have been installed or evaluated with Meta models.

## What was donated

Anthropic's [22 October announcement](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation) donates the **Agent Skills standard** to the Agentic AI Foundation: the name/logo, GitHub organization, and agentskills.io domain. A skill is a directory with `SKILL.md` plus optional scripts/resources. The donation makes governance neutral; it does not make every example implementation uniformly licensed or compatible with every runtime.

The [implementation repository](https://github.com/anthropics/skills) expressly distinguishes many Apache-2.0 examples from the source-available document skills (`docx`, `pdf`, `pptx`, `xlsx`). Inspect each directory and its bundled assets before reuse. Do not copy the whole catalog on the assumption that it is all Apache-2.0.

Inspection snapshot: [`anthropics/skills@dbd4588f9e1033efb41dad4bef2f7947c8993d44`](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44). Pin the adopted files to this commit or deliberately record a newer reviewed revision during implementation.

## Which skills help

The first three are the initial product bundle. Optional design references follow after both demos work. Development helpers belong in the development workflow, not in the coworker's authority to alter its own runtime.

| Skill | MuseOrg use | Decision | Adaptation / limitation |
| --- | --- | --- | --- |
| [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Engineer: landing-page layout, typography, responsive design and visual review | Vendor and adapt; directory has Apache-2.0 license | Remove fictional prior client feedback; preserve user's actual brand/offer, use the pinned starter and require a working accessible page with browser evidence |
| [webapp-testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md) | Engineer and QA worker: Playwright navigation, DOM assertions, screenshots and logs | Vendor and adapt; Apache-2.0 | Python + Playwright + Chromium must exist in computer image; adapt process management/readiness rather than copying helper unchanged |
| [internal-comms](https://github.com/anthropics/skills/blob/main/skills/internal-comms/SKILL.md) | Chief: progress, handoff, incident update and factual end-of-task report | Vendor and adapt; Apache-2.0 | Cite real task, artifact and execution records; no invented activity, audience or success claims |
| [theme-factory](https://github.com/anthropics/skills/blob/main/skills/theme-factory/SKILL.md) | Creative: consistent brand tokens across page and campaigns | Optional reference; Apache-2.0 | Store one project brand spec; do not repeatedly interrupt the user with theme selection |
| [canvas-design](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md) | Creative: composition/art direction for static campaign assets | Optional adapted skill; Apache-2.0 skill text | Fonts have separate notices. Remove the instruction pretending the user already supplied refinement feedback. This is not a SAM, image API or video-editing tool |
| [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) | Developers: author, trigger-test and improve MuseOrg's own skills | Development reference; Apache-2.0 | Its evaluation scripts invoke Claude CLI and inspect Claude events. Port the evaluator to Pi and the actual Meta role models |
| [mcp-builder](https://github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md) | Developers: typed tool contracts, pagination, useful errors and MCP conventions | Development reference; Apache-2.0 | Evaluation helper uses Anthropic SDK/Claude. Replace that runner; do not wrap every existing API in a new MCP server |
| [web-artifacts-builder](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md) | Potential single-file export | Skip unchanged; Apache-2.0 | Initializer installs tooling, uses an unpinned app generator and broad component setup; bundles through Parcel to single HTML. Use a normal reproducible app/build/deploy path for the real landing page |
| [doc-coauthoring](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md) | Collaborative brief/design writing | Reference behavior; hold direct vendoring | At inspection the directory had no explicit license field/file and the repo had no root LICENSE. Write an original brief-review workflow unless reuse terms are established |
| `docx`, `pdf`, `pptx`, `xlsx` | Future business documents | Outside the first two demos; assess separately | Source-available is not interchangeable with Apache-2.0. Use permitted libraries/implementations and verify each license before bundling |

The old conversation's `github-deploy` reference is not an existing skill in the inspected Anthropic catalog. MuseOrg needs its own GitHub delivery procedure.

For the Apache examples, the license is in `skills/<name>/LICENSE.txt`; for example [frontend-design license](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt), [webapp-testing license](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/LICENSE.txt), and [internal-comms license](https://github.com/anthropics/skills/blob/main/skills/internal-comms/LICENSE.txt).

## Adaptation work that matters

1. **Match our tools and actual conversation.** Replace Claude-specific file/edit/presentation tool names, connector settings, macOS `open`, and local `/tmp` assumptions with Pi tools, Linux computer paths and the MuseOrg artifact registry. Remove fictional prior-user/client-feedback premises from both `frontend-design` and `canvas-design`; never turn a skill's invented history into a project fact. Keep explicit source links and a change log.
2. **Make scripts reliable.** The browser-testing `scripts/with_server.py` helper checks TCP readiness, uses `shell=True`, pipes server output and terminates the immediate subprocess. Replace it with managed process groups, drained logs, timeouts and actual HTTP/application readiness. Streaming pages need explicit DOM assertions rather than reliance on network idleness.
3. **Separate instruction from authority.** A skill can explain how to propose publishing, merging or sending. It cannot grant a permission, choose a different account, raise a spending limit or approve its own actions. The trusted broker enforces that contract.
4. **Load selectively.** Expose short role-specific descriptions; load the selected skill and its referenced resources on demand. Do not stuff the whole repository into every turn. Rakazo already has `AgentSkill`, `skill_read` and a catalog; extend those rather than adding a second independent loader.
5. **Package resources deliberately.** Existing `AgentSkill` stores text; filesystem scripts/resources need a read-only versioned bundle and a safe resource resolver. A `SKILL.md` record alone does not deploy Python scripts, fonts or browser binaries.
6. **Evaluate on Meta.** The `skill-creator` runner uses `claude -p`, `.claude/commands` and Claude event assumptions; `mcp-builder` evaluation imports Anthropic SDK. Our runner must use the same Pi/Meta adapter as coworkers. Keep synthetic test fixtures visibly distinct from real account evidence.

Proposed bundle location: `skills/vendor/anthropic/<skill>/`. Original workflows: `skills/museorg/<skill>/`. These are product coworker resources, **not installation into the developer's global Codex skills folder**.

Proposed `skills/manifest.json` entry fields: skill ID, role allowlist, source URL, source commit, file hashes, license file, local changes, dependencies, tool capabilities, bundle version and evaluation result. Store source notices in `THIRD_PARTY_NOTICES.md`. Skills are read-only during a run; reviewed updates create a new bundle version for later runs.

## Original MuseOrg skills still required

| Skill | Owns | Done when |
| --- | --- | --- |
| `org-coordination` | Chief task decomposition, ownership, bounded peer handoff, requirement revision propagation | Two specialists work in parallel, results link to artifacts, no message loop or context copying by user |
| `project-brief` | Shared brief, constraints, brand, offer, channels and provenance | A chat correction becomes an explicit project revision and affected work is refreshed |
| `meta-media` | Voice normalization/transcription, SAM request/parsing, masks, compositing, image generation | Real inputs produce inspectable transcript, decoded mask/overlay and image files |
| `growth-operations` | Channel-specific drafts, destinations, preview, approval and publication receipt | The published payload matches the approved revision and real account readback |
| `scoped-inbox` | FAQ grounding, allowed reply scope, escalation and duplicate-event handling | Approved routine question receives one reply; exception is held for the user |
| `incident-repair` | Reproduce outage, inspect evidence, bounded fix, verification and incident report | The repair is evidence-led; an unhealthy deployment is not reported fixed |
| `github-delivery` | Worktree/branch, patch, PR, checks, authorized merge, deploy and live verification | Real PR + successful checks + merged SHA + matching healthy deployed revision |
| `browser-verification` | Public browser inspection and UI fallback with artifacts | Assertions/screenshots support the claimed result and account actions use the permitted path |

The domain skills orchestrate general tools. They do not encode the whole demo as a deterministic Chief → Creative → Engineer → Growth pipeline; other tasks can use the same coworkers and harness.

## Evaluation before shipping

Use a small fixed case set per role: positive trigger, similar negative trigger, ambiguous brief, mid-run correction and tool failure. For each meaningful skill change, compare the same task with/without the skill on the intended role model. Record task success, false activation, usable artifacts, external-action violations, latency, model/tool usage and human interventions. Do not claim a benchmark improvement without these measurements.

Minimum acceptance:

- Engineer produces a working page and tests a real interaction; visual quality is reviewed at mobile and desktop widths.
- Chief status statements can be traced to task/event/artifact records.
- Skill instructions cannot invoke an ungranted protected action or change an approval policy.
- Media skill handles a no-match SAM result and malformed/missing files without claiming a successful asset.
- GitHub skill stops on failed checks and verifies the live deployed revision after a merge.

## Practical answer

Yes: adopt the standard and adapt a small set of good skills. This saves procedural writing and gives us useful evaluation patterns. The remaining product work is the persistent organization, shared state, model/media adapters, actual account connections and reliable execution. A large skill catalog alone does not supply those capabilities.
