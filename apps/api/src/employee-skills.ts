import { ORPCError } from "@orpc/server";
import type { SkillCatalogProvider } from "@rakazo/adapter-kit";
import { SkillCatalogError } from "@rakazo/adapter-kit";
import { BUILTIN_AGENT_SKILLS } from "@rakazo/adapters";
import type { Actor, SkillBundle, SkillImportSelection } from "@rakazo/contracts";
import { importedSkillContent, importedSkillDetails } from "@rakazo/core";
import type { Prisma } from "@rakazo/db";

export async function catalogResult<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw new ORPCError("BAD_GATEWAY", {
      message:
        error instanceof SkillCatalogError
          ? error.message
          : "Skill source unavailable. Try again later.",
    });
  }
}

export async function prepareEmployeeSkills(
  catalog: SkillCatalogProvider | undefined,
  selections: SkillImportSelection[],
  signal?: AbortSignal,
) {
  if (!selections.length) return [];
  if (!catalog)
    throw new ORPCError("SERVICE_UNAVAILABLE", { message: "Skill discovery is unavailable." });
  const bundles: Array<Pick<SkillBundle, "name" | "description" | "sha256" | "content">> = [];
  for (const selection of selections) {
    const bundle = await catalogResult(() => catalog.load(selection, signal));
    if (bundle.sha256 !== selection.sha256 || bundle.revision !== selection.revision) {
      throw new ORPCError("CONFLICT", {
        message: "Skill content changed. Preview it again before importing.",
      });
    }
    if (
      BUILTIN_AGENT_SKILLS.some(
        (skill) => skill.name.toLowerCase() === bundle.name.toLowerCase(),
      ) ||
      bundles.some((skill) => skill.name.toLowerCase() === bundle.name.toLowerCase())
    ) {
      throw new ORPCError("CONFLICT", { message: "A skill with that name is already included." });
    }
    bundles.push({
      name: bundle.name,
      description: bundle.description,
      sha256: bundle.sha256,
      content: importedSkillContent(bundle),
    });
  }
  return bundles;
}

/** Called by the existing bot-creation transaction: either employee and skills persist, or neither. */
export async function seedEmployeeSkills(
  tx: Prisma.TransactionClient,
  actor: Actor,
  skills: Awaited<ReturnType<typeof prepareEmployeeSkills>>,
) {
  for (const skill of skills) {
    const existing = await tx.agentSkill.findFirst({
      where: {
        userId: actor.userId,
        spaceId: actor.spaceId,
        name: { equals: skill.name, mode: "insensitive" },
      },
    });
    if (existing) {
      if (
        importedSkillDetails(existing.content)?.sha256 !== skill.sha256 ||
        existing.content !== skill.content
      ) {
        throw new ORPCError("CONFLICT", {
          message: "A different skill with that name already exists.",
        });
      }
      continue;
    }
    await tx.agentSkill.create({
      data: {
        spaceId: actor.spaceId,
        userId: actor.userId,
        name: skill.name,
        description: skill.description,
        content: skill.content,
        source: "user",
      },
    });
  }
}
