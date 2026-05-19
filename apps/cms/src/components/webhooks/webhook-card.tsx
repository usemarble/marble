"use client";

import {
  Copy01Icon,
  Delete02Icon,
  Loading03Icon,
  MailSend01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import { Switch } from "@marble/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { format } from "date-fns";
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

interface WebhookCardProps {
  webhook: Webhook;
  onToggle: (data: { id: string; enabled: boolean }) => void;
  onDelete: () => void;
  isToggling: boolean;
  toggleVariables?: { id: string; enabled: boolean };
}

export function WebhookCard({
  webhook,
  onToggle,
  onDelete,
  isToggling,
  toggleVariables,
}: WebhookCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
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

  const isCurrentlyToggling = isToggling && toggleVariables?.id === webhook.id;

  return (
    <li>
      <Card className="rounded-[20px] border-none bg-surface p-2">
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 flex-col gap-1">
              <CardTitle className="font-medium text-lg">
                {webhook.name}
              </CardTitle>
              <CardDescription className="line-clamp-1 break-all font-mono text-sm">
                {webhook.url}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className="size-8 p-0" variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                  </Button>
                }
              />
              <DropdownMenuContent
                align="end"
                className="text-muted-foreground shadow-sm"
              >
                {webhook.format === "json" ? (
                  <DropdownMenuItem
                    onClick={() => handleCopySecret(webhook.secret)}
                  >
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
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Created {format(new Date(webhook.createdAt), "MMM d, yyyy")}
            </p>
            <Tooltip>
              <TooltipTrigger
                render={
                  <div>
                    <Switch
                      checked={webhook.enabled}
                      disabled={isCurrentlyToggling}
                      onCheckedChange={(checked) =>
                        onToggle({
                          id: webhook.id,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                }
              />
              <TooltipContent>
                {webhook.enabled ? "Disable webhook" : "Enable webhook"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
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
    </li>
  );
}
