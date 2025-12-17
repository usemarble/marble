import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Get the workspace ID from either context (API key routes) or URL params (legacy routes)
 * This allows route handlers to work with both authentication methods
 * @returns workspaceId or undefined if not found
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

/**
 * Get the workspace ID or throw if not found.
 * Use this in route handlers to ensure workspaceId exists before database queries.
 * @throws HTTPException 400 if workspaceId is missing
 */
export const requireWorkspaceId = (c: Context): string => {
  const workspaceId = getWorkspaceId(c);
  if (!workspaceId) {
    throw new HTTPException(400, {
      message: "Workspace ID is required",
    });
  }
  return workspaceId;
};
