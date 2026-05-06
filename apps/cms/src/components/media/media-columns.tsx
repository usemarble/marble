"use client";

import {
  Copy01Icon,
  Delete02Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { Checkbox } from "@marble/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import {
  DotsThreeVerticalIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
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
  return `${media.type.charAt(0).toUpperCase()}${media.type.slice(1)}`;
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
    <div className="grid size-12 place-items-center rounded-lg border border-dashed bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))]">
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
          aria-checked={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
              ? "mixed"
              : undefined
          }
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
          <div className="min-w-0 max-w-48">
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
        <p className="max-w-32 truncate text-muted-foreground text-xs">
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
                <Button
                  className="size-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  variant="ghost"
                >
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  copyMediaUrl(row.original.url);
                }}
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Copy01Icon} />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                variant="destructive"
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
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
