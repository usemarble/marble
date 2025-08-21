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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { Check, Images, Info, Spinner, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";
import { z } from "zod";
import { ImageDropzone } from "@/components/shared/dropzone";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import type { Media } from "@/types/media";

// URL schema
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

interface CoverImageSelectorProps {
  control: Control<PostValues>;
}

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
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();

  const { mutate: uploadCover, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "media" }),
    onSuccess: (data: Media) => {
      if (data?.url) {
        onChange(data.url);
        toast.success("Uploaded successfully!");
        setFile(undefined);
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.MEDIA, params.workspace],
        });
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
    queryKey: [QUERY_KEYS.MEDIA, params.workspace],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: Media[] = await res.json();
      return data;
    },
  });

  const handleEmbed = async (url: string) => {
    if (!url) return;

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
        <div className="relative w-full h-48 group">
          {/* biome-ignore lint/performance/noImgElement: <> */}
          <img
            src={coverImage}
            alt="cover"
            className="w-full h-full object-cover rounded-md"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-2 transition bg-white rounded-full text-black hover:text-destructive opacity-0 group-hover:opacity-100"
          >
            <Trash className="size-5" />
            <span className="sr-only">remove image</span>
          </button>
        </div>
      );
    }

    return (
      <Tabs defaultValue="upload" className="w-full">
        <TabsList variant="underline" className="flex justify-start mb-4">
          <TabsTrigger variant="underline" value="upload">
            Upload
          </TabsTrigger>
          <TabsTrigger variant="underline" value="embed">
            Embed
          </TabsTrigger>
          <TabsTrigger variant="underline" value="media">
            Media
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="h-48">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-48">
                {/* biome-ignore lint/performance/noImgElement: <> */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="cover preview"
                  className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute grid size-full inset-0 place-content-center bg-black/50 rounded-md p-2 backdrop-blur-xs">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Spinner className="size-5 animate-spin text-white" />
                      <p className="text-sm text-white">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        onClick={() => setFile(undefined)}
                        className="bg-white rounded-full text-black hover:bg-white hover:text-destructive"
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ImageDropzone
              onFilesAccepted={(files: File[]) => {
                if (files[0]) {
                  setFile(files[0]);
                  uploadCover(files[0]);
                }
              }}
              className="w-full h-48 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer"
              multiple={false}
            />
          )}
        </TabsContent>
        <TabsContent value="embed" className="h-48">
          <div className="w-full h-48 rounded-md border border-dashed bg-background flex items-center justify-start">
            <div className="flex flex-col gap-2 w-full max-w-sm px-4">
              <div className="flex items-center gap-2">
                <Input
                  value={embedUrl}
                  onChange={({ target }) => {
                    setEmbedUrl(target.value);
                    setUrlError(null);
                  }}
                  placeholder="Paste your cover image link"
                  className={cn(urlError && "border-destructive")}
                />
                <Button
                  className="shrink-0"
                  size="icon"
                  onClick={() => handleEmbed(embedUrl)}
                  disabled={isValidatingUrl || !embedUrl}
                >
                  {isValidatingUrl ? (
                    <Spinner className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </div>
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="media" className="h-48">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(true)}
            className="w-full h-48 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer transition-colors"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Images className="size-6" />
              <p className="text-sm font-medium">Click to view your gallery</p>
            </div>
          </button>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <p className="text-sm font-medium leading-none">Cover Image</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-muted-foreground text-xs max-w-64">
              A featured image usually used for the post thumbnail and social
              media previews (optional)
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {renderContent()}

      {/* Media Gallery Drawer */}
      <Drawer open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DrawerContent className="h-[95vh] mt-4">
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
                        key={item.id}
                        className="relative rounded-[4px] h-48 overflow-hidden group"
                      >
                        <button
                          type="button"
                          onClick={() => handleImageSelect(item.url)}
                          className="w-full h-full"
                        >
                          {/* biome-ignore lint/performance/noImgElement: <> */}
                          <img
                            src={item.url}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Images className="size-8" />
                  <p className="text-sm font-medium">
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
