import { createHash } from "node:crypto";
import { ATTACHMENT_MAX_BYTES } from "@rakazo/contracts";
import { inferAttachmentMimeType, isBackgroundRunTrigger } from "@rakazo/core";
import { resolveBotWorkspacePath } from "./computer-support.js";
import { desktopProtectionGuardMessage } from "./desktop-command-guard.js";
import { protectedActivateScriptWriteRefusal } from "./desktop-guard-words.js";
import { isSupportedTranscriptionWav } from "./media-audio.js";
import { generateMediaFromTool } from "./media-generation-tools.js";
import type { RunContext } from "./run-context.js";
import { persistMessageInTransaction, publishMessage } from "./run-messages.js";
import type { ToolCall, ToolHandlers } from "./run-tool-gate.js";
import { recordComputerAction } from "./run-tools-computer.js";
import { attachWorkspaceFileToThread } from "./thread-artifacts.js";
import { textContentArg } from "./tool-text.js";
import type { RunWorkspace } from "./workspace-file-tools.js";
import { listFilesFromTool, readFileFromTool, renderPlotFromTool } from "./workspace-file-tools.js";

function runWorkspace(ctx: RunContext, call: ToolCall): RunWorkspace {
  return {
    botId: ctx.bot.id,
    computerMode: ctx.computer.mode,
    computer: () => ctx.computer.get("tool", call.name),
    markDirty: () => ctx.computer.checkpoint.markDirty(),
    context: ctx.context,
    runSecrets: ctx.secrets,
  };
}

/** Run native media work, or recover only a job an earlier attempt already started. */
export async function callMediaTool(ctx: RunContext, call: ToolCall, recoverOnly = false) {
  const { deps, run, bot, thread, context } = ctx;
  const { name, args, executionId, applied } = call;
  const mediaGeneration = ctx.providers.mediaGeneration;
  if (
    (name !== "generate_image" &&
      name !== "generate_video" &&
      name !== "transcribe_media" &&
      name !== "segment_image") ||
    isBackgroundRunTrigger(run.trigger) ||
    !mediaGeneration ||
    !deps.artifacts
  )
    return { error: "Media generation is unavailable." };
  const artifacts = deps.artifacts;
  return generateMediaFromTool({
    name,
    args,
    executionId: applied?.effect.id ?? executionId,
    recoverOnly,
    provider: mediaGeneration,
    prisma: deps.prisma,
    context,
    run,
    loadSource: async (sourcePath) => {
      const computer = await ctx.computer.get("tool", name);
      const storedPath = resolveBotWorkspacePath(ctx.computer.mode, bot.id, sourcePath);
      const mimeType = inferAttachmentMimeType(sourcePath);
      if (
        !mimeType ||
        !(name === "transcribe_media"
          ? /^(audio|video)\//.test(mimeType)
          : /^image\/(png|jpeg|webp)$/.test(mimeType))
      )
        throw new Error("Unsupported source media type.");
      let bytes = await deps.sandbox.readFile(computer, storedPath, context, {
        maxBytes: ATTACHMENT_MAX_BYTES,
      });
      if (name !== "transcribe_media" || isSupportedTranscriptionWav(bytes))
        return { bytes, mimeType };
      const suffix = createHash("sha256")
        .update(`${run.id}:${executionId}`)
        .digest("hex")
        .slice(0, 24);
      const normalizedPath = resolveBotWorkspacePath(
        ctx.computer.mode,
        bot.id,
        `shared/media-input-${suffix}.wav`,
      );
      ctx.computer.checkpoint.markDirty();
      await deps.sandbox.writeFile(
        computer,
        { path: normalizedPath, content: new Uint8Array() },
        context,
      );
      let exit: number | undefined;
      for await (const event of deps.sandbox.execute(
        computer,
        {
          argv: [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            storedPath,
            "-t",
            "601",
            "-vn",
            "-ac",
            "1",
            "-ar",
            "24000",
            "-c:a",
            "pcm_s16le",
            "-map_metadata",
            "-1",
            normalizedPath,
          ],
          timeoutMs: 90_000,
        },
        context,
      ))
        if (event.type === "exit") exit = event.code;
      if (exit !== 0)
        throw new Error(
          "Audio conversion failed. The computer needs FFmpeg and a decodable audio track.",
        );
      bytes = await deps.sandbox.readFile(computer, normalizedPath, context, {
        maxBytes: ATTACHMENT_MAX_BYTES,
      });
      if (!isSupportedTranscriptionWav(bytes))
        throw new Error("Use a recording of at most ten minutes.");
      return { bytes, mimeType: "audio/wav" };
    },
    attach: async (output, fileName, job) => {
      let files: string[] | undefined;
      if (output.files?.length) {
        if (
          output.files.length > 18 ||
          output.files.some((file) => !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(file.name)) ||
          output.files.reduce(
            (size, file) => size + file.bytes.byteLength,
            output.bytes.byteLength,
          ) > ATTACHMENT_MAX_BYTES
        )
          throw new Error("Derived media exceeds the output limit.");
        const directory = `shared/media/${job.id}`;
        const allFiles = [{ name: fileName, bytes: output.bytes }, ...output.files];
        const computer = await ctx.computer.get("tool", name);
        ctx.computer.checkpoint.markDirty();
        files = [];
        for (const file of allFiles) {
          const path = `${directory}/${file.name}`;
          await deps.sandbox.writeFile(
            computer,
            {
              path: resolveBotWorkspacePath(ctx.computer.mode, bot.id, path),
              content: file.bytes,
            },
            context,
          );
          files.push(path);
        }
      }
      const attached = await attachWorkspaceFileToThread(
        { prisma: deps.prisma, artifacts, maxUploadSizeBytes: deps.maxUploadSizeBytes },
        {
          spaceId: run.spaceId,
          userId: run.userId,
          botId: bot.id,
          groupId: thread.groupId ?? undefined,
          runId: run.id,
          filePath: fileName,
          bytes: output.bytes,
          operationId: executionId,
          onAttached: async (tx, artifact) => {
            const checkpointed = await tx.externalEffect.updateMany({
              where: {
                id: job.id,
                status: { not: "media_completed" },
                result: { equals: job.result },
              },
              data: {
                status: "media_polling",
                result: { ...job.result, artifactId: artifact.id, ...(files ? { files } : {}) },
              },
            });
            if (!checkpointed.count) throw new Error("Media attachment was already checkpointed");
          },
        },
      );
      return { ...attached, ...(files ? { files } : {}) };
    },
    publish: async (block, jobId, artifactId, files) => {
      const committed = await deps.prisma.$transaction(async (tx) => {
        // Commit completion with the message so a restarted poll cannot post twice.
        const claimed = await tx.externalEffect.updateMany({
          where: { id: jobId, status: { not: "media_completed" } },
          data: {
            status: "media_completed",
            result: { provider: mediaGeneration.id, artifactId, ...(files ? { files } : {}) },
          },
        });
        if (!claimed.count) return null;
        return persistMessageInTransaction(tx, run, "bot", [block]);
      });
      if (committed)
        await deps.events
          .notify(run.threadId, committed.eventSeq, committed.firstResponseRunId)
          .catch(() => undefined);
    },
  });
}

