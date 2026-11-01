import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  AdapterContext,
  WorkConnection,
  WorkDeliveryContext,
  WorkDeliveryProvider,
  WorkDeliveryReceipt,
} from "@rakazo/adapter-kit";
import type { ProjectActionInput } from "@rakazo/contracts";
import { permittedProjectPath } from "@rakazo/core";
import { z } from "zod";

const Binding = z.object({
  kind: z.literal("github-cli"),
  userId: z.string().min(1),
  spaceId: z.string().min(1),
  account: z.string().regex(/^[a-zA-Z0-9-]+$/),
  resource: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/),
  requiredChecks: z.array(z.string().min(1)).min(1).max(30),
});
type GitHubBinding = z.infer<typeof Binding>;
type Json = Record<string, any>;
export type GitHubWorkApi = (
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
) => Promise<any>;
const operations = [
  "repository.read",
  "repository.propose",
  "repository.merge",
  "deployment.read",
] as const;

/** Host-only CLI transport. Argument arrays and JSON stdin; never executes repository code. */
export const githubWorkCliApi: GitHubWorkApi = (method, endpoint, body, signal) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "gh",
      [
        "api",
        "--hostname",
        "github.com",
        "--method",
        method,
        endpoint,
        "-H",
        "Accept: application/vnd.github+json",
        "-H",
        "X-GitHub-Api-Version: 2026-03-10",
        ...(body === undefined ? [] : ["--input", "-"]),
      ],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"], signal, timeout: 30_000 },
    );
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data: string) => {
      output += data;
      if (output.length > 4_000_000) child.kill();
    });
    // Never include CLI diagnostics, credential metadata or submitted file contents in errors.
    child.stderr.resume();
    child.on("error", () => reject(new Error("GitHub connection is unavailable.")));
    child.on("close", (code) => {
      if (code !== 0)
        return reject(
          new Error("GitHub request failed; verify the destination before retrying a write."),
        );
      try {
        resolve(output.trim() ? JSON.parse(output) : {});
      } catch {
        reject(new Error("Invalid GitHub response."));
      }
    });
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
  });

const proposalSchema = z
  .object({
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(16000),
    files: z
      .array(z.object({ path: z.string().min(1), content: z.string().max(120000) }).strict())
      .min(1)
      .max(30),
  })
  .strict();
const pullSchema = z.object({ pullNumber: z.number().int().positive() }).strict();
const readSchema = z
  .object({
    pullNumber: z.number().int().positive().optional(),
    path: z.string().max(400).optional(),
    ref: z
      .string()
      .regex(/^[a-f0-9]{40}$/)
      .optional(),
  })
  .strict();

