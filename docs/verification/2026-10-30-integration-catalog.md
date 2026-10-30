# Integration catalog acceptance — 30 October 2026

The user can choose an official MCP preset, review its prefilled connection,
provide the required authorization and select the coworkers that receive it.
Custom MCP, OpenAPI and GraphQL setup remains available from Add integration.

## Implemented

- One shared preset catalog for web, Electron and mobile, with locally bundled
  monochrome logos from Simple Icons 13.21.0 (CC0-1.0).
- Presets are available without a managed connector vendor, including while its
  catalog loads. Selecting a preset does not create a server or grant access.
- Web/Electron reuse the existing encrypted MCP registry, OAuth flow, connection
  test and explicit coworker assignments. The current coworker is selected by
  default and the selection remains editable. Existing assignments are retained.
- Registered-server logos match the exact reviewed endpoint, not the editable
  server name. Lookalike hosts and URLs containing credentials do not match.
- GitHub's token input is visible when selected and an empty token prevents a new
  server from being saved. OAuth-only and public servers show relevant setup
  guidance instead. English production copy is included in the message catalog.
- Mobile reuses its verified public/bearer source flow. Notion's OAuth-only setup
  explicitly directs the user to web when selected. Registered-server OAuth,
  editing, health probes and per-coworker assignment management remain web-only;
  mobile displays registered servers without pretending to manage them.

## Official endpoints and live checks

No account credentials were supplied to these protocol checks.

| Preset | Official setup reference | Live result |
| --- | --- | --- |
| GitHub | [GitHub MCP](https://github.com/github/github-mcp-server#remote-github-mcp-server) | Authentication required (HTTP 401) |
| Notion | [Notion MCP](https://developers.notion.com/guides/mcp/get-started-with-mcp) | Authentication required (HTTP 401) |
| Linear | [Linear MCP](https://linear.app/docs/mcp) | Authentication required (HTTP 401) |
| Stripe | [Stripe MCP](https://docs.stripe.com/mcp) | Authentication required (HTTP 401) |
| Cloudflare Docs | [Cloudflare MCP](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) | Initialized and discovered 2 tools |
| OpenAI Docs | [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp) | Initialized and discovered 5 tools |

Both public documentation connections also passed the application's own MCP
probe. Cloudflare Docs was added through its preloaded card and saved with the
selected coworker assignment. OpenAI Docs retained its saved connection, and its
assignment was enabled through the normal manager. Unrelated connections and
coworker assignments were preserved.

## Worker execution

One bounded live Chief task used `openai-codex` / `gpt-6-luna`, the lowest-priced
model in the connected test catalog by its bundled input/output estimates. The
task completed in two model turns. Persisted tool audit events recorded exactly
one `mcp__openai-docs__list_openai_docs` invocation and a successful completion.
The request was limited to one public documentation result and made no external
writes. The recorded estimate was $0.0022385; this is not a verified subscription
charge or a measurement of remaining allowance. No judge model was used.

The earlier [authenticated synthetic MCP proof](2026-10-30-mcp-tool-smoke.md)
separately covers encrypted bearer credentials and independent tool receipts.
The normal development instance was restarted without the fixture's private
endpoint override. Production's personal Meta-key policy remains unchanged.

## Automated and visual verification

- 63 focused offline unit tests passed across preset endpoint matching, shell
  routing, MCP management/health and mobile integration flows.
- Four browser scenarios passed: registered-server discovery/search, custom
  MCP/API setup and assignment, all preset forms/logos, and the existing broader
  integration account/source workflow. Desktop and narrow screenshots were
  captured by the web suite; the live catalog was also visually inspected.
- Core, web and mobile TypeScript checks passed. The web production build passed.

An authentication challenge verifies reachability and the need for credentials;
it does not prove an authorized third-party account operation. GitHub, Notion,
Linear and Stripe account authorization remains unverified. Meta account actions,
publishing, PR/merge/deployment and the complete MuseOrg demos remain separate
acceptance work. No external account was automatically authorized by this task.
