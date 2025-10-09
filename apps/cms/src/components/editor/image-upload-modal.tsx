"use client";

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
import { ImagesIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor } from "novel";
import { useState } from "react";
import { ImageDropzone } from "@/components/shared/dropzone";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media, MediaListResponse } from "@/types/media";

type ImageUploadModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ImageUploadModal({ isOpen, setIsOpen }: ImageUploadModalProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const workspaceId = useWorkspaceId();
  const editorInstance = useEditor();
  const queryClient = useQueryClient();

  const { mutate: uploadImage, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "media" }),
    onSuccess: (data: Media) => {
      if (data?.url) {
        editorInstance.editor
          ?.chain()
          .focus()
          .setImage({ src: data.url })
          .createParagraphNear()
          .run();
        toast.success("Image uploaded successfully.");
        setIsOpen(false);
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

  const handleEmbed = async (url: string) => {
    if (!url || !editorInstance.editor) {
      return;
    }

    try {
      setIsValidatingUrl(true);
      const img = new Image();
      img.onload = () => {
        if (editorInstance.editor) {
          editorInstance.editor
            .chain()
            .focus()
            .setImage({ src: url })
            .createParagraphNear()
            .run();
        }
        setIsOpen(false);
        setEmbedUrl("");
        setIsValidatingUrl(false);
      };
      img.onerror = () => {
        toast.error("Invalid image URL");
        setIsValidatingUrl(false);
      };
      img.src = url;
    } catch (_error) {
      toast.error("Failed to embed image");
      setIsValidatingUrl(false);
    }
  };

  // fetch media
  const { data: media } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.MEDIA(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/media");
        const data: MediaListResponse = await res.json();
        return data.media;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    enabled: !!workspaceId,
  });

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="w-full sm:min-h-[580px] sm:max-w-4xl">
        <Tabs className="h-full w-full" defaultValue="upload">
          <TabsList className="mb-4 flex justify-start" variant="line">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          {/*  */}
          <TabsContent value="upload">
            <section className="flex h-full space-y-4">
              {file ? (
                <div className="flex flex-col gap-4">
                  <div className="relative h-full w-full">
                    {/* biome-ignore lint/performance/noImgElement: <> */}
                    <img
                      alt="cover"
                      className="h-full w-full rounded-md object-cover"
                      src={URL.createObjectURL(file)}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 grid size-full place-content-center rounded-md bg-black/50 p-2 backdrop-blur-xs">
                        <div className="flex flex-col items-center gap-2">
                          <SpinnerIcon className="size-5 animate-spin text-white" />
                          <p className="text-sm text-white">Uploading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <ImageDropzone
                  className="flex h-full w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-editor-field"
                  multiple={false}
                  onFilesAccepted={(files: File[]) => {
                    if (files[0]) {
                      setFile(files[0]);
                      uploadImage(files[0]);
                    }
                  }}
                />
              )}
            </section>
          </TabsContent>
          <TabsContent value="embed">
            <section className="flex h-full flex-col items-center justify-center gap-6 space-y-4 rounded-md bg-editor-field-background p-6">
              <div className="flex w-full justify-center gap-4">
                <Input
                  className="w-2/3 bg-editor-content-background"
                  disabled={isValidatingUrl}
                  onChange={({ target }) => setEmbedUrl(target.value)}
                  placeholder="Paste your image link"
                  value={embedUrl}
                />
                <AsyncButton
                  disabled={isValidatingUrl || !embedUrl}
                  onClick={() => handleEmbed(embedUrl)}
                >
                  <span>Save</span>
                </AsyncButton>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="media">
            {media && media.length > 0 ? (
              <ScrollArea className="max-h-[580px] overflow-y-auto">
                <section className="flex flex-col gap-4 p-4">
                  <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
                    {media
                      .filter((item) => item.type === "image")
                      .map((item) => (
                        <li
                          className="group relative h-42 overflow-hidden rounded-[4px]"
                          key={item.id}
                        >
                          <button
                            className="h-full w-full cursor-pointer"
                            onClick={() => handleEmbed(item.url)}
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
                </section>
              </ScrollArea>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagesIcon className="size-8" />
                <p className="font-medium text-sm">
                  Your gallery is empty. Upload some media to get started.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
