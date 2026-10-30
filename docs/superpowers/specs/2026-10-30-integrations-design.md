# Integration access

## Preset catalog extension

Offer a small searchable catalog of official remote MCP endpoints with bundled,
monochrome brand artwork. Presets only fill the existing server form: users still
review the endpoint, credentials and coworker assignment before saving. Keep
custom MCP, OpenAPI and GraphQL entry points. Store catalog metadata once in the
shared core package and reuse it on web, Electron and mobile. Match installed
logos by exact endpoint, never by a user-supplied server name.

Use GitHub, Notion, Linear, Stripe, Cloudflare Docs and OpenAI Docs. Show required
authentication at selection time and link the provider's setup documentation.
Do not install packages, grant account access or claim connectivity from a preset
alone. Mobile reuses its existing public/bearer source form; OAuth-only setup
explicitly directs the user to web until native registered-server OAuth exists.
Verify public servers live without credentials, authenticated endpoints only up
to their authorization challenge, and real worker tool use with one bounded
low-cost model task. Offline tests remain the default.

MuseOrg coworkers need real external tools through the existing authenticated
runtime. The current foundation already implements user-scoped app connections,
MCP servers, OpenAPI and GraphQL sources. The immediate gap is that custom
connections are buried in Advanced and new registered MCP servers start without
a coworker assignment.

## Implementation choice

Reuse these existing adapters and forms. A visible Add integration action offers
MCP, OpenAPI and GraphQL. Web and Electron share the same implementation. The MCP
manager initially selects the active coworker visibly; the user can change that
selection before saving. Keep vendor presets and optional catalog configuration
under Advanced. Show actual discovery health rather than treating registration
or saved credentials as proof of access.

Mobile exposes the same existing source-install choices through native controls.
Full registered-server management remains a separate parity constraint unless
the existing native surface can support it without a second implementation.

A new integration backend would duplicate working machinery. Requiring a hosted
catalog vendor would prevent direct MCP from working independently. Neither is
needed for this request. Composio and Pipedream stay optional adapters.

## Boundaries

Personal account authorization does not grant authority over server-wide provider
credentials. Keep the existing administrative restriction. Credentials stay in
the encrypted backend store, never browser storage or public source. Preserve
server-side endpoint validation, explicit coworker assignments and execution-time
authorization. Do not enable private endpoints or host commands in the product
defaults.

## Verification

Cover visible integration choices, MCP coworker selection, existing assignment
preservation and failed/healthy discovery states with focused UI checks. Check
web and mobile types and the web production build. Exercise the updated screen
in a browser.

For the runtime proof, register a protocol-complete loopback MCP fixture through
the ordinary API, grant one read-only tool to the test coworker, and perform one
bounded real task. Verify the fixture's independent receipt. A private-endpoint
override belongs only to the ignored isolated development launcher. This proves
the actual integration path, not access to unconnected external accounts.
