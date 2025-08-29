"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent, CardFooter } from "@marble/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { ImageZoom } from "@marble/ui/components/kibo-ui/image-zoom";
import { toast } from "@marble/ui/components/sonner";
import {
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

interface MediaCardProps {
  media: Media;
  onDelete: (media: Media) => void;
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

export function MediaCard({ media, onDelete }: MediaCardProps) {
  const { icon: Icon, color } =
    mediaTypeIcons[media.type] || mediaTypeIcons.document;

  const handleDownload = async () => {
    try {
      const response = await fetch(media.url);
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = media.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardContent className="p-0">
        <div className="aspect-video relative overflow-hidden">
          {media.type === "image" && (
            <ImageZoom className="absolute inset-0 size-full">
              {/** biome-ignore lint/performance/noImgElement: <> */}
              <img
                src={media.url}
                alt={media.name}
                className="absolute inset-0 size-full object-cover"
              />
            </ImageZoom>
          )}
          {media.type === "video" && <VideoPlayer src={media.url} />}
          {(media.type === "audio" || media.type === "document") && (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Icon
                className="size-16 text-muted-foreground"
                weight="duotone"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t w-full grid gap-4 grid-cols-[1fr_auto]">
        <div className="flex items-start gap-3">
          <Icon className={`size-6 shrink-0 ${color}`} weight="duotone" />
          <div className="flex flex-col">
            <p className="text-sm font-medium line-clamp-1 text-wrap">
              {media.name}
            </p>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <p>{formatBytes(media.size)}</p>
              <span className="font-bold">·</span>
              <p>{format(new Date(media.createdAt), "dd MMM yyyy")}</p>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <DotsThreeVerticalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <DownloadSimpleIcon size={16} className="mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(media)}
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
