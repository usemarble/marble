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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import { Switch } from "@marble/ui/components/switch";
import { Copy, MoreHorizontal, Trash2, WebhookIcon } from "lucide-react";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { WebhookButton } from "@/components/webhooks/create-webhook";
import { DeleteWebhookModal } from "@/components/webhooks/delete-webhook";
import { toggleWebhookAction } from "@/lib/actions/webhook";

type Webhook = {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  enabled: boolean;
  format: string;
  createdAt: Date;
  updatedAt: Date;
};

interface PageClientProps {
  webhooks: Webhook[];
}

export function PageClient({ webhooks: initialWebhooks }: PageClientProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  if (webhooks.length === 0) {
    return (
      <WorkspacePageWrapper className="h-full grid place-content-center">
        <div className="flex flex-col gap-4 items-center max-w-80">
          <div className="p-2">
            <WebhookIcon className="size-16" />
          </div>
          <div className="text-center flex flex-col gap-4 items-center">
            <p className="text-muted-foreground text-sm">
              Webhooks allow you perform actions on your server when certain
              events occur in your workspace.
            </p>
            <WebhookButton />
          </div>
        </div>
      </WorkspacePageWrapper>
    );
  }

  const handleCopyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    toast.success("Endpoint copied to clipboard");
  };

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    try {
      await toggleWebhookAction(id, enabled);
      setWebhooks((prev) =>
        prev.map((webhook) =>
          webhook.id === id ? { ...webhook, enabled } : webhook,
        ),
      );
      toast.success(`Webhook ${enabled ? "enabled" : "disabled"}`);
    } catch (_error) {
      toast.error("Failed to update webhook");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleWebhookDeleted = (deletedId: string) => {
    setWebhooks((prev) => prev.filter((webhook) => webhook.id !== deletedId));
  };

  return (
    <WorkspacePageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Manage webhook endpoints for your workspace.
            </p>
          </div>
          <WebhookButton>Add Endpoint</WebhookButton>
        </div>

        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleWebhook(webhook.id, checked)
                      }
                      disabled={loadingStates[webhook.id]}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyEndpoint(webhook.endpoint)}
                        >
                          <Copy className="size-4 mr-2" />
                          Copy endpoint
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteWebhookModal
                          webhookId={webhook.id}
                          webhookName={webhook.name}
                          onDelete={() => handleWebhookDeleted(webhook.id)}
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DeleteWebhookModal>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Endpoint
                  </p>
                  <p className="text-sm font-mono break-all">
                    {webhook.endpoint}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Events
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <li key={event}>
                        <Badge variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Format: {webhook.format}</span>
                  <span>Created {webhook.createdAt.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
