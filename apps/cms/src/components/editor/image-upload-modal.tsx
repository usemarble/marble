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
import { SpinnerIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor } from "novel";
import { useState } from "react";
import { ImageDropzone } from "@/components/shared/dropzone";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

type ImageUploadModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ImageUploadModal({ isOpen, setIsOpen }: ImageUploadModalProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [altText, setAltText] = useState("");
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
          .setImage({ src: data.url, alt: altText })
          .createParagraphNear()
          .run();
        toast.success("Image uploaded successfully.");
        setIsOpen(false);
        setFile(undefined);
        setAltText("");
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
            .setImage({ src: url, alt: altText })
            .createParagraphNear()
            .run();
        }
        setIsOpen(false);
        setEmbedUrl("");
        setIsValidatingUrl(false);
        setAltText("");
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
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-96 max-w-xl">
        <Tabs className="w-full" defaultValue="upload">
          <TabsList className="mb-4 flex justify-start" variant="line">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          {/*  */}
          <TabsContent value="upload">
            <section className="space-y-4">
              <div className="min-h-52">
                {file ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative h-full w-full">
                      {/* biome-ignore lint/performance/noImgElement: <> */}
                      <img
                        alt="cover"
                        className="h-full max-h-52 w-full rounded-md object-cover"
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
                    <Input
                      value={altText}
                      onChange={({ target }) => setAltText(target.value)}
                      placeholder="Describe the image (alt text)"
                    />
                  </div>
                ) : (
                  <ImageDropzone
                    className="flex h-64 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background"
                    multiple={false}
                    onFilesAccepted={(files: File[]) => {
                      if (files[0]) {
                        setFile(files[0]);
                        uploadImage(files[0]);
                      }
                    }}
                  />
                )}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="embed">
            <section className="space-y-8">
              <div className="flex flex-col gap-6">
                <Input
                  disabled={isValidatingUrl}
                  onChange={({ target }) => setEmbedUrl(target.value)}
                  placeholder="Paste your image link"
                  value={embedUrl}
                />
                <Input
                  value={altText}
                  onChange={({ target }) => setAltText(target.value)}
                  placeholder="Describe the image (alt text)"
                  disabled={isValidatingUrl}
                />
                <AsyncButton
                  className="mx-auto w-52"
                  disabled={isValidatingUrl || !embedUrl}
                  onClick={() => handleEmbed(embedUrl)}
                >
                  <span>Save</span>
                </AsyncButton>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="media">
            <ScrollArea className="h-72">
              <section className="flex flex-col gap-4 p-4">
                {media && media.length > 0 ? (
                  <ul className="grid max-h-[400px] grid-cols-3 gap-2 overflow-y-auto">
                    {/* ONCE video extension is added, we need to filter out videos */}
                    {media
                      .filter((item) => item.type === "image")
                      .map((item) => (
                        <li className="border" key={item.id}>
                          <button
                            onClick={() => handleEmbed(item.url)}
                            type="button"
                          >
                            {/* biome-ignore lint/performance/noImgElement: <> */}
                            <img
                              alt={item.name}
                              className="h-24 object-cover"
                              src={item.url}
                            />
                          </button>
                          <p className="line-clamp-1 px-1 py-0.5 text-muted-foreground text-xs">
                            {item.name}
                          </p>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="grid h-full place-content-center">
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
