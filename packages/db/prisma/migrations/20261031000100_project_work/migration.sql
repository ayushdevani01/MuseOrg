-- Additive project metadata. Previous releases keep using Tasks/Runs/ExternalEffect.
CREATE TABLE "work_projects" (
  "id" TEXT PRIMARY KEY,
  "spaceId" TEXT NOT NULL REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "facts" JSONB NOT NULL DEFAULT '{}',
  "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision" > 0),
  "botIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'archived')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("id", "spaceId", "userId")
);
CREATE INDEX "work_projects_spaceId_userId_idx" ON "work_projects"("spaceId", "userId");
CREATE INDEX "work_projects_botIds_idx" ON "work_projects" USING GIN ("botIds");

CREATE TABLE "work_project_revisions" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "spec" JSONB NOT NULL,
  "changedKeys" TEXT[] NOT NULL,
  "sourceMessageId" TEXT,
  "sourceRunId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId", "revision"),
  FOREIGN KEY ("projectId", "spaceId", "userId") REFERENCES "work_projects"("id", "spaceId", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "work_project_revisions_spaceId_userId_idx" ON "work_project_revisions"("spaceId", "userId");

CREATE TABLE "work_project_outputs" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "botId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "inputKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reference" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'current',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId", "key", "revision"),
  FOREIGN KEY ("projectId", "spaceId", "userId") REFERENCES "work_projects"("id", "spaceId", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "work_project_outputs_spaceId_userId_idx" ON "work_project_outputs"("spaceId", "userId");

CREATE TABLE "work_scope_grants" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "account" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "operations" TEXT[] NOT NULL,
  "botIds" TEXT[] NOT NULL,
  "allowedPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "budgetLimitCents" INTEGER NOT NULL DEFAULT 0 CHECK ("budgetLimitCents" >= 0),
  "reservedCents" INTEGER NOT NULL DEFAULT 0 CHECK ("reservedCents" >= 0),
  "spentCents" INTEGER NOT NULL DEFAULT 0 CHECK ("spentCents" >= 0),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ("reservedCents" + "spentCents" <= "budgetLimitCents"),
  FOREIGN KEY ("projectId", "spaceId", "userId") REFERENCES "work_projects"("id", "spaceId", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "work_scope_grants_spaceId_userId_idx" ON "work_scope_grants"("spaceId", "userId");
CREATE INDEX "work_scope_grants_projectId_revokedAt_idx" ON "work_scope_grants"("projectId", "revokedAt");

CREATE TABLE "work_project_runs" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT NOT NULL REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "revision" INTEGER NOT NULL,
  "inputKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId", "runId"),
  FOREIGN KEY ("projectId", "spaceId", "userId") REFERENCES "work_projects"("id", "spaceId", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "work_project_runs_spaceId_userId_idx" ON "work_project_runs"("spaceId", "userId");

DO $$
DECLARE project_table TEXT;
BEGIN
  FOREACH project_table IN ARRAY ARRAY['work_projects', 'work_project_revisions', 'work_project_outputs', 'work_scope_grants', 'work_project_runs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', project_table);
    EXECUTE format('CREATE POLICY tenant ON %I USING ("spaceId" = NULLIF(current_setting(''app.space_id'', true), '''') AND "userId" = NULLIF(current_setting(''app.user_id'', true), ''''))', project_table);
    EXECUTE format('CREATE POLICY system ON %I USING (current_setting(''app.rls_bypass'', true) = ''on'')', project_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO rakazo_app', project_table);
  END LOOP;
END $$;
