import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import type { MediaQueryKey } from "@/types/media";

export function useMediaActions(_mediaQueryKey: MediaQueryKey) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleActionComplete = () => {
    if (!workspaceId) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: orpc.media.list.key() });
    queryClient.invalidateQueries({ queryKey: orpc.media.editor.key() });
  };

  const handleUploadComplete = () => handleActionComplete();
  // Delete handlers don't need to invalidate - the delete modal already
  // does optimistic updates directly to the cache via setQueriesData
  const handleDeleteComplete = (_id: string) => {
    return;
  };
  const handleBulkDeleteComplete = (_ids: string[]) => {
    return;
  };

  return {
    handleUploadComplete,
    handleDeleteComplete,
    handleBulkDeleteComplete,
  };
}
