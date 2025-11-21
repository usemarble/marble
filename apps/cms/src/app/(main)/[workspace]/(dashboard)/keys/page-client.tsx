"use client";

import { Button } from "@marble/ui/components/button";
import { KeyIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { type APIKey, columns } from "@/components/keys/columns";
import { DataTable } from "@/components/keys/data-table";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

const CreateKeyModal = dynamic(() =>
  import("@/components/keys/api-key-modal").then((mod) => mod.ApiKeyModal)
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: keys, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.KEYS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/keys");
        if (!res.ok) {
          throw new Error(
            `Failed to fetch keys: ${res.status} ${res.statusText}`
          );
        }
        const data: APIKey[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch keys"
        );
        return [];
      }
    },
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      {keys && keys.length > 0 ? (
        <WorkspacePageWrapper
          className="flex flex-col gap-8 pt-10 pb-16"
          size="compact"
        >
          <DataTable columns={columns} data={keys} />
        </WorkspacePageWrapper>
      ) : (
        <WorkspacePageWrapper
          className="grid h-full place-content-center"
          size="compact"
        >
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div className="p-2">
              <KeyIcon className="size-16" />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground text-sm">
                API keys let you interact with your workspace using our API.
              </p>
              <Button
                className="w-fit"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="size-4" />
                <span>New API Key</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <CreateKeyModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </>
  );
}

export default PageClient;
