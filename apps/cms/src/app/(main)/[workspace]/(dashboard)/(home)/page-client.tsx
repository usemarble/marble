"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiUsageCard } from "@/components/home/api-usage-card";
import { MediaUsageCard } from "@/components/home/media-usage-card";
import { PublishingActivityCard } from "@/components/home/publishing-activity-card";
import { WebhookUsageCard } from "@/components/home/webhook-usage-card";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { UsageDashboardData } from "@/types/dashboard";

export default function PageClient() {
  const workspaceId = useWorkspaceId();

  const { data, isPending, isError } = useQuery({
    queryKey: workspaceId
      ? QUERY_KEYS.USAGE_DASHBOARD(workspaceId)
      : ["usage-dashboard", "disabled"],
    queryFn: async (): Promise<UsageDashboardData> => {
      const response = await fetch("/api/metrics/usage");
      if (!response.ok) {
        throw new Error("Failed to fetch usage metrics");
      }
      return response.json();
    },
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 10,
  });

  if (isPending) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="text-muted-foreground text-sm">
        Unable to load dashboard metrics right now.
      </div>
    );
  }

  return (
    <WorkspacePageWrapper
      className="flex flex-col gap-8 pt-10 pb-16"
      size="compact"
    >
      <div className="flex w-full flex-col gap-6 md:grid md:gap-x-10 md:gap-y-8">
        <ApiUsageCard data={data?.api} isLoading={isPending} />
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <WebhookUsageCard data={data?.webhooks} isLoading={isPending} />
          <MediaUsageCard data={data?.media} isLoading={isPending} />
        </div>
        <PublishingActivityCard />
      </div>
    </WorkspacePageWrapper>
  );
}
