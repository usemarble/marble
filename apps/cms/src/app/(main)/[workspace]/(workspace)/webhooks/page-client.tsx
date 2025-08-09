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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, Trash2, WebhookIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import PageLoader from "@/components/shared/page-loader";
import { WebhookButton } from "@/components/webhooks/create-webhook";
import { DeleteWebhookModal } from "@/components/webhooks/delete-webhook";
import { QUERY_KEYS } from "@/lib/queries/keys";

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
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    queryKey: [QUERY_KEYS.WEBHOOKS, params.workspace],
    queryFn: () => fetch("/api/webhooks").then((res) => res.json()),
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
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.WEBHOOKS, params.workspace],
      });
      const previousWebhooks = queryClient.getQueryData<Webhook[]>([
        QUERY_KEYS.WEBHOOKS,
        params.workspace,
      ]);

      queryClient.setQueryData<Webhook[]>(
        [QUERY_KEYS.WEBHOOKS, params.workspace],
        (old) =>
          old?.map((webhook) =>
            webhook.id === newWebhookData.id
              ? { ...webhook, enabled: newWebhookData.enabled }
              : webhook
          ) ?? []
      );

      return { previousWebhooks };
    },
    onError: (_err, _newWebhook, context) => {
      if (context?.previousWebhooks) {
        queryClient.setQueryData(
          [QUERY_KEYS.WEBHOOKS, params.workspace],
          context.previousWebhooks
        );
      }
      toast.error("Failed to update");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WEBHOOKS, params.workspace],
      });
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (webhooks?.length === 0) {
    return (
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <div className="flex max-w-80 flex-col items-center gap-4">
          <div className="p-2">
            <WebhookIcon className="size-16" />
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Webhooks let you run actions on your server when events happen in
              your workspace.
            </p>
            <WebhookButton />
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
                      disabled={
                        isToggling && toggleVariables?.id === webhook.id
                      }
                      onCheckedChange={(checked) =>
                        toggleWebhook({ id: webhook.id, enabled: checked })
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="mr-2 size-4" />
                          Copy secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteWebhookModal
                          onDelete={() =>
                            queryClient.invalidateQueries({
                              queryKey: [QUERY_KEYS.WEBHOOKS, params.workspace],
                            })
                          }
                          webhookId={webhook.id}
                          webhookName={webhook.name}
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 size-4" />
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
                  <p className="mb-1 font-medium text-muted-foreground text-sm">
                    Endpoint
                  </p>
                  <p className="break-all font-mono text-sm">
                    {webhook.endpoint}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 font-medium text-muted-foreground text-sm">
                    Events
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <li key={event}>
                        <Badge className="text-xs" variant="secondary">
                          {event}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-muted-foreground text-xs">
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
