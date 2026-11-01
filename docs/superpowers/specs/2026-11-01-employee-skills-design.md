# Employee roles, imported skills and integration rows

The user chose an optional skills step inside hiring: name/look and a role
question, then skill discovery before creating the employee. Four existing
profiles remain reusable defaults; a custom responsibility needs no new runtime.

Public skill search is optional behind `SkillCatalogProvider`. The skills.sh
adapter uses the same public search endpoint as its open-source CLI, resolves
public GitHub source to a commit and previews a bounded text bundle. Creation
re-fetches that exact revision and checks the selected digest. Existing bot
creation's seed transaction stores both employee and skills atomically.

Imported recipes use the existing user/space skill library. The hired employee's
instructions select them; they are also available to other employees in that
library, like existing user-created skills. Provenance and supporting text files
are preserved in an extension to the skill document's frontmatter. `skill_read`
lists and reads exact stored resource keys without executing an installer or
resolving host paths. Imports grant no new tools or account authority.

The initial importer supports public GitHub text bundles up to forty supporting
files and eighty thousand bytes. Larger, binary or incomplete bundles fail with
an error; hiring without imports stays available when the directory is down.
Preview content is rendered as text. Search sends only the selected public role
category by default; custom responsibility text is not sent automatically.

Web and Electron share the hiring wizard and integration rows. Integrations use
logos, short descriptions, add/manage icon controls, and Discover/Added views.
Existing OAuth, token forms and assignments remain the connection authority.
Native mobile retains its existing creation, profile and integration flows; the
optional discovery wizard is web/Electron only in this slice. Shared API imports
and runtime reading work independently of that UI.

Validation covers preview consent, skipped/unavailable discovery, pinned content,
source/path limits, owned atomic persistence and runtime resource readback. Web
E2E covers hiring and the redesigned MCP catalog with screenshots. No model is
needed to choose a role, search, preview or import a skill.
