"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
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
import {
  Check,
  Image as ImageIcon,
  Images,
  Info,
  Spinner,
  Trash,
  Upload,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";
import { z } from "zod";
import { ImageDropzone } from "@/components/shared/dropzone";

import type { PostValues } from "@/lib/validations/post";

// URL schema
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

interface MediaResponse {
  id: string;
  name: string;
  url: string;
}

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

  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload media");
      }

      return response.json();
    },
    onSuccess: (data) => {
      onChange(data.url);
      toast.success("Uploaded successfully!");
      setFile(undefined);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Fetch media
  const { data: media } = useQuery({
    queryKey: ["media"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: MediaResponse[] = await res.json();
      return data;
    },
  });

  const handleCompressAndUpload = async (fileToUpload: File) => {
    uploadMedia(fileToUpload);
  };

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
        <div className="relative w-full h-48">
          {/* biome-ignore lint/performance/noImgElement: <> */}
          <img
            src={coverImage}
            alt="cover"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 transition bg-white rounded-full text-black hover:text-destructive"
          >
            <Trash className="size-4" />
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
                <div className="absolute grid size-full inset-0 place-content-center bg-black/50 rounded-md p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      onClick={() => setFile(undefined)}
                      disabled={isUploading}
                      className="bg-white rounded-full text-black hover:bg-white hover:text-destructive"
                    >
                      <Trash className="size-4" />
                    </Button>
                    <Button
                      disabled={isUploading}
                      size="icon"
                      onClick={() => file && handleCompressAndUpload(file)}
                      className="bg-white rounded-full text-black hover:bg-white hover:text-primary"
                    >
                      {isUploading ? (
                        <Spinner className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ImageDropzone
              onFilesAccepted={(files: File[]) => setFile(files[0])}
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
              {media && media.length > 0 ? (
                <Images className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              <p className="text-sm font-medium">
                {media && media.length > 0
                  ? "Click to view your gallery"
                  : "No media found. Upload some images first."}
              </p>
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

      {/* Media Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gallery</DialogTitle>
            <DialogDescription className="sr-only">
              Select an image from your media library to use as your cover
              image.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-96">
            {media && media.length > 0 ? (
              <ScrollArea className="h-full">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-6">
                  {media.map((item) => (
                    <li
                      key={item.id}
                      className="relative rounded-md h-48 overflow-hidden group"
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
              <div className="flex items-center justify-center h-full p-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <p className="text-sm font-medium">
                    No media found. Upload some to see them here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
