import { db } from "@marble/db";
import { UsageEventType } from "@prisma/client";
import { addDays, format, startOfDay, subDays, subHours } from "date-fns";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

const CHART_DAYS = 30;

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;
  const now = new Date();
  const today = startOfDay(now);
  const chartStart = subDays(today, CHART_DAYS - 1);
  const previousPeriodStart = subDays(chartStart, CHART_DAYS);

  const [apiEvents, apiPrevPeriodCount, apiTotalCount] = await Promise.all([
    db.usageEvent.findMany({
      where: {
        workspaceId,
        type: UsageEventType.api_request,
        createdAt: {
          gte: chartStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    db.usageEvent.count({
      where: {
        workspaceId,
        type: UsageEventType.api_request,
        createdAt: {
          gte: previousPeriodStart,
          lt: chartStart,
        },
      },
    }),
    db.usageEvent.count({
      where: {
        workspaceId,
        type: UsageEventType.api_request,
      },
    }),
  ]);

  const chartBuckets = new Map<string, number>();
  for (let i = 0; i < CHART_DAYS; i += 1) {
    const date = addDays(chartStart, i);
    const key = format(date, "yyyy-MM-dd");
    chartBuckets.set(key, 0);
  }
  for (const event of apiEvents) {
    const key = format(startOfDay(event.createdAt), "yyyy-MM-dd");
    chartBuckets.set(key, (chartBuckets.get(key) ?? 0) + 1);
  }

  const apiChart = Array.from(chartBuckets.entries()).map(
    ([dateKey, count]) => ({
      date: dateKey,
      label: format(new Date(dateKey), "MMM d"),
      value: count,
    })
  );

  const apiLastPeriodCount = apiChart.reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const apiPrev = apiPrevPeriodCount;
  const apiChange =
    apiPrev === 0
      ? apiLastPeriodCount > 0
        ? 100
        : 0
      : ((apiLastPeriodCount - apiPrev) / apiPrev) * 100;

  const WEBHOOK_CHART_DAYS = 30;
  const webhookChartStart = subDays(today, WEBHOOK_CHART_DAYS - 1);

  const [
    webhookTotal,
    webhookWeek,
    webhookDay,
    webhookTopEndpoint,
    webhookEvents,
    mediaTotals,
    mediaLast30,
    mediaSizeSum,
    mediaLastUpload,
    recentMediaUploads,
  ] = await Promise.all([
    db.usageEvent.count({
      where: { workspaceId, type: UsageEventType.webhook_delivery },
    }),
    db.usageEvent.count({
      where: {
        workspaceId,
        type: UsageEventType.webhook_delivery,
        createdAt: { gte: subDays(now, 6) },
      },
    }),
    db.usageEvent.count({
      where: {
        workspaceId,
        type: UsageEventType.webhook_delivery,
        createdAt: { gte: subHours(now, 24) },
      },
    }),
    db.usageEvent.groupBy({
      by: ["endpoint"],
      where: {
        workspaceId,
        type: UsageEventType.webhook_delivery,
        endpoint: { not: null },
      },
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: "desc" } },
      take: 1,
    }),
    db.usageEvent.findMany({
      where: {
        workspaceId,
        type: UsageEventType.webhook_delivery,
        createdAt: {
          gte: webhookChartStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    db.usageEvent.count({
      where: { workspaceId, type: UsageEventType.media_upload },
    }),
    db.usageEvent.count({
      where: {
        workspaceId,
        type: UsageEventType.media_upload,
        createdAt: { gte: subDays(now, 29) },
      },
    }),
    db.usageEvent.aggregate({
      where: { workspaceId, type: UsageEventType.media_upload },
      _sum: { size: true },
    }),
    db.usageEvent.findFirst({
      where: { workspaceId, type: UsageEventType.media_upload },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.media.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        size: true,
        createdAt: true,
        type: true,
        url: true,
      },
    }),
  ]);

  const webhookChartBuckets = new Map<string, number>();
  for (let i = 0; i < WEBHOOK_CHART_DAYS; i += 1) {
    const date = addDays(webhookChartStart, i);
    const key = format(date, "yyyy-MM-dd");
    webhookChartBuckets.set(key, 0);
  }
  for (const event of webhookEvents) {
    const key = format(startOfDay(event.createdAt), "yyyy-MM-dd");
    webhookChartBuckets.set(key, (webhookChartBuckets.get(key) ?? 0) + 1);
  }

  const webhookChart = Array.from(webhookChartBuckets.entries()).map(
    ([dateKey, count]) => ({
      date: dateKey,
      label: format(new Date(dateKey), "MMM d"),
      value: count,
    })
  );

  const response = {
    api: {
      totals: {
        total: apiTotalCount,
        lastPeriod: apiLastPeriodCount,
        changePercentage: Math.round(apiChange * 100) / 100,
      },
      chart: apiChart,
    },
    webhooks: {
      total: webhookTotal,
      last7Days: webhookWeek,
      last24Hours: webhookDay,
      topEndpoint: webhookTopEndpoint[0]?.endpoint ?? null,
      topEndpointCount: webhookTopEndpoint[0]?._count.endpoint ?? 0,
      chart: webhookChart,
    },
    media: {
      total: mediaTotals,
      last30Days: mediaLast30,
      totalSize: mediaSizeSum._sum.size ?? 0,
      lastUploadAt: mediaLastUpload?.createdAt.toISOString() ?? null,
      recentUploads: recentMediaUploads.map((media) => ({
        id: media.id,
        name: media.name,
        size: media.size,
        createdAt: media.createdAt.toISOString(),
        type: media.type,
        url: media.url,
      })),
    },
  };

  return NextResponse.json(response);
}
