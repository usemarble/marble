"use client";

import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  ArrowsOutSimpleIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { UsageDashboardData } from "@/types/usage-dashboard";
import { formatBytes } from "@/utils/string";
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

const openMediaFile = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export function MediaUsageCard({ data, isLoading }: MediaUsageCardProps) {
  const recentUploads = data?.recentUploads ?? [];

  return (
    <Card className="gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-0 px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Media Storage</CardTitle>
            <p className="font-semibold text-xl leading-none tracking-tight">
              {formatBytes(data?.totalSize ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="rounded-full px-3 py-1 text-muted-foreground text-xs">
              Recent Uploads
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <HiddenScrollbar className="h-60 rounded-[12px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : recentUploads.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No uploads yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentUploads.map((upload) => {
                const Icon = getMediaTypeIcon(upload.type);
                return (
                  <div
                    className="flex rounded-[12px] border-transparent bg-background p-3 shadow-none shadow-s transition-[color,box-shadow]"
                    key={upload.id}
                  >
                    <div className="flex w-full justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="grid size-20 shrink-0 place-items-center rounded-[8px] border border-dashed bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))]">
                          <Icon className="size-6 text-primary" />
                        </div>
                        <div className="flex flex-col justify-between gap-2">
                          <div>
                            <p className="line-clamp-1 font-medium text-sm">
                              {upload.name}
                            </p>
                            <p className="text-xs">
                              {formatBytes(upload.size)}
                            </p>
                          </div>
                          <p className="mt-auto text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(upload.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="rounded-full bg-sidebar hover:bg-primary/10 hover:text-primary dark:bg-accent/50 dark:hover:text-accent-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMediaFile(upload.url);
                        }}
                        size="icon"
                        variant="ghost"
                      >
                        <ArrowsOutSimpleIcon size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </HiddenScrollbar>
      </CardContent>
    </Card>
  );
}
