import {
  MEDIA_FILTER_TYPES,
  MEDIA_SORTS,
  type MEDIA_TYPES,
} from "@/lib/constants";

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

export function isMediaSort(value: string): value is MediaSort {
  return MEDIA_SORTS.includes(value);
}

export function isMediaFilterType(value: string): value is MediaFilterType {
  return MEDIA_FILTER_TYPES.includes(value);
}

export function toMediaType(value: MediaFilterType): MediaType | undefined {
  return value === "all" ? undefined : value;
}

export type MediaQueryKey = [string[], { type?: string; sort: MediaSort }];
