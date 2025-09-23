import type { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { MediaQueryKey, MediaType } from "@/types/media";

export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  return "document";
}

// this helps us to compare the current query with the other queries for logical equality
export function queryKeysEqual(key1: MediaQueryKey, key2: MediaQueryKey) {
  if (key1.length !== key2.length) {
    return false;
  }
  if (key1[0] !== key2[0]) {
    return false;
  }
  const obj1 = key1[1];
  const obj2 = key2[1];
  return (
    (obj1.type ?? "all") === (obj2.type ?? "all") && obj1.sort === obj2.sort
  );
}

export function invalidateOtherMediaQueries(
  queryClient: QueryClient,
  workspaceId: string,
  currentKey: MediaQueryKey
) {
  const queries = queryClient.getQueryCache().findAll({
    queryKey: [QUERY_KEYS.MEDIA(workspaceId)],
    exact: false,
  });
  for (const query of queries) {
    if (!queryKeysEqual(query.queryKey as MediaQueryKey, currentKey)) {
      queryClient.invalidateQueries({ queryKey: query.queryKey, exact: true });
    }
  }
}

export function getEmptyStateMessage(type?: string, hasAnyMedia?: boolean) {
  if (!hasAnyMedia) {
    return "Images you upload in this workspace will appear here.";
  }
  switch (type) {
    case "image":
      return "No images found. Try uploading some images or adjusting your filters.";
    case "video":
      return "No videos found. Try uploading some videos or adjusting your filters.";
    case "audio":
      return "No audio files found. Try uploading some audio files or adjusting your filters.";
    case "document":
      return "No documents found. Try uploading some documents or adjusting your filters.";
    default:
      return "No media found. Try adjusting your filters or upload some media.";
  }
}
