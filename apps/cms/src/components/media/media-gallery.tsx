"use client";

import { Button } from "@marble/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaUploadModal } from "@/components/media/upload-modal";

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

  const handleUploadComplete = (_url: string, newMedia?: Media) => {
    if (newMedia) {
      queryClient.setQueryData(["media"], (oldData: Media[] | undefined) => {
        return oldData ? [...oldData, newMedia] : [newMedia];
      });
    }
  };

  const handleDelete = (id: string) => {
    queryClient.setQueryData(["media"], (oldData: Media[] | undefined) => {
      return oldData ? oldData.filter((m) => m.id !== id) : [];
    });
  };

  return (
    <>
      <section className="flex justify-between items-center">
        <div />
        <Button size="sm" onClick={() => setShowUploadModal(true)}>
          <UploadCloud size={16} />
          <span>upload image</span>
        </Button>
      </section>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {media.map((media) => (
          <li
            key={media.id}
            className="relative rounded-md overflow-hidden border group"
          >
            <button
              type="button"
              onClick={() => {
                setMediaToDelete(media);
                setShowDeleteModal(true);
              }}
              className="absolute top-2 right-2 p-2 bg-white rounded-full text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition duration-500"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">delete image</span>
            </button>
            <div className="">
              {/* biome-ignore lint/performance/noImgElement: <> */}
              <img
                src={media.url}
                alt={media.name}
                className="object-cover w-full h-48"
              />
            </div>
            <div className="p-4 bg-background border-t">
              <p className="text-sm text-muted-foreground truncate">
                {media.name.split(".")[0]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
        onUploadComplete={handleUploadComplete}
      />
      {mediaToDelete && (
        <DeleteMediaModal
          isDeleteDialogOpen={showDeleteModal}
          setIsDeleteDialogOpen={setShowDeleteModal}
          onDelete={handleDelete}
          mediaToDelete={mediaToDelete.id}
        />
      )}
    </>
  );
}
