"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogX,
} from "@marble/ui/components/alert-dialog";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useWorkspace } from "@/providers/workspace";
import { AsyncButton } from "../ui/async-button";

export const DeletePostModal = ({
  open,
  setOpen,
  id,
  // view,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  id: string;
  view: "table" | "grid";
}) => {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const { mutate: deletePost, isPending } = useMutation(
    orpc.posts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Post deleted");
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: orpc.posts.key({ input: { workspaceId } }),
          });
        }
        setOpen(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete post."
        );
      },
    })
  );

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      {/* this is simply to prevent clicks on the dialog from bubbling up and clcikng the post link */}
      <AlertDialogContent onClick={(e) => e.stopPropagation()} variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              Delete Post?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription className="text-balance">
            Deleting this post will remove it from your workspace, and will no
            longer be accessible via the API. This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
              size="sm"
            >
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                if (workspaceId) {
                  deletePost({ workspaceId, id });
                }
              }}
              size="sm"
              variant="destructive"
            >
              Delete
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
};
