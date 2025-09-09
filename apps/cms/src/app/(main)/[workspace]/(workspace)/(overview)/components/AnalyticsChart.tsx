"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@marble/ui/components/chart";
import { format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

interface ChartData {
  month: string;
  requests: number;
  label: string;
}

interface AnalyticsChartProps {
  data: ChartData[];
  description?: string;
}

const chartConfig = {
  requests: {
    label: "API Requests",
    color: "hsl(244 100% 65%)",
  },
} satisfies ChartConfig;

const formatXAxisTick = (value: string) => {
  try {
    const date = parseISO(`${value}-01`);
    return format(date, "MMM yyyy");
  } catch {
    return value.slice(0, 3);
  }
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const formattedDate = formatXAxisTick(label || "");
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {formattedDate}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0]?.value?.toLocaleString() || 0} requests
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ data, description }: AnalyticsChartProps) {
  return (
    <div className="space-y-2">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <ChartContainer config={chartConfig}>
        <AreaChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatXAxisTick}
          />
          <ChartTooltip cursor={false} content={<CustomTooltip />} />
          <defs>
            {/** biome-ignore lint/correctness/useUniqueElementIds: They are scoped to this svg */}
            <linearGradient id="requests-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-requests)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-requests)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="requests"
            type="monotone"
            fill="url(#requests-gradient)"
            fillOpacity={0.4}
            stroke="var(--color-requests)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
