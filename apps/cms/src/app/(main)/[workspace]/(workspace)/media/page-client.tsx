"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { MediaGallery } from "@/components/media/media-gallery";
import { MediaControls } from "@/components/media/media-controls";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

const MediaUploadModal = dynamic(() =>
  import("@/components/media/upload-modal").then((mod) => mod.MediaUploadModal)
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [type, setType] = useState<string | undefined>();
  const [sort, setSort] = useState("createdAt_desc");
  const [limit] = useState(3);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: [QUERY_KEYS.MEDIA(workspaceId!), { type, sort }],
  queryFn: async ({ pageParam }: { pageParam?: string }) => {
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("sort", sort);

      if (type) {
        params.set("type", type);
      }
      if (pageParam) {
        params.set("cursor", pageParam);
      }

      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch media: ${res.status} ${res.statusText}`);
      }
      const data: { media: Media[]; nextCursor?: string, hasAnyMedia: boolean } = await res.json();
      return data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch media");
      return { media: [], nextCursor: undefined, hasAnyMedia: false };
    }
  },
  getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  initialPageParam: undefined,
  enabled: !!workspaceId,
  staleTime: 1000 * 60 * 60,
  placeholderData: keepPreviousData,
});

  const mediaItems = data?.pages.flatMap((page) => page.media) ?? [];
  const hasAnyMedia = data?.pages.some((page) => page.hasAnyMedia) ?? false;

  const mediaQueryKey = [QUERY_KEYS.MEDIA(workspaceId!), { type, sort }];

  useEffect(() => {
  setSelectedItems(new Set());
}, [type, sort]);

  const handleSelectAll = () => {
    if (selectedItems.size === mediaItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(mediaItems.map((item) => item.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
        {hasAnyMedia && (
          <MediaControls
            type={type}
            setType={setType}
            sort={sort}
            setSort={setSort}
            onUpload={() => setShowUploadModal(true)}
            selectedItems={selectedItems}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkDelete={() => setShowBulkDeleteModal(true)}
            mediaLength={mediaItems.length}
          />
        )}
          <MediaGallery
           media={mediaItems}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          type={type}
          selectedItems={selectedItems}
          onSelectItem={setSelectedItems}
          hasAnyMedia={hasAnyMedia}
          showBulkDeleteModal={showBulkDeleteModal}
          setShowBulkDeleteModal={setShowBulkDeleteModal}
          mediaQueryKey={mediaQueryKey}
          />
      </WorkspacePageWrapper>
      
      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
      />
    </>
  );
}

export default PageClient;
