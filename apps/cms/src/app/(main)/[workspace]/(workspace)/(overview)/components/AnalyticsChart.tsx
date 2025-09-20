"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@marble/ui/components/chart";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type ChartData = {
  month: string;
  requests: number;
};

type AnalyticsChartProps = {
  data: ChartData[];
};

const chartConfig = {
  requests: {
    label: "API Requests:",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

type ActiveProperty = keyof typeof chartConfig;

const formatXAxisTick = (value: string) => {
  try {
    const date = parseISO(`${value}-01`);
    return format(date, "MMM yyyy");
  } catch {
    return value;
  }
};

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [activeProperty, setActiveProperty] = useState<ActiveProperty | null>(
    null
  );

  return (
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
          domain={[0, "dataMax"]}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <HatchedBackgroundPattern config={chartConfig} />
          <linearGradient
            id="hatched-background-pattern-grad-requests"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stopColor="var(--color-requests)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-requests)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          onMouseEnter={() => setActiveProperty("requests")}
          onMouseLeave={() => setActiveProperty(null)}
          dataKey="requests"
          type="bump"
          fill={
            activeProperty === "requests"
              ? "url(#hatched-background-pattern-requests)"
              : "url(#hatched-background-pattern-grad-requests)"
          }
          fillOpacity={0.4}
          stroke="var(--color-requests)"
          stackId="a"
          strokeWidth={0.8}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const HatchedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`hatched-background-pattern-${key}`}
          x="0"
          y="0"
          width="6.81"
          height="6.81"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
          overflow="visible"
        >
          <g overflow="visible" className="will-change-transform">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="6 0"
              dur="1s"
              repeatCount="indefinite"
            />
            <rect width="10" height="10" opacity={0.05} fill={value} />
            <rect width="1" height="10" fill={value} />
          </g>
        </pattern>
      ))}
    </>
  );
};
