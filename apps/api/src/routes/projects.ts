import { runContinueJob } from "@rakazo/adapter-kit";
import { WorkGrantSchema } from "@rakazo/contracts";
import {
  createWorkGrant,
  createWorkProject,
  listWorkProjects,
  ownedWorkProject,
  reviseWorkProject,
  revokeWorkGrant,
  toWorkProjectDto,
} from "@rakazo/db";
import type { RouterContext } from "./context.js";

export function projectsRoutes({ deps, authed }: RouterContext) {
  return {
    projects: {
      connections: authed.projects.connections.handler(async ({ context }) =>
        [
          ...((await deps.workDelivery?.connections({
            ...context.actor,
            operationId: "projects.connections",
            traceId: "projects.connections",
            signal: context.signal ?? AbortSignal.timeout(15000),
          })) ?? []),
        ].map((connection) => ({ ...connection, operations: [...connection.operations] })),
      ),
      list: authed.projects.list.handler(async ({ context, input }) =>
        (await listWorkProjects(deps.prisma, context.actor, input.botId)).map(toWorkProjectDto),
      ),
      create: authed.projects.create.handler(async ({ context, input }) =>
        toWorkProjectDto(await createWorkProject(deps.prisma, context.actor, input)),
      ),
      get: authed.projects.get.handler(async ({ context, input }) => {
        const owner = { userId: context.actor.userId, spaceId: context.actor.spaceId };
        const project = await ownedWorkProject(deps.prisma, owner, input.projectId);
        const [outputs, grants] = await Promise.all([
          deps.prisma.workProjectOutput.findMany({
            where: { ...owner, projectId: project.id },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
          deps.prisma.workScopeGrant.findMany({
            where: { ...owner, projectId: project.id },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
        ]);
        return {
          project: toWorkProjectDto(project),
          outputs: outputs.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
          grants: grants.map(grantDto),
        };
      }),
      revise: authed.projects.revise.handler(async ({ context, input }) => {
        const result = await reviseWorkProject(deps.prisma, context.actor, input);
        await Promise.allSettled(
          (result.notifications ?? []).map((notice) =>
            deps.jobs.enqueue(runContinueJob(notice.runId)),
          ),
        );
        return toWorkProjectDto(result.project);
      }),
      grant: authed.projects.grant.handler(async ({ context, input }) =>
        grantDto(await createWorkGrant(deps.prisma, context.actor, input)),
      ),
      revoke: authed.projects.revoke.handler(async ({ context, input }) => {
        await revokeWorkGrant(deps.prisma, context.actor, input.grantId);
        return { ok: true as const };
      }),
    },
  };
}

function grantDto<T extends { expiresAt: Date; revokedAt: Date | null; createdAt: Date }>(
  grant: T,
) {
  return WorkGrantSchema.parse({
    ...grant,
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt?.toISOString() ?? null,
    createdAt: grant.createdAt.toISOString(),
  });
}
