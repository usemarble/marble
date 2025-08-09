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
import { Label } from "@marble/ui/components/label";
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
    mutationFn: async (formFile: File) => {
      const formData = new FormData();
      formData.append("file", formFile);

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

  const handleCompressAndUpload = (fileToUpload: File) => {
    uploadMedia(fileToUpload);
  };

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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  const renderContent = () => {
    if (coverImage) {
      return (
        <div className="relative h-48 w-full">
          {/* biome-ignore lint/performance/noImgElement: <> */}
          <img
            alt="cover"
            className="h-full w-full rounded-md object-cover"
            src={coverImage}
          />
          <button
            className="absolute top-2 right-2 rounded-full bg-white p-1.5 text-black transition hover:text-destructive"
            onClick={() => onChange(null)}
            type="button"
          >
            <Trash className="size-4" />
            <span className="sr-only">remove image</span>
          </button>
        </div>
      );
    }

    return (
      <Tabs className="w-full" defaultValue="upload">
        <TabsList className="mb-4 flex justify-start" variant="underline">
          <TabsTrigger value="upload" variant="underline">
            Upload
          </TabsTrigger>
          <TabsTrigger value="embed" variant="underline">
            Embed
          </TabsTrigger>
          <TabsTrigger value="media" variant="underline">
            Media
          </TabsTrigger>
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
                <div className="absolute inset-0 grid size-full place-content-center rounded-md bg-black/50 p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Button
                      className="rounded-full bg-white text-black hover:bg-white hover:text-destructive"
                      disabled={isUploading}
                      onClick={() => setFile(undefined)}
                      size="icon"
                    >
                      <Trash className="size-4" />
                    </Button>
                    <Button
                      className="rounded-full bg-white text-black hover:bg-white hover:text-primary"
                      disabled={isUploading}
                      onClick={() => file && handleCompressAndUpload(file)}
                      size="icon"
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
            <Label
              className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background"
              htmlFor="cover-image-file-input"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-4" />
                <div className="flex flex-col items-center">
                  <p className="font-medium text-sm">Upload Image</p>
                  {/* <p className="text-xs font-medium">(Max 4mb)</p> */}
                </div>
              </div>
              <Input
                accept="image/*"
                className="sr-only"
                id="cover-image-file-input"
                onChange={(e) => setFile(e.target.files?.[0])}
                type="file"
              />
            </Label>
          )}
        </TabsContent>
        <TabsContent className="h-48" value="embed">
          <div className="flex h-48 w-full items-center justify-start rounded-md border border-dashed bg-background">
            <div className="flex w-full max-w-sm flex-col gap-2 px-4">
              <div className="flex items-center gap-2">
                <Input
                  className={cn(urlError && "border-destructive")}
                  onChange={({ target }) => {
                    setEmbedUrl(target.value);
                    setUrlError(null);
                  }}
                  placeholder="Paste your cover image link"
                  value={embedUrl}
                />
                <Button
                  className="shrink-0"
                  disabled={isValidatingUrl || !embedUrl}
                  onClick={() => handleEmbed(embedUrl)}
                  size="icon"
                >
                  {isValidatingUrl ? (
                    <Spinner className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </div>
              {urlError && (
                <p className="text-destructive text-sm">{urlError}</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent className="h-48" value="media">
          <button
            className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background transition-colors"
            onClick={() => setIsGalleryOpen(true)}
            type="button"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {media && media.length > 0 ? (
                <Images className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              <p className="font-medium text-sm">
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
        <p className="font-medium text-sm leading-none">Cover Image</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64 text-muted-foreground text-xs">
              A featured image usually used for the post thumbnail and social
              media previews (optional)
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {renderContent()}

      {/* Media Gallery Modal */}
      <Dialog onOpenChange={setIsGalleryOpen} open={isGalleryOpen}>
        <DialogContent className="max-h-[80vh] w-full max-w-5xl">
          <DialogHeader>
            <DialogTitle>Gallery</DialogTitle>
            <DialogDescription className="sr-only">
              Select an image from your media library to use as your cover
              image.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {media && media.length > 0 ? (
              <ScrollArea className="h-full">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-6">
                  {media.map((item) => (
                    <li
                      className="group relative h-48 overflow-hidden rounded-md"
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
              <div className="flex h-full items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <p className="font-medium text-sm">
                    No media found. Upload some images first.
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
