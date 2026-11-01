import type { SkillCatalogProvider } from "@rakazo/adapter-kit";
import { SkillCatalogError } from "@rakazo/adapter-kit";
import type { SkillBundle } from "@rakazo/contracts";
import { describe, expect, it, vi } from "vitest";
import { catalogResult, prepareEmployeeSkills, seedEmployeeSkills } from "./employee-skills.js";

const bundle: SkillBundle = {
  source: "example/skills",
  key: "fixture",
  name: "fixture",
  description: "A fixture",
  revision: "a".repeat(40),
  sha256: "b".repeat(64),
  url: "https://skills.sh/example/skills/fixture",
  content: "---\nname: fixture\ndescription: A fixture\n---\n\nInspect the fixture.\n",
  resources: {},
};
const selection = {
  source: bundle.source,
  key: bundle.key,
  revision: bundle.revision,
  sha256: bundle.sha256,
};
const provider: SkillCatalogProvider = { search: async () => [], load: async () => bundle };
describe("employee skill preparation", () => {
  it("shows public catalog errors and hides unknown provider internals", async () => {
    await expect(
      catalogResult(async () => {
        throw new SkillCatalogError("Bundle is too large");
      }),
    ).rejects.toThrow("Bundle is too large");
    await expect(
      catalogResult(async () => {
        throw new Error("Private provider internals");
      }),
    ).rejects.toThrow("Skill source unavailable");
  });
  it("needs no catalog for ordinary creation and fails honestly when discovery is absent", async () => {
    expect(await prepareEmployeeSkills(undefined, [])).toEqual([]);
    await expect(prepareEmployeeSkills(undefined, [selection])).rejects.toThrow("unavailable");
  });
  it("refuses content that differs from the selected preview", async () => {
    await expect(
      prepareEmployeeSkills(provider, [{ ...selection, sha256: "c".repeat(64) }]),
    ).rejects.toThrow("changed");
  });
  it("writes only owned imported content through the supplied creation transaction", async () => {
    const skills = await prepareEmployeeSkills(provider, [selection]);
    const create = vi.fn();
    const findFirst = vi.fn(async () => null);
    await seedEmployeeSkills(
      { agentSkill: { findFirst, create } } as never,
      { userId: "owner", spaceId: "space" } as never,
      skills,
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "owner",
        spaceId: "space",
        name: "fixture",
        source: "user",
      }),
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: "owner", spaceId: "space" }),
    });
  });
  it("does not overwrite an existing recipe with the same name", async () => {
    const skills = await prepareEmployeeSkills(provider, [selection]);
    const create = vi.fn();
    const findFirst = vi.fn(async () => ({ content: "unrelated local recipe" }));
    await expect(
      seedEmployeeSkills({ agentSkill: { findFirst, create } } as never, {} as never, skills),
    ).rejects.toThrow("different skill");
    expect(create).not.toHaveBeenCalled();
  });
  it("refuses an edited local copy even if it retains the original import digest", async () => {
    const skills = await prepareEmployeeSkills(provider, [selection]);
    const create = vi.fn();
    const findFirst = vi.fn(async () => ({ content: `${skills[0]!.content}\nLocal edit` }));
    await expect(
      seedEmployeeSkills({ agentSkill: { findFirst, create } } as never, {} as never, skills),
    ).rejects.toThrow("different skill");
    expect(create).not.toHaveBeenCalled();
  });
});
