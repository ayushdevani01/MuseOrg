import { ORPCError } from "@orpc/server";
import type { Actor } from "@rakazo/contracts";
import { COWORKER_TEMPLATES } from "@rakazo/core";
import type { createRepos } from "@rakazo/db";

type TeamRepos = Pick<ReturnType<typeof createRepos>, "listBots" | "createBot">;

/** Retry a partially hired team without duplicating coworkers or pinning another model. */
export async function hireOnboardingCoworkers(
  repos: TeamRepos,
  actor: Actor,
  templateIds: string[],
  setup: { needsModel: boolean },
): Promise<string[]> {
  if (setup.needsModel)
    throw new ORPCError("PRECONDITION_FAILED", { message: "Connect a model first" });
  const templates = [...new Set(templateIds)].map((id) => {
    const template = COWORKER_TEMPLATES.find((entry) => entry.id === id);
    if (!template) throw new ORPCError("BAD_REQUEST", { message: "Unknown coworker role" });
    return template;
  });
  const existing = await repos.listBots(actor);
  const ids: string[] = [];
  for (const template of templates) {
    const spawnKey = `museorg:onboarding:${template.id}`;
    let bot = existing.find((entry) => entry.spawnKey === spawnKey);
    if (!bot) {
      try {
        bot = await repos.createBot(actor, {
          name: template.name,
          title: template.title,
          description: template.description,
          instructions: template.instructions,
          notifyOnFinish: true,
          computerMode: "team",
          spawnKey,
        });
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "P2002"))
          throw error;
        bot = (await repos.listBots(actor)).find((entry) => entry.spawnKey === spawnKey);
        if (!bot) throw error;
      }
    }
    ids.push(bot.id);
  }
  return ids;
}
