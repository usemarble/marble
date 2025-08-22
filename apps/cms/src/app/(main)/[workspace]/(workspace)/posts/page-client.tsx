"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { Note } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataTable } from "@/components/posts/data-table";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const { activeWorkspace } = useWorkspace();

  const { data: posts, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.POSTS(activeWorkspace?.id!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/posts");
      const data: Post[] = await res.json();
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      {posts && posts.length > 0 ? (
        <PostDataTable columns={columns} data={posts} />
      ) : (
        <WorkspacePageWrapper className="h-full grid place-content-center">
          <div className="flex flex-col gap-4 items-center max-w-80">
            <div className="p-2">
              <Note className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                No posts yet. Click the button below to start writing.
              </p>
              <Link
                href={`/${activeWorkspace?.slug}/editor/p/new`}
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <Plus size={16} />
                <span>New Post</span>
              </Link>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
