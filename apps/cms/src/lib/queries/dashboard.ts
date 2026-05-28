import "server-only";

import { db } from "@marble/db";
import { UsageEventType } from "@marble/db/browser";
import { addDays, format, startOfDay, subDays, subHours } from "date-fns";
import type { Category } from "@/components/categories/columns";
import type { APIKey } from "@/components/keys/columns";
import type { Post } from "@/components/posts/columns";
import type { Tag } from "@/components/tags/columns";
import { requireWorkspaceAccess } from "@/lib/auth/access";
import type { SocialPlatform } from "@/lib/constants";
import type { Author } from "@/types/author";
import type { UsageDashboardData } from "@/types/dashboard";
import type { CustomField } from "@/types/fields";
import type {
  Media,
  MediaPaginatedListResponse,
  MediaSort,
  MediaType,
} from "@/types/media";
import type { Webhook } from "@/types/webhook";
import type { ApiScope } from "@/utils/keys";
import { splitMediaSort } from "@/utils/media";

const CHART_DAYS = 30;

export interface PostListFilters {
  category: string;
  page: number;
  perPage: number;
  search: string;
  sort: string;
  status: "all" | "published" | "draft";
}

export interface PostListResponse {
  hasAnyPosts: boolean;
  pageCount: number;
  posts: Post[];
  totalCount: number;
}

export interface MediaListFilters {
  page: number;
  perPage: number;
  search: string | null;
  sort: MediaSort;
  type?: MediaType | null;
}

export async function getDashboardWorkspaceId(workspaceSlug: string) {
  const accessData = await requireWorkspaceAccess(workspaceSlug);
  return accessData.ok ? accessData.workspaceId : null;
}

const POST_SORT_FIELDS = new Set([
  "createdAt",
  "publishedAt",
  "updatedAt",
  "title",
]);

export function splitPostSort(sort: string) {
  const [field = "createdAt", direction = "desc"] = sort.split("_");
  return {
    field: POST_SORT_FIELDS.has(field) ? field : "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
  } as const;
}

export async function getDashboardPosts(
  workspaceId: string,
  filters: PostListFilters
): Promise<PostListResponse> {
  const { category, page, perPage, search, sort, status } = filters;
  const { direction, field } = splitPostSort(sort);
  const trimmedSearch = search.trim();
  const where = {
    workspaceId,
    ...(category !== "all" && { categoryId: category }),
    ...(status !== "all" && { status }),
    ...(trimmedSearch && {
      title: {
        contains: trimmedSearch,
        mode: "insensitive" as const,
      },
    }),
  };

  const hasFilters = Boolean(
    category !== "all" || status !== "all" || trimmedSearch
  );
  const [posts, totalCount, workspacePostCount] = await Promise.all([
    db.post.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        [field]: direction,
      },
    }),
    db.post.count({ where }),
    hasFilters ? db.post.count({ where: { workspaceId } }) : null,
  ]);

  return {
    hasAnyPosts:
      workspacePostCount === null ? totalCount > 0 : workspacePostCount > 0,
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    posts,
    totalCount,
  };
}

export async function getDashboardMedia(
  workspaceId: string,
  filters: MediaListFilters
): Promise<MediaPaginatedListResponse> {
  const { field, direction } = splitMediaSort(filters.sort);
  const { page, perPage, search, type } = filters;
  const trimmedSearch = search?.trim();
  const where = {
    workspaceId,
    ...(type && { type }),
    ...(trimmedSearch && {
      name: {
        contains: trimmedSearch,
        mode: "insensitive" as const,
      },
    }),
  };

  const hasFilters = Boolean(type || trimmedSearch);
  const [media, totalCount, workspaceMediaCount] = await Promise.all([
    db.media.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: [{ [field]: direction }, { id: direction }],
      select: {
        id: true,
        name: true,
        url: true,
        alt: true,
        createdAt: true,
        type: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
      },
    }),
    db.media.count({ where }),
    hasFilters ? db.media.count({ where: { workspaceId } }) : null,
  ]);

  return {
    media: media.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    totalCount,
    hasAnyMedia:
      workspaceMediaCount === null ? totalCount > 0 : workspaceMediaCount > 0,
  };
}

