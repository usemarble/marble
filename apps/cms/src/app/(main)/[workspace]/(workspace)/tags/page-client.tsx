"use client";

import { Button } from "@marble/ui/components/button";
import { PlusIcon, TagIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const TagModal = dynamic(() =>
  import("@/components/tags/tag-modals").then((mod) => mod.TagModal)
);

type TagType = {
  id: string;
  name: string;
  slug: string;
};

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: tags, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.TAGS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data: TagType[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch tags"
        );
      }
    },
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      {tags && tags.length > 0 ? (
        <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
          <DataTable data={tags} columns={columns} />
        </WorkspacePageWrapper>
      ) : (
        <WorkspacePageWrapper className="h-full grid place-content-center">
          <div className="flex flex-col gap-4 items-center max-w-80">
            <div className="p-2">
              <TagIcon className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                Tags help readers discover your content. Create your first tag
                to get started.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon size={16} />
                <span>Create Tag</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <TagModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        mode="create"
      />
    </>
  );
}

export default PageClient;
