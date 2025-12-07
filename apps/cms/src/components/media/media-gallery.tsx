"use client";

import { Skeleton } from "@marble/ui/components/skeleton";
import { ImagesIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BulkDeleteMediaModal } from "@/components/media/bulk-delete-modal";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaCard } from "@/components/media/media-card";
import PageLoader from "@/components/shared/page-loader";
import { useMediaActions } from "@/hooks/use-media-actions";
import type { MediaQueryKey, MediaType } from "@/types/media";
import { getEmptyStateMessage } from "@/utils/media";
import { FileUploadInput } from "./file-upload-input";
import { containerVariants, itemVariants } from "./media-gallery.variants";

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
  type?: MediaType;
  selectedItems: Set<string>;
  onSelectItem: (items: Set<string>) => void;
  hasAnyMedia: boolean;
  showBulkDeleteModal: boolean;
  setShowBulkDeleteModal: (show: boolean) => void;
  mediaQueryKey: MediaQueryKey;
  onUpload?: (files: FileList) => void;
  isUploading?: boolean;
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
  mediaQueryKey,
  onUpload,
  isUploading = false,
}: MediaGalleryProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const { handleDeleteComplete, handleBulkDeleteComplete } =
    useMediaActions(mediaQueryKey);

  const onDelete = (id: string) => {
    handleDeleteComplete(id);
    if (selectedItems.has(id)) {
      const newSelectedItems = new Set(selectedItems);
      newSelectedItems.delete(id);
      onSelectItem(newSelectedItems);
    }
  };

  const onBulkDelete = (ids: string[]) => {
    handleBulkDeleteComplete(ids);
    onSelectItem(new Set());
  };

  const handleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectItem(newSet);
  };

  return (
    <>
      <div className="relative h-full min-h-[50vh]">
        <AnimatePresence>
          {isFetching && !isFetchingNextPage && (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PageLoader />
            </motion.div>
          )}
        </AnimatePresence>

        {media.length === 0 && !hasAnyMedia ? (
          <div className="grid h-full place-content-center">
            <div className="flex max-w-80 flex-col items-center gap-4">
              <div className="p-2">
                <ImagesIcon className="size-16" />
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-muted-foreground text-sm">
                  {getEmptyStateMessage(type, hasAnyMedia)}
                </p>
                {onUpload && (
                  <FileUploadInput
                    isUploading={isUploading}
                    onUpload={onUpload}
                  />
                )}
              </div>
            </div>
          </div>
        ) : media.length === 0 ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="py-8 text-center"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-muted-foreground text-sm">
              {getEmptyStateMessage(type, hasAnyMedia)}
            </p>
          </motion.div>
        ) : (
          <motion.ul
            animate="visible"
            className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
            initial="hidden"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {media.map((item) => (
                <motion.li
                  animate="visible"
                  exit="exit"
                  initial="hidden"
                  key={item.id}
                  layout
                  layoutId={item.id}
                  variants={itemVariants}
                >
                  <MediaCard
                    isSelected={selectedItems.has(item.id)}
                    media={item}
                    onDelete={() => {
                      setMediaToDelete(item);
                      setShowDeleteModal(true);
                    }}
                    onSelect={() => handleSelectItem(item.id)}
                  />
                </motion.li>
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 10 }).map((_, index) => (
                  <li
                    className="space-y-2"
                    // biome-ignore lint/suspicious/noArrayIndexKey: <>
                    key={`skeleton-${index}`}
                  >
                    <Skeleton className="h-40 w-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-10 shrink-0 rounded-md" />
                      <div className="flex w-full flex-col gap-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </li>
                ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      {hasNextPage && (
        <motion.div
          className="h-1"
          onViewportEnter={() => {
            if (!isFetchingNextPage) {
              onLoadMore?.();
            }
          }}
        />
      )}

      {mediaToDelete && (
        <DeleteMediaModal
          isOpen={showDeleteModal}
          mediaToDelete={mediaToDelete}
          onDeleteComplete={onDelete}
          setIsOpen={setShowDeleteModal}
        />
      )}
      <BulkDeleteMediaModal
        isOpen={showBulkDeleteModal}
        onDeleteComplete={onBulkDelete}
        selectedItems={Array.from(selectedItems)}
        setIsOpen={setShowBulkDeleteModal}
      />
    </>
  );
}
