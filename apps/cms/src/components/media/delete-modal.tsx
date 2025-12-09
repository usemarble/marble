"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { toast } from "@marble/ui/components/sonner";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media, MediaListResponse } from "@/types/media";
import { AsyncButton } from "../ui/async-button";

type DeleteMediaModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mediaToDelete: Media[];
  onDeleteComplete?: (deletedIds: string[]) => void;
};

export function DeleteMediaModal({
  isOpen,
  setIsOpen,
  mediaToDelete,
  onDeleteComplete,
}: DeleteMediaModalProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const count = mediaToDelete.length;
  const isSingleItem = count === 1;
  const singleItem = isSingleItem ? mediaToDelete[0] : null;

  const { mutate: deleteMedia, isPending } = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete media");
      }

      return response.json();
    },
    onMutate: async (mediaIds) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: workspaceId ? QUERY_KEYS.MEDIA(workspaceId) : [],
      });

      // Snapshot all media queries for rollback
      const previousQueries = queryClient.getQueriesData<
        InfiniteData<MediaListResponse>
      >({
        queryKey: workspaceId ? QUERY_KEYS.MEDIA(workspaceId) : [],
      });

      const idsToDelete = new Set(mediaIds);

      // Optimistically remove items from all media queries
      if (workspaceId) {
        queryClient.setQueriesData<InfiniteData<MediaListResponse>>(
          { queryKey: QUERY_KEYS.MEDIA(workspaceId) },
          (oldData) => {
            if (!oldData) {
              return oldData;
            }
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                media: page.media.filter((item) => !idsToDelete.has(item.id)),
              })),
            };
          }
        );
      }

      setIsOpen(false);

      if (onDeleteComplete) {
        onDeleteComplete(mediaIds);
      }

      const loadingMessage =
        mediaIds.length === 1
          ? "Deleting media..."
          : `Deleting ${mediaIds.length} items...`;
      toast.loading(loadingMessage, { id: "deleting-media" });

      return { previousQueries, deletedCount: mediaIds.length };
    },
    onSuccess: (_data, _variables, context) => {
      const deletedCount = context?.deletedCount || 0;
      const message =
        deletedCount === 1
          ? "Media deleted successfully"
          : `${deletedCount} items deleted successfully`;
      toast.success(message, { id: "deleting-media" });

      // Invalidate billing usage to update storage stats
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BILLING_USAGE(workspaceId),
        });
      }
    },
    onError: (error, _mediaIds, context) => {
      // Rollback to previous state on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(error.message, { id: "deleting-media" });
    },
  });

  const handleDelete = () => {
    if (mediaToDelete.length > 0) {
      deleteMedia(mediaToDelete.map((m) => m.id));
    }
  };

  // Dynamic content based on single vs multiple items
  const title = isSingleItem
    ? `Delete this ${singleItem?.type || "media"}?`
    : `Delete ${count} media items?`;

  const description = isSingleItem
    ? `Deleting this ${singleItem?.type || "media"} will break posts where it is being used. Please make sure to update all posts using this ${singleItem?.type || "media"}.`
    : "Deleting these media items will break posts where they are being used. Please make sure to update all posts using these items.";

  const buttonText = isSingleItem ? "Delete" : `Delete ${count} items`;

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AsyncButton
            isLoading={isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {buttonText}
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
