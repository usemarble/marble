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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";
import { AsyncButton } from "../ui/async-button";

type DeleteMediaProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mediaToDelete: Media | null;
  onDeleteComplete?: (deletedMediaId: string) => void;
};

export function DeleteMediaModal({
  isOpen,
  setIsOpen,
  mediaToDelete,
  onDeleteComplete,
}: DeleteMediaProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteMedia, isPending } = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId }),
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
      toast.success("Media deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.MEDIA(workspaceId),
        });
      }
      if (onDeleteComplete) {
        onDeleteComplete(data.id);
      }
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (mediaToDelete) {
      deleteMedia(mediaToDelete.id);
    }
  };

  return (
    <div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {mediaToDelete?.type || "media"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this {mediaToDelete?.type} will break posts where it is
              being used. Please make sure to update all posts using this{" "}
              {mediaToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* <AlertDialogAction asChild> */}
            <AsyncButton
              onClick={handleDelete}
              variant="destructive"
              isLoading={isPending}
            >
              Delete
            </AsyncButton>
            {/* </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
