"use client";

import { Button } from "@marble/ui/components/button";
import { PlusIcon, PuzzlePieceIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { type CustomComponent, columns } from "@/components/components/columns";
import { ComponentsDataTable } from "@/components/components/data-table";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const ComponentModal = dynamic(() =>
  import("@/components/components/component-modals").then(
    (mod) => mod.ComponentModal
  )
);

export default function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: components, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.CUSTOM_COMPONENTS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/custom-components");
      if (!res.ok) {
        throw new Error("Failed to fetch components");
      }
      const data: CustomComponent[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      {components && components.length > 0 ? (
        <WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
          <ComponentsDataTable columns={columns} data={components} />
        </WorkspacePageWrapper>
      ) : (
        <WorkspacePageWrapper className="grid h-full place-content-center">
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div className="p-2">
              <PuzzlePieceIcon className="size-16" />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground text-sm">
                Custom components help you build reusable content blocks. Create
                your first component to get started.
              </p>
              <Button
                className="cursor-pointer"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon size={16} />
                <span>Create Component</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <ComponentModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </>
  );
}
