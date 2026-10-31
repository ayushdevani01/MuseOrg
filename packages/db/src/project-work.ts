import type {
  Actor,
  ProjectPatch,
  ProjectSpec,
  WorkGrantInput,
  WorkProject as WorkProjectDto,
} from "@rakazo/contracts";
import { ProjectPatchSchema, ProjectSpecSchema, WorkGrantInputSchema } from "@rakazo/contracts";
import { applyProjectPatch, projectOutputAffected } from "@rakazo/core";
import { cancelRunsInTransaction } from "./cancel-runs.js";
import type { Prisma, PrismaClient, WorkProject } from "./client.js";
import { createThreadMessageInTransaction } from "./messages.js";
import { IsolationError } from "./scope.js";
import { withTransactionRetry } from "./transaction-retry.js";

export type ProjectOwner = Pick<Actor, "spaceId" | "userId">;
export function projectOwner(input: ProjectOwner): ProjectOwner {
  return { userId: input.userId, spaceId: input.spaceId };
}
type ProjectDb = Pick<PrismaClient, "workProject" | "bot">;

export class ProjectRevisionConflictError extends Error {
  constructor() {
    super("The project changed. Read its latest revision and retry.");
  }
}

export function toWorkProjectDto(project: WorkProject): WorkProjectDto {
  return {
    id: project.id,
    name: project.name,
    ...ProjectSpecSchema.parse(project),
    revision: project.revision,
    botIds: project.botIds,
    status: project.status as WorkProjectDto["status"],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function ownedWorkProject(db: ProjectDb, owner: ProjectOwner, id: string) {
  owner = projectOwner(owner);
  const project = await db.workProject.findFirst({ where: { id, ...owner } });
  if (!project) throw new IsolationError();
  return project;
}

async function validateProjectBots(
  db: Pick<PrismaClient, "bot">,
  owner: ProjectOwner,
  ids: readonly string[],
) {
  const botIds = [...new Set(ids)];
  if (!botIds.length || botIds.length > 40) throw new Error("Assign at least one coworker.");
  const count = await db.bot.count({ where: { id: { in: botIds }, ...owner, archivedAt: null } });
  if (count !== botIds.length) throw new IsolationError();
  return botIds;
}

export async function createWorkProject(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: { name: string; spec: ProjectSpec; botIds: string[] },
) {
  owner = projectOwner(owner);
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error("Use a project name of at most 120 characters.");
  const spec = ProjectSpecSchema.parse(input.spec);
  const botIds = await validateProjectBots(prisma, owner, input.botIds);
  return prisma.$transaction(async (tx) => {
    const project = await tx.workProject.create({
      data: {
        ...owner,
        name,
        ...spec,
        facts: spec.facts as Prisma.InputJsonObject,
        botIds,
      },
    });
    await tx.workProjectRevision.create({
      data: {
        ...owner,
        projectId: project.id,
        revision: 1,
        spec: spec as Prisma.InputJsonObject,
        changedKeys: ["goal", "facts"],
      },
    });
    return project;
  });
}

export async function listWorkProjects(prisma: PrismaClient, owner: ProjectOwner, botId?: string) {
  owner = projectOwner(owner);
  return prisma.workProject.findMany({
    where: { ...owner, ...(botId ? { botIds: { has: botId } } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

async function lockProject(tx: Prisma.TransactionClient, owner: ProjectOwner, projectId: string) {
  await tx.$queryRaw`SELECT "id" FROM "work_projects" WHERE "id" = ${projectId} AND "spaceId" = ${owner.spaceId} AND "userId" = ${owner.userId} FOR UPDATE`;
  return ownedWorkProject(tx, owner, projectId);
}

/** The actor comes from the authenticated request/run, never from tool arguments. */
export async function reviseWorkProject(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: {
    projectId: string;
    expectedRevision: number;
    patch: ProjectPatch;
    source?: { runId: string; messageId: string };
  },
) {
  owner = projectOwner(owner);
  const patch = ProjectPatchSchema.parse(input.patch);
  return withTransactionRetry(() =>
    prisma.$transaction(async (tx) => {
      const current = await lockProject(tx, owner, input.projectId);
      if (current.revision !== input.expectedRevision) throw new ProjectRevisionConflictError();
      if (input.source) {
        const run = await tx.run.findFirst({
          where: {
            id: input.source.runId,
            ...owner,
            sourceMessageId: input.source.messageId,
          },
        });
        const message = run
          ? await tx.message.findFirst({
              where: {
                id: input.source.messageId,
                thread: owner,
                role: "user",
              },
            })
          : null;
        if (!message) throw new IsolationError();
      }
      const { spec, changedKeys } = applyProjectPatch(ProjectSpecSchema.parse(current), patch);
      if (!changedKeys.length)
        return {
          project: current,
          changedKeys,
          affectedBotIds: [],
          staleEffectIds: [],
          staleRunIds: [],
        };
      const project = await tx.workProject.update({
        where: { id: current.id },
        data: { ...spec, facts: spec.facts as Prisma.InputJsonObject, revision: { increment: 1 } },
      });
      await tx.workProjectRevision.create({
        data: {
          ...owner,
          projectId: project.id,
          revision: project.revision,
          spec: spec as Prisma.InputJsonObject,
          changedKeys,
          sourceRunId: input.source?.runId,
          sourceMessageId: input.source?.messageId,
        },
      });
      const outputs = await tx.workProjectOutput.findMany({
        where: {
          ...owner,
          projectId: project.id,
          status: "current",
        },
      });
      const stale = outputs.filter((output) =>
        projectOutputAffected(output.inputKeys, changedKeys),
      );
      if (stale.length)
        await tx.workProjectOutput.updateMany({
          where: { id: { in: stale.map((output) => output.id) }, ...owner },
          data: { status: "stale" },
        });
      // Existing ExternalEffect remains the single journal. Its frozen request binds revision.
      const effects = await tx.externalEffect.findMany({
        where: {
          spaceId: owner.spaceId,
          kind: "project_action",
          status: { in: ["intended", "approved"] },
          run: { userId: owner.userId },
          request: { path: ["projectId"], equals: project.id },
        },
        select: { id: true, runId: true },
      });
      if (effects.length)
        await tx.externalEffect.updateMany({
          where: {
            id: { in: effects.map((effect) => effect.id) },
            status: { in: ["intended", "approved"] },
          },
          data: { status: "superseded" },
        });
      const active = await tx.workProjectRun.findMany({
        where: {
          ...owner,
          projectId: project.id,
          run: { status: { in: ["queued", "running", "waiting_input", "waiting_computer"] } },
        },
        include: { run: { select: { botId: true } } },
      });
      const affectedBotIds = [
        ...new Set([
          ...stale.map((output) => output.botId),
          ...active
            .filter((work) => projectOutputAffected(work.inputKeys, changedKeys))
            .map((work) => work.run.botId),
          ...(!outputs.length ? project.botIds : []),
        ]),
      ];
      const notifications = await notifyProjectRevision(
        tx,
        owner,
        project,
        affectedBotIds,
        changedKeys,
        effects.map((effect) => effect.runId),
        input.source?.runId,
      );
      return {
        project,
        changedKeys,
        affectedBotIds,
        staleEffectIds: effects.map((effect) => effect.id),
        staleRunIds: [...new Set(effects.map((effect) => effect.runId))],
        notifications,
      };
    }),
  );
}

/** Messages, steering and queued runs commit with the revision; the existing run reconciler
 * recovers publication after a process dies between this transaction and enqueue. */
async function notifyProjectRevision(
  tx: Prisma.TransactionClient,
  owner: ProjectOwner,
  project: WorkProject,
  botIds: string[],
  changedKeys: string[],
  supersededRunIds: string[],
  sourceRunId?: string,
) {
  const notifications: { runId: string; botId: string; threadId: string; messageId: string }[] = [];
  const threads = await tx.thread.findMany({
    where: { ...owner, botId: { in: botIds } },
    orderBy: { id: "asc" },
  });
  for (const thread of threads) {
    if (!thread.botId) continue;
    const text = `Project ${project.name} (${project.id}) is now revision ${project.revision}. Changed: ${changedKeys.join(", ")}. Read project_read before continuing. Replace affected stale outputs and proposals; preserve unrelated work. This notice conveys no external-action authority.`;
    const message = await createThreadMessageInTransaction(tx, {
      threadId: thread.id,
      role: "system",
      blocks: [{ kind: "text", text }],
      clientNonce: `project-revision:${project.id}:${project.revision}`,
      markUnread: true,
    });
    const obsolete = await tx.run.findMany({
      where: {
        ...owner,
        threadId: thread.id,
        id: { in: supersededRunIds },
        status: "waiting_input",
      },
    });
    await cancelRunsInTransaction(tx, obsolete, new Date());
    const busy = await tx.run.findFirst({
      where: {
        ...owner,
        threadId: thread.id,
        status: { in: ["queued", "running", "waiting_input", "waiting_computer"] },
      },
      orderBy: { createdAt: "asc" },
    });
    if (busy) {
      if (busy.id !== sourceRunId)
        await tx.steeringMessage.create({
          data: {
            messageId: message.id,
            botId: thread.botId,
            userId: owner.userId,
            runId: busy.id,
            originTrigger: "bot_message",
          },
        });
      notifications.push({
        runId: busy.id,
        botId: thread.botId,
        threadId: thread.id,
        messageId: message.id,
      });
    } else {
      const task = await tx.task.create({
        data: {
          ...owner,
          threadId: thread.id,
          botId: thread.botId,
          prompt: text,
          status: "queued",
        },
      });
      const run = await tx.run.create({
        data: {
          ...owner,
          threadId: thread.id,
          botId: thread.botId,
          taskId: task.id,
          trigger: "bot_message",
          status: "queued",
          sourceMessageId: message.id,
        },
      });
      await tx.workProjectRun.create({
        data: {
          ...owner,
          projectId: project.id,
          runId: run.id,
          revision: project.revision,
          inputKeys: changedKeys,
        },
      });
      notifications.push({
        runId: run.id,
        botId: thread.botId,
        threadId: thread.id,
        messageId: message.id,
      });
    }
  }
  return notifications;
}

export async function linkProjectRun(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: { projectId: string; runId: string; botId: string; inputKeys?: string[] },
) {
  owner = projectOwner(owner);
  const project = await ownedWorkProject(prisma, owner, input.projectId);
  if (!project.botIds.includes(input.botId)) throw new IsolationError();
  const run = await prisma.run.findFirst({
    where: { id: input.runId, botId: input.botId, ...owner },
  });
  if (!run) throw new IsolationError();
  return prisma.workProjectRun.upsert({
    where: { projectId_runId: { projectId: project.id, runId: run.id } },
    create: {
      ...owner,
      projectId: project.id,
      runId: run.id,
      revision: project.revision,
      inputKeys: input.inputKeys ?? [],
    },
    update: {
      revision: project.revision,
      ...(input.inputKeys ? { inputKeys: input.inputKeys } : {}),
    },
  });
}

export async function registerProjectOutput(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: {
    projectId: string;
    revision: number;
    botId: string;
    runId: string;
    key: string;
    reference: string;
    sha256: string;
    inputKeys: string[];
  },
) {
  owner = projectOwner(owner);
  return prisma.$transaction(async (tx) => {
    const project = await lockProject(tx, owner, input.projectId);
    if (!project.botIds.includes(input.botId)) throw new IsolationError();
    if (project.revision !== input.revision) throw new ProjectRevisionConflictError();
    const work = await tx.workProjectRun.findFirst({
      where: { ...owner, projectId: project.id, runId: input.runId, run: { botId: input.botId } },
    });
    if (!work) throw new IsolationError();
    // A revision's registered output is immutable. A new version needs a new key/revision.
    return tx.workProjectOutput.create({
      data: {
        ...owner,
        projectId: project.id,
        botId: input.botId,
        key: input.key,
        revision: input.revision,
        reference: input.reference,
        sha256: input.sha256,
        inputKeys: input.inputKeys,
      },
    });
  });
}

export async function createWorkGrant(
  prisma: PrismaClient,
  owner: ProjectOwner,
  raw: WorkGrantInput,
) {
  owner = projectOwner(owner);
  const input = WorkGrantInputSchema.parse(raw);
  const project = await ownedWorkProject(prisma, owner, input.projectId);
  const botIds = await validateProjectBots(prisma, owner, input.botIds);
  if (botIds.some((id) => !project.botIds.includes(id))) throw new IsolationError();
  const expiresAt = new Date(input.expiresAt);
  if (expiresAt <= new Date()) throw new Error("Choose a future expiry.");
  return prisma.workScopeGrant.create({ data: { ...input, ...owner, botIds, expiresAt } });
}

export async function revokeWorkGrant(prisma: PrismaClient, owner: ProjectOwner, grantId: string) {
  owner = projectOwner(owner);
  const result = await prisma.workScopeGrant.updateMany({
    where: { id: grantId, ...owner, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) throw new IsolationError();
}
