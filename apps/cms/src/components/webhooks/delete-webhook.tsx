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
import { QUERY_KEYS } from "@/lib/queries/keys";
import { ButtonLoader } from "../ui/loader";

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WEBHOOKS] });
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
          <AlertDialogDescription className="space-y-2">
            <span>
              Are you sure you want to delete <strong>"{webhookName}"</strong>?
              This action cannot be undone.
            </span>
            <span>
              This will permanently delete the webhook endpoint and all
              associated delivery logs and event history.
            </span>
            <span className="text-blue-600 font-medium">
              Consider disabling the webhook instead if you might need it later.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-w-20">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteWebhook();
              }}
              className="min-w-20"
            >
              {isPending ? <ButtonLoader /> : "Delete webhook"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
