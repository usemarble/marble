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

// compares the current query with the other queries for logical equality
export function queryKeysEqual(key1: MediaQueryKey, key2: MediaQueryKey) {
  const [prefix1, obj1] = key1;
  const [prefix2, obj2] = key2;

  if (prefix1.length !== prefix2.length) {
    return false;
  }

  for (let i = 0; i < prefix1.length; i++) {
    if (prefix1[i] !== prefix2[i]) {
      return false;
    }
  }

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
    queryKey: QUERY_KEYS.MEDIA(workspaceId),
    exact: false,
  });
  for (const query of queries) {
    if (!queryKeysEqual(query.queryKey as MediaQueryKey, currentKey)) {
      queryClient.invalidateQueries({ queryKey: query.queryKey, exact: true });
    }
  }
}

export function getEmptyStateMessage(type?: MediaType, hasAnyMedia?: boolean) {
  if (!hasAnyMedia) {
    return "Media you upload in this workspace will appear here.";
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
