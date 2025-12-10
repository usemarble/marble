import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { ScrollArea } from "@marble/ui/components/scroll-area";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  ImageIcon,
  ImagesIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type { MediaItem } from "../../types";
import { useDropZone, useFileUpload, useUploader } from "./hooks";

// Simple URL validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export type ImageUploadCompProps = {
  initialFile?: File;
  onUpload: (url: string) => void;
  onCancel: () => void;
  upload: (file: File) => Promise<string>;
  media?: MediaItem[];
  fetchMedia?: () => Promise<MediaItem[]>;
  onError?: (error: Error) => void;
};

export const ImageUploadComp = ({
  initialFile,
  onUpload,
  onCancel,
  upload,
  media: providedMedia,
  fetchMedia,
  onError,
}: ImageUploadCompProps) => {
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[] | undefined>(providedMedia);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const { loading, uploadImage } = useUploader({ onUpload, upload, onError });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave, onDragOver } =
    useDropZone({
      uploader: uploadImage,
    });

  // Fetch media if fetchMedia function is provided
  useEffect(() => {
    if (fetchMedia && !providedMedia) {
      setIsLoadingMedia(true);
      fetchMedia()
        .then((fetchedMedia) => {
          setMedia(fetchedMedia);
        })
        .catch(() => {
          setMedia([]);
        })
        .finally(() => {
          setIsLoadingMedia(false);
        });
    }
  }, [fetchMedia, providedMedia]);

  // Update media when providedMedia changes
  useEffect(() => {
    if (providedMedia) {
      setMedia(providedMedia);
    }
  }, [providedMedia]);

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

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      onDrop(e);
    },
    [onDrop]
  );

  const handleEmbedUrl = useCallback(
    async (url: string) => {
      if (!url) {
        return;
      }

      setIsValidatingUrl(true);
      setUrlError(null);

      if (!isValidUrl(url)) {
        setUrlError("Please enter a valid URL");
        setIsValidatingUrl(false);
        return;
      }

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

  const handleDropzoneClick = useCallback(() => {
    handleUploadClick();
  }, [handleUploadClick]);

  const handleDropzoneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleUploadClick();
      }
    },
    [handleUploadClick]
  );

  // Get dropzone text based on drag state
  const getDropzoneText = () => {
    if (draggedInside) {
      return "Drop image here";
    }
    return "Drag and drop or click to upload";
  };

  return (
    <>
      <Card className="col-span-full gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
        <CardHeader className="gap-0 px-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <ImageIcon className="size-5" />
            <CardTitle className="font-normal text-sm">
              Upload or embed an image
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
          {/* Dropzone or Uploading state */}
          {loading ? (
            <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Uploading image...
              </p>
            </div>
          ) : (
            // biome-ignore lint/a11y/useSemanticElements: Dropzone requires div for drag-and-drop functionality
            <div
              aria-label="Upload image by clicking or dragging and dropping"
              className={cn(
                "flex min-h-[260px] flex-1 cursor-pointer flex-col items-center justify-center gap-2",
                draggedInside
                  ? "border-primary bg-primary/5"
                  : "border-muted bg-background"
              )}
              onClick={handleDropzoneClick}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={handleDrop}
              onKeyDown={handleDropzoneKeyDown}
              role="button"
              tabIndex={0}
            >
              <p
                className={cn(
                  "text-center font-medium text-sm",
                  draggedInside ? "text-primary" : "text-muted-foreground"
                )}
              >
                {getDropzoneText()}
              </p>
              <input
                accept="image/*"
                aria-label="Upload image"
                className="sr-only size-0 overflow-hidden opacity-0"
                onChange={onFileChange}
                ref={ref}
                type="file"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="-mt-2 flex items-center justify-between gap-10 rounded-[12px] bg-background p-4 shadow-xs">
          {showEmbedInput ? (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  className={cn(
                    "flex-1 bg-background",
                    urlError && "border-destructive"
                  )}
                  disabled={isValidatingUrl || loading}
                  onChange={({ target }) => {
                    setEmbedUrl(target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      embedUrl &&
                      !isValidatingUrl &&
                      !loading
                    ) {
                      handleEmbedUrl(embedUrl);
                    }
                  }}
                  placeholder="Paste image URL"
                  value={embedUrl}
                />
                <Button
                  className="shrink-0 shadow-none"
                  disabled={!embedUrl || isValidatingUrl || loading}
                  onClick={() => handleEmbedUrl(embedUrl)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {isValidatingUrl ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                </Button>
                <Button
                  className="shrink-0 shadow-none"
                  disabled={loading}
                  onClick={() => {
                    setShowEmbedInput(false);
                    setEmbedUrl("");
                    setUrlError(null);
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
              {urlError && (
                <p className="text-destructive text-xs">{urlError}</p>
              )}
            </div>
          ) : (
            // Media and Embed URL buttons - shown by default
            <div className="flex items-center gap-2">
              {(media !== undefined || fetchMedia) && (
                <Button
                  className="shrink-0 shadow-none"
                  disabled={loading}
                  onClick={() => setIsGalleryOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  View Gallery
                </Button>
              )}
              <Button
                className="shrink-0 shadow-none"
                disabled={loading}
                onClick={() => setShowEmbedInput(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                Embed URL
              </Button>
            </div>
          )}
          <Button
            className="shrink-0 shadow-none"
            disabled={loading}
            onClick={onCancel}
            size="sm"
            type="button"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>

      {/* Media Gallery Dialog */}
      {(media !== undefined || fetchMedia) && (
        <Dialog onOpenChange={setIsGalleryOpen} open={isGalleryOpen}>
          <DialogHeader className="sr-only">
            <DialogTitle>Media Gallery</DialogTitle>
            <DialogDescription>
              Select an image from your media library to embed.
            </DialogDescription>
          </DialogHeader>
          <DialogContent className="max-h-[800px] min-w-[1000px] sm:min-w-[1000px]">
            {isLoadingMedia ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="font-medium text-sm">Loading media...</p>
                </div>
              </div>
            ) : media && media.length > 0 ? (
              <ScrollArea className="max-h-[550px]">
                <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(8.125rem,1fr))] gap-2.5 p-0">
                  {media
                    ?.filter((item) => item.type === "image")
                    .map((item) => (
                      <li
                        className="group relative size-[8.125rem]"
                        key={item.id}
                      >
                        <button
                          className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-background p-1 transition-opacity hover:opacity-80"
                          onClick={() => handleMediaSelect(item.url)}
                          type="button"
                        >
                          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-md border border-border">
                            {/* biome-ignore lint: Preview image in dialog */}
                            <img
                              alt={item.name}
                              className="h-full w-full object-contain"
                              src={item.url}
                            />
                          </div>
                        </button>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagesIcon className="size-8" />
                  <p className="font-medium text-sm">
                    Your gallery is empty. Upload some media to get started.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
