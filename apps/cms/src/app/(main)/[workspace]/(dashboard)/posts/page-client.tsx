"use client";

import { FileImportIcon, Files01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { PlusIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardBody } from "@/components/layout/wrapper";
import { columns } from "@/components/posts/columns";
import { PostDataView } from "@/components/posts/data-view";
import { orpc } from "@/lib/orpc";
import { usePostPageFilters } from "@/lib/search-params";
import { useWorkspace } from "@/providers/workspace";
import Loading from "./loading";

const PostsImportModal = dynamic(
  () =>
    import("@/components/posts/import-modal").then((m) => m.PostsImportModal),
  { ssr: false }
);

function PageClient() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;
  const [filters] = usePostPageFilters();
  const apiFilters = useMemo(
    () => ({
      category: filters.category,
      page: filters.page,
      perPage: filters.perPage,
      search: filters.search,
      sort: filters.sort,
      status: filters.status,
    }),
    [
      filters.category,
      filters.page,
      filters.perPage,
      filters.search,
      filters.sort,
      filters.status,
    ]
  );

  const [importOpen, setImportOpen] = useState(false);

  const { data, error, isError, isFetching, isLoading } = useQuery(
    orpc.posts.list.queryOptions({
      input: { workspaceId: workspaceId ?? "", ...apiFilters },
      placeholderData: keepPreviousData,
      staleTime: 1000 * 60 * 60,
      enabled: Boolean(workspaceId),
    })
  );

  if (!workspaceId || (isLoading && !data)) {
    return <Loading />;
  }

  if (isError && !data) {
    return (
      <DashboardBody className="grid min-h-[calc(100vh-56px)] place-items-center">
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Could not load posts."}
        </p>
      </DashboardBody>
    );
  }

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      {data?.hasAnyPosts ? (
        <PostDataView
          columns={columns}
          data={data.posts}
          isFetching={isFetching}
          pageCount={data.pageCount}
          totalCount={data.totalCount}
        />
      ) : (
        <>
          <div className="grid min-h-[calc(100vh-220px)] place-content-center">
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
                          aria-label="Import"
                          onClick={() => setImportOpen(true)}
                          size="icon"
                          variant="secondary"
                        >
                          <HugeiconsIcon
                            icon={FileImportIcon}
                            size={16}
                            strokeWidth={2}
                          />
                        </Button>
                      }
                    />
                    <TooltipContent side="top">Import</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <PostsImportModal open={importOpen} setOpen={setImportOpen} />
        </>
      )}
    </DashboardBody>
  );
}

export default PageClient;