async function generateMedia(ctx: RunContext, call: ToolCall) {
  return call.finish(await callMediaTool(ctx, call));
}

/** Workspace files, attachments, plots and generated media. */
export const fileTools: ToolHandlers = {
  async list_files(ctx, call) {
    const { deps } = ctx;
    const { args } = call;
    const workspace = runWorkspace(ctx, call);
    return listFilesFromTool(deps.sandbox, workspace, args);
  },
  async read_file(ctx, call) {
    const { deps } = ctx;
    const { args } = call;
    const workspace = runWorkspace(ctx, call);
    return readFileFromTool(deps.sandbox, workspace, args);
  },
  async write_file(ctx, call) {
    const { deps, bot, context } = ctx;
    const { name, args } = call;
    const filePath = String(args.path ?? "notes/result.txt");
    if (ctx.computer.graphical) {
      const activateRefusal = protectedActivateScriptWriteRefusal(filePath);
      if (activateRefusal) {
        return call.finish({ error: desktopProtectionGuardMessage(activateRefusal) });
      }
    }
    const content = new TextEncoder().encode(textContentArg(args.content, ""));
    ctx.computer.checkpoint.markDirty();
    try {
      await deps.sandbox.writeFile(
        await ctx.computer.get("tool", name),
        { path: resolveBotWorkspacePath(ctx.computer.mode, bot.id, filePath), content },
        context,
      );
    } catch (error) {
      await recordComputerAction(ctx, call, "write_file", filePath, {
        error: error instanceof Error ? error.message : "could not write file",
      });
      throw error;
    }
    await recordComputerAction(ctx, call, "write_file", filePath, { bytes: content.byteLength });
    return call.finish({ ok: true, path: filePath });
  },
  generate_image: generateMedia,
  generate_video: generateMedia,
  transcribe_media: generateMedia,
  segment_image: generateMedia,
  async render_plot(ctx, call) {
    const { deps, run } = ctx;
    const { args, executionId } = call;
    const workspace = runWorkspace(ctx, call);
    return renderPlotFromTool(deps, run, args, executionId, workspace, call.finish);
  },
  async attach_file(ctx, call) {
    const { deps, run, bot, thread, context } = ctx;
    const { name, args, executionId } = call;
    const filePath = String(args.path ?? "");
    const failAttach = async (error: string) => {
      await recordComputerAction(ctx, call, "attach_file", filePath, { error });
      return call.finish({ error, path: filePath });
    };
    if (!deps.artifacts) return failAttach("artifact storage unavailable");
    const storedPath = resolveBotWorkspacePath(ctx.computer.mode, bot.id, filePath);
    let bytes: Uint8Array;
    try {
      bytes = await deps.sandbox.readFile(
        await ctx.computer.get("tool", name),
        storedPath,
        context,
        {
          maxBytes: deps.maxUploadSizeBytes ?? ATTACHMENT_MAX_BYTES,
        },
      );
    } catch {
      return failAttach("file not found or unreadable");
    }
    const mimeType = inferAttachmentMimeType(filePath);
    if (!mimeType) return failAttach("unsupported attachment type");
    try {
      const attached = await attachWorkspaceFileToThread(
        {
          prisma: deps.prisma,
          artifacts: deps.artifacts,
          maxUploadSizeBytes: deps.maxUploadSizeBytes,
        },
        {
          spaceId: run.spaceId,
          userId: run.userId,
          botId: bot.id,
          groupId: thread.groupId ?? undefined,
          runId: run.id,
          filePath,
          bytes,
          operationId: executionId,
          name: typeof args.name === "string" ? args.name : undefined,
          description: typeof args.description === "string" ? args.description : undefined,
        },
      );
      await publishMessage(deps, run, "bot", [attached.block]);
      await recordComputerAction(ctx, call, "attach_file", filePath);
      return call.finish({ ok: true, artifactId: attached.artifactId, path: filePath });
    } catch (error) {
      return failAttach(error instanceof Error ? error.message : "could not attach file");
    }
  },
};
