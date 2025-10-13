import { useWorkspace } from "@/providers/workspace";

export function useWorkspaceId(): string | null {
  const { currentWorkspaceId } = useWorkspace();
  return currentWorkspaceId;
}
