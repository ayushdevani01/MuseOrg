import { createHash } from "node:crypto";
import { decodeMaskToRaster, parseImageStream, recordsOfKind } from "@meta-sam/parser";
import type {
  AdapterContext,
  GeneratedMedia,
  MediaGenerationInput,
  MediaGenerationProvider,
  MediaSource,
  MediaVideoJob,
} from "@rakazo/adapter-kit";
import { MediaGenerationError } from "@rakazo/adapter-kit";
import { ATTACHMENT_MAX_BYTES } from "@rakazo/contracts";
import sharp from "sharp";
import { z } from "zod";
import { isSupportedTranscriptionWav } from "./media-audio.js";
import { boundedMediaBytes, mediaPromptSchema } from "./media-generation-provider.js";

const API = "https://api.meta.ai/v1";
const MAX_PIXELS = 16_000_000;
const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value, null, 2));
const sourceHash = (source: MediaSource) => createHash("sha256").update(source.bytes).digest("hex");
const transcriptSchema = z.object({
  transcript: z.string().max(100_000),
  audioDurationMs: z.number().nonnegative(),
  turns: z
    .array(
      z.object({
        turnId: z.number(),
        startMs: z.number(),
        endMs: z.number(),
        transcript: z.string(),
        speaker: z.string().optional(),
      }),
    )
    .max(5000)
    .default([]),
});

function sourceInput(input: MediaGenerationInput): MediaSource {
  if (!input.source?.bytes.byteLength || input.source.bytes.byteLength > ATTACHMENT_MAX_BYTES)
    throw new MediaGenerationError("invalid_input");
  return input.source;
}

async function* responseEvents(text: string) {
  for (const block of text.replaceAll("\r\n", "\n").split("\n\n")) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") continue;
    const event = JSON.parse(data) as { type: string };
    if (typeof event.type !== "string") throw new MediaGenerationError("provider_failure");
    yield event;
  }
}

/** Vendor translation only. The run's existing encrypted model connection supplies its key. */
export class MetaMediaGenerationProvider implements MediaGenerationProvider {
  readonly id = "meta";
  readonly capabilities = {
    images: true,
    video: false,
    offline: false,
    imageEditing: true,
    transcription: true,
    segmentation: true,
  };
  constructor(
    private readonly options: {
      apiKey: string;
      fetch?: typeof fetch;
      models?: { image?: string; transcription?: string; segmentation?: string };
    },
  ) {}

