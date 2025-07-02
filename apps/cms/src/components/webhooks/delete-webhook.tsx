"use client";

import {
  AlertDialog,
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
import { useState } from "react";
import { deleteWebhookAction } from "@/lib/actions/webhook";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteWebhookAction(webhookId);
      toast.success("Webhook deleted successfully");
      onDelete(); // Call the parent callback to update the UI
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to delete webhook:", error);
      toast.error("Failed to delete webhook");
    } finally {
      setIsDeleting(false);
    }
  };

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
              💡 Consider disabling the webhook instead if you might need it
              later.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="min-w-20">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
            className="min-w-20"
          >
            {isDeleting ? <ButtonLoader /> : "Delete webhook"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
