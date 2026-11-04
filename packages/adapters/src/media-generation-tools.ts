import type {
  AdapterContext,
  GeneratedMedia,
  MediaGenerationProvider,
  MediaSource,
  MediaToolName,
  MediaVideoJob,
} from "@rakazo/adapter-kit";
import { MediaGenerationError } from "@rakazo/adapter-kit";
import type { MessageBlock } from "@rakazo/contracts";
import { messageBlockForArtifact } from "@rakazo/core";
import type { ExternalEffect, PrismaClient } from "@rakazo/db";
import { z } from "zod";
import { mediaPromptSchema, validateGeneratedMedia } from "./media-generation-provider.js";

const JOB_KIND = "media_generation_job";
const savedJob = z.object({
  provider: z.string(),
  jobId: z.string().optional(),
  artifactId: z.string().optional(),
  files: z.array(z.string()).optional(),
});
export async function generateMediaFromTool(options: {
  name: MediaToolName;
  args: Record<string, unknown>;
  executionId: string;
  /** Recover only persisted state; never submit a new billed generation. */
  recoverOnly?: boolean;
  provider: MediaGenerationProvider;
  prisma: PrismaClient;
  context: AdapterContext;
  loadSource?: (path: string) => Promise<MediaSource>;
  run: { id: string; threadId: string; botId: string; userId: string; spaceId: string };
  attach: (
    output: GeneratedMedia,
    name: string,
    job: { id: string; result: { provider: string; jobId?: string } },
  ) => Promise<{ artifactId: string; block: MessageBlock; files?: string[] }>;
  publish: (
    block: MessageBlock,
    jobId: string,
    artifactId: string,
    files?: string[],
  ) => Promise<unknown>;
}) {
  const { provider, prisma, context, run } = options;
  const args =
    options.name === "transcribe_media"
      ? { ...options.args, prompt: "Transcribe the recording." }
      : options.args;
  const video = options.name === "generate_video";
  const capable =
    options.name === "transcribe_media"
      ? provider.capabilities.transcription && provider.transcribe
      : options.name === "segment_image"
        ? provider.capabilities.segmentation && provider.segmentImage
        : video
          ? provider.capabilities.video
          : provider.capabilities.images;
  if (!capable) return { error: "Media generation is unavailable." };
  try {
    const withFiles = (artifactId: string, files?: string[]) => ({
      status: "completed" as const,
      artifactId,
      ...(files?.length ? { files } : {}),
    });
    let source: MediaSource | undefined;
    if (
      args.jobId !== undefined &&
      (!video ||
        typeof args.jobId !== "string" ||
        !args.jobId ||
        args.jobId.length > 200 ||
        args.prompt !== undefined)
    ) {
      return { error: "Use a prompt to submit or jobId alone to poll a video." };
    }
    let reservation: ExternalEffect | null = null;
    let polling = false;
    if (video && typeof args.jobId === "string") {
      reservation = await prisma.externalEffect.findFirst({
        where: {
          id: args.jobId,
          kind: JOB_KIND,
          spaceId: run.spaceId,
          run: { userId: run.userId, botId: run.botId, threadId: run.threadId },
        },
      });
      if (!reservation) return { error: "Video job is unavailable." };
      const saved = savedJob.safeParse(reservation.result);
      if (!saved.success || saved.data.provider !== provider.id)
        return {
          error:
            "Video job provider changed or submission is uncertain. Do not resubmit automatically.",
        };
      if (saved.data.artifactId && reservation.status === "media_completed")
        return withFiles(saved.data.artifactId, saved.data.files);
      if (reservation.status === "media_failed") return { status: "failed" };
      if (!saved.data.jobId && !saved.data.artifactId)
        return { error: "Submission is uncertain. Do not resubmit automatically." };
    } else {
      const prior = await prisma.externalEffect.findFirst({
        where: {
          runId: run.id,
          kind: JOB_KIND,
          request: { path: ["executionId"], equals: options.executionId },
        },
      });
      if (prior) {
        const saved = savedJob.safeParse(prior.result);
        if (saved.success && saved.data.artifactId) {
          if (prior.status === "media_completed")
            return withFiles(saved.data.artifactId, saved.data.files);
          reservation = prior;
        } else {
          if (video && saved.success && saved.data.jobId)
            return {
              jobId: prior.id,
              status: prior.status === "media_failed" ? "failed" : "queued",
            };
          if (options.recoverOnly) return undefined;
          return {
            jobId: prior.id,
            error: "Submission already attempted. Poll a video job; do not resubmit automatically.",
          };
        }
      }
      if (!reservation) {
        if (options.recoverOnly) return undefined;
        const input = mediaPromptSchema.safeParse(args);
        if (!input.success) return { error: "A prompt of 1–4000 characters is required." };
        if (["transcribe_media", "segment_image"].includes(options.name) && !input.data.sourcePath)
          return { error: "A sourcePath on the employee computer is required." };
        if (input.data.sourcePath) {
          if (video || (options.name === "generate_image" && !provider.capabilities.imageEditing))
            return { error: "This media model cannot use a source image." };
          if (!options.loadSource) return { error: "Source files are unavailable." };
          source = await options.loadSource(input.data.sourcePath);
        }
        // Processing inputs must leave room to generate from them in the same run.
        // Keep the existing shared image/video slots so upgrades preserve generation limits.
        const slotGroup = ["transcribe_media", "segment_image"].includes(options.name)
          ? `${run.id}:${options.name}`
          : run.id;
        // Unique slots keep each cap durable across concurrent calls and restarts.
        for (let slot = 0; slot < 2; slot++) {
          try {
            reservation = await prisma.externalEffect.create({
              data: {
                spaceId: run.spaceId,
                runId: run.id,
                kind: JOB_KIND,
                idempotencyKey: `media:${slotGroup}:${slot}`,
                status: "media_submitting",
                request: {
                  tool: options.name,
                  prompt: input.data.prompt,
                  ...(input.data.sourcePath ? { sourcePath: input.data.sourcePath } : {}),
                  ...(input.data.box ? { box: input.data.box } : {}),
                  executionId: options.executionId,
                },
                result: { provider: provider.id },
              },
            });
            break;
          } catch (error) {
            if (!(error && typeof error === "object" && "code" in error && error.code === "P2002"))
              throw error;
          }
        }
        if (!reservation)
          return {
            error: "Media submission limit reached for this operation (two attempts per run).",
          };
      }
    }
    const saved = savedJob.parse(reservation.result);
    if (saved.artifactId) {
      const artifact = await prisma.artifact.findFirst({
        where: { id: saved.artifactId, spaceId: run.spaceId, userId: run.userId, botId: run.botId },
      });
      if (!artifact) return { error: "Generated attachment is unavailable." };
      const block = messageBlockForArtifact(artifact);
      if (saved.files) await options.publish(block, reservation.id, artifact.id, saved.files);
      else await options.publish(block, reservation.id, artifact.id);
      return withFiles(artifact.id, saved.files);
    }
    if (video && typeof args.jobId === "string") {
      const claim = await prisma.externalEffect.updateMany({
        where: {
          id: reservation.id,
          OR: [
            { status: "media_pending" },
            { status: "media_polling", updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
          ],
        },
        data: { status: "media_polling" },
      });
      if (!claim.count)
        return options.recoverOnly
          ? { jobId: reservation.id, status: "running" }
          : {
              error:
                "Video job is already being checked or needs recovery. Do not resubmit automatically.",
            };
      polling = true;
    }
    let output: MediaVideoJob | { status: "completed"; output: GeneratedMedia };
    try {
      output = video
        ? saved.jobId
          ? await provider.pollVideo(saved.jobId, context)
          : await provider.generateVideo(mediaPromptSchema.parse(args), context)
        : {
            status: "completed" as const,
            output: await (options.name === "transcribe_media"
              ? provider.transcribe!
              : options.name === "segment_image"
                ? provider.segmentImage!
                : provider.generateImage
            ).call(
              provider,
              { ...mediaPromptSchema.parse(args), ...(source ? { source } : {}) },
              context,
            ),
          };
    } catch (error) {
      if (polling)
        await prisma.externalEffect.updateMany({
          where: { id: reservation.id, status: { not: "media_completed" } },
          data: { status: "media_pending" },
        });
      throw error;
    }
    if (video && "id" in output) {
      await prisma.externalEffect.updateMany({
        where: {
          id: reservation.id,
          status: { not: "media_completed" },
          result: { equals: saved },
        },
        data: {
          status:
            output.status === "failed"
              ? "media_failed"
              : output.status === "completed"
                ? "media_polling"
                : "media_pending",
          result: { provider: provider.id, jobId: output.id },
        },
      });
    }
    if (output.status !== "completed")
      return {
        jobId: reservation.id,
        status: output.status,
        ...("progress" in output ? { progress: output.progress } : {}),
      };
    const expected = video
      ? "video/mp4"
      : options.name === "transcribe_media"
        ? "application/json"
        : options.name === "segment_image"
          ? output.output.mimeType
          : "image/png";
    if (options.name === "segment_image" && !["image/png", "application/json"].includes(expected))
      throw new MediaGenerationError("provider_failure");
    validateGeneratedMedia(output.output, expected);
    context.signal.throwIfAborted();
    const attached = await options.attach(
      output.output,
      `generated-${reservation.id}.${output.output.mimeType === "application/json" ? "json" : video ? "mp4" : "png"}`,
      {
        id: reservation.id,
        result: { provider: provider.id, ...("id" in output ? { jobId: output.id } : {}) },
      },
    );
    if (attached.files)
      await options.publish(attached.block, reservation.id, attached.artifactId, attached.files);
    else await options.publish(attached.block, reservation.id, attached.artifactId);
    return withFiles(attached.artifactId, attached.files);
  } catch (error) {
    context.signal.throwIfAborted();
    return {
      error:
        error instanceof MediaGenerationError
          ? error.message
          : "Media generation failed. Submission may have been accepted; do not retry automatically.",
    };
  }
}
