"use client";

import { Button } from "@marble/ui/components/button";
import { Package, Plus } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CreateCategoryModal } from "@/components/categories/category-modals";
import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import PageLoader from "@/components/shared/page-loader";

interface Category {
  id: string;
  name: string;
  slug: string;
}

function PageClient() {
  const params = useParams<{ workspace: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", params.workspace],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data: Category[] = await res.json();
      return data;
    },
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
              <Package className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                Categories help organize your content. Create your first
                category to get started.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus size={16} />
                <span>Create category</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <CreateCategoryModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </>
  );
}

export default PageClient;
