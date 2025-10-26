import type {
  MEDIA_FILTER_TYPES,
  MEDIA_SORTS,
  MEDIA_TYPES,
} from "@/lib/constants";

import type { QUERY_KEYS } from "@/lib/queries/keys";

export type MediaType = (typeof MEDIA_TYPES)[number];

export type MediaFilterType = (typeof MEDIA_FILTER_TYPES)[number];

export type UploadType = "avatar" | "author-avatar" | "logo" | "media";

export type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};

export type MediaSort = (typeof MEDIA_SORTS)[number];

export type MediaQueryKey = [
  ...ReturnType<typeof QUERY_KEYS.MEDIA>,
  { type?: string; sort: MediaSort },
];

export type MediaListResponse = {
  media: Media[];
  nextCursor?: string;
  hasAnyMedia: boolean;
};
