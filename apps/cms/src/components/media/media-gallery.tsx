"use client";

import { Button } from "@marble/ui/components/button";
import { UploadIcon, ImagesIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BulkDeleteMediaModal } from "@/components/media/bulk-delete-modal";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaCard } from "@/components/media/media-card";
import { MediaUploadModal } from "@/components/media/upload-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { MediaType } from "@/types/media";

type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};

type MediaGalleryProps = {
media: Media[];
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
  type?: string;
  selectedItems: Set<string>;
  onSelectItem: (items: Set<string>) => void;
  hasAnyMedia: boolean;
  showBulkDeleteModal: boolean;
  setShowBulkDeleteModal: (show: boolean) => void;
  mediaQueryKey: any[]
};

export function MediaGallery({ 
  media,
  hasNextPage,
  onLoadMore,
  isFetchingNextPage,
  isFetching,
  type,
  selectedItems,
  onSelectItem,
  hasAnyMedia,
  showBulkDeleteModal,
  setShowBulkDeleteModal,
  mediaQueryKey
 }: MediaGalleryProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleUploadComplete = (newMedia?: Media) => {
    if (newMedia && workspaceId) {
      queryClient.refetchQueries({
      queryKey: mediaQueryKey,
      exact: false, // Ensure all queries that start with this key are refetched
    });
    }
  };

  const handleDeleteComplete = (id: string) => {
    if (workspaceId) {
      queryClient.invalidateQueries({
        queryKey: mediaQueryKey
      })
    }
  };

  const handleBulkDeleteComplete = (deletedIds: string[]) => {
    if (workspaceId) {
      queryClient.invalidateQueries({
        queryKey: mediaQueryKey
      })
      onSelectItem(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    onSelectItem(new Set([...selectedItems]).add(id));
  };

  const getEmptyStateMessage = (type?: string) => {
    if (!hasAnyMedia) {
      return "Images you upload in this workspace will appear here.";
    }
    switch (type) {
      case "image":
        return "No images found. Try uploading some images or adjusting your filters.";
      case "video":
        return "No videos found. Try uploading some videos or adjusting your filters.";
      case "audio":
        return "No audio files found. Try uploading some audio files or adjusting your filters.";
      case "document":
        return "No documents found. Try uploading some documents or adjusting your filters.";
      default:
        return "No media found. Try adjusting your filters or upload some media.";
    }
  };

  return (
    <>
   <div className="relative min-h-[50vh]">
        {isFetching && !isFetchingNextPage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <PageLoader />
          </div>
        )}
        {media.length === 0 && !hasAnyMedia ? (
          <div className="grid h-full place-content-center">
            <div className="flex max-w-80 flex-col items-center gap-4">
              <div className="p-2">
                <ImagesIcon className="size-16" />
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-muted-foreground text-sm">
                  {getEmptyStateMessage(type)}
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <UploadIcon size={16} />
                  <span>Upload Media</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          media.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {getEmptyStateMessage(type)}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
              {media.map((item) => (
                <MediaCard
                  isSelected={selectedItems.has(item.id)}
                  key={item.id}
                  media={item}
                  onDelete={() => {
                    setMediaToDelete(item);
                    setShowDeleteModal(true);
                  }}
                  onSelect={() => handleSelectItem(item.id)}
                />
              ))}
            </ul>
          )
        )}
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <MediaUploadModal
        isOpen={showUploadModal}
        onUploadComplete={handleUploadComplete}
        setIsOpen={setShowUploadModal}
      />
      {mediaToDelete && (
        <DeleteMediaModal
          isOpen={showDeleteModal}
          mediaToDelete={mediaToDelete}
          onDeleteComplete={handleDeleteComplete}
          setIsOpen={setShowDeleteModal}
        />
      )}
      <BulkDeleteMediaModal
        isOpen={showBulkDeleteModal}
        onDeleteComplete={handleBulkDeleteComplete}
        selectedItems={Array.from(selectedItems)}
        setIsOpen={setShowBulkDeleteModal}
      />
    </>
  );
}
