# Integration discovery and skill preview

The integration browser now downloads the public metadata index on the backend
and caches it for five minutes. Searches run locally over that index, including
each method's metadata. Results include MCP, OpenAPI, GraphQL and CLI methods;
the UI displays more results progressively instead of silently dropping matches
after the first page. Custom administrator-configured feeds remain supported.

Search runs within MuseOrg, including the main integration search and a selected
app's setup view. The external directory search button is removed. API methods
open the existing setup form; unsupported/manual methods stay visible. Discovering
a method does not connect an account or establish provider permissions.

The reported skill preview failure was a source-lookup bug. Its canonical
frontmatter name differed from its directory name. The importer now prioritizes
likely directories and inspects a bounded set of other SKILL.md files while
retaining commit pinning, name verification, file restrictions and bundle hashes.
An unavailable preview offers the exact public skills.sh page and never silently
selects or imports the skill.

## Verification

- Live preview loaded the previously failing public printable-HTML skill and
  its supporting resource through the application API.
- Live directory requests returned multiple Gmail-related services and the
  complete set of matching Google entries from the downloaded index, including
  MCP and API methods.
- Offline tests covered metadata caching, more than one result page, multiple
  methods per service, later-method descriptions, explicit MCP endpoints,
  bounded source lookup, fallback links, and explicit skill selection.
- Browser checks covered every displayed method, Show more, an API method
  opening its prefilled form, empty-catalog browsing, and Added management.
- Web/API type checks and builds passed.

Browser catalog responses are disclosed test fixtures. Live read-only checks
were separate. No Google sign-in, account authorization or Google operation was
performed during this change.

## Public data source

Catalog metadata is supplied by the MIT-licensed
[integrations.sh project](https://github.com/UsefulSoftwareCo/integrations), via
its [public index](https://integrations.sh/api.json). The cache holds metadata;
actual service APIs, schemas and account authorization remain separate.
