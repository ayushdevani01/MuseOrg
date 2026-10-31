import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { productSkill, productSkillResource } from "./product-skills.js";
import { skillReadFromTool, skillUpdateFromTool } from "./skill-tools.js";

const owner = { spaceId: "space-fixture", userId: "user-fixture" };
const prisma = { agentSkill: { findMany: async () => [] } };

describe("versioned product skills", () => {
  it("keeps the runtime catalog synchronized with reviewed source bundles", () => {
    expect(() =>
      execFileSync(process.execPath, ["scripts/generate-agent-skills.mjs", "--check"]),
    ).not.toThrow();
  });

  it("loads an immutable selected resource with a matching content digest", async () => {
    const result = await skillReadFromTool(prisma as never, owner, {
      name: "webapp-testing",
      resource: "scripts/check_url.py",
    });
    expect(result).toMatchObject({ source: "builtin", readOnly: true });
    expect(createHash("sha256").update(String(result.content)).digest("hex")).toBe(result.sha256);
    expect(result.version).toBe(productSkill("webapp-testing")!.version);
    expect(
      await skillUpdateFromTool(prisma as never, owner, {
        name: "webapp-testing",
        body: "unreviewed replacement",
      }),
    ).toHaveProperty("error");
  });

  it.each([
    "../LICENSE.txt",
    "/etc/passwd",
    "scripts/../../secret",
    "scripts\\check_url.py",
    "__proto__",
    "scripts//check_url.py",
    "scripts/%2e%2e/secret",
  ])("cannot resolve an unlisted resource %s", (resource) => {
    expect(productSkillResource("webapp-testing", resource)).toBeUndefined();
  });
});
