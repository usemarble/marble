import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { MediaQueryKey, MediaType } from "@/types/media";
import { invalidateOtherMediaQueries } from "@/utils/media";

type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};

export function useMediaActions(mediaQueryKey: MediaQueryKey) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleUploadComplete = (newMedia?: Media) => {
    if (newMedia && workspaceId) {
      queryClient.setQueryData(
        mediaQueryKey,
        (
          oldData:
            | {
                pages: {
                  media: Media[];
                  nextCursor?: string;
                  hasAnyMedia: boolean;
                }[];
              }
            | undefined
        ) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pages: [
                { media: [newMedia], nextCursor: undefined, hasAnyMedia: true },
              ],
              pageParams: [undefined],
            };
          }
          const updatedPages = [...oldData.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            media: [newMedia, ...(updatedPages[0]?.media ?? [])],
            hasAnyMedia: true,
          };
          return {
            ...oldData,
            pages: updatedPages,
          };
        }
      );
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  const handleDeleteComplete = (id: string) => {
    if (workspaceId) {
      queryClient.setQueryData(
        mediaQueryKey,
        (
          oldData:
            | {
                pages: {
                  media: Media[];
                  nextCursor?: string;
                  hasAnyMedia: boolean;
                }[];
              }
            | undefined
        ) => {
          if (!oldData) {
            return oldData;
          }
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            media: page.media.filter((m) => m.id !== id),
            hasAnyMedia: page.media.filter((m) => m.id !== id).length > 0,
          }));
          return {
            ...oldData,
            pages: updatedPages,
          };
        }
      );
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  const handleBulkDeleteComplete = (deletedIds: string[]) => {
    if (workspaceId) {
      queryClient.setQueryData(
        mediaQueryKey,
        (
          oldData:
            | {
                pages: {
                  media: Media[];
                  nextCursor?: string;
                  hasAnyMedia: boolean;
                }[];
              }
            | undefined
        ) => {
          if (!oldData) {
            return oldData;
          }
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            media: page.media.filter((m) => !deletedIds.includes(m.id)),
            hasAnyMedia:
              page.media.filter((m) => !deletedIds.includes(m.id)).length > 0,
          }));
          return {
            ...oldData,
            pages: updatedPages,
          };
        }
      );
      invalidateOtherMediaQueries(queryClient, workspaceId, mediaQueryKey);
    }
  };

  return {
    handleUploadComplete,
    handleDeleteComplete,
    handleBulkDeleteComplete,
  };
}
