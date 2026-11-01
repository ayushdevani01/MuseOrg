import type { SkillBundle } from "@rakazo/contracts";
import { describe, expect, it } from "vitest";
import { importedSkillContent, importedSkillDetails } from "./imported-skill.js";

const bundle: SkillBundle = {
  source: "example/skills",
  key: "fixture",
  name: "fixture",
  description: "A fixture",
  revision: "a".repeat(40),
  sha256: "b".repeat(64),
  url: "https://skills.sh/example/skills/fixture",
  content: "---\nname: fixture\ndescription: A fixture\n---\n\nRead references/data.md.\n",
  resources: {
    "references/data.md": 'Unicode € and quotes "literal"\nSecond line\n',
    LICENSE: "Synthetic license text",
  },
};
describe("imported skill storage", () => {
  it("round trips provenance and exact resource bytes through the existing document format", () => {
    const restored = importedSkillDetails(importedSkillContent(bundle));
    expect(restored).toMatchObject({
      source: bundle.source,
      revision: bundle.revision,
      sha256: bundle.sha256,
      resources: bundle.resources,
    });
    expect(restored?.content).not.toContain("museorg-import");
    expect(restored?.content).toContain("Read references/data.md.");
  });
  it("rejects resource traversal and oversized storage", () => {
    expect(
      importedSkillDetails(importedSkillContent({ ...bundle, resources: { "../secret": "no" } })),
    ).toBeNull();
    expect(() =>
      importedSkillContent({ ...bundle, resources: { large: "x".repeat(100_000) } }),
    ).toThrow("storage limit");
  });
});
