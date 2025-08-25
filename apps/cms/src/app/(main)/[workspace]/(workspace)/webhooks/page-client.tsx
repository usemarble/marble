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
  PlusIcon,
  ToggleRightIcon,
  TrashIcon,
  WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const CreateWebhookSheet = dynamic(
  () => import("@/components/webhooks/create-webhook"),
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

  const { data: webhooks, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.WEBHOOKS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/webhooks");
        if (!res.ok) {
          throw new Error(
            `Failed to fetch webhooks: ${res.status} ${res.statusText}`,
          );
        }
        const data: Webhook[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch webhooks",
        );
      }
    },
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
            <WebhooksLogoIcon className="size-16" />
          </div>
          <div className="text-center flex flex-col gap-4 items-center">
            <p className="text-muted-foreground text-sm">
              Webhooks let you run actions on your server when events happen in
              your workspace.
            </p>
            {/* <WebhookButton /> */}
            <CreateWebhookSheet>
              <Button>
                <PlusIcon className="size-4" />
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
          <div />
          <CreateWebhookSheet>
            <Button>
              <PlusIcon className="size-4" />
              Add Endpoint
            </Button>
          </CreateWebhookSheet>
        </div>

        <div className="grid gap-4">
          {webhooks?.map((webhook) => (
            <Card key={webhook.id}>
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
                        toggleWebhook({
                          id: webhook.id,
                          enabled: !webhook.enabled,
                        })
                      }
                      disabled={
                        isToggling && toggleVariables?.id === webhook.id
                      }
                    >
                      <ToggleRightIcon size={16} className="mr-1.5" />
                      <span>
                        {webhook.enabled ? "Disable" : "Enable"} webhook
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCopySecret(webhook.secret)}
                    >
                      <CopyIcon className="size-4 mr-1.5" />
                      Copy secret
                    </DropdownMenuItem>
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
                        variant="destructive"
                        onClick={(e) => e.preventDefault()}
                      >
                        <TrashIcon className="size-4 mr-1.5 text-inherit" />
                        Delete
                      </DropdownMenuItem>
                    </DeleteWebhookModal>
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
                        Created{" "}
                        {format(new Date(webhook.createdAt), "MMM d, yyyy")}
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
          ))}
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
