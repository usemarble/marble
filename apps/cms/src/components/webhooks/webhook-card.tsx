"use client";

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
import {
  CopyIcon,
  DotsThreeVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
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
  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  const isCurrentlyToggling = isToggling && toggleVariables?.id === webhook.id;

  return (
    <li>
      <Card className="rounded-[20px] border-none bg-sidebar p-2">
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 flex-col gap-1">
              <CardTitle className="font-medium text-lg">
                {webhook.name}
              </CardTitle>
              <CardDescription className="line-clamp-1 break-all font-mono text-sm">
                {webhook.endpoint}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <DotsThreeVerticalIcon size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {webhook.format === "json" ? (
                  <DropdownMenuItem
                    onClick={() => handleCopySecret(webhook.secret)}
                  >
                    <CopyIcon className="mr-1.5 size-4" />
                    Copy Secret
                  </DropdownMenuItem>
                ) : undefined}
                <DropdownMenuItem
                  disabled={isToggling}
                  onSelect={(_e) => setIsEditOpen(true)}
                >
                  <PencilIcon className="mr-1.5 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isToggling}
                  onSelect={(_e) => setIsDeleteOpen(true)}
                  variant="destructive"
                >
                  <TrashIcon className="mr-1.5 size-4 text-inherit" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Created {format(new Date(webhook.createdAt), "MMM d, yyyy")}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
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
