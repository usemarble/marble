"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "@marble/ui/components/kibo-ui/contribution-graph";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PublishingMetricsData } from "@/types/dashboard";

const numberFormatter = new Intl.NumberFormat("en-US");

export const PublishingActivityCard = () => {
  const workspaceId = useWorkspaceId();

  const { data: metrics, isPending } = useQuery({
    queryKey: workspaceId
      ? QUERY_KEYS.PUBLISHING_METRICS(workspaceId)
      : ["publishing-metrics", "disabled"],
    queryFn: async (): Promise<PublishingMetricsData> => {
      const response = await fetch("/api/metrics/publishing");
      if (!response.ok) {
        throw new Error("Failed to fetch publishing metrics");
      }
      return response.json();
    },
    enabled: Boolean(workspaceId),
  });

  if (isPending) {
    return (
      <Card className="rounded-[20px] border-none bg-sidebar p-2.5">
        <CardHeader className="gap-0 px-4 pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Publishing Activity</CardTitle>
              <p className="rounded-full px-3 py-1 text-muted-foreground text-xs">
                {new Date().getFullYear()}
              </p>
            </div>
            <p className="font-medium text-muted-foreground text-xl leading-none tracking-tight">
              0 posts published
            </p>
          </div>
        </CardHeader>
        <CardContent className="h-[191px] rounded-[12px] bg-background p-4 shadow-xs">
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-0 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Publishing Activity</CardTitle>
            <p className="rounded-full px-3 py-1 text-muted-foreground text-xs">
              {new Date().getFullYear()}
            </p>
          </div>
          <p className="font-medium text-muted-foreground text-xl leading-none tracking-tight">
            {numberFormatter.format(
              metrics?.graph?.activity?.reduce(
                (acc, curr) => acc + curr.count,
                0
              ) ?? 0
            )}{" "}
            posts published
          </p>
        </div>
      </CardHeader>
      <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
        {metrics?.graph?.activity ? (
          <TooltipProvider delay={0}>
            <ContributionGraph
              blockMargin={3}
              blockSize={13}
              data={metrics.graph.activity}
              fontSize={12}
            >
              <ContributionGraphCalendar>
                {({ activity, dayIndex, weekIndex }) => (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <ContributionGraphBlock
                          activity={activity}
                          className={cn(
                            'data-[level="0"]:fill-muted dark:data-[level="0"]:fill-white/5',
                            'data-[level="1"]:fill-primary/20 dark:data-[level="1"]:fill-primary/30',
                            'data-[level="2"]:fill-primary/40 dark:data-[level="2"]:fill-primary/50',
                            'data-[level="3"]:fill-primary/60 dark:data-[level="3"]:fill-primary/70',
                            'data-[level="4"]:fill-primary/80 dark:data-[level="4"]:fill-primary/90'
                          )}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                        />
                      }
                    />
                    <TooltipContent
                      className="whitespace-nowrap"
                      sideOffset={8}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {format(parseISO(activity.date), "MMM d, yyyy")}
                        </span>
                        <span>
                          {activity.count}{" "}
                          {activity.count === 1 ? "post" : "posts"} published
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </ContributionGraphCalendar>
              {/* @ts-ignore - ContributionGraphFooter types seem incomplete but it renders children */}
              <ContributionGraphFooter>
                <ContributionGraphTotalCount>
                  {/* @ts-ignore - same issue with props type */}
                  {({ totalCount }) => (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        Total:
                      </span>
                      <span className="font-medium text-sm">
                        {totalCount.toLocaleString()} posts
                      </span>
                    </div>
                  )}
                </ContributionGraphTotalCount>
                <ContributionGraphLegend>
                  {/* @ts-ignore - same issue with props type */}
                  {({ level }) => (
                    <div
                      className="group relative flex h-3 w-3 items-center justify-center"
                      data-level={level}
                    >
                      <div
                        className={cn(
                          "h-full w-full rounded-sm border border-border",
                          level === 0 && "bg-muted dark:bg-white/5",
                          level === 1 && "bg-primary/20 dark:bg-primary/30",
                          level === 2 && "bg-primary/40 dark:bg-primary/50",
                          level === 3 && "bg-primary/60 dark:bg-primary/70",
                          level === 4 && "bg-primary/80 dark:bg-primary/90"
                        )}
                      />
                      <span className="-top-8 absolute hidden rounded bg-popover px-2 py-1 text-popover-foreground text-xs shadow-md group-hover:block">
                        Level {level}
                      </span>
                    </div>
                  )}
                </ContributionGraphLegend>
              </ContributionGraphFooter>
            </ContributionGraph>
          </TooltipProvider>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
            No publishing activity data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
