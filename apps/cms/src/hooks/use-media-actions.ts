import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { MediaQueryKey } from "@/types/media";

export function useMediaActions(mediaQueryKey: MediaQueryKey) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleActionComplete = () => {
    if (!workspaceId) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: mediaQueryKey, exact: true });

    const allMediaPrefixKey = QUERY_KEYS.MEDIA(workspaceId);
    queryClient.invalidateQueries({
      queryKey: allMediaPrefixKey,
      exact: false,
    });
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
