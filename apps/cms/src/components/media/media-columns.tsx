"use client";

import { Checkbox } from "@marble/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  CopyIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Image from "next/image";
import { type ElementType, useMemo } from "react";
import { blurhashToDataUrl } from "@/lib/blurhash";
import type { Media, MediaType } from "@/types/media";
import { formatBytes } from "@/utils/string";

interface MediaColumnsOptions {
  onDelete: (media: Media) => void;
}

const mediaTypeIcons: Record<MediaType, ElementType> = {
  image: FileImageIcon,
  video: FileVideoIcon,
  audio: FileAudioIcon,
  document: FileIcon,
};

function getMediaTypeLabel(media: Media) {
  const mimeSubtype = media.mimeType?.split("/").at(1);
  return (mimeSubtype || media.type).toUpperCase();
}

function getMediaDimensions(media: Media) {
  if (media.width && media.height) {
    return `${media.width} x ${media.height}`;
  }
  if (media.duration !== null) {
    return `${Math.round(media.duration / 1000)}s`;
  }
  return "-";
}

function MediaThumbnail({ media }: { media: Media }) {
  const Icon = mediaTypeIcons[media.type] || FileIcon;
  const blurDataUrl = useMemo(() => {
    if (media.type !== "image" || !media.blurHash) {
      return undefined;
    }
    return blurhashToDataUrl(media.blurHash);
  }, [media.blurHash, media.type]);

  if (media.type === "image") {
    return (
      <div className="relative size-11 overflow-hidden rounded-md bg-muted">
        <Image
          alt=""
          blurDataURL={blurDataUrl}
          className="size-full object-cover"
          height={48}
          placeholder={blurDataUrl ? "blur" : "empty"}
          src={media.url}
          unoptimized
          width={48}
        />
      </div>
    );
  }

  return (
    <div className="grid size-12 place-items-center rounded-lg bg-muted">
      <Icon className="size-5 text-primary" weight="duotone" />
    </div>
  );
}

async function copyMediaUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Copied media URL");
  } catch {
    toast.error("Could not copy media URL");
  }
}

export function getMediaColumns({
  onDelete,
}: MediaColumnsOptions): ColumnDef<Media>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={
            table.getIsAllPageRowsSelected() ? "Deselect all" : "Select all"
          }
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "file",
      accessorKey: "name",
      header: "File",
      cell: ({ row }) => (
        <div className="flex min-w-64 items-center gap-3">
          <MediaThumbnail media={row.original} />
          <div className="min-w-0">
            <p className="truncate font-medium text-xs">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">
              {getMediaTypeLabel(row.original)}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "File",
      },
    },
    {
      id: "alt",
      accessorKey: "alt",
      header: "Alt text",
      cell: ({ row }) => (
        <p className="truncate text-muted-foreground text-xs">
          {row.original.alt || "-"}
        </p>
      ),
      meta: {
        label: "Alt text",
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Uploaded",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
      enableSorting: true,
      meta: {
        label: "Uploaded",
      },
    },
    {
      id: "size",
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatBytes(row.original.size)}
        </span>
      ),
      meta: {
        label: "Size",
      },
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {getMediaDimensions(row.original)}
        </span>
      ),
      meta: {
        label: "Details",
      },
    },
    {
      id: "references",
      header: "References",
      cell: () => <span className="text-muted-foreground text-sm">-</span>,
      meta: {
        label: "References",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  aria-haspopup="menu"
                  aria-label={`More actions for ${row.original.name}`}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-all hover:bg-surface-foreground/10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  type="button"
                >
                  <DotsThreeVerticalIcon size={16} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  copyMediaUrl(row.original.url);
                }}
              >
                <CopyIcon className="mr-2" size={16} />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.open(
                    row.original.url,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <DownloadSimpleIcon className="mr-2" size={16} />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                variant="destructive"
              >
                <TrashIcon className="mr-2" size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
      size: 48,
    },
  ];
}
