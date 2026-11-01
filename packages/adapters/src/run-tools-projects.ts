import { createHash } from "node:crypto";
import type { WorkDeliveryContext } from "@rakazo/adapter-kit";
import { runContinueJob } from "@rakazo/adapter-kit";
import { ProjectActionInputSchema, ProjectPatchSchema } from "@rakazo/contracts";
import {
  inspectWorkAction,
  linkProjectRun,
  listWorkProjects,
  ownedWorkProject,
  registerProjectOutput,
  reserveWorkAction,
  reviseWorkProject,
  settleWorkAction,
  toWorkProjectDto,
} from "@rakazo/db";
import { z } from "zod";
import { resolveBotWorkspacePath } from "./computer-support.js";
import type { RunContext } from "./run-context.js";
import type { ToolCall, ToolHandlers } from "./run-tool-gate.js";

export async function inspectProjectTool(ctx: RunContext, args: unknown, intentKey = "validation") {
  if (!ctx.deps.workDelivery) throw new Error("No delivery connection is configured.");
  const inspected = await inspectWorkAction(ctx.deps.prisma, ctx.context, ctx.bot.id, args);
  const files = Array.isArray(inspected.intent.payload.files) ? inspected.intent.payload.files : [];
  const context: WorkDeliveryContext = {
    ...ctx.context,
    botId: ctx.bot.id,
    runId: ctx.runId,
    intentKey,
    allowedPaths:
      inspected.grant?.allowedPaths ??
      files.map((file) =>
        typeof file === "object" &&
        file !== null &&
        !Array.isArray(file) &&
        typeof file.path === "string"
          ? file.path
          : "",
      ),
  };
  await ctx.deps.workDelivery.validate(inspected.intent, context);
  return { ...inspected, context };
}

export async function reconcileProjectTool(ctx: RunContext, call: ToolCall, effectId: string) {
  // Reconciliation only observes the frozen destination. Revocation/revision changes must
  // not prevent finding the receipt for an already-dispatched action.
  const intent = ProjectActionInputSchema.parse(call.args);
  const receipt = await ctx.deps.workDelivery?.reconcile(intent, {
    ...ctx.context,
    botId: ctx.bot.id,
    runId: ctx.runId,
    intentKey: call.effectKey,
    allowedPaths: [],
  });
  if (!receipt) return undefined;
  return settleWorkAction(ctx.deps.prisma, ctx.context, {
    effectId,
    runId: ctx.runId,
    status: "completed",
    actualCostCents: receipt.actualCostCents,
    receipt: z.record(z.string(), z.json()).parse(receipt),
  });
}

