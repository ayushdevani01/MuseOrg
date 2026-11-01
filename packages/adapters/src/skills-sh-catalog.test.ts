import { describe, expect, it, vi } from "vitest";
import { SkillsShCatalog } from "./skills-sh-catalog.js";

const revision = "a".repeat(40);
const content =
  "---\nname: fixture-skill\ndescription: A synthetic recipe\n---\n\nRead references/check.md.\n";
function fixture(
  options: { truncated?: boolean; resourcePath?: string; mode?: string; size?: number } = {},
) {
  const request = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/api/search?"))
      return Response.json({
        skills: [
          { id: "example/skills/fixture-skill", source: "example/skills", name: "fixture-skill" },
          { id: "bad", source: "https://private.invalid", name: "bad" },
        ],
      });
    if (url.endsWith("/commits/HEAD")) return Response.json({ sha: revision });
    if (url.includes("/git/trees/"))
      return Response.json({
        truncated: options.truncated ?? false,
        tree: [
          {
            path: "skills/fixture-skill/SKILL.md",
            type: "blob",
            mode: "100644",
            size: content.length,
          },
          {
            path: options.resourcePath ?? "skills/fixture-skill/references/check.md",
            type: "blob",
            mode: options.mode ?? "100644",
            size: options.size ?? 13,
          },
        ],
      });
    if (url.endsWith("/SKILL.md")) return new Response(content);
    if (url.endsWith("/references/check.md")) return new Response("Check bytes.\n");
    throw new Error(`Unexpected fixture request ${url}`);
  });
  return { request, catalog: new SkillsShCatalog(request as typeof fetch) };
}
describe("public skill catalog conformance", () => {
  it("normalizes public search results without accepting URL sources", async () => {
    expect(await fixture().catalog.search("synthetic recipe")).toEqual([
      {
        source: "example/skills",
        key: "fixture-skill",
        name: "fixture-skill",
        url: "https://skills.sh/example/skills/fixture-skill",
      },
    ]);
  });
  it("pins all source files and preserves a deterministic bundle digest", async () => {
    const { catalog, request } = fixture();
    const first = await catalog.load({ source: "example/skills", key: "fixture-skill" });
    const pinned = await catalog.load({ source: "example/skills", key: "fixture-skill", revision });
    expect(first).toEqual(pinned);
    expect(first.resources).toEqual({ "references/check.md": "Check bytes.\n" });
    expect(first.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      request.mock.calls
        .filter(([url]) => String(url).includes("raw.githubusercontent.com"))
        .every(([url]) => String(url).includes(`/${revision}/`)),
    ).toBe(true);
  });
  it("rejects invalid destinations and revisions before a request", async () => {
    const { catalog, request } = fixture();
    for (const input of [
      { source: "../private", key: "fixture-skill" },
      { source: "example/skills", key: "../../secret" },
      { source: "example/skills", key: "fixture-skill", revision: "main" },
    ]) {
      await expect(catalog.load(input)).rejects.toThrow("Invalid skill source");
    }
    expect(request).not.toHaveBeenCalled();
  });
  it.each([
    { truncated: true },
    { mode: "120000" },
    { resourcePath: "skills/fixture-skill/../secret" },
    { size: 90_000 },
  ])("rejects incomplete, linked, escaping or oversized bundles: %j", async (options) => {
    await expect(
      fixture(options).catalog.load({ source: "example/skills", key: "fixture-skill" }),
    ).rejects.toThrow();
  });
  it("reports unavailable discovery instead of fake suggestions", async () => {
    await expect(
      new SkillsShCatalog(
        vi.fn(async () => new Response("Unavailable", { status: 503 })) as typeof fetch,
      ).search("design"),
    ).rejects.toThrow("503");
  });
});
