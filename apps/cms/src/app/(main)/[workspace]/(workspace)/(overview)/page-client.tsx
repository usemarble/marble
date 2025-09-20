"use client";

import { Suspense } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useUser } from "@/providers/user";
import { ApiUsageStats } from "./components/ApiUsageStats";
import { PublishingActivityGraph } from "./components/PublishingActivityGraph";
import { QuickStats } from "./components/QuickStats";

export default function PageClient() {
  const { user, isFetchingUser } = useUser();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
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
            <h2 className="text-xl font-semibold">Publishing Data</h2>
            <div className="flex-1 h-px bg-border" />
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
            <h2 className="text-xl font-semibold">API Usage</h2>
            <div className="flex-1 h-px bg-border" />
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
