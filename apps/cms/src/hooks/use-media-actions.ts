import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { MediaQueryKey } from "@/types/media";
import { invalidateOtherMediaQueries } from "@/utils/media";

export function useMediaActions(mediaQueryKey: MediaQueryKey) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleUploadComplete = () => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: mediaQueryKey, exact: true });
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  const handleDeleteComplete = (_id: string) => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: mediaQueryKey, exact: true });
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  const handleBulkDeleteComplete = (_ids: string[]) => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: mediaQueryKey, exact: true });
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  return {
    handleUploadComplete,
    handleDeleteComplete,
    handleBulkDeleteComplete,
  };
}
