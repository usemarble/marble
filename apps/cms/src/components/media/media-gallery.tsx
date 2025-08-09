"use client";

import { Button } from "@marble/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaUploadModal } from "@/components/media/upload-modal";
import { QUERY_KEYS } from "@/lib/queries/keys";

type Media = {
  id: string;
  name: string;
  url: string;
};

interface MediaGalleryProps {
  media: Media[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const queryClient = useQueryClient();

  const handleUploadComplete = (newMedia?: Media) => {
    if (newMedia) {
      queryClient.setQueryData(["media"], (oldData: Media[] | undefined) => {
        return oldData ? [...oldData, newMedia] : [newMedia];
      });
    }
  };

  const handleDelete = (id: string) => {
    queryClient.setQueryData(
      [QUERY_KEYS.MEDIA],
      (oldData: Media[] | undefined) => {
        return oldData ? oldData.filter((m) => m.id !== id) : [];
      }
    );
  };

  return (
    <>
      <section className="flex items-center justify-between">
        <div />
        <Button onClick={() => setShowUploadModal(true)} size="sm">
          <UploadCloud size={16} />
          <span>upload image</span>
        </Button>
      </section>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {media.map((m) => (
          <li
            className="group relative overflow-hidden rounded-md border"
            key={m.id}
          >
            <button
              className="absolute top-2 right-2 rounded-full bg-white p-2 text-muted-foreground opacity-0 transition duration-500 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              onClick={() => {
                setMediaToDelete(m);
                setShowDeleteModal(true);
              }}
              type="button"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">delete image</span>
            </button>
            <div>
              {/* biome-ignore lint/performance/noImgElement: <> */}
              <img
                alt={m.name}
                className="h-48 w-full object-cover"
                src={m.url}
              />
            </div>
            <div className="border-t bg-background p-4">
              <p className="truncate text-muted-foreground text-sm">
                {m.name.split(".")[0]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <MediaUploadModal
        isOpen={showUploadModal}
        onUploadComplete={handleUploadComplete}
        setIsOpen={setShowUploadModal}
      />
      {mediaToDelete && (
        <DeleteMediaModal
          isOpen={showDeleteModal}
          mediaToDelete={mediaToDelete.id}
          onDeleteComplete={handleDelete}
          setIsOpen={setShowDeleteModal}
        />
      )}
    </>
  );
}
