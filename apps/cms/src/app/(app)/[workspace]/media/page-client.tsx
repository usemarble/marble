"use client";

import { MediaUploadModal } from "@/components/media/upload-modal";
import { Button } from "@repo/ui/components/button";
import { ImageIcon, UploadCloud } from "lucide-react";
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
      <div className="h-full flex flex-col mx-auto pt-10 pb-16 max-w-4xl gap-8">
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
                <div className="p-4 bg-background border-t">
                  <p className="text-sm text-muted-foreground">{media.name}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid h-full w-full place-content-center mt-10">
            <div className="flex flex-col items-center gap-4 max-w-80">
              <ImageIcon className="size-16 stroke-[1px]" />
              <p className="text-balance text-center text-muted-foreground text-sm">
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
