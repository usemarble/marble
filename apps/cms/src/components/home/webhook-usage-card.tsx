"use client";

import {
  Card,
  CardContent,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { UsageDashboardData } from "@/types/usage-dashboard";

type WebhookUsageCardProps = {
  data?: UsageDashboardData["webhooks"];
  isLoading?: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function WebhookUsageCard({ data, isLoading }: WebhookUsageCardProps) {
  const rawChartData = data?.chart ?? [];

  const chartData =
    rawChartData.map((item) => ({
      label: item.label,
      value: item.value,
      date: item.date,
    })) ?? [];

  const chartConfig = {
    deliveries: {
      label: "Deliveries",
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

  const startDate = chartData[0]?.date
    ? new Date(chartData[0].date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const lastItem = chartData.at(-1);
  const endDate = lastItem?.date
    ? new Date(lastItem.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card className="gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-0 px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Webhook Deliveries</CardTitle>
            <p className="font-medium text-muted-foreground text-xl leading-none tracking-tight">
              {numberFormatter.format(data?.total ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="rounded-full px-3 py-1 text-muted-foreground text-xs">
              {startDate && endDate
                ? `${startDate} - ${endDate}`
                : "Last 30 Days"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-60 rounded-[12px] bg-background p-4 pt-8 shadow-xs">
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
                    nameKey="deliveries"
                  />
                }
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                name="deliveries"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
