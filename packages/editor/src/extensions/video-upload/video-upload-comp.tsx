import { Video02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogX,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  SpinnerIcon,
  VideoCameraIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type { MediaItem, MediaPage } from "../../types";
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

export interface VideoUploadCompProps {
  initialFile?: File;
  onUpload: (url: string) => void;
  onCancel: () => void;
  upload: (file: File) => Promise<string>;
  media?: MediaItem[];
  fetchMediaPage?: (cursor?: string) => Promise<MediaPage>;
  onError?: (error: Error) => void;
}

export const VideoUploadComp = ({
  initialFile,
  onUpload,
  onCancel,
  upload,
  media: providedMedia,
  fetchMediaPage,
  onError,
}: VideoUploadCompProps) => {
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[] | undefined>(providedMedia);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { loading, uploadVideo } = useUploader({ onUpload, upload, onError });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave, onDragOver } =
    useDropZone({
      uploader: uploadVideo,
    });

  // Fetch initial media page if fetchMediaPage function is provided
  useEffect(() => {
    if (fetchMediaPage && !providedMedia) {
      setIsLoadingMedia(true);
      fetchMediaPage()
        .then((page) => {
          setMedia(page.media);
          setNextCursor(page.nextCursor);
        })
        .catch(() => {
          setMedia([]);
        })
        .finally(() => {
          setIsLoadingMedia(false);
        });
    }
  }, [fetchMediaPage, providedMedia]);

  // Load more media handler
  const handleLoadMore = useCallback(async () => {
    if (!fetchMediaPage || !nextCursor || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const page = await fetchMediaPage(nextCursor);
      setMedia((prev) => [...(prev || []), ...page.media]);
      setNextCursor(page.nextCursor);
    } catch {
      // Ignore errors on load more
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchMediaPage, nextCursor, isLoadingMore]);

  // Update media when providedMedia changes
  useEffect(() => {
    if (providedMedia) {
      setMedia(providedMedia);
    }
  }, [providedMedia]);

  // Auto-upload if initialFile is provided
  useEffect(() => {
    if (initialFile) {
      uploadVideo(initialFile);
    }
  }, [initialFile, uploadVideo]);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadVideo(file);
      }
    },
    [uploadVideo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      onDrop(e);
    },
    [onDrop]
  );

  const handleEmbedUrl = useCallback(
    (url: string) => {
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

      // For video URLs, we accept them directly without loading validation
      onUpload(url);
      setEmbedUrl("");
      setShowEmbedInput(false);
      setIsValidatingUrl(false);
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
      return "Drop video here";
    }
    return "Drag and drop or click to upload";
  };

  return (
    <>
      <Card className="col-span-full gap-4 rounded-[20px] border-none bg-surface p-2">
        <CardHeader className="gap-0 px-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Video02Icon}
              size={20}
            />
            <CardTitle className="font-normal text-sm">
              Upload or embed a video
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
          {/* Dropzone or Uploading state */}
          {loading ? (
            <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Uploading video...
              </p>
            </div>
          ) : (
            // biome-ignore lint/a11y/useSemanticElements: Dropzone requires div for drag-and-drop functionality
            <div
              aria-label="Upload video by clicking or dragging and dropping"
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
                accept="video/*"
                aria-label="Upload video"
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
                  placeholder="Paste video URL"
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
                    <SpinnerIcon className="size-4 animate-spin" />
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
              {(media !== undefined || fetchMediaPage) && (
                <Button
                  className="shrink-0 text-muted-foreground shadow-none"
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
                className="shrink-0 text-muted-foreground shadow-none"
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
      {(media !== undefined || fetchMediaPage) && (
        <Dialog onOpenChange={setIsGalleryOpen} open={isGalleryOpen}>
          <DialogContent
            className="flex max-h-[800px] flex-col overflow-hidden text-clip sm:max-w-4xl"
            variant="card"
          >
            <DialogHeader className="flex-row items-center justify-between px-4 py-2">
              <div className="flex flex-1 items-center gap-2">
                <HugeiconsIcon
                  className="text-muted-foreground"
                  icon={Video02Icon}
                  size={20}
                />
                <DialogTitle className="font-medium text-muted-foreground text-sm">
                  Video Gallery
                </DialogTitle>
              </div>
              <DialogX />
            </DialogHeader>
            <DialogBody className="min-h-[400px] p-4">
              {isLoadingMedia ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <SpinnerIcon className="size-6 animate-spin" />
                    <p className="font-medium text-sm">Loading media...</p>
                  </div>
                </div>
              ) : media && media.length > 0 ? (
                <div className="flex max-h-[500px] flex-col gap-4 overflow-y-auto">
                  <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(8.125rem,1fr))] gap-2.5 p-0">
                    {media
                      ?.filter((item) => item.type === "video")
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
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border">
                              <video
                                className="h-full w-full object-cover"
                                muted
                                preload="metadata"
                                src={`${item.url}#t=0.5`}
                              >
                                <track kind="captions" />
                              </video>
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                  {nextCursor && (
                    <div className="flex justify-center py-2">
                      <Button
                        disabled={isLoadingMore}
                        onClick={handleLoadMore}
                        type="button"
                        variant="outline"
                      >
                        {isLoadingMore ? (
                          <>
                            <SpinnerIcon className="mr-2 size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <VideoCameraIcon className="size-8" />
                    <p className="font-medium text-sm">
                      Your gallery has no videos. Upload some media to get
                      started.
                    </p>
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
