/** biome-ignore-all lint/performance/noImgElement: <> */
/** biome-ignore-all lint/correctness/useImageSize: <> */
"use client";

import {
  ArrowsOutSimpleIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { UsageDashboardData } from "@/types/dashboard";
import type { Media } from "@/types/media";
import { formatBytes } from "@/utils/string";
import { VideoPlayer } from "../media/video-player";
import { HiddenScrollbar } from "../ui/hidden-scrollbar";

type MediaUsageCardProps = {
  data?: UsageDashboardData["media"];
  isLoading?: boolean;
};

function getMediaTypeIcon(type: string) {
  switch (type) {
    case "image":
      return FileImageIcon;
    case "video":
      return FileVideoIcon;
    case "audio":
      return FileAudioIcon;
    default:
      return FileIcon;
  }
}

export function MediaUsageCard({ data, isLoading }: MediaUsageCardProps) {
  const recentUploads = data?.recentUploads ?? [];
  const [selectedFile, setSelectedFile] = useState<Media | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dialogRef as RefObject<HTMLDivElement>, () =>
    setSelectedFile(null)
  );
  const mountKeyRef = useRef(Math.random().toString(36));

  useEffect(() => {
    function handleClose(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedFile(null);
      }
    }
    document.addEventListener("keydown", handleClose);
    return () => {
      document.removeEventListener("keydown", handleClose);
    };
  }, []);

  useEffect(() => {
    if (selectedFile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [selectedFile]);

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-none bg-sidebar p-2.5 text-card-foreground">
      <AnimatePresence key={mountKeyRef.current} mode="wait">
        {selectedFile ? (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-10 bg-black/30 backdrop-blur-xs"
              exit={{ opacity: 0 }}
            />
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
              <motion.div
                aria-labelledby={`file-name-${selectedFile.id}`}
                aria-modal="true"
                className="pointer-events-auto z-50 h-fit w-[600px] max-w-[calc(100vw-20rem)] rounded-[20px] bg-background p-3 shadow-sm"
                key={selectedFile.id}
                layoutId={`file-${selectedFile.id}`}
                ref={dialogRef}
                role="dialog"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between">
                    <div>
                      <motion.p
                        className="line-clamp-1 max-w-[400px] font-medium text-sm"
                        id={`file-name-${selectedFile.id}`}
                        layoutId={`name-${selectedFile.id}`}
                      >
                        {selectedFile.name}
                      </motion.p>
                      <motion.p
                        className="text-xs"
                        layoutId={`size-${selectedFile.id}`}
                      >
                        {formatBytes(selectedFile.size)}
                      </motion.p>
                      <motion.p
                        className="mt-auto text-muted-foreground text-xs"
                        layoutId={`date-${selectedFile.id}`}
                      >
                        {new Date(selectedFile.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </motion.p>
                    </div>
                    <motion.button
                      aria-label="Close file"
                      autoFocus
                      className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-accent outline-none transition-colors hover:bg-accent/80 hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      layoutId={`button-${selectedFile.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      type="button"
                    >
                      <motion.svg
                        aria-labelledby={`title-${selectedFile.id}`}
                        className="size-4"
                        fill="#000000"
                        height="32"
                        layoutId={`icon-${selectedFile.id}`}
                        viewBox="0 0 256 256"
                        width="32"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title id={`title-${selectedFile.id}`}>
                          Close icon
                        </title>
                        <motion.path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                      </motion.svg>
                    </motion.button>
                  </div>

                  <motion.div
                    className="aspect-video h-[350px] w-full overflow-hidden rounded-[12px] bg-background"
                    layoutId={`image-${selectedFile.id}`}
                  >
                    {selectedFile.type === "image" ? (
                      <motion.img
                        alt={selectedFile.name}
                        animate={{ opacity: 1 }}
                        className="h-full w-full object-cover"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        src={selectedFile.url}
                        transition={{ duration: 0.2 }}
                      />
                    ) : selectedFile.type === "video" ? (
                      <div className="relative h-full w-full">
                        <VideoPlayer
                          className="h-full w-full object-cover"
                          src={selectedFile.url}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        {(() => {
                          const Icon = getMediaTypeIcon(selectedFile.type);
                          return (
                            <Icon
                              className="size-16 text-muted-foreground"
                              weight="duotone"
                            />
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="gap-0 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-xl">Media Storage</p>
            <p className="rounded-full px-3 py-1 text-muted-foreground text-xs">
              Recent Uploads
            </p>
          </div>
          <p className="font-medium text-muted-foreground text-xl leading-none tracking-tight">
            {formatBytes(data?.totalSize ?? 0)}
          </p>
        </div>
      </div>

      <HiddenScrollbar className="h-60 rounded-[12px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : recentUploads.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-background text-muted-foreground text-sm shadow-xs">
            No uploads yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recentUploads.map((upload) => {
              const Icon = getMediaTypeIcon(upload.type);
              return (
                <motion.li key={upload.id} layoutId={`file-${upload.id}`}>
                  <button
                    className="flex w-full cursor-pointer rounded-[18px] border-transparent bg-background p-2.5 shadow-none shadow-s outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    onClick={() => {
                      setSelectedFile(upload);
                    }}
                    type="button"
                  >
                    <div className="flex w-full justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="grid size-20 shrink-0 place-items-center rounded-[8px] border border-dashed bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))]"
                          layoutId={`image-${upload.id}`}
                        >
                          <Icon className="size-6 text-primary" />
                        </motion.div>
                        <div className="flex flex-col items-start justify-between gap-2 text-left">
                          <div>
                            <motion.p
                              className="line-clamp-1 max-w-[200px] font-medium text-sm"
                              layoutId={`name-${upload.id}`}
                            >
                              {upload.name}
                            </motion.p>
                            <motion.p
                              className="text-muted-foreground text-xs"
                              layoutId={`size-${upload.id}`}
                            >
                              {formatBytes(upload.size)}
                            </motion.p>
                          </div>
                          <motion.p
                            className="mt-auto text-muted-foreground text-xs"
                            layoutId={`date-${upload.id}`}
                          >
                            {formatDistanceToNow(new Date(upload.createdAt), {
                              addSuffix: true,
                            })}
                          </motion.p>
                        </div>
                      </div>
                      <motion.div
                        className="flex size-8 items-center justify-center rounded-full bg-sidebar hover:bg-primary/10 hover:text-primary dark:bg-accent/50 dark:hover:bg-sidebar-accent dark:hover:text-accent-foreground"
                        layoutId={`button-${upload.id}`}
                      >
                        <ArrowsOutSimpleIcon size={16} />
                      </motion.div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </HiddenScrollbar>
    </div>
  );
}
