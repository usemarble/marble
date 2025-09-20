"use client";

import { Button } from "@marble/ui/components/button";
import { PackageIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const CategoryModal = dynamic(() =>
  import("@/components/categories/category-modals").then(
    (mod) => mod.CategoryModal
  )
);

type Category = {
  id: string;
  name: string;
  slug: string;
};

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: categories, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.CATEGORIES(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error(
            `Failed to fetch categories: ${res.status} ${res.statusText}`
          );
        }
        const data: Category[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch categories"
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
      {categories && categories.length > 0 ? (
        <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
          <DataTable data={categories} columns={columns} />
        </WorkspacePageWrapper>
      ) : (
        <WorkspacePageWrapper className="h-full grid place-content-center">
          <div className="flex flex-col gap-4 items-center max-w-80">
            <div>
              <PackageIcon className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
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
        </WorkspacePageWrapper>
      )}
      <CategoryModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        mode="create"
      />
    </>
  );
}

export default PageClient;
