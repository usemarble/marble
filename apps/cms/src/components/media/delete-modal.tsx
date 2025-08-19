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
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/misc";
import { ButtonLoader } from "../ui/loader";

interface DeleteMediaProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mediaToDelete: Media | null;
  onDeleteComplete?: (deletedMediaId: string) => void;
}

export function DeleteMediaModal({
  isOpen,
  setIsOpen,
  mediaToDelete,
  onDeleteComplete,
}: DeleteMediaProps) {
  const queryClient = useQueryClient();

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
      toast.success("Media deleted successfully");
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDIA],
      });
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
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? <ButtonLoader variant="destructive" /> : "Delete"}
            </Button>
            {/* </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
