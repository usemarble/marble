"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Loading03Icon,
  MailSend01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
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
              <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="text-muted-foreground shadow-sm"
        >
          {webhook.format === "json" ? (
            <DropdownMenuItem onClick={handleCopySecret}>
              <HugeiconsIcon icon={Copy01Icon} size={16} />
              <span>Copy Secret</span>
            </DropdownMenuItem>
          ) : undefined}
          <DropdownMenuItem
            disabled={isSendingTest || isToggling}
            onClick={handleSendTest}
          >
            {isSendingTest ? (
              <HugeiconsIcon
                className="animate-spin"
                icon={Loading03Icon}
                size={16}
              />
            ) : (
              <HugeiconsIcon icon={MailSend01Icon} size={16} />
            )}
            <span>Send Test</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() =>
              onToggle({ id: webhook.id, enabled: !webhook.enabled })
            }
          >
            {webhook.enabled ? (
              <HugeiconsIcon icon={CancelCircleIcon} size={16} />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
            )}
            <span>{webhook.enabled ? "Disable" : "Enable"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() => setIsEditOpen(true)}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggling}
            onClick={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span>Delete</span>
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
