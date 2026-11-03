# Meta model and integration browsing verification

MuseOrg coworkers must use the selected model for real tool work and produce
checkable results. Integration discovery must remain useful before a hosted
app catalog is configured.

## Verified

- A live Standard-mode `muse-spark-1.3` request was accepted by Meta.
- The existing Pi runtime completed a live read, calculation, write and final
  response loop through Meta's Responses API. No second agent loop was added.
- The app saved a personal Meta connection through its existing encrypted
  credential flow and selected Meta as the local workspace's main model.
- A Meta coworker saved a reporting preference with `remember`. A subsequent
  task read an uploaded synthetic order file from the Team Computer, wrote
  and attached a JSON report, and used the saved currency. The report matched
  the expected fixture result and the original input remained unchanged.
- Both persisted app runs recorded `meta` / `muse-spark-1.3` and completed.
- The result and attachment were visible in the normal coworker chat.

The initial small endpoint probe exhausted its output ceiling; it established
acceptance only. The later completed runtime and app tasks establish tool work.
Live calls used synthetic task data and did not publish posts, send messages,
modify external accounts, or create active ads.

## Integration browser

- Twelve popular apps remain visible with local logos when the managed catalog
  is empty. Shared metadata is in `@rakazo/core`; web and Electron share the UI.
- Available app catalog entries use the existing account connection flow.
- GitHub, Notion, Linear and Supabase use reviewed official MCP setup presets.
  Stripe and documentation servers remain available below the popular list.
- Other entries open app-specific MCP setup with a prefilled search and an empty
  server URL. They are browse entries, not claims that native integrations or
  account authorizations already exist. No endpoint is guessed.
- Search, connected-app management, duplicate suppression, local logo fallback
  after a failed remote image, and a narrow viewport were checked.
- Added includes connected featured apps even with an empty search query.
- Opening a browse entry or a preset creates no connection or account grant.

Checks include focused offline tests for catalog matching, endpoint identity
and Meta protocol replay; web/core type checks; a web build; and headless web
flows for browsing, setup, and connected-app management. The browser account
and managed-catalog responses in these UI checks are disclosed test fixtures.
They do not establish access to Gmail, Instagram, ads, or other real accounts.

## Still required for the marketing story

The model key authorizes model inference. Social publishing, advertising and
business messaging require their own API access tokens and account permissions.

For the combined Facebook/Instagram/ads route, prepare:

1. A Facebook account with control of a demo Page and its business portfolio.
2. An Instagram Business or Creator account linked to that Page. A Business
   account also supports the broader Stories demo path.
3. A Meta developer app with the relevant Instagram and Marketing API products,
   assigned developer/tester accounts, and the permissions needed by the demo.
4. An ad account accessible to that app/user if showing campaign creation. A
   paused campaign is sufficient for demonstrating creation without activation.
5. WhatsApp Business Platform assets and an eligible phone number only if the
   chosen inbound story uses WhatsApp.

Direct Instagram Login is a separate route and does not inherit the Facebook
Login requirements. Choose the route before collecting permissions. Account
eligibility, allowed permission access and any required review must be checked
in the actual app dashboard.

Publishing, ad-management and inbound-message adapters still need to be wired
and tested with those account grants. The later [media and account verification](./2026-11-03-meta-media.md)
records native Meta media tools, live application runs and actual account reads.
EC2 deployment and a full marketing rehearsal remain outside this verification.

## Sources

- [Meta Model API overview](https://dev.meta.ai/docs/overview)
- [Meta pricing and modes](https://dev.meta.ai/docs/pricing-rate-limits)
- [Meta image generation](https://dev.meta.ai/docs/image-generation)
- [Meta's Instagram collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Meta's Marketing API collection](https://www.postman.com/meta/facebook-marketing-api/collection/0zr4mes/facebook-marketing-api-mapi)
- [Meta's WhatsApp Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api)
- [Supabase's official MCP setup](https://supabase.com/docs/guides/ai-tools/mcp)
