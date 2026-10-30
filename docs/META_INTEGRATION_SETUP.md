# Meta integration and account setup

Checked 27 October 2026. This records supported integration routes and planning estimates. No user account, token, business asset or live application connection has been configured or verified.

## Integration split

1. **Models/media:** call the official Meta Model API from trusted worker tools. Spark/Wonder supply coworker reasoning; Voice/SAM/Image supply media outputs. The [official quickstart](https://dev.meta.ai/docs/quickstart) documents API keys and OpenAI/Anthropic-compatible transports. The [model catalog](https://dev.meta.ai/docs/models) identifies supported endpoints. Prove Pi's tool loop and protocol state; endpoint configurability alone is insufficient.
2. **Business/social accounts:** use Meta's platform APIs and separate account permissions/tokens. An inference API key does not grant access to Instagram, WhatsApp or ad assets.
3. **Reusable connectors:** reuse Rakazo's Composio/MCP plumbing. Composio is a third-party wrapper, not Meta's own unified connector. Its current [Instagram](https://docs.composio.dev/toolkits/instagram) and [Facebook](https://docs.composio.dev/toolkits/facebook) toolkits offer managed OAuth; [Threads](https://docs.composio.dev/toolkits/threads) and [Meta Ads](https://docs.composio.dev/toolkits/metaads) list managed OAuth as unavailable, so configure the appropriate custom authentication. Test each intended action and webhook.

## Official options and prerequisites

| Part | Route | Account prerequisites |
| --- | --- | --- |
| Spark, Wonder, Voice, SAM, Image | Meta Model API, with native media tools | Activated model account/key and available usage/billing; check intended model access |
| Instagram / Facebook | Instagram Platform and Pages APIs; Composio where sufficient | Instagram Business/Creator account and a Page for the Facebook Login path; appropriate app/account roles and granted permissions |
| Threads | Threads API, optionally through Composio | Threads account, app configuration, OAuth callback and publishing/reply permissions |
| WhatsApp | Official Cloud API; test setup first | Developer registration, WhatsApp-enabled recipient/device, business portfolio/messaging account, token, test number and HTTPS receiver |
| Ads | Official Meta Ads MCP; Marketing API/Composio only as a recorded alternative | Authorized ad assets, required MCP permissions/authentication; account/billing eligibility for actual ad delivery |

Instagram Login is also supported and does not require a linked Facebook Page; choose the authentication path deliberately. Meta's [Instagram collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7) documents the Facebook Login path; its [Instagram Login collection](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login) documents the separate route. Neither route establishes general access to personal consumer accounts.

### Meta Ads MCP: source verification resolved, account verification outstanding

The [official overview](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview) confirms the Meta-hosted `https://mcp.facebook.com/ads` endpoint and custom MCP-compatible agent support. The [get-started guide](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-get-started) documents an own-app route with the **Create & manage ads with ads MCP server** use case, Facebook Login for Business OAuth, programmatic user bearer tokens and server-to-server system-user authentication. It specifies employee-role system users, not admin-role system users, and `ads_mcp_management` with `ads_read` or `ads_management` as minimum permissions. It also links an assistant setup route without an owned developer app; do not claim owning an app is universally mandatory.

These primary pages were read successfully through HTTP in this pass despite the web reader's earlier failures. An unauthenticated initialization returned 401/OAuth metadata, establishing an authentication boundary, not access to any user's ad assets. MuseOrg's actual account/tool tests remain pending. Use the existing MCP client plumbing and trusted action gate; do not put tokens in the shared computer.

### WhatsApp: test first, production separately

The [official quickstart](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) provides a test path through the WhatsApp app use case, business portfolio/messaging account, temporary token and test sender. Configure the HTTPS webhook separately for incoming messages and delivery status. Replace temporary credentials for persistent operation. The [official Postman collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api) documents token lifetimes and request examples.

Production onboarding adds the actual eligible business phone/account and relevant permissions/templates. Existing WhatsApp Business app numbers have a documented coexistence path where eligible; do not assume they must always be deleted or migrated. Platform messaging rules still govern automatic replies.

## Time budget

**These are our hands-on engineering estimates, not Meta approval SLAs.** They assume access to eligible accounts, successful registration and the required auth credentials. Waiting for activation, identity/business checks, review, phone-number approval or restrictions is additional.

| Setup item | Hands-on budget |
| --- | --- |
| Model account/key and first request | 15–45 minutes after access is available |
| Developer/business assets plus Instagram/Page authentication | 1–3 hours with owned eligible assets |
| Threads test authorization | 30–90 minutes |
| WhatsApp test setup | 30–90 minutes |
| Existing ad account + MCP auth/read test | 1–3 hours; a restricted/new account can take longer |

Allow roughly one working day for initial owned-account setup/smoke tests, conditional on access. Integrating usable model/media/social/webhook flows into MuseOrg is a separate multi-day engineering task; initially budget 2–4 focused days in parallel with product work and revise after the first actual tests. Production customer onboarding can involve external review measured in days or weeks; no guaranteed turnaround was verified.

## Execution order

1. Activate Model API access, claim eligible event credits and prove a real model request.
2. Inventory owned accounts/assets and establish public HTTPS callback/webhook routes.
3. Prove one Instagram/Page publishing action, Threads authorization and a WhatsApp test event/reply; inspect granted scopes rather than trusting a connected badge.
4. Prove Ads MCP authentication, account listing and a read operation before proposing a paused campaign or spend.
5. Expand to all submitted channels, durable tokens, signed events, recovery and production onboarding as required. Keep blocked operations explicit.

Own/admin/test accounts can reduce review dependencies for development, but do not imply every permission works instantly without review. Serving unrelated customers through MuseOrg must satisfy the requirements of the actual app, login path, permission and platform.
