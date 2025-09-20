"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent, CardFooter } from "@marble/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import type { Media, MediaType } from "@/types/media";
import { formatBytes } from "@/utils/string";
import { VideoPlayer } from "./video-player";

type MediaCardProps = {
  media: Media;
  onDelete: (media: Media) => void;
  isSelected?: boolean;
  onSelect?: () => void;
};

const mediaTypeIcons: Record<
  MediaType,
  { icon: React.ElementType; color: string }
> = {
  image: { icon: FileImageIcon, color: "text-blue-500" },
  video: { icon: FileVideoIcon, color: "text-red-500" },
  audio: { icon: FileAudioIcon, color: "text-green-500" },
  document: { icon: FileIcon, color: "text-gray-500" },
};

export function MediaCard({
  media,
  onDelete,
  isSelected = false,
  onSelect,
}: MediaCardProps) {
  const { icon: Icon, color } =
    mediaTypeIcons[media.type] || mediaTypeIcons.document;

  const handleDownload = () => {
    window.open(media.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className={cn(
        "group gap-0 overflow-hidden py-0",
        isSelected &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
        "cursor-pointer"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden">
          <div className="absolute rounded-md" />
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-10 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                isSelected && "opacity-100 backdrop-blur-xs"
              )}
            />
            <div className="relative z-20 rounded-full bg-white p-2 shadow-lg">
              <CheckIcon weight="bold" className="size-5 text-black" />
            </div>
          </div>
          {media.type === "image" && (
            <>
              {/** biome-ignore lint/performance/noImgElement: <> */}
              <img
                src={media.url}
                alt={media.name}
                className="absolute inset-0 size-full object-cover"
              />
            </>
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
      <CardFooter className="grid w-full grid-cols-[1fr_auto] gap-4 border-t p-4">
        <div className="flex items-start gap-3">
          <Icon className={`size-6 shrink-0 ${color}`} weight="duotone" />
          <div className="flex flex-col">
            <p className="line-clamp-1 text-wrap font-medium text-sm">
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
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsThreeVerticalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <DownloadSimpleIcon size={16} className="mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media);
              }}
            >
              <TrashIcon size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
