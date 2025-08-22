"use client";

import { Button } from "@marble/ui/components/button";
import { Plus, Tag } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import PageLoader from "@/components/shared/page-loader";
import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";
import { QUERY_KEYS } from "@/lib/queries/keys";

const CreateTagModal = dynamic(() =>
  import("@/components/tags/tag-modals").then((mod) => mod.CreateTagModal),
);

interface TagType {
  id: string;
  name: string;
  slug: string;
}

function PageClient() {
  const params = useParams<{ workspace: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: tags, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TAGS, params.workspace],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const data: TagType[] = await res.json();
      return data;
    },
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
              <Tag className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                Tags help readers discover your content. Create your first tag
                to get started.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus size={16} />
                <span>Create Tag</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <CreateTagModal open={showCreateModal} setOpen={setShowCreateModal} />
    </>
  );
}

export default PageClient;
