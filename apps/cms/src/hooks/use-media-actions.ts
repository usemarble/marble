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
  const handleDeleteComplete = (_id: string) => handleActionComplete();
  const handleBulkDeleteComplete = (_ids: string[]) => handleActionComplete();

  return {
    handleUploadComplete,
    handleDeleteComplete,
    handleBulkDeleteComplete,
  };
}
