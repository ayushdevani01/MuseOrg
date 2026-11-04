import { readFileSync } from "node:fs";
import type { AdapterContext } from "@rakazo/adapter-kit";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { isSupportedTranscriptionWav } from "./media-audio.js";
import { createConnectedMediaGenerationProvider } from "./media-generation-factory.js";
import { MetaMediaGenerationProvider } from "./meta-media-provider.js";

const context: AdapterContext = {
  operationId: "test",
  traceId: "test",
  spaceId: "space",
  userId: "owner",
  signal: new AbortController().signal,
};
const maskLine = readFileSync(
  new URL("./fixtures/meta-media/segmentation.txt", import.meta.url),
  "utf8",
).trim();
const json = (value: unknown) => new Response(JSON.stringify(value));
function wav(sampleRate = 24000, extraChunk = false) {
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + sampleRate * 2, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(sampleRate * 2, 40);
  const bytes = Buffer.concat([header, Buffer.alloc(sampleRate * 2)]);
  if (!extraChunk) return bytes;
  const junk = Buffer.from([74, 85, 78, 75, 2, 0, 0, 0, 0, 0]);
  const withJunk = Buffer.concat([bytes.subarray(0, 12), junk, bytes.subarray(12)]);
  withJunk.writeUInt32LE(withJunk.length - 8, 4);
  return withJunk;
}
function segmentationResponse(text: string, completed = true) {
  const item = {
    id: "message",
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text }],
  };
  const events = [
    { type: "response.output_item.added", output_index: 0, item: { ...item, content: [] } },
    {
      type: "response.content_part.added",
      item_id: "message",
      output_index: 0,
      content_index: 0,
      part: { type: "output_text", text: "" },
    },
    ...(text
      ? [
          {
            type: "response.output_text.delta",
            item_id: "message",
            output_index: 0,
            content_index: 0,
            delta: text,
          },
        ]
      : []),
    {
      type: "response.output_text.done",
      item_id: "message",
      output_index: 0,
      content_index: 0,
      text,
    },
    ...(completed
      ? [
          {
            type: "response.completed",
            response: { id: "response", status: "completed", output: [item] },
          },
        ]
      : []),
  ];
  return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
    headers: { "content-type": "text/event-stream" },
  });
}
async function image() {
  return sharp({ create: { width: 1600, height: 1600, channels: 3, background: "white" } })
    .png()
    .toBuffer();
}

