import { z } from "zod";

export const SkillCatalogEntrySchema = z.object({
  source: z.string().min(1).max(160),
  key: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  url: z.url().startsWith("https://"),
});
export type SkillCatalogEntry = z.infer<typeof SkillCatalogEntrySchema>;

export const SkillImportSelectionSchema = SkillCatalogEntrySchema.pick({
  source: true,
  key: true,
}).extend({
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type SkillImportSelection = z.infer<typeof SkillImportSelectionSchema>;

export const SkillBundleSchema = SkillCatalogEntrySchema.extend({
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  description: z.string().min(1).max(2000),
  content: z.string().min(1).max(80_000),
  resources: z.record(z.string(), z.string()),
});
export type SkillBundle = z.infer<typeof SkillBundleSchema>;

export const ImportedSkillMetadataSchema = z.object({
  version: z.literal(1),
  source: z.string(),
  key: z.string(),
  revision: z.string(),
  sha256: z.string(),
  url: z.string(),
  resources: z.record(z.string(), z.string()),
});
