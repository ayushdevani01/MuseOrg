import type { SkillBundle } from "@rakazo/contracts";
import { ImportedSkillMetadataSchema } from "@rakazo/contracts";
import { buildSkillMd, parseSkillMd } from "./agent-skill.js";

const metadataKey = "museorg-import";

/** Reuse the existing skill document store; no extra database or filesystem install. */
export function importedSkillContent(bundle: SkillBundle): string {
  const parsed = parseSkillMd(bundle.content);
  if ("error" in parsed) throw new Error(parsed.error);
  const content = buildSkillMd({
    ...parsed,
    frontmatter: {
      ...parsed.frontmatter,
      [metadataKey]: JSON.stringify({
        version: 1,
        source: bundle.source,
        key: bundle.key,
        revision: bundle.revision,
        sha256: bundle.sha256,
        url: bundle.url,
        resources: bundle.resources,
      }),
    },
  });
  if (content.length > 100_000) throw new Error("Skill bundle exceeds the import storage limit.");
  return content;
}

/** Resources are exact stored text keys. They are never resolved against the host filesystem. */
export function importedSkillDetails(content: string) {
  const parsed = parseSkillMd(content);
  if ("error" in parsed || typeof parsed.frontmatter[metadataKey] !== "string") return null;
  try {
    const details = ImportedSkillMetadataSchema.parse(JSON.parse(parsed.frontmatter[metadataKey]));
    if (
      Object.keys(details.resources).some(
        (path) =>
          path.startsWith("/") ||
          path.includes("\\") ||
          /\p{Cc}/u.test(path) ||
          path.split("/").some((part) => !part || part === "." || part === ".."),
      )
    )
      return null;
    const { [metadataKey]: _metadata, ...frontmatter } = parsed.frontmatter;
    return { ...details, content: buildSkillMd({ ...parsed, frontmatter }) };
  } catch {
    return null;
  }
}
