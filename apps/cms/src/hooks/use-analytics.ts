import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspaceId } from "./use-workspace-id";

interface ApiAnalyticsData {
  totalRequests: number;
  currentMonthRequests: number;
  lastMonthRequests: number;
  monthlyGrowth: number;
  chartData: {
    month: string;
    requests: number;
    label: string;
  }[];
}

interface PublishingActivityData {
  date: string;
  count: number;
  level: number;
}

interface PublishingMetricsResponse {
  graph: {
    activity: PublishingActivityData[];
  };
}

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
    placeholderData: {
      totalRequests: 0,
      currentMonthRequests: 0,
      lastMonthRequests: 0,
      monthlyGrowth: 0,
      chartData: [],
    },
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
    placeholderData: {
      graph: {
        activity: [],
      },
    },
  });
}

interface WorkspaceMetricsData {
  totalPosts: number;
  publishedPosts: number;
  drafts: number;
  tags: number;
  categories: number;
}

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
    placeholderData: {
      totalPosts: 0,
      publishedPosts: 0,
      drafts: 0,
      tags: 0,
      categories: 0,
    },
  });
}
