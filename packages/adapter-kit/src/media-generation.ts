import type { AdapterContext } from "./types.js";

export type MediaSource = { bytes: Uint8Array; mimeType: string };
export type MediaGenerationInput = {
  prompt: string;
  source?: MediaSource;
};
export type MediaToolName =
  | "generate_image"
  | "generate_video"
  | "transcribe_media"
  | "segment_image";
export type MediaFile = {
  name: string;
  bytes: Uint8Array;
};
export type GeneratedMedia = {
  bytes: Uint8Array;
  mimeType: "image/png" | "video/mp4" | "application/json";
  /** Additional source/derived files, retained on the employee's shared computer. */
  files?: MediaFile[];
};
export type MediaVideoJob =
  | { id: string; status: "queued" | "running"; progress?: number }
  | { id: string; status: "completed"; output: GeneratedMedia }
  | { id: string; status: "failed" };
export interface MediaGenerationProvider {
  readonly id: string;
  readonly capabilities: {
    images: boolean;
    video: boolean;
    offline: boolean;
    imageEditing?: boolean;
    transcription?: boolean;
    segmentation?: boolean;
  };
  generateImage(input: MediaGenerationInput, context: AdapterContext): Promise<GeneratedMedia>;
  transcribe?(input: MediaGenerationInput, context: AdapterContext): Promise<GeneratedMedia>;
  segmentImage?(input: MediaGenerationInput, context: AdapterContext): Promise<GeneratedMedia>;
  generateVideo(input: MediaGenerationInput, context: AdapterContext): Promise<MediaVideoJob>;
  pollVideo(id: string, context: AdapterContext): Promise<MediaVideoJob>;
}
export type MediaGenerationErrorCode =
  | "invalid_input"
  | "unsupported"
  | "authentication"
  | "rate_limit"
  | "provider_failure"
  | "output_limit";
export class MediaGenerationError extends Error {
  constructor(public readonly code: MediaGenerationErrorCode) {
    super(`Media generation: ${code}`);
    this.name = "MediaGenerationError";
  }
}
