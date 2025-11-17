"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import type { UsageDashboardData } from "@/types/usage-dashboard";
import { formatBytes } from "@/utils/string";
import { LoadingSpinner } from "../ui/loading-spinner";

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

  return (
    <Card className="gap-4 rounded-[20px] border-none bg-sidebar p-2.5">
      <CardHeader className="gap-2 px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Recent Uploads</CardTitle>
            <CardDescription className="sr-only">
              Recent media uploads and storage usage
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-semibold text-xl leading-none tracking-tight">
              {formatBytes(data?.totalSize ?? 0)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-64 overflow-y-auto rounded-[12px] p-0">
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
            {recentUploads.slice(0, 5).map((upload) => {
              const Icon = getMediaTypeIcon(upload.type);
              return (
                <Card
                  className="flex border-transparent bg-background p-3 shadow-none transition-[color,box-shadow]"
                  key={upload.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="grid size-20 place-items-center rounded-md border border-dashed bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))]">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{upload.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(upload.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="text-xs">{formatBytes(upload.size)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