export const projectToolHandlers: ToolHandlers = {
  async project_reconcile(ctx, call) {
    const effect = await ctx.deps.prisma.externalEffect.findFirst({
      where: {
        id: String(call.args.actionId),
        spaceId: ctx.run.spaceId,
        kind: "project_action",
        run: { userId: ctx.run.userId, botId: ctx.bot.id },
      },
    });
    if (!effect) return { error: "Unknown project action." };
    if (["completed", "failed"].includes(effect.status)) return effect.result;
    if (!["executing", "uncertain"].includes(effect.status) || !effect.result)
      return { error: "This action has no dispatched reservation to reconcile." };
    const intent = ProjectActionInputSchema.parse(effect.request);
    const receipt = await ctx.deps.workDelivery?.reconcile(intent, {
      ...ctx.context,
      botId: ctx.bot.id,
      runId: effect.runId,
      intentKey: effect.idempotencyKey,
      allowedPaths: [],
    });
    if (!receipt)
      return {
        actionId: effect.id,
        uncertain: true,
        error: "No verified receipt yet. No write was retried.",
      };
    return settleWorkAction(ctx.deps.prisma, ctx.context, {
      effectId: effect.id,
      runId: effect.runId,
      status: "completed",
      actualCostCents: receipt.actualCostCents,
      receipt: z.record(z.string(), z.json()).parse(receipt),
    });
  },
  async project_read(ctx, call) {
    const owner = { spaceId: ctx.run.spaceId, userId: ctx.run.userId };
    const assigned = await listWorkProjects(ctx.deps.prisma, owner, ctx.bot.id);
    if (!call.args.projectId)
      return {
        projects: assigned.map(toWorkProjectDto),
        connections: (await ctx.deps.workDelivery?.connections(ctx.context)) ?? [],
      };
    const project = assigned.find((p) => p.id === call.args.projectId);
    if (!project) return { error: "This coworker is not assigned to the project." };
    await linkProjectRun(ctx.deps.prisma, owner, {
      projectId: project.id,
      runId: ctx.runId,
      botId: ctx.bot.id,
      inputKeys: Array.isArray(call.args.inputKeys) ? call.args.inputKeys.map(String) : undefined,
    });
    const [outputs, grants] = await Promise.all([
      ctx.deps.prisma.workProjectOutput.findMany({
        where: { ...owner, projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      ctx.deps.prisma.workScopeGrant.findMany({
        where: {
          ...owner,
          projectId: project.id,
          botIds: { has: ctx.bot.id },
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    return {
      project: toWorkProjectDto(project),
      outputs,
      grants,
      connections: (await ctx.deps.workDelivery?.connections(ctx.context)) ?? [],
    };
  },
  async project_revise(ctx, call) {
    // Only an exact human approval reaches this handler; models cannot grant authority.
    if (call.applied?.effect.status !== "approved")
      return { error: "The owner must approve this exact project correction." };
    const project = await ownedWorkProject(
      ctx.deps.prisma,
      ctx.context,
      String(call.args.projectId),
    );
    if (!project.botIds.includes(ctx.bot.id))
      return { error: "This coworker is not assigned to the project." };
    const result = await reviseWorkProject(ctx.deps.prisma, ctx.context, {
      projectId: project.id,
      expectedRevision: Number(call.args.expectedRevision),
      patch: ProjectPatchSchema.parse(call.args.patch),
    });
    await Promise.allSettled(
      (result.notifications ?? []).map((notice) =>
        ctx.deps.jobs.enqueue(runContinueJob(notice.runId)),
      ),
    );
    return call.finish({
      project: toWorkProjectDto(result.project),
      changedKeys: result.changedKeys,
    });
  },
  async project_output(ctx, call) {
    const projectId = String(call.args.projectId);
    const inputKeys = Array.isArray(call.args.inputKeys) ? call.args.inputKeys.map(String) : [];
    await linkProjectRun(ctx.deps.prisma, ctx.context, {
      projectId,
      runId: ctx.runId,
      botId: ctx.bot.id,
      inputKeys,
    });
    const path = String(call.args.path);
    const bytes = await ctx.deps.sandbox.readFile(
      await ctx.computer.get("tool", call.name),
      resolveBotWorkspacePath(ctx.computer.mode, ctx.bot.id, path),
      ctx.context,
      { maxBytes: ctx.deps.maxUploadSizeBytes ?? 20_000_000 },
    );
    const result = await registerProjectOutput(ctx.deps.prisma, ctx.context, {
      projectId,
      revision: Number(call.args.revision),
      botId: ctx.bot.id,
      runId: ctx.runId,
      key: String(call.args.key),
      reference: path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      inputKeys,
    });
    return call.finish(result);
  },
  async project_action(ctx, call) {
    const inspected = await inspectProjectTool(ctx, call.args, call.effectKey);
    if (!call.applied) throw new Error("Missing project action journal.");
    await reserveWorkAction(ctx.deps.prisma, ctx.context, {
      runId: ctx.runId,
      botId: ctx.bot.id,
      effectId: call.applied.effect.id,
      intent: inspected.intent,
      exactApproval: call.applied.effect.status === "approved",
    });
    try {
      const receipt = await ctx.deps.workDelivery!.execute(inspected.intent, inspected.context);
      return await settleWorkAction(ctx.deps.prisma, ctx.context, {
        effectId: call.applied.effect.id,
        runId: ctx.runId,
        status: "completed",
        actualCostCents: receipt.actualCostCents,
        receipt: z.record(z.string(), z.json()).parse(receipt),
      });
    } catch {
      // A lost HTTP reply does not prove the write failed. Keep its budget reserved.
      return settleWorkAction(ctx.deps.prisma, ctx.context, {
        effectId: call.applied.effect.id,
        runId: ctx.runId,
        status: "uncertain",
        actualCostCents: 0,
        receipt: {
          actionId: call.applied.effect.id,
          uncertain: true,
          error:
            "Delivery outcome needs reconciliation. Read the destination before another proposal.",
        },
      });
    }
  },
};
