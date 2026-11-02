import { createHash } from "node:crypto";
import type { SkillCatalogProvider } from "@rakazo/adapter-kit";
import { SkillCatalogError } from "@rakazo/adapter-kit";
import type { SkillBundle } from "@rakazo/contracts";
import { parseSkillMd } from "@rakazo/core";
import { z } from "zod";

const repoPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const MAX_BYTES = 80_000;
const searchSchema = z.object({
  skills: z.array(
    z.object({
      source: z.string(),
      skillId: z.string().optional(),
      id: z.string(),
      name: z.string(),
    }),
  ),
});
const treeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      mode: z.string(),
      size: z.number().optional(),
    }),
  ),
});

function safePath(path: string) {
  return (
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !/\p{Cc}/u.test(path) &&
    path.split("/").every((part) => part !== ".." && part !== "." && part.length > 0)
  );
}

/** Uses the CLI's public search endpoint and pinned public GitHub source, with no shell install. */
export class SkillsShCatalog implements SkillCatalogProvider {
  constructor(private readonly request: typeof fetch = fetch) {}

  private async text(url: string, signal?: AbortSignal, limit = 1_000_000) {
    const response = await this.request(url, {
      redirect: "error",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
      headers: { Accept: "application/json", "User-Agent": "MuseOrg-skill-import" },
    });
    if (!response.ok)
      throw new SkillCatalogError(
        `Skill source unavailable (${response.status}). Try again later.`,
      );
    if (!response.body) throw new SkillCatalogError("Skill source returned no content.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.length;
        if (length > limit)
          throw new SkillCatalogError("Skill bundle exceeds the import size limit.");
        chunks.push(next.value);
      }
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
      } catch {
        throw new SkillCatalogError(
          "This skill contains non-text files and cannot be imported yet.",
        );
      }
    } finally {
      await reader.cancel();
    }
  }

  async search(query: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ q: query.slice(0, 160), limit: "12" });
    const data = searchSchema.parse(
      JSON.parse(await this.text(`https://skills.sh/api/search?${params}`, signal)),
    );
    return data.skills
      .flatMap((item) => {
        const key = item.skillId ?? item.id.split("/").at(-1) ?? "";
        if (!repoPattern.test(item.source) || !keyPattern.test(key) || item.name.length > 80)
          return [];
        return [
          {
            source: item.source,
            key,
            name: item.name,
            url: `https://skills.sh/${item.source}/${key}`,
          },
        ];
      })
      .slice(0, 12);
  }

  async load(
    input: { source: string; key: string; revision?: string },
    signal?: AbortSignal,
  ): Promise<SkillBundle> {
    if (
      !repoPattern.test(input.source) ||
      !keyPattern.test(input.key) ||
      (input.revision !== undefined && !revisionPattern.test(input.revision))
    )
      throw new SkillCatalogError("Invalid skill source.");
    const revision =
      input.revision ??
      z
        .object({ sha: z.string().regex(revisionPattern) })
        .parse(
          JSON.parse(
            await this.text(`https://api.github.com/repos/${input.source}/commits/HEAD`, signal),
          ),
        ).sha;
    const tree = treeSchema.parse(
      JSON.parse(
        await this.text(
          `https://api.github.com/repos/${input.source}/git/trees/${revision}?recursive=1`,
          signal,
          4_000_000,
        ),
      ),
    );
    if (tree.truncated)
      throw new SkillCatalogError("The source tree is incomplete. This skill cannot be imported.");
    const candidates = tree.tree
      .filter(
        (file) =>
          file.type === "blob" &&
          file.mode === "100644" &&
          (file.path === "SKILL.md" || file.path.endsWith("/SKILL.md")) &&
          safePath(file.path),
      )
      .sort((left, right) => {
        // Directory names need not equal the canonical frontmatter name. Prefer
        // likely matches, then inspect a bounded set of other skill files.
        const rank = (path: string) => {
          const directory = path.split("/").at(-2);
          return directory && (directory === input.key || input.key.endsWith(`-${directory}`))
            ? 0
            : path === "SKILL.md"
              ? 1
              : 2;
        };
        return rank(left.path) - rank(right.path) || left.path.localeCompare(right.path);
      });
    const raw = (path: string) =>
      `https://raw.githubusercontent.com/${input.source}/${revision}/${path.split("/").map(encodeURIComponent).join("/")}`;
    for (const candidate of candidates.slice(0, 16)) {
      const content = await this.text(raw(candidate.path), signal, MAX_BYTES);
      const parsed = parseSkillMd(content);
      if ("error" in parsed || parsed.name !== input.key) continue;
      const prefix = candidate.path.slice(0, -"SKILL.md".length);
      const files = tree.tree.filter(
        (file) =>
          file.type === "blob" && file.path.startsWith(prefix) && file.path !== candidate.path,
      );
      if (
        files.length > 40 ||
        files.some(
          (file) =>
            file.mode !== "100644" ||
            !safePath(file.path) ||
            file.size === undefined ||
            file.size > MAX_BYTES,
        )
      )
        throw new SkillCatalogError(
          "This skill bundle is too large or contains unsupported files.",
        );
      const resources: Record<string, string> = Object.create(null);
      let bytes = Buffer.byteLength(content);
      for (const file of files.sort((a, b) => a.path.localeCompare(b.path))) {
        if (bytes + file.size! > MAX_BYTES)
          throw new SkillCatalogError("Skill bundle exceeds the import size limit.");
        const contents = await this.text(raw(file.path), signal, MAX_BYTES);
        bytes += Buffer.byteLength(contents);
        if (bytes > MAX_BYTES)
          throw new SkillCatalogError("Skill bundle exceeds the import size limit.");
        resources[file.path.slice(prefix.length)] = contents;
      }
      const sha256 = createHash("sha256")
        .update(JSON.stringify([input.source, input.key, revision, content, resources]))
        .digest("hex");
      return {
        source: input.source,
        key: input.key,
        name: parsed.name,
        description: parsed.description,
        url: `https://skills.sh/${input.source}/${input.key}`,
        revision,
        sha256,
        content,
        resources,
      };
    }
    throw new SkillCatalogError("The selected SKILL.md was not found in this repository.");
  }
}
