import type { ProjectActionInput } from "@rakazo/contracts";
import { describe, expect, it } from "vitest";
import {
  applyProjectPatch,
  permittedProjectPath,
  projectActionRefusal,
  projectOutputAffected,
  workGrantRefusal,
} from "./project-work.js";

const intent: ProjectActionInput = {
  projectId: "project",
  revision: 2,
  operation: "repository.propose",
  provider: "fixture",
  account: "account",
  resource: "repository",
  payload: { files: [] },
  budgetCents: 25,
  expectedHead: "a".repeat(40),
};
const now = new Date("2026-01-01T00:00:00Z");
const grant = {
  id: "scope",
  projectId: "project",
  provider: "fixture",
  account: "account",
  resource: "repository",
  operations: ["repository.propose"],
  botIds: ["engineer"],
  allowedPaths: ["site/"],
  budgetLimitCents: 100,
  reservedCents: 50,
  spentCents: 25,
  expiresAt: new Date("2026-01-02T00:00:00Z"),
  revokedAt: null,
};

describe("shared project contracts", () => {
  it("patches selected facts and invalidates only affected structured dependencies", () => {
    const result = applyProjectPatch(
      { goal: "launch", facts: { offer: 20, locale: "en" } },
      { facts: { offer: 30 } },
    );
    expect(result.spec).toEqual({ goal: "launch", facts: { offer: 30, locale: "en" } });
    expect(result.changedKeys).toEqual(["facts.offer"]);
    expect(projectOutputAffected(["facts.offer"], result.changedKeys)).toBe(true);
    expect(projectOutputAffected(["facts.locale"], result.changedKeys)).toBe(false);
    expect(projectOutputAffected([], result.changedKeys)).toBe(true);
    expect(applyProjectPatch(result.spec, { facts: { offer: 30 } }).changedKeys).toEqual([]);
  });

  it("rejects stale, paused, unassigned and unbound merge operations", () => {
    const current = {
      currentRevision: 2,
      status: "active",
      botIds: ["engineer"],
      botId: "engineer",
      intent,
    };
    expect(projectActionRefusal(current)).toBeUndefined();
    for (const change of [
      { currentRevision: 3 },
      { status: "paused" },
      { botId: "other" },
      { intent: { ...intent, operation: "repository.merge" as const, expectedHead: undefined } },
    ]) {
      expect(projectActionRefusal({ ...current, ...change })).toBeDefined();
    }
  });

  it("binds scopes to exact targets, coworker, operation, expiry and aggregate budget", () => {
    expect(workGrantRefusal(intent, "engineer", grant, now)).toBeUndefined();
    for (const change of [
      { account: "other" },
      { resource: "other" },
      { provider: "other" },
      { projectId: "other" },
      { budgetCents: 26 },
      { operation: "repository.merge" as const },
    ]) {
      expect(workGrantRefusal({ ...intent, ...change }, "engineer", grant, now)).toBeDefined();
    }
    expect(workGrantRefusal(intent, "other", grant, now)).toBeDefined();
    expect(workGrantRefusal(intent, "engineer", { ...grant, revokedAt: now }, now)).toBeDefined();
    expect(workGrantRefusal(intent, "engineer", grant, grant.expiresAt)).toBeDefined();
  });

  it.each([
    "../site/a",
    "/site/a",
    "site/../a",
    "site\\a",
    ".github/workflows/check.yml",
    "site/.env.local",
    "site/AGENTS.md",
    "site/.git/config",
  ])("denies an escaping or protected path %s", (path) => {
    expect(permittedProjectPath(path, ["site/", ".github/"])).toBe(false);
  });
  it("accepts exact files and bounded directories", () => {
    expect(permittedProjectPath("site/app.js", ["site/"])).toBe(true);
    expect(permittedProjectPath("site-other/app.js", ["site/"])).toBe(false);
    expect(permittedProjectPath("README.md", ["README.md"])).toBe(true);
  });
});
