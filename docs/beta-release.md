# Invite beta

The optional `BETA_INVITE_CODE` gates authenticated access to the app. Signup
creates the account; the web app then asks for the invite. The API checks the
account's persisted admission before resolving an authenticated workspace.
Failed status checks keep the web gate closed. Redemption is rate limited.

Signup creates account and workspace metadata without starting a computer.
Employee creation and computer boot require admission through the same API
session check. Computers start on demand as isolated Linux containers on the
deployment's EC2 host, with a shared computer per workspace by default.

After admission and model readiness, web and Electron offer Chief of Staff,
Staff Engineer, Creative Director and Meta Growth Operator, all initially
selected. The backend validates model readiness and hires the selected profiles
idempotently. Coworkers inherit the configured shared model without personal
credentials or fixed per-role model choices. A partially completed hire can be
retried without duplicating coworkers. Native mobile uses ordinary coworker
hiring after the account has redeemed its invitation on web.

Set the real code in the server environment, outside source control. Changing
the code changes future admissions; already admitted accounts remain admitted.
Leaving it empty preserves normal self-hosted behavior. Native clients can use
an admitted account, but this web beta has no native invite-entry screen.

Configure the shared connection through the deployment's existing model defaults:

```dotenv
BETA_INVITE_CODE=replace-with-a-private-invite
REQUIRED_PERSONAL_MODEL_PROVIDER=
PI_DEFAULT_PROVIDER=meta
PI_DEFAULT_MODEL=muse-spark-1.3-contributor
PI_DEFAULT_BACKUP_MODEL=muse-spark-1.3
PI_DEFAULT_API_KEY=replace-with-server-held-key
```

The backup is attempted only for rate limits. New runs start with the primary.
The selected native Meta connection also supplies image generation,
transcription and segmentation. Users need no personal model connection. The
server key is not returned to clients or copied into user credentials. App and
MCP authorizations still belong to each user; model funding does not share the
operator's connected social accounts.

Skills remain inside hiring. Search the public catalog, preview a skill, select
it, then hire. The backend imports its pinned revision and checks its digest in
the employee-creation transaction. Existing built-in skills show as Included.
Source failures retain the external preview link and never claim an import
succeeded. Imported text and resources are available through `skill_read`.

Use the production Compose file with its Docker sandbox overlay for the beta.
Keep its database and app volumes on the new host. The deployment environment
must supply fresh auth, database and encryption secrets and the shared model
key; none belong in a release archive. See [self-hosting](./self-host.md).

Build the shared application image once before starting the services. This
avoids concurrent exports of the same image tag on a fresh Docker host:

```sh
COMPOSE_PARALLEL_LIMIT=1 docker compose --env-file .env \
  -f infra/compose/docker-compose.prod.yml \
  -f infra/compose/docker-compose.prod.docker.yml build computer api
docker compose --env-file .env \
  -f infra/compose/docker-compose.prod.yml \
  -f infra/compose/docker-compose.prod.docker.yml up -d --no-build --pull never --wait
```

Run `pnpm --filter @rakazo/web intl:extract` before releasing new UI copy. A
development render can show source messages that are absent from production
catalogs, so verify the production browser flow as well as the API.
