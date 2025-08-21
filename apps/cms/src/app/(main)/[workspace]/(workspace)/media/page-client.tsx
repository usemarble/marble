"use client";

import { Button } from "@marble/ui/components/button";
import { Images, Upload } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { MediaGallery } from "@/components/media/media-gallery";
import { MediaUploadModal } from "@/components/media/upload-modal";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

function PageClient() {
  const params = useParams<{ workspace: string }>();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: media, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MEDIA, params.workspace],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: Media[] = await res.json();
      return data;
    },
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
              <Images className="size-16" />
            </div>
            <div className="text-center flex flex-col gap-4 items-center">
              <p className="text-muted-foreground text-sm">
                Images you upload in this workspace will appear here.
              </p>
              <Button onClick={() => setShowUploadModal(true)} size="sm">
                <Upload size={16} />
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
