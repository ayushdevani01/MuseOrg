import type { ProjectActionInput } from "@rakazo/contracts";
import { ProjectActionInputSchema } from "@rakazo/contracts";
import { projectActionRefusal, WORK_OPERATIONS, workGrantRefusal } from "@rakazo/core";
import { stableJsonValue } from "@rakazo/core/node/approval-effect-key";
import type { Prisma, PrismaClient } from "./client.js";
import type { ProjectOwner } from "./project-work.js";
import { ownedWorkProject, projectOwner } from "./project-work.js";
import { IsolationError } from "./scope.js";
import { withTransactionRetry } from "./transaction-retry.js";

export class WorkAuthorityError extends Error {}

export async function inspectWorkAction(
  prisma: PrismaClient,
  owner: ProjectOwner,
  botId: string,
  raw: unknown,
) {
  owner = projectOwner(owner);
  const intent = ProjectActionInputSchema.parse(raw);
  const project = await ownedWorkProject(prisma, owner, intent.projectId);
  const refusal = projectActionRefusal({
    currentRevision: project.revision,
    status: project.status,
    botIds: project.botIds,
    botId,
    intent,
  });
  if (refusal) throw new WorkAuthorityError(refusal);
  const grant = intent.grantId
    ? await prisma.workScopeGrant.findFirst({
        where: { id: intent.grantId, ...owner },
      })
    : null;
  if (intent.grantId && !grant) throw new IsolationError();
  if (grant) {
    const denied = workGrantRefusal(intent, botId, grant, new Date());
    if (denied) throw new WorkAuthorityError(denied);
  }
  return {
    intent,
    project,
    grant,
    needsApproval: !WORK_OPERATIONS[intent.operation].readOnly && !grant,
  };
}

type Reservation = { grantId: string | null; cents: number; revision: number };
function reservationFrom(value: Prisma.JsonValue | null): Reservation | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value.__workScopeReservation;
  if (!row || typeof row !== "object" || Array.isArray(row)) return undefined;
  if (
    (row.grantId !== null && typeof row.grantId !== "string") ||
    typeof row.cents !== "number" ||
    !Number.isSafeInteger(row.cents) ||
    row.cents < 0 ||
    typeof row.revision !== "number"
  )
    return undefined;
  return { grantId: row.grantId, cents: row.cents, revision: row.revision };
}

/** Linearization point for revision/scope/budget authority, before remote dispatch. */
export async function reserveWorkAction(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: {
    runId: string;
    botId: string;
    effectId: string;
    intent: ProjectActionInput;
    exactApproval: boolean;
  },
) {
  owner = projectOwner(owner);
  return withTransactionRetry(() =>
    prisma.$transaction(async (tx) => {
      const { intent } = input;
      await tx.$queryRaw`SELECT "id" FROM "work_projects" WHERE "id" = ${intent.projectId} AND "spaceId" = ${owner.spaceId} AND "userId" = ${owner.userId} FOR UPDATE`;
      const project = await ownedWorkProject(tx, owner, intent.projectId);
      const refusal = projectActionRefusal({
        currentRevision: project.revision,
        status: project.status,
        botIds: project.botIds,
        botId: input.botId,
        intent,
      });
      if (refusal) throw new WorkAuthorityError(refusal);
      await tx.$queryRaw`SELECT "id" FROM "external_effects" WHERE "id" = ${input.effectId} AND "spaceId" = ${owner.spaceId} FOR UPDATE`;
      const effect = await tx.externalEffect.findFirst({
        where: {
          id: input.effectId,
          runId: input.runId,
          spaceId: owner.spaceId,
          kind: "project_action",
          run: { userId: owner.userId, botId: input.botId },
        },
      });
      if (effect?.status !== "executing" || effect.result !== null)
        throw new WorkAuthorityError("This action has already been claimed or superseded.");
      if (
        stableJsonValue(ProjectActionInputSchema.parse(effect.request)) !== stableJsonValue(intent)
      )
        throw new WorkAuthorityError("The action differs from its frozen request.");
      let grantId: string | null = null;
      if (intent.grantId) {
        await tx.$queryRaw`SELECT "id" FROM "work_scope_grants" WHERE "id" = ${intent.grantId} AND "spaceId" = ${owner.spaceId} AND "userId" = ${owner.userId} FOR UPDATE`;
        const grant = await tx.workScopeGrant.findFirst({
          where: { id: intent.grantId, ...owner },
        });
        if (!grant) throw new IsolationError();
        const denied = workGrantRefusal(intent, input.botId, grant, new Date());
        if (denied) throw new WorkAuthorityError(denied);
        grantId = grant.id;
        await tx.workScopeGrant.update({
          where: { id: grant.id },
          data: {
            reservedCents: { increment: intent.budgetCents },
          },
        });
      } else if (!WORK_OPERATIONS[intent.operation].readOnly && !input.exactApproval) {
        throw new WorkAuthorityError("This action needs an exact approval or an active scope.");
      }
      const reservation: Reservation = {
        grantId,
        cents: intent.budgetCents,
        revision: intent.revision,
      };
      await tx.externalEffect.update({
        where: { id: effect.id },
        data: {
          result: { __workScopeReservation: reservation },
        },
      });
      return reservation;
    }),
  );
}

/** Settling an uncertain receipt retains its reservation until an outcome is known. */
export async function settleWorkAction(
  prisma: PrismaClient,
  owner: ProjectOwner,
  input: {
    effectId: string;
    runId: string;
    status: "completed" | "failed" | "uncertain";
    actualCostCents: number;
    receipt: Prisma.InputJsonObject;
  },
) {
  owner = projectOwner(owner);
  if (!Number.isSafeInteger(input.actualCostCents) || input.actualCostCents < 0)
    throw new WorkAuthorityError("Invalid operation cost.");
  return withTransactionRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "external_effects" WHERE "id" = ${input.effectId} AND "spaceId" = ${owner.spaceId} FOR UPDATE`;
      const effect = await tx.externalEffect.findFirst({
        where: {
          id: input.effectId,
          runId: input.runId,
          spaceId: owner.spaceId,
          run: { userId: owner.userId },
          kind: "project_action",
        },
      });
      if (!effect) throw new IsolationError();
      if (effect.status === "completed" || effect.status === "failed") return effect.result;
      if (!["executing", "uncertain"].includes(effect.status))
        throw new WorkAuthorityError("Action is not dispatched.");
      const reservation = reservationFrom(effect.result);
      if (!reservation) throw new WorkAuthorityError("The action has no authority reservation.");
      const uncertain = input.status === "uncertain" || input.actualCostCents > reservation.cents;
      if (reservation.grantId && !uncertain) {
        const grant = await tx.workScopeGrant.findFirst({
          where: { id: reservation.grantId, ...owner },
        });
        if (!grant || grant.reservedCents < reservation.cents)
          throw new WorkAuthorityError("The action budget needs reconciliation.");
        await tx.workScopeGrant.update({
          where: { id: grant.id },
          data: {
            reservedCents: { decrement: reservation.cents },
            spentCents: { increment: input.actualCostCents },
          },
        });
      }
      const result = uncertain
        ? {
            __workScopeReservation: reservation,
            receipt: input.receipt,
            reconciliationRequired: true,
          }
        : input.receipt;
      await tx.externalEffect.update({
        where: { id: effect.id },
        data: {
          status: uncertain ? "uncertain" : input.status,
          result: result as Prisma.InputJsonObject,
        },
      });
      return result;
    }),
  );
}
