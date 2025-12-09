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
import { toast } from "@marble/ui/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { AsyncButton } from "../ui/async-button";

type BulkDeleteMediaProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedItems: string[];
  onDeleteComplete?: (deletedIds: string[]) => void;
};

export function BulkDeleteMediaModal({
  isOpen,
  setIsOpen,
  selectedItems,
  onDeleteComplete,
}: BulkDeleteMediaProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: bulkDeleteMedia, isPending } = useMutation({
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
    onSuccess: (data) => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.MEDIA(workspaceId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BILLING_USAGE(workspaceId),
        });
      }

      const deletedIds = data.deletedIds || [];
      const failedCount = data.failedIds?.length || 0;

      if (failedCount > 0) {
        toast.warning(
          `${deletedIds.length} items deleted, ${failedCount} failed`
        );
      } else {
        toast.success(`${deletedIds.length} items deleted successfully`);
      }

      if (onDeleteComplete) {
        onDeleteComplete(deletedIds);
      }
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMedia(selectedItems);
    }
  };

  return (
    <div>
      <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedItems.length} media{" "}
              {selectedItems.length === 1 ? "item" : "items"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting these media items will break posts where they are being
              used. Please make sure to update all posts using these items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={handleBulkDelete}
              variant="destructive"
            >
              Delete {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"}
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
