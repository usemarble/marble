"use client";

import { Suspense } from "react";
import { ApiUsageStats } from "@/components/home/ApiUsageStats";
import { PublishingActivityGraph } from "@/components/home/PublishingActivityGraph";
import { QuickStats } from "@/components/home/QuickStats";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useUser } from "@/providers/user";

export default function PageClient() {
  const { user, isFetchingUser } = useUser();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 17) {
      return "Good afternoon";
    }
    return "Good evening";
  };

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">
          {isFetchingUser ? (
            getTimeOfDay()
          ) : (
            <>
              {getTimeOfDay()}, {user?.name}
            </>
          )}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your workspace
        </p>
      </div>

      <div className="grid gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-xl">Publishing Data</h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Suspense
            fallback={
              <div className="h-20">
                <PageLoader />
              </div>
            }
          >
            <QuickStats />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-64">
                <PageLoader />
              </div>
            }
          >
            <PublishingActivityGraph />
          </Suspense>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-xl">API Usage</h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Suspense
            fallback={
              <div className="h-20">
                <PageLoader />
              </div>
            }
          >
            <ApiUsageStats />
          </Suspense>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}
