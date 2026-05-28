/**
 * Builds an internal workspace-scoped path while encoding the workspace segment
 * so an unsafe slug cannot turn the URL into a scheme-relative external target.
 */
export function workspacePath(workspaceSlug: string, path = "") {
  const encodedWorkspaceSlug = encodeURIComponent(workspaceSlug);
  const normalizedPath = path.replace(/^\/+/, "");

  return normalizedPath
    ? `/${encodedWorkspaceSlug}/${normalizedPath}`
    : `/${encodedWorkspaceSlug}`;
}
