import type { Actor } from "@rakazo/contracts";
import type { createRepos } from "@rakazo/db";
import { describe, expect, it, vi } from "vitest";
import { hireOnboardingCoworkers } from "./onboarding-coworkers.js";

type TeamRepos = Pick<ReturnType<typeof createRepos>, "listBots" | "createBot">;
const actor = { userId: "owner", spaceId: "space", organizationId: "org" } as Actor;
const roles = ["chief", "engineer", "creative", "growth"];
function fixture() {
  const rows: Array<{ id: string; spawnKey: string }> = [];
  const listBots = vi.fn(async () => [...rows]);
  const createBot = vi.fn(async (_actor, input) => {
    const bot = { id: input.spawnKey, ...input };
    rows.push(bot);
    return bot;
  });
  return { rows, listBots, createBot, repos: { listBots, createBot } as unknown as TeamRepos };
}
describe("starter team", () => {
  it("rejects unavailable models and unknown roles before creating any coworker", async () => {
    const f = fixture();
    await expect(
      hireOnboardingCoworkers(f.repos, actor, roles, { needsModel: true }),
    ).rejects.toThrow("Connect a model first");
    await expect(
      hireOnboardingCoworkers(f.repos, actor, ["chief", "unknown"], { needsModel: false }),
    ).rejects.toThrow("Unknown coworker role");
    expect(f.createBot).not.toHaveBeenCalled();
  });
  it("hires the four roles on the shared computer without pinning a provider or model", async () => {
    const f = fixture();
    const ids = await hireOnboardingCoworkers(f.repos, actor, roles, { needsModel: false });
    expect(ids).toHaveLength(4);
    expect(f.createBot.mock.calls.map(([, input]) => input.title)).toEqual([
      "Chief of Staff",
      "Staff Engineer",
      "Creative Director",
      "Meta Growth Operator",
    ]);
    for (const [owner, input] of f.createBot.mock.calls) {
      expect(owner).toBe(actor);
      expect(input.computerMode).toBe("team");
      expect(input).not.toHaveProperty("modelProvider");
      expect(input).not.toHaveProperty("modelId");
    }
    expect(await hireOnboardingCoworkers(f.repos, actor, roles, { needsModel: false })).toEqual(
      ids,
    );
    expect(f.createBot).toHaveBeenCalledTimes(4);
  });
  it("recovers a partial hire and a concurrent unique-key winner", async () => {
    const f = fixture();
    f.rows.push({ id: "existing-chief", spawnKey: "museorg:onboarding:chief" });
    f.createBot.mockImplementationOnce(async (_actor, input) => {
      f.rows.push({ id: "concurrent-engineer", spawnKey: input.spawnKey });
      throw Object.assign(new Error("unique"), { code: "P2002" });
    });
    const ids = await hireOnboardingCoworkers(f.repos, actor, ["chief", "engineer"], {
      needsModel: false,
    });
    expect(ids).toEqual(["existing-chief", "concurrent-engineer"]);
    expect(f.createBot).toHaveBeenCalledOnce();
  });
});
