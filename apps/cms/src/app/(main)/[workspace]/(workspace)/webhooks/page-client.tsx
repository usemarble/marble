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
import { Copy, Plus, Trash, WebhooksLogo } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const CreateWebhookSheet = dynamic(
  () => import("@/components/webhooks/create-webhook"),
);

const WebhookButton = dynamic(() =>
  import("@/components/webhooks/create-webhook").then(
    (mod) => mod.WebhookButton,
  ),
);

const DeleteWebhookModal = dynamic(() =>
  import("@/components/webhooks/delete-webhook").then(
    (mod) => mod.DeleteWebhookModal,
  ),
);

type Webhook = {
  id: string;
  name: string;
  endpoint: string;
  secret: string;
  events: string[];
  enabled: boolean;
  format: string;
  createdAt: Date;
  updatedAt: Date;
};

export function PageClient() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.WEBHOOKS(workspaceId!),
    queryFn: () => fetch("/api/webhooks").then((res) => res.json()),
    enabled: !!workspaceId,
  });

  const {
    mutate: toggleWebhook,
    variables: toggleVariables,
    isPending: isToggling,
  } = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      }),
    onMutate: async (newWebhookData) => {
      if (!workspaceId) return;

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
      });
      const previousWebhooks = queryClient.getQueryData<Webhook[]>(
        QUERY_KEYS.WEBHOOKS(workspaceId),
      );

      queryClient.setQueryData<Webhook[]>(
        QUERY_KEYS.WEBHOOKS(workspaceId),
        (old) =>
          old?.map((webhook) =>
            webhook.id === newWebhookData.id
              ? { ...webhook, enabled: newWebhookData.enabled }
              : webhook,
          ) ?? [],
      );

      return { previousWebhooks };
    },
    onError: (_err, _newWebhook, context) => {
      if (context?.previousWebhooks && workspaceId) {
        queryClient.setQueryData(
          QUERY_KEYS.WEBHOOKS(workspaceId),
          context.previousWebhooks,
        );
      }
      toast.error("Failed to update");
    },
    onSettled: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
        });
      }
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (webhooks?.length === 0) {
    return (
      <WorkspacePageWrapper className="h-full grid place-content-center">
        <div className="flex flex-col gap-4 items-center max-w-80">
          <div className="p-2">
            <WebhooksLogo className="size-16" />
          </div>
          <div className="text-center flex flex-col gap-4 items-center">
            <p className="text-muted-foreground text-sm">
              Webhooks let you run actions on your server when events happen in
              your workspace.
            </p>
            {/* <WebhookButton /> */}
            <CreateWebhookSheet>
              <Button>
                <Plus className="size-4" />
                New webhook
              </Button>
            </CreateWebhookSheet>
          </div>
        </div>
      </WorkspacePageWrapper>
    );
  }

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
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
          {webhooks?.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(checked) =>
                        toggleWebhook({ id: webhook.id, enabled: checked })
                      }
                      disabled={
                        isToggling && toggleVariables?.id === webhook.id
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="size-4 mr-2" />
                          Copy secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteWebhookModal
                          webhookId={webhook.id}
                          webhookName={webhook.name}
                          onDelete={() => {
                            if (workspaceId) {
                              queryClient.invalidateQueries({
                                queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
                              });
                            }
                          }}
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash className="size-4 mr-2" />
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
                  <span>
                    Created {new Date(webhook.createdAt).toLocaleDateString()}
                  </span>
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
