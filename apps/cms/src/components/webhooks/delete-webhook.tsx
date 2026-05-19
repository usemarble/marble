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
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

interface DeleteWebhookModalProps {
  webhookId: string;
  webhookName: string;
  onDelete: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteWebhookModal({
  webhookId,
  webhookName,
  onDelete,
  isOpen,
  onOpenChange,
}: DeleteWebhookModalProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate: deleteWebhook, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/webhooks/${webhookId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Webhook deleted successfully");
      onDelete();
      onOpenChange(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
        });
      }
    },
    onError: () => {
      toast.error("Failed to delete webhook");
    },
  });

  return (
    <AlertDialog onOpenChange={onOpenChange} open={isOpen}>
      <AlertDialogContent className="sm:max-w-md" variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              Delete "{webhookName}"?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            This will permanently delete this webhook from your workspace and
            stop delivering events to its URL.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteWebhook();
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
}
