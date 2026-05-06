"use client";

import { toast } from "@marble/ui/components/sonner";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardBody } from "@/components/layout/wrapper";
import { MediaDataTable } from "@/components/media/media-data-table";
import PageLoader from "@/components/shared/page-loader";
import { useMediaActions } from "@/hooks/use-media-actions";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { getMediaApiUrl, useMediaPageFilters } from "@/lib/search-params";
import { useWorkspace } from "@/providers/workspace";
import type {
  Media,
  MediaPaginatedListResponse,
  MediaQueryKey,
} from "@/types/media";
import { toMediaType } from "@/utils/media";

function PageClient() {
  const workspaceId = useWorkspaceId();
  const { isFetchingWorkspace } = useWorkspace();
  const [{ page, perPage, search, sort, type }] = useMediaPageFilters();
  const normalizedType = toMediaType(type);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { data, error, isError, isLoading, isFetching } = useQuery({
    queryKey: [
      // biome-ignore lint/style/noNonNullAssertion: <>
      ...QUERY_KEYS.MEDIA(workspaceId!),
      { page, perPage, search, sort, type: normalizedType },
    ],
    queryFn: async () => {
      try {
        const url = getMediaApiUrl("/api/media", {
          page,
          perPage,
          search: search || null,
          sort,
          type: normalizedType,
        });

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch media: ${res.status} ${res.statusText}`
          );
        }
        const data: MediaPaginatedListResponse = await res.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch media"
        );
        throw error;
      }
    },
    enabled: !!workspaceId && !isFetchingWorkspace,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const mediaItems = data?.media ?? [];
  const hasAnyMedia = data?.hasAnyMedia ?? mediaItems.length > 0;
  const pageCount = data?.pageCount ?? 1;
  const totalCount = data?.totalCount ?? mediaItems.length;

  const mediaQueryKey: MediaQueryKey = [
    // biome-ignore lint/style/noNonNullAssertion: <>
    ...QUERY_KEYS.MEDIA(workspaceId!),
    { page, perPage, search, type: normalizedType, sort },
  ];

  const { handleUploadComplete } = useMediaActions(mediaQueryKey);

  const handleFileUpload = async (files: FileList) => {
    if (!files?.length) {
      return;
    }

    setIsUploading(true);

    const total = files.length;
    let uploaded = 0;
    let failed = 0;

    const getUploadMessage = (current: number, totalFiles: number) => {
      if (totalFiles === 1) {
        return "Uploading file...";
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
    }
    setIsUploading(false);
  };

  if (isFetchingWorkspace || !workspaceId || isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <DashboardBody className="grid min-h-[calc(100vh-56px)] place-items-center">
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Could not load media."}
        </p>
      </DashboardBody>
    );
  }

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div aria-atomic="true" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      <MediaDataTable
        disabled={isFetching || isUploading}
        hasAnyMedia={hasAnyMedia}
        isUploading={isUploading}
        media={mediaItems}
        mediaQueryKey={mediaQueryKey}
        onUpload={handleFileUpload}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </DashboardBody>
  );
}

export default PageClient;
