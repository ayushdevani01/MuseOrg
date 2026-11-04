import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "./client.js";
import { createDb } from "./client.js";
import { assignMcpServerToBots } from "./mcp-default-access.js";
import { provisionMessagingIdentity } from "./messaging.js";
import { createRepos } from "./repos.js";
import { asSystem, runAsSystem, runAsTenant } from "./row-security.js";
import { IsolationError } from "./scope.js";

const databaseUrl = process.env.DATABASE_URL;
const postgres = process.env.VERIFY_DATABASE && databaseUrl ? describe.sequential : describe.skip;

postgres("default MCP access (PostgreSQL)", () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const identities = [`mcp-default-a-${suffix}`, `mcp-default-b-${suffix}`];
  let prisma: PrismaClient;
  let close: () => Promise<void>;
  let owner: { spaceId: string; userId: string };
  let stranger: { spaceId: string; userId: string };
  const actor = () => ({ ...owner, email: "fixture@example.test", isDeploymentOwner: false });
  const createBot = (name: string) =>
    createRepos(prisma).createBot(actor(), {
      name,
      title: "",
      description: "",
      instructions: "",
      notifyOnFinish: false,
    });

  beforeAll(async () => {
    const db = createDb(databaseUrl!);
    prisma = db.prisma;
    close = async () => {
      await db.prisma.$disconnect();
      await db.pool.end();
    };
    const fixtures = await runAsSystem("MCP defaults fixtures", async () =>
      Promise.all(
        identities.map((address) =>
          provisionMessagingIdentity(
            prisma,
            { provider: "slack", address },
            { signupsEnabled: undefined, signupAllowlist: undefined },
          ),
        ),
      ),
    );
    owner = { userId: fixtures[0]!.userId, spaceId: fixtures[0]!.spaceId };
    stranger = { userId: fixtures[1]!.userId, spaceId: fixtures[1]!.spaceId };
  });
  afterAll(async () => {
    if (prisma && owner && stranger) {
      const system = asSystem(prisma);
      await system.messagingIdentity.deleteMany({
        where: { provider: "slack", address: { in: identities } },
      });
      await system.organization.deleteMany({
        where: { id: { in: [owner.spaceId, stranger.spaceId] } },
      });
      await system.user.deleteMany({ where: { id: { in: [owner.userId, stranger.userId] } } });
    }
    await close?.();
  });

  it("assigns a new server to existing employees except explicit exclusions", async () => {
    await runAsTenant(owner, async () => {
      const first = await createBot("Included");
      const excluded = await createBot("Excluded");
      const server = await prisma.$transaction(async (tx) => {
        const server = await tx.mcpServer.create({
          data: {
            ...owner,
            slug: "shared",
            name: "Shared fixture",
            transport: "streamable_http",
            endpoint: "https://mcp.example.test",
            defaultForBots: true,
          },
        });
        await assignMcpServerToBots(tx, owner, server.id, [excluded.id]);
        return server;
      });
      expect(
        await prisma.botMcpServer.count({ where: { serverId: server.id, botId: first.id } }),
      ).toBe(1);
      expect(
        await prisma.botMcpServer.count({ where: { serverId: server.id, botId: excluded.id } }),
      ).toBe(0);
      await prisma.mcpServer.update({
        where: { id: server.id },
        data: { revision: { increment: 1 } },
      });
      const later = await createBot("Hired later");
      expect(
        await prisma.botMcpServer.count({ where: { serverId: server.id, botId: later.id } }),
      ).toBe(1);
      expect(
        await prisma.botMcpServer.count({ where: { serverId: server.id, botId: excluded.id } }),
      ).toBe(0);
    });
  });

  it("does not inherit pending imports or another owner's server", async () => {
    await runAsSystem("MCP pending and foreign fixtures", async () => {
      const space = await prisma.space.findUniqueOrThrow({ where: { id: owner.spaceId } });
      const otherSpaceId = `mcp-other-space-${suffix}`;
      await prisma.space.create({
        data: {
          id: otherSpaceId,
          organizationId: space.organizationId,
          name: "Other workspace",
          createdByUserId: owner.userId,
        },
      });
      await prisma.spaceMember.create({
        data: {
          id: otherSpaceId,
          spaceId: otherSpaceId,
          organizationId: space.organizationId,
          userId: owner.userId,
          createdAt: new Date(),
        },
      });
      for (const [scope, slug, shared] of [
        [owner, "pending", false],
        [stranger, "foreign", true],
        [{ userId: owner.userId, spaceId: otherSpaceId }, "other-space", true],
      ] as const)
        await prisma.mcpServer.create({
          data: {
            ...scope,
            slug,
            name: slug,
            transport: "streamable_http",
            endpoint: "https://mcp.example.test",
            defaultForBots: shared,
          },
        });
    });
    await runAsTenant(owner, async () => {
      const bot = await createBot("Scoped employee");
      const rows = await prisma.botMcpServer.findMany({
        where: { botId: bot.id },
        include: { server: true },
      });
      expect(rows.map((row) => row.server.slug)).toEqual(["shared"]);
      expect(
        rows.every((row) => row.userId === owner.userId && row.spaceId === owner.spaceId),
      ).toBe(true);
    });
  });

  it("rejects an exclusion for an employee outside the owner scope", async () => {
    await runAsTenant(owner, async () => {
      const server = await prisma.mcpServer.findFirstOrThrow({
        where: { ...owner, slug: "shared" },
      });
      await expect(
        prisma.$transaction((tx) =>
          assignMcpServerToBots(tx, owner, server.id, ["foreign-employee"]),
        ),
      ).rejects.toThrow(IsolationError);
    });
  });
});
