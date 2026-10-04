import { useWorkspace } from "@/providers/workspace";

/**
 * Hook to get the current workspace ID consistently across the app.
 * Returns null if no active workspace is available.
 */
export function useWorkspaceId(): string | null {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.id || null;
}

/**
 * Like `useWorkspaceId`, but null until Better Auth's active organization is
 * this workspace. For the CMS routes that still read the session's active
 * organization instead of taking a `workspaceId`
 * (`requireActiveWorkspaceAccess`): fetching before the sync would cache
 * another workspace's data under this one's key. Procedures on `/rpc` don't
 * need it. Switch a caller back to `useWorkspaceId` when its route moves.
 */
export function useSyncedWorkspaceId(): string | null {
  const { activeWorkspace, isOrganizationSynced } = useWorkspace();
  return isOrganizationSynced ? activeWorkspace?.id || null : null;
}
