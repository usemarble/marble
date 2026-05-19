"use client";

import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBody } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import {
  WebhookDataTable,
  WebhooksEmptyState,
} from "@/components/webhooks/webhook-data-table";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import type { Webhook } from "@/types/webhook";

export function PageClient() {
  const workspaceId = useWorkspaceId();
  const { isFetchingWorkspace } = useWorkspace();
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
            `Failed to fetch webhooks: ${res.status} ${res.statusText}`
          );
        }
        const data: Webhook[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch webhooks"
        );
      }
    },
    enabled: !!workspaceId && !isFetchingWorkspace,
  });

  const {
    mutate: toggleWebhook,
    variables: toggleVariables,
    isPending: isToggling,
  } = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      return response.json();
    },
    onMutate: async (newWebhookData) => {
      if (!workspaceId) {
        return;
      }

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
      });
      const previousWebhooks = queryClient.getQueryData<Webhook[]>(
        QUERY_KEYS.WEBHOOKS(workspaceId)
      );

      queryClient.setQueryData<Webhook[]>(
        QUERY_KEYS.WEBHOOKS(workspaceId),
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
      if (context?.previousWebhooks && workspaceId) {
        queryClient.setQueryData(
          QUERY_KEYS.WEBHOOKS(workspaceId),
          context.previousWebhooks
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

  if (isFetchingWorkspace || !workspaceId || isLoading) {
    return <PageLoader />;
  }

  if (webhooks?.length === 0) {
    return (
      <DashboardBody
        className="grid h-full place-content-center"
        size="compact"
      >
        <WebhooksEmptyState />
      </DashboardBody>
    );
  }

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <WebhookDataTable
        isToggling={isToggling}
        onDelete={() => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
          });
        }}
        onToggle={toggleWebhook}
        toggleVariables={toggleVariables}
        webhooks={webhooks ?? []}
      />
    </DashboardBody>
  );
}

export default PageClient;
