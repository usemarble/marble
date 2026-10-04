"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBody } from "@/components/layout/wrapper";
import {
  WebhookDataTable,
  WebhooksEmptyState,
} from "@/components/webhooks/webhook-data-table";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import Loading from "./loading";

export function PageClient() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    data: webhooks,
    isLoading,
    error,
  } = useQuery(
    orpc.webhooks.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: !!workspaceId,
      staleTime: 1000 * 60 * 60,
    })
  );

  if (!workspaceId || isLoading) {
    return <Loading />;
  }

  if (error) {
    return <DashboardBody size="compact">{error.message}</DashboardBody>;
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
        onDelete={() => {
          queryClient.invalidateQueries({
            queryKey: orpc.webhooks.key({ input: { workspaceId } }),
          });
        }}
        webhooks={webhooks ?? []}
      />
    </DashboardBody>
  );
}

export default PageClient;
