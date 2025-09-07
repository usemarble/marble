"use client";

import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { PlusIcon, WebhooksLogoIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Webhook } from "@/types/webhook";

const CreateWebhookSheet = dynamic(
  () => import("@/components/webhooks/create-webhook"),
);

const WebhookCard = dynamic(() =>
  import("@/components/webhooks/webhook-card").then((mod) => mod.WebhookCard),
);

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
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <div className="flex max-w-80 flex-col items-center gap-4">
          <div className="p-2">
            <WebhooksLogoIcon className="size-16" />
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Webhooks let you run actions on your server when events happen in
              your workspace.
            </p>
            <CreateWebhookSheet>
              <Button>
                <PlusIcon className="size-4" />
                New Webhook
              </Button>
            </CreateWebhookSheet>
          </div>
        </div>
      </WorkspacePageWrapper>
    );
  }

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

        <ul className="grid gap-4">
          {webhooks?.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onToggle={toggleWebhook}
              onDelete={() => {
                if (workspaceId) {
                  queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
                  });
                }
              }}
              isToggling={isToggling}
              toggleVariables={toggleVariables}
            />
          ))}
        </ul>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
