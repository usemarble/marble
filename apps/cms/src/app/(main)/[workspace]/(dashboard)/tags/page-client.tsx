"use client";

import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DashboardBody } from "@/components/layout/wrapper";
import { PageError } from "@/components/shared/page-error";
import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import Loading from "./loading";

const TagModal = dynamic(() =>
  import("@/components/tags/tag-modals").then((mod) => mod.TagModal)
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: tags,
    isLoading,
    error,
  } = useQuery(
    orpc.tags.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      staleTime: 1000 * 60 * 60,
      enabled: Boolean(workspaceId),
    })
  );

  if (!workspaceId || isLoading) {
    return <Loading />;
  }

  if (error) {
    return <PageError message={error.message} title="Unable to load tags" />;
  }

  return (
    <>
      {tags && tags.length > 0 ? (
        <DashboardBody
          className="flex flex-col gap-8 pt-10 pb-16"
          size="compact"
        >
          <DataTable columns={columns} data={tags} />
        </DashboardBody>
      ) : (
        <DashboardBody
          className="grid h-full place-content-center"
          size="compact"
        >
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div className="p-2">
              <HugeiconsIcon className="size-16" icon={Tag01Icon} />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
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
        </DashboardBody>
      )}
      <TagModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </>
  );
}

export default PageClient;
