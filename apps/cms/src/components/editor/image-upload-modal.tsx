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
  CloudArrowUp,
  Image as ImageIcon,
  Spinner,
  Trash,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEditor } from "novel";
import { useState } from "react";
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
    mutationFn: async (formFile: File) => {
      const formData = new FormData();
      formData.append("file", formFile);
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

  const handleEmbed = (url: string) => {
    if (!(url && editorInstance.editor)) {
      return;
    }

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

  const handleUpload = (uploadFile: File) => {
    if (!editorInstance.editor) {
      return;
    }
    uploadImage(uploadFile);
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
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-96 sm:max-w-lg">
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
                        className="h-full max-h-48 w-full rounded-md object-cover"
                        src={URL.createObjectURL(file)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        className="text-destructive hover:text-destructive"
                        disabled={isUploading}
                        onClick={() => setFile(undefined)}
                        variant="outline"
                      >
                        <Trash className="size-4" />
                        <span>Remove</span>
                      </Button>
                      <Button
                        disabled={isUploading}
                        onClick={() => file && handleUpload(file)}
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
                  <Label
                    className="flex h-full min-h-56 w-full cursor-pointer items-center justify-center rounded-md border border-dashed hover:border-primary"
                    htmlFor="bodyImage"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-4" />
                      <div className="flex flex-col items-center">
                        <p className="font-medium text-sm">Upload Image</p>
                        <p className="font-medium text-xs">(Max 4mb)</p>
                      </div>
                    </div>
                    <Input
                      accept="image/*"
                      className="sr-only"
                      id="bodyImage"
                      onChange={(e) => setFile(e.target.files?.[0])}
                      type="file"
                    />
                  </Label>
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
                <Button
                  className="mx-auto w-52"
                  disabled={isValidatingUrl || !embedUrl}
                  onClick={() => handleEmbed(embedUrl)}
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
                  <ul className="grid max-h-[400px] grid-cols-3 gap-2 overflow-y-auto">
                    {media.map((item) => (
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
