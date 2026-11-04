# Live Meta connection and campaign evidence

The demo now has real Meta reporting reads through MuseOrg employees. These
checks supplement [the native media evidence](./2026-11-03-meta-media.md), rather
than replacing the remaining launch and inbound-message requirements.

## Official Ads MCP

- The official endpoint authenticated through MuseOrg's encrypted MCP OAuth flow
  using the demo developer app. Dynamic client registration was unavailable, so
  the existing pre-registered-client setting was used.
- The initial authorization URL requested only `ads_read` and
  `ads_mcp_management` after [the shared scope correction](./2026-11-03-mcp-scope.md).
- Server discovery succeeded and reported its tool catalog. The demo employee
  received an explicit allowlist containing only `ads_get_ad_accounts`.
- The employee made the real MCP call. Its completed durable effect recorded
  `isError: false` and an empty `ad_accounts` array. The employee reported that
  absence instead of inventing an account or campaign.

The first read established the transport, but found no account. A later,
explicitly approved setup created a dedicated demo ad account. The employee's
new account read confirmed MCP eligibility, queryability and no payment method.

### Campaign and generated artwork

The first campaign write failed with an authorization error. The owner then
approved adding `ads_management` through the normal encrypted MCP OAuth flow.
The consent describes access to accessible ad accounts broadly; it is not an
account-specific OAuth grant. Demo requests targeted only the dedicated demo
account. Budget changes and status changes were blocked in Meta's own MCP
business settings, and activation tools were excluded from the employee's
allowlist.

The employee created one traffic campaign without supplying budget, spend-cap
or schedule fields. Despite the earlier catalog describing draft mode, the
actual create returned a persisted `PAUSED` campaign. A subsequent read with
`object_state=live` verified both `status` and `effective_status` as `PAUSED`.
An independent Ads Manager browser showed the same campaign switched Off and
no spend. This is a paused API object, not an unpublished Ads Manager draft.
Draft-state queries returned an account-rollout error; no draft verification
success is claimed.

The employee also uploaded the actual generated English campaign PNG with
`ads_creative_upload_media`. An exact-hash `ads_get_ad_images` lookup verified
the stored asset, its available status and image dimensions. The temporary
source URL allowed download of only the synthetic image; it did not make the
storage bucket public. An image-library asset's `ACTIVE` status does not mean
an ad is delivering.

This proves employee-driven official MCP account reads, campaign creation,
campaign readback, image upload and asset readback. No ad set, ad creative or ad
was created, no payment method was added and nothing was activated. A complete
delivery configuration still needs an approved destination and budget. This
does not establish revision-bound social publishing authority.

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
