"use client";

import { Badge } from "@marble/ui/components/badge";
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
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import PageLoader from "@/components/shared/page-loader";
import { usePublishingMetrics } from "@/hooks/use-analytics";

export const PublishingActivityGraph = () => {
  const { data: metrics, isLoading, error } = usePublishingMetrics();

  if (error) {
    toast.error("Failed to load publishing activity");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32">
            <PageLoader />
          </div>
        ) : metrics?.graph?.activity ? (
          <TooltipProvider>
            <ContributionGraph data={metrics.graph.activity}>
              <ContributionGraphCalendar>
                {({ activity, dayIndex, weekIndex }) => (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <ContributionGraphBlock
                          activity={activity}
                          className={cn(
                            'data-[level="0"]:fill-muted dark:data-[level="0"]:fill-muted',
                            'data-[level="1"]:fill-primary/20 dark:data-[level="1"]:fill-primary/30',
                            'data-[level="2"]:fill-primary/40 dark:data-[level="2"]:fill-primary/50',
                            'data-[level="3"]:fill-primary/60 dark:data-[level="3"]:fill-primary/70',
                            'data-[level="4"]:fill-primary/80 dark:data-[level="4"]:fill-primary/90',
                          )}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                        />
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">
                        {format(parseISO(activity.date), "MMMM d, yyyy")}
                      </p>
                      <p>
                        {activity.count}{" "}
                        {activity.count === 1 ? "post" : "posts"} published
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </ContributionGraphCalendar>
              <ContributionGraphFooter>
                <ContributionGraphTotalCount>
                  {({ totalCount, year }) => (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        Year {year}:
                      </span>
                      <Badge variant="secondary">
                        {totalCount.toLocaleString()} posts published
                      </Badge>
                    </div>
                  )}
                </ContributionGraphTotalCount>
                <ContributionGraphLegend>
                  {({ level }) => (
                    <div
                      className="group relative flex h-3 w-3 items-center justify-center"
                      data-level={level}
                    >
                      <div
                        className={`h-full w-full rounded-sm border border-border ${level === 0 ? "bg-muted" : ""} ${level === 1 ? "bg-primary/20 dark:bg-primary/30" : ""} ${level === 2 ? "bg-primary/40 dark:bg-primary/50" : ""} ${level === 3 ? "bg-primary/60 dark:bg-primary/70" : ""} ${level === 4 ? "bg-primary/80 dark:bg-primary/90" : ""} `}
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
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            No publishing activity data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
