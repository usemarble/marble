"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { NoteIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataTable } from "@/components/posts/data-table";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const { activeWorkspace } = useWorkspace();

  const { data: posts, isLoading } = useQuery<Post[]>({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.POSTS(activeWorkspace?.id!),
    staleTime: 1000 * 60 * 5, // 5 minutes for frequently changing content
    queryFn: async (): Promise<Post[]> => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data: Post[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch posts",
        );
        return [];
      }
    },
    enabled: !!activeWorkspace?.id,
    placeholderData: [] as Post[],
  });

  const content = useMemo(() => {
    if (isLoading) {
      return <PageLoader />;
    }

    if (posts && posts.length > 0) {
      return <PostDataTable columns={columns} data={posts} />;
    }

    return (
      <WorkspacePageWrapper className="h-full grid place-content-center">
        <div className="flex flex-col gap-4 items-center max-w-80">
          <div className="p-2">
            <NoteIcon className="size-16" />
          </div>
          <div className="text-center flex flex-col gap-4 items-center">
            <p className="text-muted-foreground text-sm">
              No posts yet. Click the button below to start writing.
            </p>
            <Link
              href={`/${activeWorkspace?.slug}/editor/p/new`}
              className={buttonVariants({ variant: "default" })}
            >
              <PlusIcon size={16} />
              <span>New Post</span>
            </Link>
          </div>
        </div>
      </WorkspacePageWrapper>
    );
  }, [posts, isLoading, activeWorkspace?.slug]);

  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      {content}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
