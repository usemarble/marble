"use client";

import { Package01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";
import { DashboardBody } from "@/components/layout/wrapper";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import { useWorkspace } from "@/providers/workspace";
import Loading from "./loading";

const CategoryModal = dynamic(() =>
  import("@/components/categories/category-modals").then(
    (mod) => mod.CategoryModal
  )
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const { isFetchingWorkspace } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery(
    orpc.categories.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      staleTime: 1000 * 60 * 60,
      enabled: Boolean(workspaceId) && !isFetchingWorkspace,
    })
  );

  if (isFetchingWorkspace || !workspaceId || isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <DashboardBody>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </DashboardBody>
    );
  }

  return (
    <>
      {categories && categories.length > 0 ? (
        <DashboardBody
          className="flex flex-col gap-8 pt-10 pb-16"
          size="compact"
        >
          <DataTable columns={columns} data={categories} />
        </DashboardBody>
      ) : (
        <DashboardBody
          className="grid h-full place-content-center"
          size="compact"
        >
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div>
              <HugeiconsIcon className="size-16" icon={Package01Icon} />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground text-sm">
                Categories help organize your content. Create your first
                category to get started.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon size={16} />
                <span>Create Category</span>
              </Button>
            </div>
          </div>
        </DashboardBody>
      )}
      <CategoryModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </>
  );
}

export default PageClient;
