"use client";

import { Button } from "@marble/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@marble/ui/components/drawer";
import { Input } from "@marble/ui/components/input";
import { ScrollArea } from "@marble/ui/components/scroll-area";
import { toast } from "@marble/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckIcon,
  ImagesIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";
import { z } from "zod";
import { ImageDropzone } from "@/components/shared/dropzone";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import type { Media } from "@/types/media";
import { FieldInfo } from "./field-info";

// URL schema
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

type CoverImageSelectorProps = {
  control: Control<PostValues>;
};

export function CoverImageSelector({ control }: CoverImageSelectorProps) {
  const {
    field: { onChange, value: coverImage },
  } = useController({
    name: "coverImage",
    control,
  });

  const [file, setFile] = useState<File | undefined>();
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate: uploadCover, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "media" }),
    onSuccess: (data: Media) => {
      if (data?.url) {
        onChange(data.url);
        toast.success("Uploaded successfully!");
        setFile(undefined);
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.MEDIA(workspaceId),
          });
        }
      } else {
        toast.error("Upload failed: Invalid response from server.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Fetch media
  const { data: media } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.MEDIA(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: Media[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
  });

  const handleEmbed = async (url: string) => {
    if (!url) {
      return;
    }

    setIsValidatingUrl(true);
    setUrlError(null);

    try {
      await urlSchema.parseAsync(url);
      const img = new Image();
      img.onload = () => {
        onChange(url);
        setEmbedUrl("");
        setIsValidatingUrl(false);
      };
      img.onerror = () => {
        setUrlError("Invalid image URL");
        setIsValidatingUrl(false);
      };
      img.src = url;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUrlError(error.errors?.[0]?.message || "Invalid URL");
      } else {
        setUrlError("Invalid URL");
      }
      setIsValidatingUrl(false);
    }
  };

  const handleImageSelect = (url: string) => {
    onChange(url);
    setIsGalleryOpen(false);
  };

  const renderContent = () => {
    if (coverImage) {
      return (
        <div className="group relative h-48 w-full">
          {/* biome-ignore lint/performance/noImgElement: <> */}
          <img
            alt="cover"
            className="h-full w-full rounded-md object-cover"
            src={coverImage}
          />
          <div className="absolute inset-0 rounded-md bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <button
            className="absolute top-2 right-2 rounded-full bg-white p-2 text-black opacity-0 transition hover:text-destructive group-hover:opacity-100"
            onClick={() => onChange(null)}
            type="button"
          >
            <TrashIcon className="size-5" />
            <span className="sr-only">remove image</span>
          </button>
        </div>
      );
    }

    return (
      <Tabs className="w-full" defaultValue="upload">
        <TabsList className="mb-4 flex justify-start" variant="line">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent className="h-48" value="upload">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative h-48 w-full">
                {/* biome-ignore lint/performance/noImgElement: <> */}
                <img
                  alt="cover preview"
                  className="h-full w-full rounded-md object-cover"
                  src={URL.createObjectURL(file)}
                />
                <div className="absolute inset-0 grid size-full place-content-center rounded-md bg-black/50 p-2 backdrop-blur-xs">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <SpinnerIcon className="size-5 animate-spin text-white" />
                      <p className="text-sm text-white">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        className="rounded-full bg-white text-black hover:bg-white hover:text-destructive"
                        onClick={() => setFile(undefined)}
                        size="icon"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ImageDropzone
              className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-editor-field"
              multiple={false}
              onFilesAccepted={(files: File[]) => {
                if (files[0]) {
                  setFile(files[0]);
                  uploadCover(files[0]);
                }
              }}
            />
          )}
        </TabsContent>
        <TabsContent className="h-48" value="embed">
          <div className="flex h-48 w-full items-center justify-start rounded-md border border-dashed bg-editor-field">
            <div className="flex w-full max-w-sm flex-col gap-2 px-4">
              <div className="flex items-center gap-2">
                <Input
                  className={cn(
                    "bg-editor-sidebar-background",
                    urlError && "border-destructive"
                  )}
                  onChange={({ target }) => {
                    setEmbedUrl(target.value);
                    setUrlError(null);
                  }}
                  placeholder="Paste your cover image link"
                  value={embedUrl}
                />
                <AsyncButton
                  className="shrink-0"
                  disabled={!embedUrl}
                  isLoading={isValidatingUrl}
                  onClick={() => handleEmbed(embedUrl)}
                  size="icon"
                >
                  <CheckIcon className="size-4" />
                </AsyncButton>
              </div>
              {urlError && (
                <p className="text-destructive text-sm">{urlError}</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent className="h-48" value="media">
          <button
            className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-editor-field transition-colors"
            onClick={() => setIsGalleryOpen(true)}
            type="button"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagesIcon className="size-6" />
              <p className="font-medium text-sm">Click to view your gallery</p>
            </div>
          </button>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <p className="font-medium text-sm leading-none">Cover Image</p>
        <FieldInfo text="A featured image usually used for the post thumbnail and social media previews (optional)" />
      </div>
      {renderContent()}

      {/* Media Gallery Drawer */}
      <Drawer onOpenChange={setIsGalleryOpen} open={isGalleryOpen}>
        <DrawerContent className="mt-4 min-h-[95vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Gallery</DrawerTitle>
            <DrawerDescription>
              Select an image from your media library to use as your cover
              image.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {media && media.length > 0 ? (
              <ScrollArea className="h-full">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
                  {/* We will filter via query params once endpoint is updated */}
                  {media
                    .filter((item) => item.type === "image")
                    .map((item) => (
                      <li
                        className="group relative h-48 overflow-hidden rounded-[4px]"
                        key={item.id}
                      >
                        <button
                          className="h-full w-full"
                          onClick={() => handleImageSelect(item.url)}
                          type="button"
                        >
                          {/* biome-ignore lint/performance/noImgElement: <> */}
                          <img
                            alt={item.name}
                            className="h-full w-full object-cover"
                            src={item.url}
                          />
                        </button>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagesIcon className="size-8" />
                  <p className="font-medium text-sm">
                    Your gallery is empty. Upload some media to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
