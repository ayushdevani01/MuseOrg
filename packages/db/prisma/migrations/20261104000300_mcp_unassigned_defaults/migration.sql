-- A manually saved server with no old assignments also gets the new default.
-- Keep imported definitions waiting for approval, and do not re-add exclusions
-- on servers whose default sharing has already been established.
WITH newly_shared AS (
  UPDATE "mcp_servers" s SET "defaultForBots" = true
  WHERE NOT s."defaultForBots"
    AND NOT EXISTS (
      SELECT 1 FROM "agent_imports" i
      WHERE i."spaceId" = s."spaceId" AND i."userId" = s."userId"
        AND i.created @> jsonb_build_object(
          'mcpServers', jsonb_build_array(jsonb_build_object('id', s.id))
        )
    )
  RETURNING s.id, s."spaceId", s."userId"
)
INSERT INTO "bot_mcp_servers"
  (id, "spaceId", "userId", "botId", "serverId", "allowAllTools", "allowedTools", "updatedAt")
SELECT gen_random_uuid()::text, s."spaceId", s."userId", b.id, s.id, true, '[]'::jsonb, CURRENT_TIMESTAMP
FROM newly_shared s
JOIN bots b ON b."spaceId" = s."spaceId" AND b."userId" = s."userId"
ON CONFLICT ("botId", "serverId") DO NOTHING;
