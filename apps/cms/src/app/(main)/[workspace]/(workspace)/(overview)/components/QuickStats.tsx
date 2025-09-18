"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { toast } from "sonner";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceMetrics } from "@/hooks/use-analytics";

export const QuickStats = () => {
  const { data: metrics, isPending, error } = useWorkspaceMetrics();

  if (error) {
    toast.error("Failed to load workspace metrics");
  }

  const statItems = [
    { label: "Total Posts", value: metrics?.totalPosts || 0 },
    { label: "Published", value: metrics?.publishedPosts || 0 },
    { label: "Drafts", value: metrics?.drafts || 0 },
    { label: "Tags", value: metrics?.tags || 0 },
    { label: "Categories", value: metrics?.categories || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="h-24">
            <PageLoader />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
