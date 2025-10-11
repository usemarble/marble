"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { MediaControls } from "@/components/media/media-controls";
import { MediaGallery } from "@/components/media/media-gallery";
import PageLoader from "@/components/shared/page-loader";
import { useMediaActions } from "@/hooks/use-media-actions";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MEDIA_FILTER_TYPES, MEDIA_LIMIT, MEDIA_SORTS } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type {
  MediaFilterType,
  MediaListResponse,
  MediaQueryKey,
  MediaSort,
} from "@/types/media";
import { toMediaType } from "@/utils/media";

const MediaUploadModal = dynamic(() =>
  import("@/components/media/upload-modal").then((mod) => mod.MediaUploadModal)
);

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [type, setType] = useQueryState<MediaFilterType>(
    "type",
    parseAsStringLiteral(MEDIA_FILTER_TYPES).withDefault("all")
  );
  const [sort, setSort] = useQueryState<MediaSort>(
    "sort",
    parseAsStringLiteral(MEDIA_SORTS).withDefault("createdAt_desc")
  );
  const normalizedType = toMediaType(type);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: [QUERY_KEYS.MEDIA(workspaceId!), { type: normalizedType, sort }],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      try {
        const params = new URLSearchParams();
        params.set("limit", String(MEDIA_LIMIT));
        params.set("sort", sort);

        if (normalizedType) {
          params.set("type", normalizedType);
        }
        if (pageParam) {
          params.set("cursor", pageParam);
        }

        const res = await fetch(`/api/media?${params}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch media: ${res.status} ${res.statusText}`
          );
        }
        const data: MediaListResponse = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch media"
        );
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
  const hasAnyMedia = data?.pages.at(0)?.hasAnyMedia ?? mediaItems.length > 0;

  const mediaQueryKey: MediaQueryKey = [
    // biome-ignore lint/style/noNonNullAssertion: <>
    QUERY_KEYS.MEDIA(workspaceId!),
    { type: normalizedType, sort },
  ];

  const { handleUploadComplete } = useMediaActions(mediaQueryKey);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
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
            mediaLength={mediaItems.length}
            onBulkDelete={() => setShowBulkDeleteModal(true)}
            onDeselectAll={handleDeselectAll}
            onSelectAll={handleSelectAll}
            onUpload={() => setShowUploadModal(true)}
            selectedItems={selectedItems}
            setSort={setSort}
            setType={setType}
            sort={sort}
            type={type}
          />
        )}
        <MediaGallery
          hasAnyMedia={hasAnyMedia}
          hasNextPage={hasNextPage}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          media={mediaItems}
          mediaQueryKey={mediaQueryKey}
          onLoadMore={fetchNextPage}
          onSelectItem={setSelectedItems}
          selectedItems={selectedItems}
          setShowBulkDeleteModal={setShowBulkDeleteModal}
          showBulkDeleteModal={showBulkDeleteModal}
          type={normalizedType}
        />
      </WorkspacePageWrapper>

      <MediaUploadModal
        isOpen={showUploadModal}
        onUploadComplete={handleUploadComplete}
        setIsOpen={setShowUploadModal}
      />
    </>
  );
}

export default PageClient;
