"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@marble/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { UsageDashboardData } from "@/types/usage-dashboard";
import { LoadingSpinner } from "../ui/loading-spinner";

type ApiUsageCardProps = {
  data?: UsageDashboardData["api"];
  isLoading?: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function ApiUsageCard({ data, isLoading }: ApiUsageCardProps) {
  const rawChartData = data?.chart ?? [];

  const chartData =
    rawChartData.map((item) => ({
      label: item.label,
      value: item.value,
      date: item.date,
    })) ?? [];

  const chartConfig = {
    requests: {
      label: "API Requests",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const formatXAxisLabel = (value: string) => value;

  const formatTooltipLabel = (value?: string) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="col-span-full gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-2 px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">API Requests</CardTitle>
            <CardDescription className="sr-only">
              {" "}
              API requests for thelast 30 days
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-semibold text-xl leading-none tracking-tight">
              {numberFormatter.format(data?.totals.lastPeriod ?? 0)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-84 rounded-[12px] bg-background p-4 pt-8 shadow-sm">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No data available.
          </div>
        ) : (
          <ChartContainer
            className="aspect-auto size-full"
            config={chartConfig}
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                minTickGap={24}
                tickFormatter={formatXAxisLabel}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      formatTooltipLabel(
                        chartData.find((item) => item.label === value)?.date
                      )
                    }
                    nameKey="requests"
                  />
                }
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-requests)"
                name="requests"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
