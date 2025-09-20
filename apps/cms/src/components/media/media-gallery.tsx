"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { TrashIcon, UploadIcon, XIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BulkDeleteMediaModal } from "@/components/media/bulk-delete-modal";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaCard } from "@/components/media/media-card";
import { MediaUploadModal } from "@/components/media/upload-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
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
};

export function MediaGallery({ media }: MediaGalleryProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleUploadComplete = (newMedia?: Media) => {
    if (newMedia && workspaceId) {
      queryClient.setQueryData(
        QUERY_KEYS.MEDIA(workspaceId),
        (oldData: Media[] | undefined) => {
          return oldData ? [...oldData, newMedia] : [newMedia];
        }
      );
    }
  };

  const handleDeleteComplete = (id: string) => {
    if (workspaceId) {
      queryClient.setQueryData(
        QUERY_KEYS.MEDIA(workspaceId),
        (oldData: Media[] | undefined) => {
          return oldData ? oldData.filter((m) => m.id !== id) : [];
        }
      );
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === media.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(media.map((item) => item.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDeleteComplete = (deletedIds: string[]) => {
    if (workspaceId) {
      queryClient.setQueryData(
        QUERY_KEYS.MEDIA(workspaceId),
        (oldData: Media[] | undefined) => {
          return oldData
            ? oldData.filter((m) => !deletedIds.includes(m.id))
            : [];
        }
      );
    }
    setSelectedItems(new Set());
  };

  return (
    <>
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && (
              <Button variant="outline" size="icon" onClick={handleDeselectAll}>
                <XIcon size={16} />
              </Button>
            )}
            <Button variant="outline" onClick={handleSelectAll}>
              {selectedItems.size === media.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            {selectedItems.size > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setShowBulkDeleteModal(true)}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete selected ({selectedItems.size})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowUploadModal(true)}>
            <UploadIcon size={16} />
            <span>Upload Media</span>
          </Button>
        </div>
      </section>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {media.map((item) => (
          <MediaCard
            key={item.id}
            media={item}
            isSelected={selectedItems.has(item.id)}
            onSelect={() => handleSelectItem(item.id)}
            onDelete={() => {
              setMediaToDelete(item);
              setShowDeleteModal(true);
            }}
          />
        ))}
      </ul>

      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
        onUploadComplete={handleUploadComplete}
      />
      {mediaToDelete && (
        <DeleteMediaModal
          isOpen={showDeleteModal}
          setIsOpen={setShowDeleteModal}
          onDeleteComplete={handleDeleteComplete}
          mediaToDelete={mediaToDelete}
        />
      )}
      <BulkDeleteMediaModal
        isOpen={showBulkDeleteModal}
        setIsOpen={setShowBulkDeleteModal}
        selectedItems={Array.from(selectedItems)}
        onDeleteComplete={handleBulkDeleteComplete}
      />
    </>
  );
}
