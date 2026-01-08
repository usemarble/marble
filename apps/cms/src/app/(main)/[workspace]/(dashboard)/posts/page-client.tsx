"use client";

import { Files01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { PlusIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataView } from "@/components/posts/data-view";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

const PostsImportModal = dynamic(
  () =>
    import("@/components/posts/import-modal").then((m) => m.PostsImportModal),
  { ssr: false }
);

function PageClient() {
  const { activeWorkspace } = useWorkspace();

  const [importOpen, setImportOpen] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: QUERY_KEYS.POSTS(activeWorkspace?.id ?? ""),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data: Post[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch posts"
        );
      }
    },
    enabled: !!activeWorkspace?.id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <WorkspacePageWrapper
      className="flex flex-col gap-8 pt-10 pb-16"
      size="compact"
    >
      {posts && posts.length > 0 ? (
        <PostDataView columns={columns} data={posts} />
      ) : (
        <>
          <WorkspacePageWrapper className="grid h-full place-content-center">
            <div className="flex max-w-80 flex-col items-center gap-4">
              <div className="p-2">
                <HugeiconsIcon className="size-16" icon={Files01Icon} />
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-muted-foreground text-sm">
                  No posts yet. Click the button below to start writing.
                </p>
                <div className="flex gap-2">
                  <Link
                    className={buttonVariants({ variant: "default" })}
                    href={`/${activeWorkspace?.slug}/editor/p/new`}
                  >
                    <PlusIcon size={16} />
                    <span>New Post</span>
                  </Link>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label="Upload"
                          onClick={() => setImportOpen(true)}
                          variant="default"
                        >
                          <UploadSimpleIcon className="size-4" />
                        </Button>
                      }
                    />
                    <TooltipContent side="top">Upload</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </WorkspacePageWrapper>
          <PostsImportModal open={importOpen} setOpen={setImportOpen} />
        </>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
