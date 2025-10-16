import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspaceId } from "./use-workspace-id";

type ApiAnalyticsData = {
  totalRequests: number;
  currentMonthRequests: number;
  lastMonthRequests: number;
  monthlyGrowth: number;
  chartData: {
    month: string;
    requests: number;
    label: string;
  }[];
};

type PublishingActivityData = {
  date: string;
  count: number;
  level: number;
};

type PublishingMetricsResponse = {
  graph: {
    activity: PublishingActivityData[];
  };
};

export function useApiAnalytics() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.API_ANALYTICS(workspaceId!),
    queryFn: async (): Promise<ApiAnalyticsData> => {
      const response = await fetch("/api/metrics/api");
      if (!response.ok) {
        throw new Error("Failed to fetch API analytics data");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!workspaceId,
  });
}

export function usePublishingMetrics() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.PUBLISHING_METRICS(workspaceId!),
    queryFn: async (): Promise<PublishingMetricsResponse> => {
      const response = await fetch("/api/metrics/publishing");
      if (!response.ok) {
        throw new Error("Failed to fetch publishing metrics");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!workspaceId,
  });
}

type WorkspaceMetricsData = {
  totalPosts: number;
  publishedPosts: number;
  drafts: number;
  tags: number;
  categories: number;
};

export function useWorkspaceMetrics() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.WORKSPACE_METRICS(workspaceId!),
    queryFn: async (): Promise<WorkspaceMetricsData> => {
      const response = await fetch("/api/metrics/workspace");
      if (!response.ok) {
        throw new Error("Failed to fetch workspace metrics");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!workspaceId,
  });
}
