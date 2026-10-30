import type { CoworkerTemplate } from "@rakazo/core";
import type { RpcClient } from "./rpc";

/** Idempotent even when another tab wins a create or a previous hire partly completed. */
export async function hireOnboardingCoworker(
  client: Pick<RpcClient, "bots">,
  template: CoworkerTemplate,
  model: { provider: string; id: string },
): Promise<{ id: string }> {
  const spawnKey = `museorg:onboarding:${template.id}`;
  let bot = (await client.bots.list()).find((entry) => entry.spawnKey === spawnKey);
  if (!bot) {
    try {
      bot = await client.bots.create({
        name: template.name,
        title: template.title,
        description: template.description,
        instructions: template.instructions,
        notifyOnFinish: true,
        spawnKey,
        modelProvider: model.provider,
        modelId: model.id,
      });
    } catch (error) {
      bot = (await client.bots.list()).find((entry) => entry.spawnKey === spawnKey);
      if (!bot) throw error;
    }
  }
  // Repair a profile created by an earlier version before model assignment was atomic.
  if (bot.modelProvider !== model.provider || bot.modelId !== model.id) {
    await client.bots.update({ botId: bot.id, modelProvider: model.provider, modelId: model.id });
  }
  return { id: bot.id };
}
