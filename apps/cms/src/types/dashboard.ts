import type { Media, MediaType } from "./media";

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
