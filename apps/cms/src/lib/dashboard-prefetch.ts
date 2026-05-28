"use client";

import type { QueryClient } from "@tanstack/react-query";
import { MEDIA_LIMIT, POST_LIMIT } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { getMediaApiUrl, getPostApiUrl } from "@/lib/search-params";

const ONE_HOUR = 1000 * 60 * 60;
const FIVE_MINUTES = 1000 * 60 * 5;

const defaultPostFilters = {
  category: "all",
  page: 1,
  perPage: POST_LIMIT,
  search: "",
  sort: "createdAt_desc" as const,
  status: "all" as const,
};

const defaultMediaFilters = {
  page: 1,
  perPage: MEDIA_LIMIT,
  search: "",
  sort: "createdAt_desc" as const,
  type: undefined,
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to prefetch ${url}`);
  }
  return response.json() as Promise<T>;
}

export function prefetchDashboardRoute(
  queryClient: QueryClient,
  workspaceId: string,
  route: string
) {
  switch (route) {
    case "":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.USAGE_DASHBOARD(workspaceId),
        queryFn: () => fetchJson("/api/metrics/usage"),
        staleTime: FIVE_MINUTES,
      });
    case "posts":
      return queryClient.prefetchQuery({
        queryKey: [...QUERY_KEYS.POSTS(workspaceId), defaultPostFilters],
        queryFn: () =>
          fetchJson(getPostApiUrl("/api/posts", defaultPostFilters)),
        staleTime: ONE_HOUR,
      });
    case "categories":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        queryFn: () => fetchJson("/api/categories"),
        staleTime: ONE_HOUR,
      });
    case "tags":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.TAGS(workspaceId),
        queryFn: () => fetchJson("/api/tags"),
        staleTime: ONE_HOUR,
      });
    case "media":
      return queryClient.prefetchQuery({
        queryKey: [...QUERY_KEYS.MEDIA(workspaceId), defaultMediaFilters],
        queryFn: () =>
          fetchJson(
            getMediaApiUrl("/api/media", {
              ...defaultMediaFilters,
              search: null,
            })
          ),
        staleTime: FIVE_MINUTES,
      });
    case "authors":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.AUTHORS(workspaceId),
        queryFn: () => fetchJson("/api/authors"),
        staleTime: ONE_HOUR,
      });
    case "settings/keys":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.KEYS(workspaceId),
        queryFn: () => fetchJson("/api/keys"),
        staleTime: ONE_HOUR,
      });
    case "settings/fields":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId),
        queryFn: () => fetchJson("/api/fields"),
        staleTime: ONE_HOUR,
      });
    case "settings/webhooks":
      return queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
        queryFn: () => fetchJson("/api/webhooks"),
        staleTime: ONE_HOUR,
      });
    default:
      return Promise.resolve();
  }
}
