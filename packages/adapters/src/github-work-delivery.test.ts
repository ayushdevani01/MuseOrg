import { createHash } from "node:crypto";
import type { WorkDeliveryContext } from "@rakazo/adapter-kit";
import type { ProjectActionInput } from "@rakazo/contracts";
import { describe, expect, it, vi } from "vitest";
import type { GitHubWorkApi } from "./github-work-delivery.js";
import { GitHubWorkDelivery } from "./github-work-delivery.js";

const head = "a".repeat(40);
const binding = {
  kind: "github-cli" as const,
  userId: "member",
  spaceId: "space",
  account: "fixture",
  resource: "fixture/demo",
  requiredChecks: ["Repair check"],
};
const context: WorkDeliveryContext = {
  userId: "member",
  spaceId: "space",
  botId: "engineer",
  runId: "run",
  intentKey: "intent",
  operationId: "op",
  traceId: "trace",
  signal: new AbortController().signal,
  allowedPaths: ["site/"],
};
const action: ProjectActionInput = {
  projectId: "project",
  revision: 1,
  provider: "github",
  account: "fixture",
  resource: "fixture/demo",
  operation: "repository.merge",
  payload: { pullNumber: 1 },
  expectedHead: head,
  budgetCents: 0,
  grantId: "scope",
};
function fixture(
  change: {
    head?: string;
    check?: string;
    checkHead?: string;
    files?: string[];
    unresolved?: boolean;
    account?: string;
  } = {},
) {
  const writes: string[] = [];
  const api = vi.fn<GitHubWorkApi>(async (method, path) => {
    if (method !== "GET") writes.push(path);
    if (path === "user") return { login: change.account ?? "fixture" };
    if (path.endsWith("/pulls/1/merge")) return { merged: true, sha: "b".repeat(40) };
    if (path.endsWith("/pulls/1"))
      return {
        number: 1,
        state: "open",
        draft: false,
        merged: false,
        mergeable_state: "clean",
        changed_files: (change.files ?? ["site/index.html"]).length,
        head: { sha: change.head ?? head, repo: { full_name: "fixture/demo" } },
        base: { repo: { full_name: "fixture/demo" } },
        html_url: "https://github.com/fixture/demo/pull/1",
      };
    if (path.includes("/files?"))
      return (change.files ?? ["site/index.html"]).map((filename) => ({ filename }));
    if (path.includes("/check-runs?"))
      return {
        total_count: 1,
        check_runs: [
          {
            name: "Repair check",
            head_sha: change.checkHead ?? head,
            status: "completed",
            conclusion: change.check ?? "success",
          },
        ],
      };
    if (path.includes("/status?")) return { statuses: [] };
    if (path.includes("/reviews?")) return [];
    if (path === "graphql")
      return {
        data: {
          repository: {
            pullRequest: {
              reviewDecision: null,
              reviewThreads: {
                pageInfo: { hasNextPage: false },
                nodes: [{ isResolved: !change.unresolved }],
              },
            },
          },
        },
      };
    throw new Error(`Unexpected fixture route: ${path}`);
  });
  return { api, writes, provider: new GitHubWorkDelivery([binding], api) };
}

describe("trusted GitHub work delivery conformance", () => {
  it("isolates tenant/account/resource and does not reveal another tenant's connection", async () => {
    const { provider, api } = fixture();
    expect(await provider.connections({ ...context, userId: "other" })).toEqual([]);
    for (const altered of [{ userId: "other" }, { spaceId: "other" }])
      await expect(provider.execute(action, { ...context, ...altered })).rejects.toThrow(
        "not connected",
      );
    for (const altered of [
      { account: "other" },
      { resource: "fixture/other" },
      { operation: "ads.activate" as const },
    ])
      await expect(provider.execute({ ...action, ...altered }, context)).rejects.toThrow(
        "not connected",
      );
    expect(api).not.toHaveBeenCalled();
  });
  it.each([
    { head: "c".repeat(40) },
    { checkHead: "c".repeat(40) },
    { check: "failure" },
    { check: "skipped" },
    { files: [".github/workflows/check.yml"] },
    { files: ["tests/test.py"] },
    { unresolved: true },
    { account: "other" },
  ])(
    "refuses a merge without exact passing checks, allowed files, reviews and account: %j",
    async (change) => {
      const { provider, writes } = fixture(change);
      await expect(provider.execute(action, context)).rejects.toThrow();
      expect(writes.filter((p) => p.endsWith("/merge"))).toEqual([]);
    },
  );
  it("merges only the frozen head and returns the actual merge receipt", async () => {
    const { provider, api } = fixture();
    const result = await provider.execute(action, context);
    expect(api).toHaveBeenLastCalledWith(
      "PUT",
      "repos/fixture/demo/pulls/1/merge",
      { sha: head, merge_method: "merge" },
      context.signal,
    );
    expect(result).toMatchObject({
      head,
      mergeSha: "b".repeat(40),
      actualCostCents: 0,
      operation: "repository.merge",
    });
  });
  it("rejects path escapes and policy/workflow modifications before any remote write", async () => {
    const { provider, api } = fixture();
    for (const path of [
      "../site/x",
      "site/../x",
      "site/.env.local",
      "site/AGENTS.md",
      ".github/workflows/ci.yml",
      "site/C:/x",
      "tests/test.py",
    ]) {
      await expect(
        provider.execute(
          {
            ...action,
            operation: "repository.propose",
            payload: {
              title: "Repair",
              body: "Restore the entry point",
              files: [{ path, content: "repair" }],
            },
          },
          context,
        ),
      ).rejects.toThrow();
    }
    expect(api).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    "reconciles only the frozen proposal bytes, without another write (tampered: %s)",
    async (tampered) => {
      const proposedHead = "b".repeat(40);
      const content = "repair";
      const sha = createHash("sha1")
        .update(`blob ${Buffer.byteLength(content)}\0${content}`)
        .digest("hex");
      const api = vi.fn<GitHubWorkApi>(async (_method, path) => {
        if (path === "user") return { login: "fixture" };
        if (path.includes("/pulls?"))
          return [
            {
              number: 1,
              changed_files: 1,
              head: { sha: proposedHead },
              html_url: "https://github.com/fixture/demo/pull/1",
            },
          ];
        if (path.includes("/git/commits/")) return { parents: [{ sha: head }] };
        if (path.includes("/files?")) return [{ filename: "site/index.html" }];
        if (path.includes("/contents/"))
          return { type: "file", sha: tampered ? "c".repeat(40) : sha };
        throw new Error("Unexpected reconciliation read");
      });
      const provider = new GitHubWorkDelivery([binding], api);
      const receipt = await provider.reconcile(
        {
          ...action,
          operation: "repository.propose",
          payload: {
            title: "Repair",
            body: "Restore the entry point",
            files: [{ path: "site/index.html", content }],
          },
        },
        context,
      );
      if (tampered) expect(receipt).toBeUndefined();
      else expect(receipt).toMatchObject({ head: proposedHead, data: { pullNumber: 1 } });
      expect(api.mock.calls.every(([method]) => method === "GET")).toBe(true);
      expect(api.mock.calls.some(([, path]) => path.includes("head=fixture%3Amuseorg%2F"))).toBe(
        true,
      );
    },
  );
});