export class GitHubWorkDelivery implements WorkDeliveryProvider {
  constructor(
    private readonly bindings: readonly GitHubBinding[],
    private readonly api: GitHubWorkApi = githubWorkCliApi,
  ) {}
  async connections(ctx: AdapterContext): Promise<WorkConnection[]> {
    return this.bindings
      .filter((b) => b.userId === ctx.userId && b.spaceId === ctx.spaceId)
      .map((b) => ({ provider: "github", account: b.account, resource: b.resource, operations }));
  }
  private binding(intent: ProjectActionInput, ctx: AdapterContext) {
    const found = this.bindings.find(
      (b) =>
        b.userId === ctx.userId &&
        b.spaceId === ctx.spaceId &&
        intent.provider === "github" &&
        b.account === intent.account &&
        b.resource === intent.resource,
    );
    if (!found || !operations.includes(intent.operation as (typeof operations)[number]))
      throw new Error("This account, repository or operation is not connected.");
    return found;
  }
  async validate(intent: ProjectActionInput, ctx: WorkDeliveryContext) {
    this.binding(intent, ctx);
    if (intent.budgetCents !== 0)
      throw new Error("This delivery adapter supports zero-cost repository actions only.");
    if (
      ["repository.propose", "repository.merge"].includes(intent.operation) &&
      !intent.expectedHead
    )
      throw new Error("The exact repository head is required.");
    if (intent.operation === "repository.propose") {
      const proposal = proposalSchema.parse(intent.payload);
      if (new Set(proposal.files.map((f) => f.path)).size !== proposal.files.length)
        throw new Error("Duplicate file paths.");
      if (proposal.files.some((f) => !permittedProjectPath(f.path, ctx.allowedPaths)))
        throw new Error("A changed path is outside the approved scope.");
    } else if (intent.operation === "repository.merge") pullSchema.parse(intent.payload);
    else if (intent.operation === "repository.read") {
      const read = readSchema.parse(intent.payload);
      if (read.path && !permittedProjectPath(read.path, [read.path]))
        throw new Error("Protected source path.");
    } else if (Object.keys(intent.payload).length)
      throw new Error("Deployment reads take an empty payload.");
  }
  private branch(ctx: WorkDeliveryContext) {
    return `museorg/${createHash("sha256").update(ctx.intentKey).digest("hex").slice(0, 24)}`;
  }
  private async assertIdentity(binding: GitHubBinding, signal: AbortSignal) {
    const identity = await this.api("GET", "user", undefined, signal);
    if (identity.login?.toLowerCase() !== binding.account.toLowerCase())
      throw new Error("The connected GitHub account changed.");
  }
  private receipt(
    intent: ProjectActionInput,
    data: Json,
    extra: Partial<WorkDeliveryReceipt> = {},
  ): WorkDeliveryReceipt {
    return {
      status: "completed",
      provider: "github",
      operation: intent.operation,
      account: intent.account,
      resource: intent.resource,
      actualCostCents: 0,
      data,
      ...extra,
    };
  }
  async execute(
    intent: ProjectActionInput,
    ctx: WorkDeliveryContext,
  ): Promise<WorkDeliveryReceipt> {
    await this.validate(intent, ctx);
    const binding = this.binding(intent, ctx);
    const base = `repos/${binding.resource}`;
    const api = (method: "GET" | "POST" | "PUT", path: string, body?: unknown) =>
      this.api(method, `${base}/${path}`, body, ctx.signal);
    // The binding is operator-created, but a switched CLI account must still fail closed.
    await this.assertIdentity(binding, ctx.signal);
    if (intent.operation === "repository.read") {
      const input = readSchema.parse(intent.payload);
      const repo = await this.api("GET", base, undefined, ctx.signal);
      const branch = await api("GET", `branches/${encodeURIComponent(repo.default_branch)}`);
      const data: Json = { defaultBranch: repo.default_branch, head: branch.commit.sha };
      if (input.path) {
        const file = await api(
          "GET",
          `contents/${input.path.split("/").map(encodeURIComponent).join("/")}?ref=${input.ref ?? branch.commit.sha}`,
        );
        if (file.encoding !== "base64" || file.size > 120000)
          throw new Error("Source is too large or is not a file.");
        data.file = {
          path: file.path,
          sha: file.sha,
          content: Buffer.from(file.content, "base64").toString("utf8"),
        };
      }
      if (input.pullNumber) {
        const pull = await api("GET", `pulls/${input.pullNumber}`);
        const [checks, status] = await Promise.all([
          api("GET", `commits/${pull.head.sha}/check-runs?per_page=100`),
          api("GET", `commits/${pull.head.sha}/status?per_page=100`),
        ]);
        data.pull = {
          number: pull.number,
          state: pull.state,
          merged: pull.merged,
          head: pull.head.sha,
          mergeableState: pull.mergeable_state,
          url: pull.html_url,
        };
        data.checks = checks.check_runs.map((c: Json) => ({
          name: c.name,
          status: c.status,
          conclusion: c.conclusion,
          head: c.head_sha,
          url: c.html_url,
        }));
        data.statuses = status.statuses.map((s: Json) => ({
          name: s.context,
          state: s.state,
          url: s.target_url,
        }));
        const reviews = await api("GET", `pulls/${input.pullNumber}/reviews?per_page=100`);
        const threads = await this.api(
          "POST",
          "graphql",
          {
            query:
              "query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewDecision reviewThreads(first:100){pageInfo{hasNextPage} nodes{isResolved}}}}}",
            variables: {
              owner: binding.resource.split("/")[0],
              name: binding.resource.split("/")[1],
              number: input.pullNumber,
            },
          },
          ctx.signal,
        );
        if (threads.errors || !threads.data?.repository?.pullRequest)
          throw new Error("Review state is unavailable.");
        const review = threads.data.repository.pullRequest;
        data.review = {
          decision: review.reviewDecision,
          reviews: reviews.map((r: Json) => ({ id: r.id, state: r.state, head: r.commit_id })),
          unresolvedThreads: review.reviewThreads.nodes.filter((t: Json) => !t.isResolved).length,
          truncated: reviews.length >= 100 || review.reviewThreads.pageInfo.hasNextPage,
        };
        data.requiredChecks = binding.requiredChecks;
      }
      return this.receipt(intent, data, { head: branch.commit.sha });
    }
    if (intent.operation === "deployment.read") {
      const [pages, build] = await Promise.all([
        api("GET", "pages"),
        api("GET", "pages/builds/latest"),
      ]);
      return this.receipt(
        intent,
        { buildStatus: build.status, builtAt: build.updated_at },
        {
          status: build.status === "built" ? "completed" : "pending",
          deploymentSha: build.commit,
          url: pages.html_url,
        },
      );
    }
    if (intent.operation === "repository.propose") {
      const known = await this.reconcile(intent, ctx);
      if (known) return known;
      const proposal = proposalSchema.parse(intent.payload);
      const repo = await this.api("GET", base, undefined, ctx.signal);
      const current = await api("GET", `branches/${encodeURIComponent(repo.default_branch)}`);
      if (current.commit.sha !== intent.expectedHead)
        throw new Error("The base changed. Prepare a fresh proposal.");
      const parent = await api("GET", `git/commits/${intent.expectedHead}`);
      const tree = await api("POST", "git/trees", {
        base_tree: parent.tree.sha,
        tree: proposal.files.map((f) => ({
          path: f.path,
          mode: "100644",
          type: "blob",
          content: f.content,
        })),
      });
      const commit = await api("POST", "git/commits", {
        message: proposal.title,
        tree: tree.sha,
        parents: [intent.expectedHead],
      });
      const branch = this.branch(ctx);
      await api("POST", "git/refs", { ref: `refs/heads/${branch}`, sha: commit.sha });
      const pull = await api("POST", "pulls", {
        title: proposal.title,
        body: proposal.body,
        base: repo.default_branch,
        head: branch,
      });
      return this.receipt(
        intent,
        { pullNumber: pull.number, branch },
        { head: commit.sha, url: pull.html_url },
      );
    }
    const { pullNumber } = pullSchema.parse(intent.payload);
    const pull = await api("GET", `pulls/${pullNumber}`);
    if (pull.head.sha !== intent.expectedHead)
      throw new Error("The PR head changed. Prepare a new approval.");
    if (pull.merged)
      return this.receipt(
        intent,
        { pullNumber },
        { head: pull.head.sha, mergeSha: pull.merge_commit_sha, url: pull.html_url },
      );
    if (
      pull.state !== "open" ||
      pull.draft ||
      pull.mergeable_state !== "clean" ||
      pull.head.repo?.full_name !== binding.resource ||
      pull.base.repo?.full_name !== binding.resource
    )
      throw new Error("The PR is not ready to merge.");
    const [files, checks, status, reviews] = await Promise.all([
      api("GET", `pulls/${pullNumber}/files?per_page=100`),
      api("GET", `commits/${intent.expectedHead}/check-runs?per_page=100&filter=latest`),
      api("GET", `commits/${intent.expectedHead}/status?per_page=100`),
      api("GET", `pulls/${pullNumber}/reviews?per_page=100`),
    ]);
    if (
      !files.length ||
      files.length !== pull.changed_files ||
      files.some(
        (f: Json) =>
          !permittedProjectPath(
            f.filename,
            ctx.allowedPaths.length ? ctx.allowedPaths : intent.grantId ? [] : [f.filename],
          ),
      )
    )
      throw new Error("PR files are outside the approved scope.");
    if (
      checks.total_count > 100 ||
      checks.check_runs.some(
        (c: Json) =>
          c.head_sha !== intent.expectedHead ||
          c.status !== "completed" ||
          c.conclusion !== "success",
      ) ||
      status.statuses.some((s: Json) => s.state !== "success")
    )
      throw new Error("Checks on the exact PR head are not all green.");
    const green = new Set([
      ...checks.check_runs.map((c: Json) => c.name),
      ...status.statuses.map((s: Json) => s.context),
    ]);
    if (binding.requiredChecks.some((name) => !green.has(name)))
      throw new Error("A required check has not completed.");
    const latestReviews = new Map<string, string>();
    for (const review of reviews)
      if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state))
        latestReviews.set(review.user.login, review.state);
    if (reviews.length >= 100 || [...latestReviews.values()].includes("CHANGES_REQUESTED"))
      throw new Error("Review feedback remains unresolved.");
    const threads = await this.api(
      "POST",
      "graphql",
      {
        query:
          "query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewDecision reviewThreads(first:100){pageInfo{hasNextPage} nodes{isResolved}}}}}",
        variables: {
          owner: binding.resource.split("/")[0],
          name: binding.resource.split("/")[1],
          number: pullNumber,
        },
      },
      ctx.signal,
    );
    const reviewed = threads.data?.repository?.pullRequest;
    if (
      threads.errors ||
      !reviewed ||
      ["CHANGES_REQUESTED", "REVIEW_REQUIRED"].includes(reviewed.reviewDecision) ||
      reviewed.reviewThreads.pageInfo.hasNextPage ||
      reviewed.reviewThreads.nodes.some((t: Json) => !t.isResolved)
    )
      throw new Error("Review is incomplete.");
    const result = await api("PUT", `pulls/${pullNumber}/merge`, {
      sha: intent.expectedHead,
      merge_method: "merge",
    });
    if (!result.merged) throw new Error("GitHub did not confirm the merge.");
    return this.receipt(
      intent,
      { pullNumber },
      { head: intent.expectedHead, mergeSha: result.sha, url: pull.html_url },
    );
  }
  async reconcile(
    intent: ProjectActionInput,
    ctx: WorkDeliveryContext,
  ): Promise<WorkDeliveryReceipt | undefined> {
    const binding = this.binding(intent, ctx);
    await this.assertIdentity(binding, ctx.signal);
    if (intent.operation === "repository.propose") {
      const head = encodeURIComponent(`${binding.resource.split("/")[0]}:${this.branch(ctx)}`);
      const pulls = await this.api(
        "GET",
        `repos/${binding.resource}/pulls?state=all&head=${head}&per_page=100`,
        undefined,
        ctx.signal,
      );
      if (pulls.length === 1) {
        const proposal = proposalSchema.parse(intent.payload);
        const pull = pulls[0];
        const [commit, files] = await Promise.all([
          this.api(
            "GET",
            `repos/${binding.resource}/git/commits/${pull.head.sha}`,
            undefined,
            ctx.signal,
          ),
          this.api(
            "GET",
            `repos/${binding.resource}/pulls/${pull.number}/files?per_page=100`,
            undefined,
            ctx.signal,
          ),
        ]);
        if (
          commit.parents.length !== 1 ||
          commit.parents[0].sha !== intent.expectedHead ||
          !files.length ||
          files.length !== pull.changed_files ||
          files.some((f: Json) => !proposal.files.some((p) => p.path === f.filename))
        )
          return undefined;
        const matches = await Promise.all(
          proposal.files.map(async (file) => {
            const remote = await this.api(
              "GET",
              `repos/${binding.resource}/contents/${file.path.split("/").map(encodeURIComponent).join("/")}?ref=${pull.head.sha}`,
              undefined,
              ctx.signal,
            );
            const bytes = Buffer.from(file.content, "utf8");
            const sha = createHash("sha1")
              .update(`blob ${bytes.length}\0`)
              .update(bytes)
              .digest("hex");
            return remote.sha === sha && remote.type === "file";
          }),
        );
        if (matches.some((match) => !match)) return undefined;
        return this.receipt(
          intent,
          { pullNumber: pulls[0].number, branch: this.branch(ctx) },
          { head: pulls[0].head.sha, url: pulls[0].html_url },
        );
      }
    } else if (intent.operation === "repository.merge") {
      const { pullNumber } = pullSchema.parse(intent.payload);
      const pull = await this.api(
        "GET",
        `repos/${binding.resource}/pulls/${pullNumber}`,
        undefined,
        ctx.signal,
      );
      if (pull.merged && pull.head.sha === intent.expectedHead)
        return this.receipt(
          intent,
          { pullNumber },
          { head: pull.head.sha, mergeSha: pull.merge_commit_sha, url: pull.html_url },
        );
    }
    return undefined;
  }
}

/** A local operator opts in a specific application tenant; absent file means no host access. */
export async function createWorkDeliveryProvider(
  dataDir: string,
): Promise<WorkDeliveryProvider | undefined> {
  let contents: string;
  try {
    contents = await readFile(join(dataDir, "work-connections.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  const config = z
    .object({ connections: z.array(Binding).max(30) })
    .strict()
    .parse(JSON.parse(contents));
  return new GitHubWorkDelivery(config.connections);
}
