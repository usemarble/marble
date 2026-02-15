import type {
  MEDIA_FILTER_TYPES,
  MEDIA_SORTS,
  MEDIA_TYPES,
} from "@/lib/constants";

import type { QUERY_KEYS } from "@/lib/queries/keys";

export type MediaType = (typeof MEDIA_TYPES)[number];

export type MediaFilterType = (typeof MEDIA_FILTER_TYPES)[number];

export type UploadType = "avatar" | "logo" | "media";

export interface Media {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
}

export type MediaSort = (typeof MEDIA_SORTS)[number];

export type MediaQueryKey = [
  ...ReturnType<typeof QUERY_KEYS.MEDIA>,
  { type?: string; sort: MediaSort },
];

export interface MediaListResponse {
  media: Media[];
  nextCursor?: string;
  hasAnyMedia: boolean;
}

/** Response from POST /api/upload — returns a presigned URL and storage key */
export interface PresignedUrlResponse {
  url: string;
  key: string;
}

/** Response from POST /api/upload/complete for non-media types (avatar, logo) */
export interface UploadResponse {
  url: string;
}

/**
 * Maps each UploadType to its corresponding response from POST /api/upload/complete.
 * - avatar / logo → UploadResponse (just a public URL)
 * - media → Media (includes id, name, size, type, etc.)
 */
export interface UploadResponseMap {
  avatar: UploadResponse;
  logo: UploadResponse;
  media: Media;
}
