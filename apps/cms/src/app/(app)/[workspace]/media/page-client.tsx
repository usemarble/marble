"use client";

import { MediaUploadModal } from "@/components/media/upload-modal";
import { Button } from "@repo/ui/components/button";
import { ImageIcon, Upload, UploadCloud } from "lucide-react";
import { useState } from "react";

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

  return (
    <>
      <div className="h-full flex flex-col mx-auto py-16 max-w-4xl gap-8">
        <section className="flex justify-between items-center">
          <div />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUploadModal(true)}
          >
            <UploadCloud size={16} />
            <span>upload image</span>
          </Button>
        </section>
        {optimisticMedia.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {optimisticMedia.map((media) => (
              <li
                key={media.id}
                className="relative rounded-md overflow-hidden border"
              >
                <div className="">
                  <img
                    src={media.url}
                    alt={media.name}
                    className="object-cover w-full h-48"
                  />
                </div>
                <div className="p-4 bg-background">
                  <p className="text-sm text-muted-foreground">{media.name}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid h-full w-full place-content-center mt-10">
            <div className="flex flex-col items-center gap-4">
              <ImageIcon className="size-24 text-muted-foreground" />
              <p className="text-balance max-w-2xl mx-auto text-center text-muted-foreground">
                Images you upload in this workspace will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
      <MediaUploadModal
        isOpen={showUploadModal}
        setIsOpen={setShowUploadModal}
      />
    </>
  );
}

export default PageClient;