export async function getDashboardCategories(
  workspaceId: string
): Promise<Category[]> {
  const categories = await db.category.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    postsCount: _count.posts,
  }));
}

export async function getDashboardTags(workspaceId: string): Promise<Tag[]> {
  const tags = await db.tag.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return tags.map(({ _count, ...tag }) => ({
    ...tag,
    postsCount: _count.posts,
  }));
}

export async function getDashboardAuthors(
  workspaceId: string
): Promise<Author[]> {
  const authors = await db.author.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      bio: true,
      slug: true,
      email: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      socials: {
        select: {
          id: true,
          url: true,
          platform: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return authors.map((author) => ({
    ...author,
    socials: author.socials.map((social) => ({
      ...social,
      platform: social.platform as SocialPlatform,
    })),
  }));
}

export async function getDashboardApiKeys(
  workspaceId: string
): Promise<APIKey[]> {
  const keys = await db.apiKey.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      preview: true,
      type: true,
      scopes: true,
      enabled: true,
      requestCount: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return keys.map((key) => ({
    ...key,
    type: key.type as APIKey["type"],
    scopes: key.scopes as ApiScope[],
  }));
}

export async function getDashboardWebhooks(
  workspaceId: string
): Promise<Webhook[]> {
  return db.webhookEndpoint.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDashboardCustomFields(
  workspaceId: string
): Promise<CustomField[]> {
  const fields = await db.field.findMany({
    where: {
      workspaceId,
    },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          values: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return fields.map(({ _count, ...field }) => ({
    ...field,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
    options: field.options.map((option) => ({
      ...option,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
    hasValues: _count.values > 0,
  }));
}

export async function getDashboardUsageMetrics(
  workspaceId: string
): Promise<UsageDashboardData> {
  const now = new Date();
  const today = startOfDay(now);
  const chartStart = subDays(today, CHART_DAYS - 1);
  const previousPeriodStart = subDays(chartStart, CHART_DAYS);

  const [apiEvents, apiPrevPeriodCount, apiTotalCount] = await Promise.all([
    db.usageEvent.findMany({
      where: {
        workspaceId,
        type: UsageEventType.api_request,
        createdAt: { gte: chartStart },
      },
      select: { createdAt: true },
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
    chartBuckets.set(format(date, "yyyy-MM-dd"), 0);
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
  const apiChange =
    apiPrevPeriodCount === 0
      ? apiLastPeriodCount > 0
        ? 100
        : 0
      : ((apiLastPeriodCount - apiPrevPeriodCount) / apiPrevPeriodCount) * 100;

  const webhookChartStart = subDays(today, CHART_DAYS - 1);
  const [
    webhookTotal,
    webhookWeek,
    webhookDay,
    webhookTopEndpoint,
    webhookEvents,
    mediaTotals,
    mediaLast30,
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
        createdAt: { gte: webhookChartStart },
      },
      select: { createdAt: true },
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
        alt: true,
        createdAt: true,
        type: true,
        url: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
      },
    }),
  ]);

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
    ([dateKey, count]) => ({
      date: dateKey,
      label: format(new Date(dateKey), "MMM d"),
      value: count,
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
      topEndpointCount: webhookTopEndpoint[0]?._count.endpoint ?? 0,
      chart: webhookChart,
    },
    media: {
      total: mediaTotals,
      last30Days: mediaLast30,
      totalSize: recentMediaUploads.reduce((sum, media) => sum + media.size, 0),
      lastUploadAt: mediaLastUpload?.createdAt.toISOString() ?? null,
      recentUploads: recentMediaUploads.map((media) => ({
        id: media.id,
        name: media.name,
        size: media.size,
        alt: media.alt,
        createdAt: media.createdAt.toISOString(),
        type: media.type,
        url: media.url,
        mimeType: media.mimeType,
        width: media.width,
        height: media.height,
        duration: media.duration,
        blurHash: media.blurHash,
      })),
    },
  };
}