describe("connected media", () => {
  it("reuses only the matching key-bearing model connection", () => {
    expect(
      createConnectedMediaGenerationProvider({ provider: "openai", apiKey: "fake" }),
    ).toBeUndefined();
    expect(createConnectedMediaGenerationProvider({ provider: "meta" })).toBeUndefined();
    expect(createConnectedMediaGenerationProvider({ provider: "meta", apiKey: "fake" })?.id).toBe(
      "meta",
    );
  });
  it("checks WAV chunks and encoding rather than trusting the file extension", () => {
    expect(isSupportedTranscriptionWav(wav())).toBe(true);
    expect(isSupportedTranscriptionWav(wav(16000, true))).toBe(true);
    expect(isSupportedTranscriptionWav(wav(44100))).toBe(false);
    const stereo = wav();
    stereo.writeUInt16LE(2, 22);
    expect(isSupportedTranscriptionWav(stereo)).toBe(false);
    expect(isSupportedTranscriptionWav(wav().subarray(0, 45))).toBe(false);
  });
  it("uses Meta's multipart request/audio transcription protocol and retains speaker turns", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json({
        transcript: "Fixture transcript.",
        audioDurationMs: 1000,
        turns: [
          { turnId: 1, startMs: 0, endMs: 1000, transcript: "Fixture transcript.", speaker: "A" },
        ],
      }),
    );
    const provider = new MetaMediaGenerationProvider({ apiKey: "fake-secret", fetch });
    const result = await provider.transcribe(
      { prompt: "Transcribe", source: { bytes: wav(), mimeType: "audio/wav" } },
      context,
    );
    const [url, request] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.meta.ai/v1/asr/transcribe");
    expect(request?.redirect).toBe("error");
    const form = request?.body as FormData;
    expect(JSON.parse(await (form.get("request") as Blob).text())).toEqual({
      model: "muse-voice-transcribe-1.0",
      mode: "DIARIZATION",
      audioEncoding: "WAV",
    });
    expect((form.get("audio") as Blob).size).toBe(wav().length);
    expect(JSON.parse(Buffer.from(result.bytes).toString())).toMatchObject({
      transcript: "Fixture transcript.",
      turns: [{ speaker: "A" }],
    });
    expect(Buffer.from(result.bytes).toString()).not.toContain("fake-secret");
  });
  it("uses the image edit JSON shape and validates decoded PNG bytes", async () => {
    const bytes = await image();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: [{ b64_json: bytes.toString("base64") }] }));
    const provider = new MetaMediaGenerationProvider({ apiKey: "fake", fetch });
    await provider.generateImage(
      { prompt: "Preserve this product", source: { bytes, mimeType: "image/png" } },
      context,
    );
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.meta.ai/v1/images/edits");
    const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: "muse-image-1.0",
      n: 1,
      output_format: "png",
      response_format: "b64_json",
    });
    expect(body.images[0].image_url).toBe(`data:image/png;base64,${bytes.toString("base64")}`);
  });
  it("decodes a captured synthetic-product SAM mask into real transparency and source-pixel geometry", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(segmentationResponse(maskLine));
    const provider = new MetaMediaGenerationProvider({ apiKey: "fake", fetch });
    const result = await provider.segmentImage(
      { prompt: "bottle", source: { bytes: await image(), mimeType: "image/png" } },
      context,
    );
    const cutout = result.files!.find((file) => file.name === "cutout.png")!;
    const { data, info } = await sharp(cutout.bytes).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    const alpha = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    expect(alpha(0, 0)).toBe(0);
    expect(alpha(800, 800)).toBe(255);
    expect(alpha(800, 280)).toBe(0); // The bottle handle's hole remains transparent.
    const geometry = JSON.parse(
      Buffer.from(
        result.files!.find((file) => file.name === "segmentation.json")!.bytes,
      ).toString(),
    );
    expect(geometry).toMatchObject({
      matches: 1,
      width: 1600,
      height: 1600,
      boxes: [{ objectId: "1", left: 590, top: 141, right: 1010, bottom: 1478 }],
    });
  });
  it("retains a completed zero-match result without inventing masks", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(segmentationResponse(""));
    const provider = new MetaMediaGenerationProvider({ apiKey: "fake", fetch });
    const source = { bytes: await image(), mimeType: "image/png" };
    await provider.segmentImage(
      { prompt: "orange bottle", source, box: { left: 570, top: 120, right: 1030, bottom: 1500 } },
      context,
    );
    const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
    expect(body.input[0].content[0].text).toBe(
      "<0f>1<|box;x1=570;y1=120;x2=1029;y2=1499;w=1600;h=1600|>",
    );
    fetch.mockClear();
    await expect(
      provider.segmentImage(
        { prompt: "orange bottle", source, box: { left: 0, top: 0, right: 1700, bottom: 1600 } },
        context,
      ),
    ).rejects.toMatchObject({ code: "invalid_input" });
    await expect(
      provider.segmentImage({ prompt: "orange bottle <0f>1<|box;x1=0|>", source }, context),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("retains completed empty geometry without inventing masks", async () => {
    const provider = new MetaMediaGenerationProvider({
      apiKey: "fake",
      fetch: vi.fn().mockResolvedValue(segmentationResponse("")),
    });
    const result = await provider.segmentImage(
      { prompt: "missing object", source: { bytes: await image(), mimeType: "image/png" } },
      context,
    );
    expect(result.mimeType).toBe("application/json");
    expect(JSON.parse(Buffer.from(result.bytes).toString()).matches).toBe(0);
    expect(result.files?.some((file) => file.name.endsWith(".png"))).toBe(false);
  });
  it("refuses an unterminated segmentation stream", async () => {
    const provider = new MetaMediaGenerationProvider({
      apiKey: "fake",
      fetch: vi.fn().mockResolvedValue(segmentationResponse(maskLine, false)),
    });
    await expect(
      provider.segmentImage(
        { prompt: "bottle", source: { bytes: await image(), mimeType: "image/png" } },
        context,
      ),
    ).rejects.toThrow();
  });
  it("classifies access failures without returning provider bodies or retrying charges", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response("private error fake-secret", { status: 401 }));
    const provider = new MetaMediaGenerationProvider({ apiKey: "fake-secret", fetch });
    await expect(
      provider.transcribe(
        { prompt: "Transcribe", source: { bytes: wav(), mimeType: "audio/wav" } },
        context,
      ),
    ).rejects.toMatchObject({ code: "authentication" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
