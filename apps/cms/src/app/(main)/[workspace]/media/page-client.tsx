"use client";

import { Button } from "@marble/ui/components/button";
import { Image } from "@phosphor-icons/react";
import { Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { DeleteMediaModal } from "@/components/media/delete-modal";
import { MediaUploadModal } from "@/components/media/upload-modal";

type Media = {
  id: string;
  name: string;
  url: string;
};

interface PageClientProps {
  media: Media[];
}

function PageClient({ media }: PageClientProps) {
  const [optimisticMedia, setOptimisticMedia] = useState<Media[]>(media);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);

  return (
    <>
      <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
        <section className="flex justify-between items-center">
          <div />
          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            <UploadCloud size={16} />
            <span>upload image</span>
          </Button>
        </section>
        {optimisticMedia.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {optimisticMedia.map((media) => (
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
        ) : (
          <div className="grid h-full w-full place-content-center mt-10">
            <div className="flex flex-col items-center gap-4 max-w-80">
              <Image className="size-16 stroke-[1px] text-muted-foreground" />
              <p className="text-balance text-center text-muted-foreground text-sm">
                Images you upload in this workspace will appear here.
              </p>
            </div>
          </div>
        )}
      </WorkspacePageWrapper>
      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
        onUploadComplete={(_url: string, media?: Media) => {
          if (media) {
            setOptimisticMedia([...optimisticMedia, media]);
          }
        }}
      />
      {mediaToDelete && (
        <DeleteMediaModal
          isDeleteDialogOpen={showDeleteModal}
          setIsDeleteDialogOpen={setShowDeleteModal}
          onDelete={(id) => {
            setOptimisticMedia(optimisticMedia.filter((m) => m.id !== id));
          }}
          mediaToDelete={mediaToDelete.id}
        />
      )}
    </>
  );
}

export default PageClient;
