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
import { Spinner } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor } from "novel";
import { useState } from "react";
import { ImageDropzone } from "@/components/shared/dropzone";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

interface ImageUploadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

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
    if (!url || !editorInstance.editor) return;

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
      const res = await fetch("/api/media");
      const data: Media[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="max-w-xl max-h-96">
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
          {/*  */}
          <TabsContent value="upload">
            <section className="space-y-4">
              <div className="min-h-52">
                {file ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full h-full">
                      {/* biome-ignore lint/performance/noImgElement: <> */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="cover"
                        className="w-full h-full max-h-52 object-cover rounded-md"
                      />
                      {isUploading && (
                        <div className="absolute grid size-full inset-0 place-content-center bg-black/50 rounded-md p-2 backdrop-blur-xs">
                          <div className="flex flex-col items-center gap-2">
                            <Spinner className="size-5 animate-spin text-white" />
                            <p className="text-sm text-white">Uploading...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onFilesAccepted={(files: File[]) => {
                      if (files[0]) {
                        setFile(files[0]);
                        uploadImage(files[0]);
                      }
                    }}
                    className="w-full h-64 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer"
                    multiple={false}
                  />
                )}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="embed">
            <section className="space-y-8">
              <div className="flex flex-col gap-6">
                <Input
                  value={embedUrl}
                  onChange={({ target }) => setEmbedUrl(target.value)}
                  placeholder="Paste your image link"
                  disabled={isValidatingUrl}
                />
                <Button
                  className="w-52 mx-auto"
                  onClick={() => handleEmbed(embedUrl)}
                  disabled={isValidatingUrl || !embedUrl}
                >
                  {isValidatingUrl ? (
                    <>
                      <Spinner className="size-4 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="media">
            <ScrollArea className="h-72">
              <section className="flex flex-col gap-4 p-4">
                {media && media.length > 0 ? (
                  <ul className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[400px]">
                    {/* ONCE video extension is added, we need to filter out videos */}
                    {media
                      .filter((item) => item.type === "image")
                      .map((item) => (
                        <li key={item.id} className="border">
                          <button
                            type="button"
                            onClick={() => handleEmbed(item.url)}
                          >
                            {/* biome-ignore lint/performance/noImgElement: <> */}
                            <img
                              src={item.url}
                              alt={item.name}
                              className="h-24 object-cover"
                            />
                          </button>
                          <p className="text-xs text-muted-foreground line-clamp-1 py-0.5 px-1">
                            {item.name}
                          </p>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="h-full grid place-content-center">
                    <div className="flex flex-col items-center gap-4">
                      <p>Your previously uploaded media will show up here </p>
                    </div>
                  </div>
                )}
              </section>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
