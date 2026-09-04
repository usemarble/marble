export type RestrictedLegacyPostStatus = "draft" | "all";

/**
 * Preserve legacy workspace-ID post routes while preventing anonymous draft
 * access. Mutating the forwarded URL ensures validation, filtering, and cache
 * keys all use the effective published-only status.
 */
export function restrictLegacyPostStatus(
  url: URL,
  workspaceId: string
): RestrictedLegacyPostStatus | null {
  const postsPath = `/v1/${workspaceId}/posts`;
  const isPostsRoute =
    url.pathname === postsPath || url.pathname.startsWith(`${postsPath}/`);

  if (!isPostsRoute) {
    return null;
  }

  const requestedStatus = url.searchParams.get("status");
  if (requestedStatus !== "draft" && requestedStatus !== "all") {
    return null;
  }

  url.searchParams.set("status", "published");
  return requestedStatus;
}
