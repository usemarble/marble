import type { ApiScope } from "@/utils/keys";
import type { Media, MediaType } from "./media";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postsCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postsCount: number;
}

export interface Post {
  id: string;
  title: string;
  coverImage: string | null;
  status: "published" | "draft";
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  authors: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
}

export interface APIKey {
  id: string;
  name: string;
  preview: string;
  type: "public" | "private";
  scopes: ApiScope[];
  requestCount: number;
  enabled: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

type DashboardRecentUpload = Pick<
  Media,
  | "alt"
  | "blurHash"
  | "duration"
  | "height"
  | "id"
  | "mimeType"
  | "name"
  | "size"
  | "type"
  | "url"
  | "width"
> & {
  createdAt: string;
  type: MediaType;
};

export interface UsageDashboardData {
  api: {
    totals: {
      total: number;
      lastPeriod: number;
      changePercentage: number;
    };
    chart: Array<{
      date: string;
      label: string;
      value: number;
    }>;
  };
  webhooks: {
    total: number;
    last7Days: number;
    last24Hours: number;
    topEndpoint: string | null;
    topEndpointCount: number;
    chart: Array<{
      date: string;
      label: string;
      value: number;
    }>;
  };
  media: {
    total: number;
    last30Days: number;
    totalSize: number;
    lastUploadAt: string | null;
    recentUploads: DashboardRecentUpload[];
  };
}

export interface PublishingMetricsData {
  graph: {
    activity: Array<{
      date: string;
      count: number;
      level: number;
    }>;
  };
}
