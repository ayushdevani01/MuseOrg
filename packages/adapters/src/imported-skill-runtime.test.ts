import type { SkillBundle } from "@rakazo/contracts";
import { importedSkillContent } from "@rakazo/core";
import { expect, it, vi } from "vitest";
import { skillReadFromTool } from "./skill-tools.js";

it("makes imported instructions and exact resource keys available through the real runtime reader", async () => {
  const bundle: SkillBundle = {
    source: "example/skills",
    key: "fixture",
    name: "fixture",
    description: "A fixture",
    revision: "a".repeat(40),
    sha256: "b".repeat(64),
    url: "https://skills.sh/example/skills/fixture",
    content: "---\nname: fixture\ndescription: A fixture\n---\n\nRead references/check.md.\n",
    resources: { "references/check.md": "Inspect the fixture bytes.\n" },
  };
  const prisma = {
    agentSkill: {
      findMany: vi.fn(async () => [
        {
          id: "imported",
          name: bundle.name,
          description: bundle.description,
          content: importedSkillContent(bundle),
          source: "user",
        },
      ]),
    },
  };
  const owner = { userId: "owner", spaceId: "space" };
  expect(await skillReadFromTool(prisma as never, owner, { name: "fixture" })).toMatchObject({
    version: bundle.revision,
    resources: ["references/check.md"],
    provenance: { sha256: bundle.sha256 },
  });
  expect(
    await skillReadFromTool(prisma as never, owner, {
      name: "fixture",
      resource: "references/check.md",
    }),
  ).toMatchObject({ content: "Inspect the fixture bytes.\n" });
  expect(
    await skillReadFromTool(prisma as never, owner, { name: "fixture", resource: "../secret" }),
  ).toEqual({ error: "Skill resource not found." });
  expect(prisma.agentSkill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: owner }),
  );
});
