"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

export const QuickStats = () => {
  const workspaceId = useWorkspaceId();

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: workspaceId is guaranteed to exist when enabled
    queryKey: QUERY_KEYS.POSTS(workspaceId!),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const { data: tags, isLoading: isLoadingTags } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: workspaceId is guaranteed to exist when enabled
    queryKey: QUERY_KEYS.TAGS(workspaceId!),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: workspaceId is guaranteed to exist when enabled
    queryKey: QUERY_KEYS.CATEGORIES(workspaceId!),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const isLoading = isLoadingPosts || isLoadingTags || isLoadingCategories;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24">
            <PageLoader />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    totalPosts: posts?.length || 0,
    publishedPosts:
      posts?.filter((p: { status: string }) => p.status === "published")
        .length || 0,
    draftPosts:
      posts?.filter((p: { status: string }) => p.status === "draft").length ||
      0,
    totalTags: tags?.length || 0,
    totalCategories: categories?.length || 0,
  };

  const statItems = [
    { label: "Total Posts", value: stats.totalPosts },
    { label: "Published", value: stats.publishedPosts },
    { label: "Drafts", value: stats.draftPosts },
    { label: "Tags", value: stats.totalTags },
    { label: "Categories", value: stats.totalCategories },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold text-primary">
                {item.value}
              </div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
