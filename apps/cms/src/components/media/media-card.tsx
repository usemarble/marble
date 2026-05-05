"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent, CardFooter } from "@marble/ui/components/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogX,
} from "@marble/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import Image from "next/image";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { blurhashToDataUrl } from "@/lib/blurhash";
import type { Media, MediaType } from "@/types/media";
import { formatBytes } from "@/utils/string";
import { VideoPlayer } from "./video-player";

interface MediaCardProps {
  media: Media;
  onDelete: (media: Media) => void;
  isSelected?: boolean;
  onSelect: () => void;
}

const mediaTypeIcons: Record<
  MediaType,
  { icon: React.ElementType; color: string }
> = {
  image: { icon: FileImageIcon, color: "text-blue-500" },
  video: { icon: FileVideoIcon, color: "text-red-500" },
  audio: { icon: FileAudioIcon, color: "text-green-500" },
  document: { icon: FileIcon, color: "text-gray-500" },
};

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: number | string | null;
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 break-all font-medium text-sm">{value ?? "None"}</dd>
    </div>
  );
}

function BlurHashDebugDialog({
  blurDataUrl,
  media,
  onOpenChange,
  open,
}: {
  blurDataUrl?: string;
  media: Media;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const handleOpenDataUrl = () => {
    if (!blurDataUrl) {
      return;
    }

    window.open(blurDataUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-h-[90vh] w-[min(80vw,960px)] overflow-hidden sm:max-w-none"
        variant="card"
      >
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-col gap-1">
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              BlurHash preview
            </DialogTitle>
            <DialogDescription className="line-clamp-1 text-xs">
              {media.name}
            </DialogDescription>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody className="max-h-[calc(90vh-3.5rem)] gap-5 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-medium text-sm">Original image</p>
              <div className="relative h-[min(32vh,320px)] overflow-hidden rounded-lg bg-muted">
                <Image
                  alt={media.name}
                  className="size-full object-contain"
                  fill
                  sizes="(max-width: 768px) 80vw, 40vw"
                  src={media.url}
                  unoptimized
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-medium text-sm">Decoded placeholder</p>
              <div className="grid h-[min(32vh,320px)] place-items-center overflow-hidden rounded-lg bg-muted">
                {blurDataUrl ? (
                  <Image
                    alt=""
                    className="size-full object-cover"
                    height={32}
                    src={blurDataUrl}
                    unoptimized
                    width={32}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No BlurHash data available
                  </p>
                )}
              </div>
            </div>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetadataItem label="Width" value={media.width} />
            <MetadataItem label="Height" value={media.height} />
            <MetadataItem label="MIME type" value={media.mimeType} />
            <MetadataItem label="BlurHash" value={media.blurHash} />
          </dl>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">Generated data URL</p>
              <div className="flex items-center gap-2">
                <CopyButton
                  disabled={!blurDataUrl}
                  textToCopy={blurDataUrl ?? ""}
                  toastMessage="Copied data URL"
                />
                <Button
                  disabled={!blurDataUrl}
                  onClick={handleOpenDataUrl}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Open
                </Button>
              </div>
            </div>
            <Textarea
              className="max-h-40 min-h-24 resize-y font-mono text-xs"
              readOnly
              value={blurDataUrl ?? ""}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function MediaCard({
  media,
  onDelete,
  isSelected = false,
  onSelect,
}: MediaCardProps) {
  const { icon: Icon, color } =
    mediaTypeIcons[media.type] || mediaTypeIcons.document;
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const blurDataUrl = useMemo(() => {
    if (media.type !== "image" || !media.blurHash) {
      return undefined;
    }

    return blurhashToDataUrl(media.blurHash);
  }, [media.blurHash, media.type]);

  const handleDownload = () => {
    window.open(media.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Card
        className={cn(
          "gap-2.5 overflow-hidden rounded-[20px] border-none bg-surface p-2"
        )}
      >
        <button
          aria-label={`Select ${media?.name ?? "media"}`}
          className="cursor-pointer rounded-[12px] outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onSelect}
          type="button"
        >
          <CardContent className="group overflow-hidden rounded-[12px] border-0 bg-background p-0 shadow-xs">
            <div className="relative aspect-video overflow-hidden">
              <div
                className={`absolute inset-0 z-10 flex items-center justify-center rounded-[12px] transition-opacity duration-300 ${
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 z-10 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    isSelected && "opacity-100"
                  )}
                />
                <div className="relative z-20 rounded-full bg-white p-2 shadow-lg">
                  <CheckIcon className="size-5 text-black" weight="bold" />
                </div>
              </div>
              {media.type === "image" && (
                <div className="h-full w-full bg-background">
                  <Image
                    alt={media.name}
                    blurDataURL={blurDataUrl}
                    className="size-full object-cover"
                    height={160}
                    placeholder={blurDataUrl ? "blur" : "empty"}
                    src={media.url}
                    unoptimized
                    width={250}
                  />
                </div>
              )}
              {media.type === "video" && <VideoPlayer src={media.url} />}
              {(media.type === "audio" || media.type === "document") && (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Icon
                    className="size-16 text-muted-foreground"
                    weight="duotone"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </button>
        <CardFooter className="grid w-full grid-cols-[1fr_auto] gap-4 p-0">
          <div className="flex items-start gap-3">
            <Icon
              className={"size-6 shrink-0 text-muted-foreground"}
              weight="duotone"
            />
            <div className="flex flex-col">
              <p className="line-clamp-1 max-w-[180px] text-wrap font-medium text-sm">
                {media.name}
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <p>{formatBytes(media.size)}</p>
                <span className="font-bold">·</span>
                <p>{format(new Date(media.createdAt), "dd MMM yyyy")}</p>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  aria-haspopup="menu"
                  aria-label="More actions"
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-background shadow-xs outline-none transition-all hover:bg-surface-foreground/10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  type="button"
                >
                  <DotsThreeVerticalIcon size={16} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {media.type === "image" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDebugOpen(true);
                  }}
                >
                  <MagnifyingGlassIcon className="mr-2" size={16} />
                  Inspect placeholder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <DownloadSimpleIcon className="mr-2" size={16} />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media);
                }}
                variant="destructive"
              >
                <TrashIcon className="mr-2" size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
      {media.type === "image" && (
        <BlurHashDebugDialog
          blurDataUrl={blurDataUrl}
          media={media}
          onOpenChange={setIsDebugOpen}
          open={isDebugOpen}
        />
      )}
    </>
  );
}
