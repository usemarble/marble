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
import { CloudArrowUp, Spinner, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEditor } from "novel";
import { useState } from "react";
import { ImageDropzone } from "@/components/shared/dropzone";
import { QUERY_KEYS } from "@/lib/queries/keys";

interface MediaResponse {
  id: string;
  name: string;
  url: string;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ImageUploadModal({ isOpen, setIsOpen }: ImageUploadModalProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const editorInstance = useEditor();

  const { mutate: uploadImage, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads/media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image.");
      }
      return response.json();
    },
    onSuccess: (data) => {
      editorInstance.editor?.chain().focus().setImage({ src: data.url }).run();
      toast.success("Image uploaded successfully.");
      setIsOpen(false);
      setFile(undefined);
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
          editorInstance.editor.chain().focus().setImage({ src: url }).run();
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

  const handleUpload = async (file: File) => {
    if (!editorInstance.editor) return;
    uploadImage(file);
  };

  // fetch media
  const { data: media } = useQuery({
    queryKey: [QUERY_KEYS.MEDIA],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: MediaResponse[] = await res.json();
      return data;
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="sm:max-w-lg max-h-96">
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
                        className="w-full h-full max-h-48 object-cover rounded-md"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setFile(undefined)}
                        disabled={isUploading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="size-4" />
                        <span>Remove</span>
                      </Button>
                      <Button
                        onClick={() => file && handleUpload(file)}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Spinner className="size-4 animate-spin" />
                        ) : (
                          <CloudArrowUp className="size-4" />
                        )}
                        <span>{isUploading ? "Uploading..." : "Upload"}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onFilesAccepted={(files: File[]) => setFile(files[0])}
                    className="w-full h-full min-h-56 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:border-primary"
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
                    {media.map((item) => (
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