  private async request(path: string, context: AdapterContext, body: unknown, multipart = false) {
    context.signal.throwIfAborted();
    try {
      const response = await (this.options.fetch ?? fetch)(`${API}/${path}`, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          ...(!multipart ? { "Content-Type": "application/json" } : {}),
        },
        body: multipart ? (body as FormData) : JSON.stringify(body),
        signal: AbortSignal.any([context.signal, AbortSignal.timeout(240_000)]),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new MediaGenerationError(
          response.status === 429
            ? "rate_limit"
            : [401, 403].includes(response.status)
              ? "authentication"
              : "provider_failure",
        );
      }
      return response;
    } catch (error) {
      context.signal.throwIfAborted();
      if (error instanceof MediaGenerationError) throw error;
      throw new MediaGenerationError("provider_failure");
    }
  }

  async generateImage(
    input: MediaGenerationInput,
    context: AdapterContext,
  ): Promise<GeneratedMedia> {
    const { prompt } = mediaPromptSchema.parse(input);
    const model = this.options.models?.image ?? "muse-image-1.0";
    const source = input.source;
    if (source) await sharp(sourceInput(input).bytes, { limitInputPixels: MAX_PIXELS }).metadata();
    const response = await this.request(source ? "images/edits" : "images/generations", context, {
      model,
      prompt,
      n: 1,
      output_format: "png",
      response_format: "b64_json",
      ...(source
        ? {
            images: [
              {
                image_url: `data:${source.mimeType};base64,${Buffer.from(source.bytes).toString("base64")}`,
              },
            ],
          }
        : {}),
    });
    const body = z
      .object({ data: z.array(z.object({ b64_json: z.string().min(1) })).length(1) })
      .parse(
        JSON.parse(
          new TextDecoder().decode(await boundedMediaBytes(response, ATTACHMENT_MAX_BYTES * 2)),
        ),
      );
    const bytes = Buffer.from(body.data[0]!.b64_json, "base64");
    if (!bytes.length || bytes.length > ATTACHMENT_MAX_BYTES)
      throw new MediaGenerationError("output_limit");
    const metadata = await sharp(bytes, { limitInputPixels: MAX_PIXELS }).metadata();
    if (metadata.format !== "png" || !metadata.width || !metadata.height)
      throw new MediaGenerationError("provider_failure");
    return {
      bytes,
      mimeType: "image/png",
      files: [
        {
          name: "receipt.json",
          bytes: jsonBytes({
            provider: this.id,
            model,
            operation: source ? "edit" : "generate",
            width: metadata.width,
            height: metadata.height,
            ...(source ? { sourceSha256: sourceHash(source) } : {}),
          }),
        },
      ],
    };
  }

  async transcribe(input: MediaGenerationInput, context: AdapterContext): Promise<GeneratedMedia> {
    const source = sourceInput(input);
    if (!isSupportedTranscriptionWav(source.bytes)) throw new MediaGenerationError("invalid_input");
    const model = this.options.models?.transcription ?? "muse-voice-transcribe-1.0";
    const body = new FormData();
    body.set(
      "request",
      new Blob([JSON.stringify({ model, mode: "DIARIZATION", audioEncoding: "WAV" })], {
        type: "application/json",
      }),
    );
    body.set(
      "audio",
      new Blob([new Uint8Array(source.bytes)], { type: "audio/wav" }),
      "recording.wav",
    );
    const response = await this.request("asr/transcribe", context, body, true);
    const transcript = transcriptSchema.parse(
      JSON.parse(new TextDecoder().decode(await boundedMediaBytes(response, 1_000_000))),
    );
    return {
      mimeType: "application/json",
      bytes: jsonBytes({
        provider: this.id,
        model,
        sourceSha256: sourceHash(source),
        ...transcript,
      }),
      files: [{ name: "transcript.txt", bytes: new TextEncoder().encode(transcript.transcript) }],
    };
  }

  async segmentImage(
    input: MediaGenerationInput,
    context: AdapterContext,
  ): Promise<GeneratedMedia> {
    const source = sourceInput(input);
    const prompt = mediaPromptSchema.parse(input).prompt;
    const original = sharp(source.bytes, { limitInputPixels: MAX_PIXELS }).rotate();
    const normalized = await original.png().toBuffer({ resolveWithObject: true });
    const { width, height } = normalized.info;
    const model = this.options.models?.segmentation ?? "sam-3.1";
    const response = await this.request("responses", context, {
      model,
      store: false,
      stream: true,
      metadata: { mask_encoding: "one_bit" },
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${normalized.data.toString("base64")}`,
            },
          ],
        },
      ],
    });
    const streamText = new TextDecoder().decode(await boundedMediaBytes(response, 2_000_000));
    const parsed = await parseImageStream(responseEvents(streamText)).finalResult;
    if (parsed.outcome.status !== "completed" || parsed.diagnostics.length)
      throw new MediaGenerationError("provider_failure");
    const masks = recordsOfKind(parsed.records, "mask");
    const metadata = {
      provider: this.id,
      model,
      sourceSha256: sourceHash(source),
      width,
      height,
      matches: masks.length,
      boxes: recordsOfKind(parsed.records, "box"),
      outcome: parsed.outcome,
    };
    const files = [
      { name: "segmentation.json", bytes: jsonBytes(metadata) },
      { name: "segmentation.txt", bytes: new TextEncoder().encode(parsed.rawOutput) },
    ];
    if (!masks.length) return { bytes: jsonBytes(metadata), mimeType: "application/json", files };
    if (masks.length > 16) throw new MediaGenerationError("output_limit");
    const alpha = Buffer.alloc(width * height);
    for (const record of masks) {
      context.signal.throwIfAborted();
      const { left, top, right, bottom } = record.bounds;
      const maskWidth = right - left,
        maskHeight = bottom - top;
      if (
        !Number.isInteger(maskWidth) ||
        !Number.isInteger(maskHeight) ||
        maskWidth < 1 ||
        maskHeight < 1 ||
        left < 0 ||
        top < 0 ||
        right > width ||
        bottom > height ||
        record.mask.width * record.mask.height > MAX_PIXELS
      )
        throw new MediaGenerationError("provider_failure");
      const raster = decodeMaskToRaster(record.mask);
      const scaled = await sharp(Buffer.from(raster.map((value) => (value ? 255 : 0))), {
        raw: { width: record.mask.width, height: record.mask.height, channels: 1 },
      })
        .resize(maskWidth, maskHeight, { kernel: "nearest" })
        .greyscale()
        .raw()
        .toBuffer();
      if (scaled.length !== maskWidth * maskHeight)
        throw new MediaGenerationError("provider_failure");
      for (let y = 0; y < maskHeight; y++)
        for (let x = 0; x < maskWidth; x++) {
          if (scaled[y * maskWidth + x]) alpha[(top + y) * width + left + x] = 255;
        }
    }
    const maskPng = await sharp(alpha, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer();
    const rgb = await sharp(normalized.data).removeAlpha().toColourspace("srgb").raw().toBuffer();
    if (rgb.length !== width * height * 3) throw new MediaGenerationError("provider_failure");
    const cutoutPixels = Buffer.alloc(width * height * 4);
    const overlayPixels = Buffer.alloc(width * height * 4);
    for (let i = 0; i < alpha.length; i++) {
      cutoutPixels[i * 4] = rgb[i * 3]!;
      cutoutPixels[i * 4 + 1] = rgb[i * 3 + 1]!;
      cutoutPixels[i * 4 + 2] = rgb[i * 3 + 2]!;
      cutoutPixels[i * 4 + 3] = alpha[i]!;
      overlayPixels[i * 4] = 0;
      overlayPixels[i * 4 + 1] = 160;
      overlayPixels[i * 4 + 2] = 210;
      overlayPixels[i * 4 + 3] = alpha[i] ? 90 : 0;
    }
    const cutout = await sharp(cutoutPixels, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();
    const overlay = await sharp(normalized.data)
      .composite([{ input: overlayPixels, raw: { width, height, channels: 4 } }])
      .png()
      .toBuffer();
    files.push({ name: "mask.png", bytes: maskPng }, { name: "cutout.png", bytes: cutout });
    return { bytes: overlay, mimeType: "image/png", files };
  }

  async generateVideo(
    _input: MediaGenerationInput,
    _context: AdapterContext,
  ): Promise<MediaVideoJob> {
    throw new MediaGenerationError("unsupported");
  }
  async pollVideo(_id: string, _context: AdapterContext): Promise<MediaVideoJob> {
    throw new MediaGenerationError("unsupported");
  }
}
