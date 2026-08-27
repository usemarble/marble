import "server-only";

import { db } from "@marble/drizzle";
import { media, usageEvent } from "@marble/drizzle/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  lt,
} from "drizzle-orm";
import { addDays, format, startOfDay, subDays, subHours } from "date-fns";
import type { UsageDashboardData } from "@/types/dashboard";

const CHART_DAYS = 30;

export async function getDashboardUsageMetrics(
  workspaceId: string
): Promise<UsageDashboardData> {
  const now = new Date();
  const today = startOfDay(now);
  const chartStart = subDays(today, CHART_DAYS - 1);
  const previousPeriodStart = subDays(chartStart, CHART_DAYS);

  const [apiEvents, apiPrevPeriodCountResult, apiTotalCountResult] =
    await Promise.all([
      db
        .select({ createdAt: usageEvent.createdAt })
        .from(usageEvent)
        .where(
          and(
            eq(usageEvent.workspaceId, workspaceId),
            eq(usageEvent.type, "api_request"),
            gte(usageEvent.createdAt, chartStart)
          )
        ),
      db
        .select({ count: count() })
        .from(usageEvent)
        .where(
          and(
            eq(usageEvent.workspaceId, workspaceId),
            eq(usageEvent.type, "api_request"),
            gte(usageEvent.createdAt, previousPeriodStart),
            lt(usageEvent.createdAt, chartStart)
          )
        ),
      db
        .select({ count: count() })
        .from(usageEvent)
        .where(
          and(
            eq(usageEvent.workspaceId, workspaceId),
            eq(usageEvent.type, "api_request")
          )
        ),
    ]);

  const apiPrevPeriodCount = apiPrevPeriodCountResult[0]?.count ?? 0;
  const apiTotalCount = apiTotalCountResult[0]?.count ?? 0;

  const chartBuckets = new Map<string, number>();
  for (let i = 0; i < CHART_DAYS; i += 1) {
    const date = addDays(chartStart, i);
    chartBuckets.set(format(date, "yyyy-MM-dd"), 0);
  }
  for (const event of apiEvents) {
    const key = format(startOfDay(event.createdAt), "yyyy-MM-dd");
    chartBuckets.set(key, (chartBuckets.get(key) ?? 0) + 1);
  }

  const apiChart = Array.from(chartBuckets.entries()).map(
    ([dateKey, chartCount]) => ({
      date: dateKey,
      label: format(new Date(dateKey), "MMM d"),
      value: chartCount,
    })
  );

  const apiLastPeriodCount = apiChart.reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const apiChange =
    apiPrevPeriodCount === 0
      ? apiLastPeriodCount > 0
        ? 100
        : 0
      : ((apiLastPeriodCount - apiPrevPeriodCount) / apiPrevPeriodCount) * 100;

  const webhookChartStart = subDays(today, CHART_DAYS - 1);
  const [
    webhookTotalResult,
    webhookWeekResult,
    webhookDayResult,
    webhookTopEndpoint,
    webhookEvents,
    mediaTotalsResult,
    mediaLast30Result,
    mediaLastUpload,
    recentMediaUploads,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "webhook_delivery")
        )
      ),
    db
      .select({ count: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "webhook_delivery"),
          gte(usageEvent.createdAt, subDays(now, 6))
        )
      ),
    db
      .select({ count: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "webhook_delivery"),
          gte(usageEvent.createdAt, subHours(now, 24))
        )
      ),
    db
      .select({
        endpoint: usageEvent.endpoint,
        count: count(),
      })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "webhook_delivery"),
          isNotNull(usageEvent.endpoint)
        )
      )
      .groupBy(usageEvent.endpoint)
      .orderBy(desc(count()))
      .limit(1),
    db
      .select({ createdAt: usageEvent.createdAt })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "webhook_delivery"),
          gte(usageEvent.createdAt, webhookChartStart)
        )
      ),
    db
      .select({ count: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "media_upload")
        )
      ),
    db
      .select({ count: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, workspaceId),
          eq(usageEvent.type, "media_upload"),
          gte(usageEvent.createdAt, subDays(now, 29))
        )
      ),
    db.query.usageEvent.findFirst({
      where: and(
        eq(usageEvent.workspaceId, workspaceId),
        eq(usageEvent.type, "media_upload")
      ),
      orderBy: desc(usageEvent.createdAt),
      columns: { createdAt: true },
    }),
    db
      .select({
        id: media.id,
        name: media.name,
        size: media.size,
        alt: media.alt,
        createdAt: media.createdAt,
        type: media.type,
        url: media.url,
        mimeType: media.mimeType,
        width: media.width,
        height: media.height,
        duration: media.duration,
        blurHash: media.blurHash,
      })
      .from(media)
      .where(eq(media.workspaceId, workspaceId))
      .orderBy(desc(media.createdAt))
      .limit(10),
  ]);

  const webhookTotal = webhookTotalResult[0]?.count ?? 0;
  const webhookWeek = webhookWeekResult[0]?.count ?? 0;
  const webhookDay = webhookDayResult[0]?.count ?? 0;
  const mediaTotals = mediaTotalsResult[0]?.count ?? 0;
  const mediaLast30 = mediaLast30Result[0]?.count ?? 0;

  const webhookChartBuckets = new Map<string, number>();
  for (let i = 0; i < CHART_DAYS; i += 1) {
    const date = addDays(webhookChartStart, i);
    webhookChartBuckets.set(format(date, "yyyy-MM-dd"), 0);
  }
  for (const event of webhookEvents) {
    const key = format(startOfDay(event.createdAt), "yyyy-MM-dd");
    webhookChartBuckets.set(key, (webhookChartBuckets.get(key) ?? 0) + 1);
  }

  const webhookChart = Array.from(webhookChartBuckets.entries()).map(
    ([dateKey, chartCount]) => ({
      date: dateKey,
      label: format(new Date(dateKey), "MMM d"),
      value: chartCount,
    })
  );

  return {
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
      topEndpointCount: webhookTopEndpoint[0]?.count ?? 0,
      chart: webhookChart,
    },
    media: {
      total: mediaTotals,
      last30Days: mediaLast30,
      recentUploadsSize: recentMediaUploads.reduce(
        (sum, item) => sum + item.size,
        0
      ),
      lastUploadAt: mediaLastUpload?.createdAt.toISOString() ?? null,
      recentUploads: recentMediaUploads.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        alt: item.alt,
        createdAt: item.createdAt.toISOString(),
        type: item.type,
        url: item.url,
        mimeType: item.mimeType,
        width: item.width,
        height: item.height,
        duration: item.duration,
        blurHash: item.blurHash,
      })),
    },
  };
}
