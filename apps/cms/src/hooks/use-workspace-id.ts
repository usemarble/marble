import { useWorkspace } from "@/providers/workspace";

/**
 * Hook to get the current workspace ID consistently across the app.
 * Uses the currentWorkspaceId from context which handles pending workspace switches
 * to prevent stale data from appearing during transitions.
 * Returns null if no active workspace is available.
 */
export function useWorkspaceId(): string | null {
  const { currentWorkspaceId } = useWorkspace();
  return currentWorkspaceId;
}
