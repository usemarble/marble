import type { Context } from "hono";

/**
 * Get the workspace ID from either context (API key routes) or URL params (legacy routes)
 * This allows route handlers to work with both authentication methods
 */
export const getWorkspaceId = (c: Context): string | undefined => {
  // Try context first (set by keyAuthorization middleware for API key routes)
  const contextWorkspaceId = c.get("workspaceId") as string | undefined;
  if (contextWorkspaceId) {
    return contextWorkspaceId;
  }

  // Fall back to URL param (legacy workspace ID routes)
  return c.req.param("workspaceId");
};
