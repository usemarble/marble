"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  CheckCircle,
  CopyIcon,
  DotsThreeVerticalIcon,
  PaperPlaneTiltIcon,
  PencilIcon,
  ProhibitIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Webhook } from "@/types/webhook";

const DeleteWebhookModal = dynamic(() =>
  import("@/components/webhooks/delete-webhook").then(
    (mod) => mod.DeleteWebhookModal
  )
);

const EditWebhookSheet = dynamic(() =>
  import("@/components/webhooks/edit-webhook").then(
    (mod) => mod.EditWebhookSheet
  )
);

interface WebhookActionsProps {
  webhook: Webhook;
  isToggling: boolean;
  onDelete: () => void;
  onToggle: (data: { id: string; enabled: boolean }) => void;
}

export function WebhookActions({
  webhook,
  isToggling,
  onDelete,
  onToggle,
}: WebhookActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhook.secret);
    toast.success("Secret copied to clipboard");
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Failed to send test webhook");
      }

      toast.success("Test webhook queued");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send test webhook"
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="size-8 p-0" variant="ghost">
              <span className="sr-only">Open webhook actions</span>
              <DotsThreeVerticalIcon className="size-5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {webhook.format === "json" ? (
            <DropdownMenuItem onClick={handleCopySecret}>
              <CopyIcon className="mr-1.5 size-4" />
              Copy Secret
            </DropdownMenuItem>
          ) : undefined}
          <DropdownMenuItem
            disabled={isSendingTest || isToggling}
            onClick={handleSendTest}
          >
            {isSendingTest ? (
              <SpinnerIcon className="mr-1.5 size-4 animate-spin" />
            ) : (
              <PaperPlaneTiltIcon className="mr-1.5 size-4" />
            )}
            Send Test
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() =>
              onToggle({ id: webhook.id, enabled: !webhook.enabled })
            }
          >
            {webhook.enabled ? (
              <ProhibitIcon className="mr-1.5 size-4" />
            ) : (
              <CheckCircle className="mr-1.5 size-4" />
            )}
            {webhook.enabled ? "Disable" : "Enable"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() => setIsEditOpen(true)}
          >
            <PencilIcon className="mr-1.5 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <TrashIcon className="mr-1.5 size-4 text-inherit" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditWebhookSheet
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        webhook={webhook}
      />
      <DeleteWebhookModal
        isOpen={isDeleteOpen}
        onDelete={onDelete}
        onOpenChange={setIsDeleteOpen}
        webhookId={webhook.id}
        webhookName={webhook.name}
      />
    </>
  );
}
