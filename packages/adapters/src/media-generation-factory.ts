import type { MediaGenerationProvider } from "@rakazo/adapter-kit";
import {
  FakeMediaGenerationProvider,
  FalMediaGenerationProvider,
} from "./media-generation-provider.js";
import { MetaMediaGenerationProvider } from "./meta-media-provider.js";

/** Reuse the selected connection without adding a second credential or vendor environment setting. */
export function createConnectedMediaGenerationProvider(connection: {
  provider: string;
  apiKey?: string;
}): MediaGenerationProvider | undefined {
  return connection.provider === "meta" && connection.apiKey
    ? new MetaMediaGenerationProvider({ apiKey: connection.apiKey })
    : undefined;
}

export function createMediaGenerationProvider(
  env: NodeJS.ProcessEnv = process.env,
): MediaGenerationProvider | undefined {
  const kind = env.MEDIA_GENERATION_PROVIDER?.trim().toLowerCase();
  if (!kind || kind === "disabled") return undefined;
  if (kind === "fake") return new FakeMediaGenerationProvider();
  if (kind !== "fal") throw new Error("Unknown media generation provider");
  const apiKey = env.MEDIA_GENERATION_API_KEY?.trim();
  const imageModel = env.MEDIA_GENERATION_IMAGE_MODEL?.trim();
  const videoModel = env.MEDIA_GENERATION_VIDEO_MODEL?.trim();
  if (!apiKey || (!imageModel && !videoModel))
    throw new Error("Media generation requires credentials and at least one model");
  return new FalMediaGenerationProvider({
    apiKey,
    imageModel,
    videoModel,
    baseUrl: env.MEDIA_GENERATION_BASE_URL,
  });
}
