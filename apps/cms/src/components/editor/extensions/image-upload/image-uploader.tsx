import { Button } from "@marble/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@marble/ui/components/drawer";
import { Input } from "@marble/ui/components/input";
import { ScrollArea } from "@marble/ui/components/scroll-area";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  SpinnerIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { MediaListResponse } from "@/types/media";
import { useDropZone, useFileUpload, useUploader } from "./hooks";

// URL schema for validation
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

export const ImageUploader = ({
  initialFile,
  onUpload,
}: {
  initialFile?: File;
  onUpload: (url: string) => void;
}) => {
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const workspaceId = useWorkspaceId();

  const { loading, uploadImage } = useUploader({ onUpload });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave, onDragOver } =
    useDropZone({
      uploader: uploadImage,
    });

  // Fetch media
  const { data: media } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: workspaceId is required for media query
    queryKey: QUERY_KEYS.MEDIA(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/media");
        const data: MediaListResponse = await res.json();
        return data.media;
      } catch (_error) {
        return [];
      }
    },
    enabled: !!workspaceId,
  });

  // Auto-upload if initialFile is provided
  useEffect(() => {
    if (initialFile) {
      uploadImage(initialFile);
    }
  }, [initialFile, uploadImage]);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadImage(file);
      }
    },
    [uploadImage]
  );

  const handleEmbedUrl = useCallback(
    async (url: string) => {
      if (!url) {
        return;
      }

      setIsValidatingUrl(true);
      setUrlError(null);

      try {
        await urlSchema.parseAsync(url);
        const img = new Image();
        img.onload = () => {
          onUpload(url);
          setEmbedUrl("");
          setShowEmbedInput(false);
          setIsValidatingUrl(false);
        };
        img.onerror = () => {
          setUrlError("Invalid image URL");
          setIsValidatingUrl(false);
        };
        img.src = url;
      } catch (error) {
        if (error instanceof z.ZodError) {
          setUrlError(error.errors?.[0]?.message || "Invalid URL");
        } else {
          setUrlError("Invalid URL");
        }
        setIsValidatingUrl(false);
      }
    },
    [onUpload]
  );

  const handleMediaSelect = useCallback(
    (url: string) => {
      onUpload(url);
      setIsGalleryOpen(false);
    },
    [onUpload]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-md border border-muted bg-muted/50 p-12">
        <div className="flex flex-col items-center gap-2">
          <SpinnerIcon className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Uploading image...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: Drag-and-drop zone requires div element for proper event handling */}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-md border border-dashed p-8 transition-colors",
          draggedInside
            ? "border-primary bg-primary/5"
            : "border-muted bg-muted/50"
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        <ImageIcon
          className={cn(
            "size-12 transition-colors",
            draggedInside ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-center font-medium text-sm">
            {draggedInside
              ? "Drop image here"
              : "Drag and drop or choose an option"}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUploadClick}
              size="sm"
              type="button"
              variant="outline"
            >
              <UploadSimpleIcon className="size-4" />
              Upload
            </Button>
            <Button
              onClick={() => setShowEmbedInput(!showEmbedInput)}
              size="sm"
              type="button"
              variant="outline"
            >
              <LinkIcon className="size-4" />
              Embed URL
            </Button>
            <Button
              onClick={() => setIsGalleryOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ImagesIcon className="size-4" />
              Media
            </Button>
          </div>

          {/* Inline URL Input */}
          {showEmbedInput && (
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  className={cn(
                    "flex-1 bg-background",
                    urlError && "border-destructive"
                  )}
                  disabled={isValidatingUrl}
                  onChange={({ target }) => {
                    setEmbedUrl(target.value);
                    setUrlError(null);
                  }}
                  placeholder="Paste image URL"
                  value={embedUrl}
                />
                <Button
                  disabled={!embedUrl || isValidatingUrl}
                  onClick={() => handleEmbedUrl(embedUrl)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {isValidatingUrl ? (
                    <SpinnerIcon className="size-4 animate-spin" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                </Button>
              </div>
              {urlError && (
                <p className="text-destructive text-xs">{urlError}</p>
              )}
            </div>
          )}
        </div>
        <input
          accept="image/*"
          className="size-0 overflow-hidden opacity-0"
          onChange={onFileChange}
          ref={ref}
          type="file"
        />
      </div>

      {/* Media Gallery Drawer */}
      <Drawer onOpenChange={setIsGalleryOpen} open={isGalleryOpen}>
        <DrawerContent className="mt-4 flex min-h-[95vh] flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Gallery</DrawerTitle>
            <DrawerDescription>
              Select an image from your media library.
            </DrawerDescription>
          </DrawerHeader>
          {media && media.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <ScrollArea className="h-full">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
                  {media
                    .filter((item) => item.type === "image")
                    .map((item) => (
                      <li
                        className="group relative h-48 overflow-hidden rounded-[4px]"
                        key={item.id}
                      >
                        <button
                          className="h-full w-full cursor-pointer"
                          onClick={() => handleMediaSelect(item.url)}
                          type="button"
                        >
                          {/* biome-ignore lint/performance/noImgElement: Preview image in drawer */}
                          <img
                            alt={item.name}
                            className="h-full w-full object-cover"
                            src={item.url}
                          />
                        </button>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </div>
          ) : (
            <div className="grid h-full flex-1 place-items-center p-4">
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagesIcon className="size-8" />
                <p className="font-medium text-sm">
                  Your gallery is empty. Upload some media to get started.
                </p>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
