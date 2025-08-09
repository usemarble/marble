"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { Note } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataTable } from "@/components/posts/data-table";
import PageLoader from "@/components/shared/page-loader";

function PageClient() {
  const params = useParams<{ workspace: string }>();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", params.workspace],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/posts");
      const data: Post[] = await res.json();
      return data;
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
      {posts && posts.length > 0 ? (
        <PostDataTable columns={columns} data={posts} />
      ) : (
        <WorkspacePageWrapper className="grid h-full place-content-center">
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div className="p-2">
              <Note className="size-16" />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground text-sm">
                No posts yet. Click the button below to start writing.
              </p>
              <Link
                className={buttonVariants({ variant: "default", size: "sm" })}
                href={`/${params.workspace}/editor/p/new`}
              >
                <Plus size={16} />
                <span>New post</span>
              </Link>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
