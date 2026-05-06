"use client";

import {
  ArrowLeft02Icon,
  Copy01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeaderSidebarTrigger } from "@/components/layout/header-sidebar-trigger";
import { DashboardBody } from "@/components/layout/wrapper";
import { VideoPlayer } from "@/components/media/video-player";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { blurhashToDataUrl } from "@/lib/blurhash";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";
import {
  downloadMedia,
  formatMediaDimensions,
  formatMediaDuration,
  formatMediaType,
} from "@/utils/media";
import { formatBytes } from "@/utils/string";

interface MediaDetailPageProps {
  id: string;
  workspace: string;
}
export default function MediaDetailPage({
  id,
  workspace,
}: MediaDetailPageProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    data: media,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.MEDIA_DETAIL(workspaceId ?? "", id),
    queryFn: async (): Promise<Media> => {
      const response = await fetch(`/api/media/${id}`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to fetch media");
      }
      return response.json();
    },
    enabled: Boolean(workspaceId),
  });

  const { isPending: isSaving, mutate: updateMedia } = useMutation({
    mutationFn: async ({ alt, name }: { alt: string | null; name: string }) => {
      const response = await fetch(`/api/media/${id}`, {
        body: JSON.stringify({ alt, name }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update media");
      }

      return response.json() as Promise<Media>;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update media"
      );
    },
    onSuccess: (updatedMedia) => {
      if (!workspaceId) {
        return;
      }

      queryClient.setQueryData(
        QUERY_KEYS.MEDIA_DETAIL(workspaceId, id),
        updatedMedia
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEDIA(workspaceId),
      });
      toast.success("Saved media details");
    },
  });

  const blurDataUrl = useMemo(() => {
    if (!media?.blurHash || media.type !== "image") {
      return undefined;
    }

    return blurhashToDataUrl(media.blurHash);
  }, [media?.blurHash, media?.type]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !media) {
    return (
      <DashboardBody showHeader={false}>
        <div className="grid min-h-[calc(100vh-56px)] place-items-center p-8">
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Could not load media."}
          </p>
        </div>
      </DashboardBody>
    );
  }

  const copyMediaUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      toast.success("Copied media URL");
    } catch {
      toast.error("Could not copy media URL");
    }
  };

  return (
    <DashboardBody
      contextView={
        <MediaDetailsPanel
          isSaving={isSaving}
          media={media}
          onSave={(values) => updateMedia(values)}
        />
      }
      flush
      showHeader={false}
    >
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-dashed bg-background px-4">
          <div className="flex items-center gap-2">
            <HeaderSidebarTrigger />
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    aria-label="Back to media"
                    nativeButton={false}
                    render={<Link href={`/${workspace}/media`} />}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to media</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="min-w-0 truncate font-medium text-sm">{media.name}</p>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    onClick={copyMediaUrl}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <HugeiconsIcon className="size-4" icon={Copy01Icon} />
                <span className="sr-only">Copy URL</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy URL</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    onClick={() => {
                      downloadMedia(media).catch(() => {
                        toast.error("Could not download media");
                      });
                    }}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon className="size-4" icon={Download01Icon} />
                    <span className="sr-only">Download media</span>
                  </Button>
                }
              />
              <TooltipContent>
                <p>Download file</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-hidden bg-background p-4 md:p-8">
          <div className="grid h-full min-h-0 place-items-center">
            <div className="flex h-full min-h-0 w-full items-center justify-center">
              {media.type === "image" ? (
                <Image
                  alt={media.alt ?? media.name}
                  blurDataURL={blurDataUrl}
                  className="h-auto max-h-full w-auto max-w-[min(100%,_900px)] rounded-lg object-contain shadow-sm"
                  height={media.height ?? 900}
                  placeholder={blurDataUrl ? "blur" : "empty"}
                  priority
                  sizes="(min-width: 1024px) min(900px, calc(100vw - 520px)), calc(100vw - 32px)"
                  src={media.url}
                  unoptimized
                  width={media.width ?? 1200}
                />
              ) : media.type === "video" ? (
                <VideoPlayer
                  className="max-h-full max-w-[min(100%,_900px)] rounded-lg shadow-sm"
                  controls
                  preview={false}
                  src={media.url}
                />
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-3 text-muted-foreground text-sm">
                  Preview unavailable
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardBody>
  );
}

function MediaDetailsPanel({
  isSaving,
  media,
  onSave,
}: {
  isSaving: boolean;
  media: Media;
  onSave: (values: { alt: string | null; name: string }) => void;
}) {
  const [name, setName] = useState(media.name);
  const [alt, setAlt] = useState(media.alt ?? "");

  useEffect(() => {
    setName(media.name);
    setAlt(media.alt ?? "");
  }, [media.alt, media.name]);

  const hasChanges = name !== media.name || alt !== (media.alt ?? "");

  const handleSave = () => {
    onSave({
      alt: alt.trim() ? alt.trim() : null,
      name: name.trim(),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-dashed px-5">
        <h2 className="font-medium text-lg">Details</h2>
        <Button
          disabled={!hasChanges || isSaving || !name.trim()}
          onClick={handleSave}
          size="sm"
        >
          Save
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="grid gap-2">
          <Label htmlFor="media-name">Name</Label>
          <Input
            id="media-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="media-alt">Alt text</Label>
          <Textarea
            id="media-alt"
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Describe the media for screen readers"
            rows={4}
            value={alt}
          />
        </div>
        <dl className="grid gap-3 text-sm">
          <DetailItem label="Type" value={formatMediaType(media)} />
          <DetailItem label="Size" value={formatBytes(media.size)} />
          <DetailItem label="Dimensions" value={formatMediaDimensions(media)} />
          <DetailItem
            label="Duration"
            value={formatMediaDuration(media.duration)}
          />
          <DetailItem label="MIME type" value={media.mimeType ?? "-"} />
          <DetailItem
            label="Uploaded"
            value={format(new Date(media.createdAt), "MMM d, yyyy")}
          />
        </dl>
        <div className="grid gap-2">
          <h3 className="font-medium text-sm">References</h3>
          <p className="text-muted-foreground text-sm">
            Not used in any posts yet.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="break-words text-muted-foreground">{value}</dd>
    </div>
  );
}
