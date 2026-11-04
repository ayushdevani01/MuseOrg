# Live Meta reporting connections

The demo now has real Meta reporting reads through MuseOrg employees. These
checks supplement [the native media evidence](./2026-11-03-meta-media.md), rather
than replacing the remaining launch and inbound-message requirements.

## Official Ads MCP

- The official endpoint authenticated through MuseOrg's encrypted MCP OAuth flow
  using the demo developer app. Dynamic client registration was unavailable, so
  the existing pre-registered-client setting was used.
- The authorization URL requested only `ads_read` and `ads_mcp_management` after
  [the shared scope correction](./2026-11-03-mcp-scope.md).
- Server discovery succeeded and reported its tool catalog. The demo employee
  received an explicit allowlist containing only `ads_get_ad_accounts`.
- The employee made the real MCP call. Its completed durable effect recorded
  `isError: false` and an empty `ad_accounts` array. The employee reported that
  absence instead of inventing an account or campaign.

This establishes the intended MCP transport and account read. It does not
establish campaign creation, activation, spend authority or account eligibility
for those actions. An eligible ad account is still needed for campaign staging.

## Threads

The public demo profile accepted the app's tester invitation. Its generated token
was first verified with a direct profile read, then saved through MuseOrg's normal
encrypted API-capability installation flow. Only a profile GET operation was
exposed, using the existing provider-neutral installed connector.

The same continuing growth employee then used that configured tool. Its completed
effect recorded HTTP success and the exact authorized profile identity. This is
an in-application tool result, not a catalog entry or connected badge. The token
was not placed in source, tool arguments visible to the employee, or its computer.
Publishing and reusable customer OAuth for this route remain separate work.

## Current limits

Instagram Business and Facebook Page identity reads were verified earlier.
Social draft/publish receipts, scoped inbound replies and the full launch rehearsal
remain outstanding. WhatsApp provisioning was deferred before accepting its
separate platform terms. Google account setup also remains deferred.

No account grant, token, private identifier or raw account response is distributed
with this evidence. Live setup and proof helpers stay outside the tracked source.

References: [Meta Ads MCP setup](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-get-started),
[Composio Threads authentication](https://docs.composio.dev/toolkits/threads).
