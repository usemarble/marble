import { useWorkspace } from "@/providers/workspace";

/**
 * Hook to get the current workspace ID consistently across the app.
 * Returns null if no active workspace is available.
 */
export function useWorkspaceId(): string | null {
  const { activeWorkspace } = useWorkspace();
  return activeWorkspace?.id || null;
}
