"use client";

import { Button } from "@marble/ui/components/button";
import { Upload } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

interface MediaGalleryProps {
  media: Media[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleUploadComplete = (newMedia?: Media) => {
    if (newMedia && workspaceId) {
      queryClient.setQueryData(
        QUERY_KEYS.MEDIA(workspaceId),
        (oldData: Media[] | undefined) => {
          return oldData ? [...oldData, newMedia] : [newMedia];
        },
      );
    }
  };

  const handleDeleteComplete = (id: string) => {
    if (workspaceId) {
      queryClient.setQueryData(
        QUERY_KEYS.MEDIA(workspaceId),
        (oldData: Media[] | undefined) => {
          return oldData ? oldData.filter((m) => m.id !== id) : [];
        },
      );
    }
  };

  return (
    <>
      <section className="flex justify-between items-center">
        <div />
        <Button size="sm" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} className="" />
          <span>upload media</span>
        </Button>
      </section>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {media.map((item) => (
          <MediaCard
            key={item.id}
            media={item}
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
    </>
  );
}
