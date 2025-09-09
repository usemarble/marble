"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { WarningCircleIcon } from "@phosphor-icons/react";
import PageLoader from "@/components/shared/page-loader";
import { useApiAnalytics } from "@/hooks/use-analytics";
import { AnalyticsChart } from "./AnalyticsChart";

export function ApiUsageStats() {
  const { data, isLoading, error } = useApiAnalytics();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarningCircleIcon className="h-5 w-5 text-red-500" />
            API Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load API analytics data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80">
              <PageLoader />
            </div>
          ) : data?.chartData && data.chartData.length > 0 ? (
            <AnalyticsChart
              data={data.chartData}
              description="Track your API usage over the last 12 months"
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
              No analytics data available yet. Start making API requests to see
              your usage statistics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
