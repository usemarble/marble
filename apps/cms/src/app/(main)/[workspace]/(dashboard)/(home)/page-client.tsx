"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiUsageCard } from "@/components/home/api-usage-card";
import { MediaUsageCard } from "@/components/home/media-usage-card";
import { PublishingActivityCard } from "@/components/home/publishing-activity-card";
import { WebhookUsageCard } from "@/components/home/webhook-usage-card";
import { DashboardBody } from "@/components/layout/wrapper";
import { PageError } from "@/components/shared/page-error";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import Loading from "./loading";

export default function PageClient() {
  const workspaceId = useWorkspaceId();
  const { data, isPending, isError } = useQuery(
    orpc.workspaces.metrics.usage.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: Boolean(workspaceId),
      staleTime: 1000 * 60 * 10,
    })
  );

  if (!workspaceId || isPending) {
    return <Loading />;
  }

  if (isError) {
    return (
      <PageError
        message="Unable to load dashboard metrics right now."
        title="Unable to load dashboard metrics"
      />
    );
  }

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div className="flex w-full flex-col gap-6 md:grid md:gap-x-10 md:gap-y-8">
        <ApiUsageCard data={data?.api} isLoading={isPending} />
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <WebhookUsageCard data={data?.webhooks} isLoading={isPending} />
          <MediaUsageCard data={data?.media} isLoading={isPending} />
        </div>
        <PublishingActivityCard />
      </div>
    </DashboardBody>
  );
}
