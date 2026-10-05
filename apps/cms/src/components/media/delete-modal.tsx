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
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";
import { AsyncButton } from "../ui/async-button";

interface DeleteMediaModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mediaToDelete: Media[];
  onDeleteComplete?: (deletedIds: string[]) => void;
}

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
    ...orpc.media.delete.mutationOptions(),
    onMutate: ({ mediaIds }) => {
      toast.loading(
        mediaIds.length === 1
          ? "Deleting media..."
          : `Deleting ${mediaIds.length} items...`,
        { id: "deleting-media" }
      );
    },
    onSuccess: (_data, { mediaIds }) => {
      setIsOpen(false);
      const deletedCount = mediaIds.length;
      const message =
        deletedCount === 1
          ? "Media deleted successfully"
          : `${deletedCount} items deleted successfully`;
      toast.success(message, { id: "deleting-media" });

      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: orpc.media.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.media.editor.key() });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BILLING_USAGE(workspaceId),
        });
      }

      onDeleteComplete?.(mediaIds);
    },
    onError: (error) => {
      toast.error(error.message, { id: "deleting-media" });
    },
  });

  const handleDelete = () => {
    if (mediaToDelete.length > 0 && workspaceId) {
      deleteMedia({ workspaceId, mediaIds: mediaToDelete.map((m) => m.id) });
    }
  };

  const title = isSingleItem
    ? `Delete this ${singleItem?.type || "media"}?`
    : `Delete ${count} media items?`;

  const description = isSingleItem
    ? `Deleting this ${singleItem?.type || "media"} will break posts where it is being used. Please make sure to update all posts using this ${singleItem?.type || "media"}.`
    : "Deleting these media items will break posts where they are being used. Please make sure to update all posts using these items.";

  const buttonText = isSingleItem ? "Delete" : `Delete ${count} items`;

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogContent variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription className="text-balance">
            {description}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={handleDelete}
              size="sm"
              variant="destructive"
            >
              {buttonText}
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
}
