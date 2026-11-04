import type { Prisma } from "./client.js";
import { IsolationError } from "./scope.js";

type Owner = { spaceId: string; userId: string };

/** Only creation/first approval calls this; edits must preserve explicit exclusions. */
export async function assignMcpServerToBots(
  tx: Prisma.TransactionClient,
  owner: Owner,
  serverId: string,
  excludedBotIds: string[] = [],
) {
  const scope = { spaceId: owner.spaceId, userId: owner.userId };
  const server = await tx.mcpServer.findFirst({
    where: { ...scope, id: serverId },
    select: { id: true },
  });
  if (!server) throw new IsolationError();
  const bots = await tx.bot.findMany({ where: scope, select: { id: true } });
  const owned = new Set(bots.map((bot) => bot.id));
  if (excludedBotIds.some((id) => !owned.has(id))) throw new IsolationError();
  const excluded = new Set(excludedBotIds);
  const data = bots
    .filter((bot) => !excluded.has(bot.id))
    .map((bot) => ({ ...scope, botId: bot.id, serverId, allowAllTools: true }));
  if (data.length) await tx.botMcpServer.createMany({ data, skipDuplicates: true });
}

export async function inheritDefaultMcpServers(
  tx: Prisma.TransactionClient,
  owner: Owner,
  botId: string,
) {
  const scope = { spaceId: owner.spaceId, userId: owner.userId };
  const servers = await tx.mcpServer.findMany({
    where: { ...scope, defaultForBots: true },
    select: { id: true },
  });
  if (servers.length)
    await tx.botMcpServer.createMany({
      data: servers.map((server) => ({
        ...scope,
        botId,
        serverId: server.id,
        allowAllTools: true,
      })),
      skipDuplicates: true,
    });
}
