"use client";

import { toast } from "@marble/ui/components/sonner";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { MediaControls } from "@/components/media/media-controls";
import { MediaGallery } from "@/components/media/media-gallery";
import PageLoader from "@/components/shared/page-loader";
import { useMediaActions } from "@/hooks/use-media-actions";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MEDIA_FILTER_TYPES, MEDIA_SORTS } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { getMediaApiUrl, useMediaPageFilters } from "@/lib/search-params";
import type { MediaListResponse, MediaQueryKey } from "@/types/media";
import { toMediaType } from "@/utils/media";

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [{ type, sort }] = useMediaPageFilters();
  const normalizedType = toMediaType(type);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      // biome-ignore lint/style/noNonNullAssertion: <>
      ...QUERY_KEYS.MEDIA(workspaceId!),
      { type: normalizedType, sort },
    ],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      try {
        const url = getMediaApiUrl("/api/media", {
          sort,
          type: normalizedType,
          cursor: pageParam,
        });

        const res = await fetch(url);
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
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const queryClient = useQueryClient();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <prevent multiple prefetches, only prefetch on workspaceId change>
  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    // Iterate through all combinations of filter types and sorts
    for (const filterType of MEDIA_FILTER_TYPES) {
      const normalizedType = toMediaType(filterType);

      for (const sortOption of MEDIA_SORTS) {
        // Skip current active combo since it's already fetched
        if (filterType === type && sortOption === sort) {
          continue;
        }

        queryClient.prefetchInfiniteQuery({
          queryKey: [
            ...QUERY_KEYS.MEDIA(workspaceId),
            { type: normalizedType, sort: sortOption },
          ],
          queryFn: async ({ pageParam }: { pageParam?: string }) => {
            const url = getMediaApiUrl("/api/media", {
              sort: sortOption,
              type: normalizedType,
              cursor: pageParam,
            });

            const res = await fetch(url);
            if (!res.ok) {
              throw new Error(
                `Failed to prefetch media: ${res.status} ${res.statusText}`
              );
            }

            const data: MediaListResponse = await res.json();
            return data;
          },
          initialPageParam: undefined,
        });
      }
    }
  }, [workspaceId, queryClient]);

  const mediaItems = data?.pages.flatMap((page) => page.media) ?? [];
  const hasAnyMedia = data?.pages.at(0)?.hasAnyMedia ?? mediaItems.length > 0;

  const mediaQueryKey: MediaQueryKey = [
    // biome-ignore lint/style/noNonNullAssertion: <>
    ...QUERY_KEYS.MEDIA(workspaceId!),
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

  const handleFileUpload = async (files: FileList) => {
    if (!files?.length) {
      return;
    }

    setIsUploading(true);

    const total = files.length;
    let uploaded = 0;
    let failed = 0;

    // For single file, show simple message; for multiple, show count
    const getUploadMessage = (current: number, totalFiles: number) => {
      if (totalFiles === 1) {
        return "Uploading image...";
      }
      return `Uploading ${current} of ${totalFiles} files...`;
    };

    const toastId = toast.loading(getUploadMessage(0, total));
    setStatusMessage(getUploadMessage(0, total));

    try {
      const errors: Array<{ file: string; error: string }> = [];
      for (const file of Array.from(files)) {
        try {
          await uploadFile({ file, type: "media" });
          uploaded += 1;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          errors.push({
            file: file.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          failed += 1;
        }

        const message = getUploadMessage(uploaded, total);
        toast.loading(message, { id: toastId });
        setStatusMessage(message);
      }

      handleUploadComplete();

      if (failed === 0) {
        const successMsg = `Uploaded all ${uploaded} file${uploaded > 1 ? "s" : ""}!`;
        toast.success(successMsg, { id: toastId });
        setStatusMessage(successMsg);
      } else {
        const warnMsg = `Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""}, ${failed} failed.`;
        toast.warning(warnMsg, { id: toastId });
        setStatusMessage(warnMsg);
      }
    } catch (err) {
      toast.error("Unexpected upload error", { id: toastId });
      setStatusMessage("Unexpected upload error");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
      <div aria-atomic="true" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      {hasAnyMedia && (
        <MediaControls
          isUploading={isUploading}
          mediaLength={mediaItems.length}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
          onDeselectAll={handleDeselectAll}
          onSelectAll={handleSelectAll}
          onUpload={handleFileUpload}
          selectedItems={selectedItems}
        />
      )}
      <MediaGallery
        hasAnyMedia={hasAnyMedia}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        isUploading={isUploading}
        media={mediaItems}
        mediaQueryKey={mediaQueryKey}
        onLoadMore={fetchNextPage}
        onSelectItem={setSelectedItems}
        onUpload={handleFileUpload}
        selectedItems={selectedItems}
        setShowBulkDeleteModal={setShowBulkDeleteModal}
        showBulkDeleteModal={showBulkDeleteModal}
        type={normalizedType}
      />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
