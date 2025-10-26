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
		null,
	);

	return (
		<ChartContainer config={chartConfig}>
			<AreaChart accessibilityLayer data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis
					axisLine={false}
					dataKey="month"
					tickFormatter={formatXAxisTick}
					tickLine={false}
					tickMargin={8}
				/>
				<YAxis
					allowDecimals={false}
					axisLine={false}
					domain={[0, "dataMax"]}
					tickLine={false}
					tickMargin={8}
				/>
				<ChartTooltip content={<ChartTooltipContent />} cursor={false} />
				<defs>
					<HatchedBackgroundPattern config={chartConfig} />
					<linearGradient
						id="hatched-background-pattern-grad-requests"
						x1="0"
						x2="0"
						y1="0"
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
					dataKey="requests"
					fill={
						activeProperty === "requests"
							? "url(#hatched-background-pattern-requests)"
							: "url(#hatched-background-pattern-grad-requests)"
					}
					fillOpacity={0.4}
					onMouseEnter={() => setActiveProperty("requests")}
					onMouseLeave={() => setActiveProperty(null)}
					stackId="a"
					stroke="var(--color-requests)"
					strokeWidth={0.8}
					type="bump"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

const HatchedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
	const items = Object.fromEntries(
		Object.entries(config).map(([key, value]) => [key, value.color]),
	);
	return (
		<>
			{Object.entries(items).map(([key, value]) => (
				<pattern
					height="6.81"
					id={`hatched-background-pattern-${key}`}
					key={key}
					overflow="visible"
					patternTransform="rotate(-45)"
					patternUnits="userSpaceOnUse"
					width="6.81"
					x="0"
					y="0"
				>
					<g className="will-change-transform" overflow="visible">
						<animateTransform
							attributeName="transform"
							dur="1s"
							from="0 0"
							repeatCount="indefinite"
							to="6 0"
							type="translate"
						/>
						<rect fill={value} height="10" opacity={0.05} width="10" />
						<rect fill={value} height="10" width="1" />
					</g>
				</pattern>
			))}
		</>
	);
};
