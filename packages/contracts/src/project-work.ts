import * as z from "zod";

const ProjectId = z.string().min(1).max(120);
const Facts = z
  .record(z.string().min(1).max(120), z.json())
  .refine((facts) => JSON.stringify(facts).length <= 24000, "Project facts are too large");

export const ProjectSpecSchema = z.object({ goal: z.string().min(1).max(8000), facts: Facts });
export type ProjectSpec = z.infer<typeof ProjectSpecSchema>;
export const ProjectPatchSchema = z.object({
  goal: z.string().min(1).max(8000).optional(),
  facts: Facts.optional(),
});
export type ProjectPatch = z.infer<typeof ProjectPatchSchema>;

export const WorkOperationSchema = z.enum([
  "repository.read",
  "repository.propose",
  "repository.merge",
  "deployment.read",
  "publish",
  "message.send",
  "ads.stage",
  "ads.activate",
]);
export type WorkOperation = z.infer<typeof WorkOperationSchema>;
export const WorkConnectionSchema = z.object({
  provider: z.string(),
  account: z.string(),
  resource: z.string(),
  operations: z.array(WorkOperationSchema),
});
export type WorkConnection = z.infer<typeof WorkConnectionSchema>;

export const ProjectActionInputSchema = z.object({
  projectId: ProjectId,
  revision: z.number().int().positive(),
  operation: WorkOperationSchema,
  provider: z.string().min(1).max(80),
  account: z.string().min(1).max(200),
  resource: z.string().min(1).max(400),
  payload: z
    .record(z.string(), z.json())
    .refine((value) => JSON.stringify(value).length <= 260000, "Action payload is too large"),
  budgetCents: z.number().int().min(0).max(100000000).default(0),
  expectedHead: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .optional(),
  grantId: ProjectId.optional(),
});
export type ProjectActionInput = z.infer<typeof ProjectActionInputSchema>;

export const WorkGrantInputSchema = z.object({
  projectId: ProjectId,
  provider: z.string().min(1).max(80),
  account: z.string().min(1).max(200),
  resource: z.string().min(1).max(400),
  operations: z.array(WorkOperationSchema).min(1).max(8),
  botIds: z.array(ProjectId).min(1).max(40),
  allowedPaths: z.array(z.string().min(1).max(400)).max(40).default([]),
  budgetLimitCents: z.number().int().min(0).max(100000000).default(0),
  expiresAt: z.string().datetime(),
});
export type WorkGrantInput = z.infer<typeof WorkGrantInputSchema>;

export const WorkProjectSchema = z.object({
  id: ProjectId,
  name: z.string(),
  goal: z.string(),
  facts: Facts,
  revision: z.number().int().positive(),
  botIds: z.array(ProjectId),
  status: z.enum(["active", "paused", "archived"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkProject = z.infer<typeof WorkProjectSchema>;

export const ProjectOutputSchema = z.object({
  id: ProjectId,
  projectId: ProjectId,
  botId: ProjectId,
  key: z.string(),
  revision: z.number().int(),
  inputKeys: z.array(z.string()),
  status: z.string(),
  reference: z.string(),
  sha256: z.string(),
  createdAt: z.string().datetime(),
});

export const WorkGrantSchema = WorkGrantInputSchema.extend({
  id: ProjectId,
  reservedCents: z.number().int(),
  spentCents: z.number().int(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
