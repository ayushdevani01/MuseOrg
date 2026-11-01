import { randomUUID } from "node:crypto";
import type { ProjectActionInput } from "@rakazo/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "./client.js";
import { createDb } from "./client.js";
import { provisionMessagingIdentity } from "./messaging.js";
import { inspectWorkAction, reserveWorkAction, settleWorkAction } from "./project-actions.js";
import {
  createWorkGrant,
  createWorkProject,
  linkProjectRun,
  ownedWorkProject,
  registerProjectOutput,
  reviseWorkProject,
  revokeWorkGrant,
} from "./project-work.js";
import { asSystem, drainUnscopedDatabaseAccess, runAsSystem, runAsTenant } from "./row-security.js";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres =
  process.env.VERIFY_DATABASE === "1" && databaseUrl ? describe.sequential : describe.skip;

describePostgres("project revision and action authority (PostgreSQL)", () => {
  let prisma: PrismaClient;
  let system: PrismaClient;
  let close: () => Promise<void>;
  let owner: { userId: string; spaceId: string };
  let botId: string;
  let threadId: string;
  let runId: string;
  let projectId: string;
  let grantId: string;
  let reservedEffectId: string;
  const address = `+1555${String(Date.now()).slice(-7)}`;
  const tenant = <T>(fn: () => Promise<T>) => runAsTenant(owner, fn);
  const intent = (extra: Partial<ProjectActionInput> = {}): ProjectActionInput => ({
    projectId,
    revision: 1,
    operation: "repository.propose",
    expectedHead: "a".repeat(40),
    provider: "fixture",
    account: "fixture-account",
    resource: "fixture-repository",
    payload: { files: [] },
    budgetCents: 0,
    ...extra,
  });

  beforeAll(async () => {
    const db = createDb(databaseUrl!, { encryptContent: false });
    prisma = db.prisma;
    system = asSystem(prisma);
    close = async () => {
      await prisma.$disconnect();
      await db.pool.end();
    };
    const identity = await runAsSystem("create isolated project authority fixture", () =>
      provisionMessagingIdentity(
        prisma,
        { provider: "sendblue", address },
        { signupsEnabled: undefined, signupAllowlist: undefined },
      ),
    );
    owner = { spaceId: identity.spaceId, userId: identity.userId };
    ({ botId, threadId } = identity);
    const task = await system.task.create({
      data: { ...owner, botId, threadId, prompt: "fixture", status: "running" },
    });
    const run = await system.run.create({
      data: { ...owner, botId, threadId, taskId: task.id, trigger: "user", status: "running" },
    });
    runId = run.id;
    const project = await tenant(() =>
      createWorkProject(prisma, owner, {
        name: "Authority fixture",
        spec: { goal: "fixture", facts: { offer: 20, locale: "en" } },
        botIds: [botId],
      }),
    );
    projectId = project.id;
  });

  afterAll(async () => {
    try {
      if (owner) {
        await system.messagingIdentity.deleteMany({ where: { provider: "sendblue", address } });
        await system.organization.deleteMany({ where: { id: owner.spaceId } });
        await system.user.deleteMany({ where: { id: owner.userId } });
      }
    } finally {
      await close?.();
    }
  });

  async function effect(request: ProjectActionInput, status = "executing") {
    return tenant(() =>
      prisma.externalEffect.create({
        data: {
          spaceId: owner.spaceId,
          runId,
          kind: "project_action",
          idempotencyKey: randomUUID(),
          status,
          request,
        },
      }),
    );
  }

  it("enforces database and application ownership", async () => {
    await expect(
      runAsTenant({ spaceId: owner.spaceId, userId: "unrelated-fixture-user" }, () =>
        ownedWorkProject(
          prisma,
          { spaceId: owner.spaceId, userId: "unrelated-fixture-user" },
          projectId,
        ),
      ),
    ).rejects.toThrow();
    expect(
      await runAsTenant({ spaceId: "unrelated-fixture-space", userId: owner.userId }, () =>
        prisma.workProject.findMany({ where: { id: projectId } }),
      ),
    ).toEqual([]);
    expect(await prisma.workProject.findMany({ where: { id: projectId } })).toEqual([]);
    expect(drainUnscopedDatabaseAccess()).toHaveLength(1);
  });

  it("reserves a shared budget atomically across parallel action claims", async () => {
    const grant = await tenant(() =>
      createWorkGrant(prisma, owner, {
        projectId,
        provider: "fixture",
        account: "fixture-account",
        resource: "fixture-repository",
        operations: ["repository.propose"],
        botIds: [botId],
        allowedPaths: ["site/"],
        budgetLimitCents: 100,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }),
    );
    grantId = grant.id;
    const request = intent({ grantId, budgetCents: 60 });
    const rows = await Promise.all([effect(request), effect(request)]);
    const claims = await Promise.allSettled(
      rows.map((row) =>
        tenant(() =>
          reserveWorkAction(prisma, owner, {
            runId,
            botId,
            effectId: row.id,
            intent: request,
            exactApproval: false,
          }),
        ),
      ),
    );
    expect(claims.filter((claim) => claim.status === "fulfilled")).toHaveLength(1);
    reservedEffectId = rows[claims.findIndex((claim) => claim.status === "fulfilled")]!.id;
    expect(
      await tenant(() => prisma.workScopeGrant.findUnique({ where: { id: grantId } })),
    ).toMatchObject({ reservedCents: 60, spentCents: 0 });
  });

  it("holds uncertain reservations and settles a receipt exactly once", async () => {
    await tenant(() =>
      settleWorkAction(prisma, owner, {
        runId,
        effectId: reservedEffectId,
        status: "uncertain",
        actualCostCents: 0,
        receipt: { outcome: "timeout" },
      }),
    );
    expect(
      await tenant(() => prisma.workScopeGrant.findUnique({ where: { id: grantId } })),
    ).toMatchObject({ reservedCents: 60, spentCents: 0 });
    await expect(
      tenant(() =>
        reserveWorkAction(prisma, owner, {
          runId,
          botId,
          effectId: reservedEffectId,
          intent: intent({ grantId, budgetCents: 60 }),
          exactApproval: false,
        }),
      ),
    ).rejects.toThrow();
    for (let count = 0; count < 2; count++)
      await tenant(() =>
        settleWorkAction(prisma, owner, {
          runId,
          effectId: reservedEffectId,
          status: "completed",
          actualCostCents: 40,
          receipt: { remoteId: "fixture-receipt" },
        }),
      );
    expect(
      await tenant(() => prisma.workScopeGrant.findUnique({ where: { id: grantId } })),
    ).toMatchObject({ reservedCents: 0, spentCents: 40 });
  });

  it("refuses changed frozen payloads and missing exact approvals", async () => {
    const request = intent();
    const row = await effect(request);
    await expect(
      tenant(() =>
        reserveWorkAction(prisma, owner, {
          runId,
          botId,
          effectId: row.id,
          intent: { ...request, payload: { changed: true } },
          exactApproval: true,
        }),
      ),
    ).rejects.toThrow("frozen request");
    await expect(
      tenant(() =>
        reserveWorkAction(prisma, owner, {
          runId,
          botId,
          effectId: row.id,
          intent: request,
          exactApproval: false,
        }),
      ),
    ).rejects.toThrow("exact approval");
    await tenant(() =>
      reserveWorkAction(prisma, owner, {
        runId,
        botId,
        effectId: row.id,
        intent: request,
        exactApproval: true,
      }),
    );
    await tenant(() =>
      settleWorkAction(prisma, owner, {
        runId,
        effectId: row.id,
        status: "completed",
        actualCostCents: 0,
        receipt: { remoteId: "exact-fixture" },
      }),
    );
  });

  it("revokes future dispatch without losing prior cost accounting", async () => {
    await tenant(() => revokeWorkGrant(prisma, owner, grantId));
    await expect(
      tenant(() => inspectWorkAction(prisma, owner, botId, intent({ grantId }))),
    ).rejects.toThrow("revoked");
    expect(
      await tenant(() => prisma.workScopeGrant.findUnique({ where: { id: grantId } })),
    ).toMatchObject({ reservedCents: 0, spentCents: 40 });
  });

  it("advances one revision and invalidates dependent output and undispatched approvals", async () => {
    await tenant(() => linkProjectRun(prisma, owner, { projectId, botId, runId }));
    for (const [key, dependency] of [
      ["offer", "facts.offer"],
      ["locale", "facts.locale"],
    ]) {
      await tenant(() =>
        registerProjectOutput(prisma, owner, {
          projectId,
          botId,
          runId,
          revision: 1,
          key: key!,
          inputKeys: [dependency!],
          reference: `fixture/${key}.json`,
          sha256: "0".repeat(64),
        }),
      );
    }
    const pending = await effect(intent(), "intended");
    const result = await tenant(() =>
      reviseWorkProject(prisma, owner, {
        projectId,
        expectedRevision: 1,
        patch: { facts: { offer: 30 } },
      }),
    );
    expect(result.project.revision).toBe(2);
    expect(result.notifications).toHaveLength(1);
    const notice = await tenant(() =>
      prisma.message.findUnique({ where: { id: result.notifications![0]!.messageId } }),
    );
    expect(notice?.role).toBe("system");
    expect(
      await tenant(() => prisma.steeringMessage.count({ where: { messageId: notice!.id, runId } })),
    ).toBe(1);
    expect(result.changedKeys).toEqual(["facts.offer"]);
    const outputs = await tenant(() =>
      prisma.workProjectOutput.findMany({ where: { projectId }, orderBy: { key: "asc" } }),
    );
    expect(outputs.map((row) => [row.key, row.status])).toEqual([
      ["locale", "current"],
      ["offer", "stale"],
    ]);
    expect(
      await tenant(() => prisma.externalEffect.findUnique({ where: { id: pending.id } })),
    ).toMatchObject({ status: "superseded" });
    await expect(tenant(() => inspectWorkAction(prisma, owner, botId, intent()))).rejects.toThrow(
      "project changed",
    );
    await expect(
      tenant(() =>
        reviseWorkProject(prisma, owner, {
          projectId,
          expectedRevision: 1,
          patch: { facts: { offer: 40 } },
        }),
      ),
    ).rejects.toThrow("project changed");
    expect(await tenant(() => prisma.workProjectRevision.count({ where: { projectId } }))).toBe(2);
  });
  it("steers a held lease without starting overlapping work", async () => {
    await tenant(() => prisma.run.update({ where: { id: runId }, data: { status: "leased" } }));
    const result = await tenant(() =>
      reviseWorkProject(prisma, owner, {
        projectId,
        expectedRevision: 2,
        patch: { facts: { locale: "fr" } },
      }),
    );
    expect(result.notifications?.map((n) => n.runId)).toEqual([runId]);
    expect(await tenant(() => prisma.run.count({ where: { botId } }))).toBe(1);
    expect(
      await tenant(() =>
        ownedWorkProject(
          prisma,
          { ...owner, ...{ traceId: "ignored-request-metadata" } },
          projectId,
        ),
      ),
    ).toMatchObject({ revision: 3 });
  });
});
