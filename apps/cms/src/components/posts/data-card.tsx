"use client";

import { Badge } from "@marble/ui/components/badge";
import { Card, CardContent, CardHeader } from "@marble/ui/components/card";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";
import TableActions from "./table-actions";

interface DataCardProps {
  data: Post[];
}

export function DataCard({ data }: DataCardProps) {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const handleCardClick = (post: Post, event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).closest("button") ||
      (event.target as HTMLElement).closest("a") ||
      (event.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      return;
    }
    router.push(`/${activeWorkspace?.slug}/editor/p/${post.id}`);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((post) => (
        <Card
          key={post.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={(event) => handleCardClick(post, event)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <h3 className="font-medium line-clamp-2 flex-1 mr-2">
                {post.title}
              </h3>
              <div>
                <TableActions {...post} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col justify-end h-full">
            <div className="space-y-3">
              <Badge
                variant={post.status === "published" ? "positive" : "pending"}
                className="rounded-[6px] w-fit"
              >
                {post.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>Published: {format(post.publishedAt, "MMM dd, yyyy")}</p>
              <p>Updated: {format(post.updatedAt, "MMM dd, yyyy")}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
