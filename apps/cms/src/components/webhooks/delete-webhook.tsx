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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{webhookName}"</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-w-20" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AsyncButton
            className="min-w-20"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteWebhook();
            }}
            variant="destructive"
          >
            Delete webhook
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
