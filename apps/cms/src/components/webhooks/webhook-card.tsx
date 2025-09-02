"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  CopyIcon,
  DotsThreeVerticalIcon,
  ToggleRightIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Webhook } from "@/types/webhook";

const DeleteWebhookModal = dynamic(() =>
  import("@/components/webhooks/delete-webhook").then(
    (mod) => mod.DeleteWebhookModal,
  ),
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
  const [isOpen, setIsOpen] = useState(false);
  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  return (
    <li>
      <Card>
        <CardHeader className="flex justify-between">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="text-lg">{webhook.name}</CardTitle>
            <Badge
              variant={webhook.enabled ? "positive" : "negative"}
              className="text-xs"
            >
              {webhook.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <DotsThreeVerticalIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onToggle({
                    id: webhook.id,
                    enabled: !webhook.enabled,
                  })
                }
                disabled={isToggling && toggleVariables?.id === webhook.id}
              >
                <ToggleRightIcon size={16} className="mr-1.5" />
                <span>{webhook.enabled ? "Disable" : "Enable"} Webhook</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCopySecret(webhook.secret)}
              >
                <CopyIcon className="size-4 mr-1.5" />
                Copy Secret
              </DropdownMenuItem>

              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => setIsOpen(true)}
                disabled={isToggling}
              >
                <TrashIcon className="size-4 mr-1.5 text-inherit" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-muted-foreground break-all mb-3">
                {webhook.endpoint}
              </p>
              <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>
                  Created {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                </span>
                <div>
                  <span>
                    {webhook.events.length} event
                    {webhook.events.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <DeleteWebhookModal
        webhookId={webhook.id}
        webhookName={webhook.name}
        onDelete={onDelete}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </li>
  );
}
