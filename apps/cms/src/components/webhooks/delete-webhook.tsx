"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

interface DeleteWebhookModalProps {
  webhookId: string;
  webhookName: string;
  onDelete: () => void;
  children: React.ReactNode;
}

export function DeleteWebhookModal({
  webhookId,
  webhookName,
  onDelete,
  children,
}: DeleteWebhookModalProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false);
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
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{webhookName}"</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-w-20">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <AsyncButton
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteWebhook();
              }}
              className="min-w-20"
            >
              Delete webhook
            </AsyncButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
