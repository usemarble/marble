"use client";

import { Button } from "@marble/ui/components/button";
import { ImagesIcon, UploadIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { MediaGallery } from "@/components/media/media-gallery";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

const MediaUploadModal = dynamic(() =>
  import("@/components/media/upload-modal").then((mod) => mod.MediaUploadModal),
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: media, isLoading } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.MEDIA(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/media");
        if (!res.ok) {
          throw new Error(
            `Failed to fetch media: ${res.status} ${res.statusText}`,
          );
        }
        const data: Media[] = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch media",
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
      {media && media.length > 0 ? (
        <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
          <MediaGallery media={media} />
        </WorkspacePageWrapper>
      ) : (
        <WorkspacePageWrapper className="h-full grid place-content-center">
          <div className="flex flex-col gap-4 items-center max-w-80">
            <div className="p-2">
              <ImagesIcon className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                Images you upload in this workspace will appear here.
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <UploadIcon size={16} />
                <span>Upload image</span>
              </Button>
            </div>
          </div>
        </WorkspacePageWrapper>
      )}
      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
      />
    </>
  );
}

export default PageClient;
