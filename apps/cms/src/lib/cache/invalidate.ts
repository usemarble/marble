/**
 * Cache invalidation utility for CMS
 * Calls the internal API endpoint to invalidate cache when content changes
 * Only runs in production environment
 */

type CacheResource = "posts" | "categories" | "tags" | "authors" | "usage";

/**
 * Invalidate cache for a workspace and optionally a specific resource
 * Fire-and-forget: doesn't await or block the response
 */
export function invalidateCache(
  workspaceId: string,
  resource?: CacheResource
): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const apiUrl = process.env.MARBLE_API_URL;
  const systemSecret = process.env.SYSTEM_SECRET;

  if (!apiUrl || !systemSecret) {
    console.warn(
      "[CacheInvalidation] Missing API_URL or SYSTEM_SECRET, skipping cache invalidation"
    );
    return;
  }

  fetch(`${apiUrl}/cache/invalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-System-Secret": systemSecret,
    },
    body: JSON.stringify({
      workspaceId,
      ...(resource && { resource }),
    }),
  }).catch((error) => {
    console.error("[CacheInvalidation] Failed to invalidate cache:", error);
  });
}
