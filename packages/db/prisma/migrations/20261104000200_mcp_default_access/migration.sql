-- Existing assignments establish approval. Unapproved imported definitions stay inert.
ALTER TABLE "mcp_servers" ADD COLUMN "defaultForBots" BOOLEAN NOT NULL DEFAULT false;
UPDATE "mcp_servers" s SET "defaultForBots" = true
WHERE EXISTS (SELECT 1 FROM "bot_mcp_servers" a WHERE a."serverId" = s.id);
ALTER TABLE "mcp_servers" ALTER COLUMN "defaultForBots" SET DEFAULT true;

-- Keep existing per-tool restrictions. The new default applies to other employees.
INSERT INTO "bot_mcp_servers"
  (id, "spaceId", "userId", "botId", "serverId", "allowAllTools", "allowedTools", "updatedAt")
SELECT gen_random_uuid()::text, s."spaceId", s."userId", b.id, s.id, true, '[]'::jsonb, CURRENT_TIMESTAMP
FROM "mcp_servers" s
JOIN bots b ON b."spaceId" = s."spaceId" AND b."userId" = s."userId"
WHERE s."defaultForBots"
ON CONFLICT ("botId", "serverId") DO NOTHING;
