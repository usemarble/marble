import { z } from "zod";

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
] as const;

const audioSourcesSchema = z.array(
  z.object({ src: z.string(), type: z.string().optional() })
);

export function parseAudioSources(value: unknown) {
  const result = audioSourcesSchema.safeParse(value);
  return result.success ? result.data : [];
}
