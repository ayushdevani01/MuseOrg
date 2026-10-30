# Hackathon repository and submission

MuseOrg is being developed for the Meta Global AI Developer Hackathon.

## Sources

- [Participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details)
- [Official rules and event waiver](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver)

The guide and rules were inspected on 26 October 2026. The guide currently
requires sign-in to inspect again. Verify the latest guide and submission form
before submitting; this checklist does not replace the organizers' rules.

## Repository

- Keep the repository public and accessible to judges.
- Preserve the upstream license and notices. [UPSTREAM.md](../UPSTREAM.md)
  identifies the exact starting revision and separates inherited capabilities
  from MuseOrg changes. Git history retains the original foundation.
- Make focused commits with actual dates; do not disguise inherited work as
  work created during the event.
- Include reproducible setup, completed verification and known limitations.
  [CORE_IMPLEMENTATION.md](CORE_IMPLEMENTATION.md) records implementation status;
  [verification/](verification/) records specific checks.
- Keep real credentials, local account state, private briefs and personal data
  out of source, screenshots, logs and commit messages. Use the connection UI
  or ignored local environment files.

## Submission still to complete

- Demonstrate useful live Meta model execution. Temporary Codex development
  access does not establish the Meta requirement; submission configuration
  requires a personal Meta API-key connection.
- Provide an accessible three-minute demo video, identify the features built
  during the event, and accurately describe reused components.
- Provide the live product and required submission fields, identify team
  contributors through the submission portal, and confirm successful receipt.
- Verify the deadline and any updated requirements in the authenticated guide.

Repository publication does not complete the submission or either end-to-end
demonstration in [the product goal](MUSEORG_GOAL.md).

## Repository automation

Normal CI remains available for lint, type checks, builds, offline tests,
database journeys and browser screenshots. Publishing and upstream maintenance
jobs are opt-in repository variables:

| Variable | Enables |
| --- | --- |
| `SERVER_IMAGE_PUBLISH_ENABLED` | Container image publication |
| `MOBILE_UPDATE_ENABLED` | Mobile over-the-air publication |
| `DEPENDENCY_AUTOMATION_ENABLED` | Scheduled dependency and model-catalog updates |
| `VISUAL_REPORT_PUBLISH_ENABLED` | Scheduled/external visual report publication |
| `PRODUCTION_DEPLOY_ENABLED` | Existing production deployment job |

Leave these unset until this project's destinations and required credentials
are deliberately configured. Browser screenshots from CI remain GitHub Actions
artifacts without enabling external report publication.
