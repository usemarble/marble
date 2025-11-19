export type UsageDashboardData = {
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
    recentUploads: Array<{
      id: string;
      name: string;
      size: number;
      createdAt: string;
      type: string;
      url: string;
    }>;
  };
};
