"use client";

import { Image02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@marble/ui/components/skeleton";
import { AnimatePresence, motion } from "motion/react";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaCard } from "@/components/media/media-card";
import { useMediaActions } from "@/hooks/use-media-actions";
import type { MediaQueryKey, MediaType } from "@/types/media";
import { getEmptyStateMessage } from "@/utils/media";
import { FileUploadInput } from "./file-upload-input";

interface Media {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
}

interface MediaGalleryProps {
  media: Media[];
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
  type?: MediaType;
  selectedItems: Set<string>;
  onSelectItem: (items: Set<string>) => void;
  hasAnyMedia: boolean;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  mediaToDelete: Media[];
  setMediaToDelete: (items: Media[]) => void;
  mediaQueryKey: MediaQueryKey;
  onUpload?: (files: FileList) => void;
  isUploading?: boolean;
}

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
  showDeleteModal,
  setShowDeleteModal,
  mediaToDelete,
  setMediaToDelete,
  mediaQueryKey,
  onUpload,
  isUploading = false,
}: MediaGalleryProps) {
  const { handleDeleteComplete, handleBulkDeleteComplete } =
    useMediaActions(mediaQueryKey);

  const onDeleteComplete = (ids: string[]) => {
    if (ids.length === 1 && ids[0]) {
      handleDeleteComplete(ids[0]);
    } else {
      handleBulkDeleteComplete(ids);
    }
    // Remove deleted items from selection
    const newSelectedItems = new Set(selectedItems);
    for (const id of ids) {
      newSelectedItems.delete(id);
    }
    onSelectItem(newSelectedItems);
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

  // Open delete modal for single item (from card dropdown)
  const handleDeleteSingle = (item: Media) => {
    setMediaToDelete([item]);
    setShowDeleteModal(true);
  };

  // Open delete modal for selected items (from bulk action)
  const handleDeleteSelected = () => {
    const itemsToDelete = media.filter((item) => selectedItems.has(item.id));
    setMediaToDelete(itemsToDelete);
    setShowDeleteModal(true);
  };

  const isRefetching = isFetching && !isFetchingNextPage && media.length > 0;

  const renderSkeletonCard = (index: number, keyPrefix: string) => (
    <li className="space-y-2.5 rounded-[20px]" key={`${keyPrefix}-${index}`}>
      <Skeleton className="aspect-video w-full rounded-[12px]" />
      <div className="flex items-start gap-3">
        <Skeleton className="size-6 shrink-0 rounded" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </li>
  );

  return (
    <>
      <div className="relative h-full min-h-[50vh]">
        {isRefetching ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {Array.from({ length: 10 }).map((_, index) =>
              renderSkeletonCard(index, "refetch-skeleton")
            )}
          </ul>
        ) : media.length === 0 && !hasAnyMedia ? (
          <div className="grid h-full place-content-center">
            <div className="flex max-w-80 flex-col items-center gap-4">
              <div className="p-2">
                <HugeiconsIcon className="size-16" icon={Image02Icon} />
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
            className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
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
                    onDelete={() => handleDeleteSingle(item)}
                    onSelect={() => handleSelectItem(item.id)}
                  />
                </motion.li>
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 10 }).map((_, index) =>
                  renderSkeletonCard(index, "pagination-skeleton")
                )}
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

      <DeleteMediaModal
        isOpen={showDeleteModal}
        mediaToDelete={mediaToDelete}
        onDeleteComplete={onDeleteComplete}
        setIsOpen={setShowDeleteModal}
      />
    </>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeIn" },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};
