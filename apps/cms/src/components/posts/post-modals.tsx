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
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { ButtonLoader } from "../ui/loader";

export const DeletePostModal = ({
  open,
  setOpen,
  id,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  id: string;
}) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deletePost, isPending } = useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Post deleted");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POSTS(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete post.");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the post and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              deletePost(id);
            }}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? <ButtonLoader /> : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
