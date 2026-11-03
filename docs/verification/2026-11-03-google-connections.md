# Managed Google connections

MuseOrg reuses its optional Composio adapter for Google app connections. The server
uses the existing encrypted integration settings; an app account cannot configure
server credentials. Each user authorizes their own Google accounts through a
Composio Connect Link. Toolkit names and identifiers come from the live catalog.

The web and Electron connection buttons now reserve a sign-in window during the
click, before requesting authorization from the server. This avoids a slow request
losing the browser's popup permission. The window cannot access its opener, and
unused windows close after a failed or unnecessary authorization request. Native
mobile continues to open the provider URL through its existing platform flow.

The recovery message is “Allow popups to connect this app.” It appears only when
the browser prevents sign-in. Removing it would leave the user without a way to
recover from that failure; it is not persistent interface copy.
“Open sign-in” appears only after the server returns an authorization URL, while
the account remains unconnected. It lets the user continue in embedded browsers
that do not display the reserved popup. It disappears after server confirmation.

## Verification

- The existing adapter, encrypted provider settings and shared connection flow
  passed their focused offline checks.
- Popup and chat-card checks covered blocked windows, delayed navigation,
  unused-window cleanup and preventing false connection status.
- Browser checks passed for Gmail, Drive and Calendar authorization, pending
  status until server confirmation, the Added list, popup recovery and callback
  closure. These use fixture authorization responses, not Google accounts.
- Web type checking and a production build passed.
- A live authenticated Composio request verified project access. The application
  loaded the real Google catalog, including Gmail, Drive, Calendar, Docs, Sheets,
  Slides and Tasks.

Google account consent and a real read-only tool result are separate from project
setup and catalog discovery. Until those complete, Google operations remain
unverified. A connected badge or successful build alone does not prove them.

References: [manual authentication](https://docs.composio.dev/docs/authentication/manually-authenticating),
[session configuration](https://docs.composio.dev/docs/configuring-sessions),
[Gmail toolkit](https://docs.composio.dev/toolkits/gmail).
