import type { ConnectorTool } from "@rakazo/adapter-kit";
import { ProjectActionInputSchema, ProjectPatchSchema } from "@rakazo/contracts";
import { z } from "zod";

export const projectTools: ConnectorTool[] = [
  {
    name: "project_reconcile",
    description:
      "Find a real receipt for an uncertain project delivery by actionId. This only observes its original frozen destination and settles its existing reservation; it never retries a write. Works after scope revocation or a later project revision.",
    readOnly: true,
    inputSchema: z.toJSONSchema(z.object({ actionId: z.string().min(1).max(120) })),
  },
  {
    name: "project_read",
    description:
      "Read assigned projects, current brief revision, stale outputs, available scoped grants and delivery connections. Omit projectId to list. Always read before project work. inputKeys optionally records the brief fields this run depends on (goal, facts.offer, etc.).",
    readOnly: true,
    inputSchema: z.toJSONSchema(
      z.object({
        projectId: z.string().optional(),
        inputKeys: z.array(z.string()).max(40).optional(),
      }),
    ),
  },
  {
    name: "project_revise",
    description:
      "Propose a correction to a shared project brief. The owner must approve this exact revision and patch. Applies atomically, stales dependent artifacts and pending actions, and wakes affected coworkers. Never expand external authority here.",
    readOnly: false,
    inputSchema: z.toJSONSchema(
      z.object({
        projectId: z.string(),
        expectedRevision: z.number().int().positive(),
        patch: ProjectPatchSchema,
      }),
    ),
  },
  {
    name: "project_output",
    description:
      "Register a completed workspace file against the current project revision and its input dependencies. The backend reads and hashes actual bytes. Stale revisions are rejected. Use a new key for a new output in the same revision.",
    readOnly: false,
    inputSchema: z.toJSONSchema(
      z.object({
        projectId: z.string(),
        revision: z.number().int().positive(),
        key: z.string().min(1).max(120),
        path: z.string().min(1).max(400),
        inputKeys: z.array(z.string()).max(40),
      }),
    ),
  },
  {
    name: "project_action",
    description:
      "Use a connected trusted delivery adapter. repository.read returns source/checks/PR; repository.propose accepts payload {title,body,files:[{path,content}]} and exact base expectedHead; repository.merge accepts {pullNumber} and exact PR expectedHead; deployment.read reads the real deployed revision. Bind project revision, account and resource exactly. A valid scoped grant may authorize permitted actions; otherwise the owner approves the frozen payload. Never retry uncertain writes; reconcile/read first. Unsupported operations fail closed.",
    readOnly: false,
    inputSchema: z.toJSONSchema(ProjectActionInputSchema, { io: "input" }),
  },
];
