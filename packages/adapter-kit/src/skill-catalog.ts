import type { SkillBundle, SkillCatalogEntry } from "@rakazo/contracts";

/** Public, credential-free failure text suitable for the import UI. */
export class SkillCatalogError extends Error {}

/** Optional public discovery; imported recipes never grant tools or account authority. */
export interface SkillCatalogProvider {
  search(query: string, signal?: AbortSignal): Promise<SkillCatalogEntry[]>;
  load(
    input: { source: string; key: string; revision?: string },
    signal?: AbortSignal,
  ): Promise<SkillBundle>;
}
