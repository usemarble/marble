"use client";

import { CloudUpload, ImageIcon, Trash2 } from "lucide-react";

import { useUploadThing } from "@/utils/uploadthing";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { useEditor } from "novel";
import { useState } from "react";

interface ImageUploadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ImageUploadModal({ isOpen, setIsOpen }: ImageUploadModalProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const editorInstance = useEditor();

  const { startUpload } = useUploadThing("posts", {
    onClientUploadComplete: (res) => {
      const imageUrl = res[0]?.url;
      if (imageUrl && editorInstance) {
        editorInstance.editor
          ?.chain()
          .focus()
          .setImage({ src: imageUrl })
          .run();
      }
      toast.success("uploaded successfully!", {
        id: "uploading",
        position: "top-center",
      });
      setIsOpen(false);
      setFile(undefined);
    },
    onUploadError: () => {
      toast.error("Failed to upload", {
        id: "uploading",
        position: "top-center",
      });
    },
    onUploadBegin: (filename) => {
      console.log("upload has begun for", filename);
      toast.loading("uploading...", {
        id: "uploading",
        position: "top-center",
      });
    },
  });

  const handleEmbed = (url: string) => {
    if (editorInstance) {
      editorInstance.editor?.chain().focus().setImage({ src: url }).run();
      setIsOpen(false);
      setEmbedUrl("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Upload an image from your computer or embed an image from the web.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="sm:max-w-lg">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList variant="underline" className="flex justify-start mb-4">
            <TabsTrigger variant="underline" value="upload">
              Upload
            </TabsTrigger>
            <TabsTrigger variant="underline" value="embed">
              Embed
            </TabsTrigger>
          </TabsList>
          {/*  */}
          <TabsContent value="upload">
            <section className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">
                Click below to upload an image from your computer.
              </p>
              <div className="min-h-52">
                {file ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full h-full">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="cover"
                        className="w-full h-full min-h-48 object-cover rounded-md"
                      />
                    </div>
                    <div className="flex gap-4 items-center">
                      <Button
                        variant="outline"
                        onClick={() => setFile(undefined)}
                        className="text-destructive hover:text-destructive hover:border-destructive"
                      >
                        <Trash2 className="size-4" />
                        <span>Remove</span>
                      </Button>
                      <Button onClick={() => startUpload([file])}>
                        <CloudUpload className="size-4" />
                        <span>Upload</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Label
                    htmlFor="coverImage"
                    className="w-full h-full min-h-52 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:border-primary"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-4" />
                      <p className="text-sm font-medium">Upload Image</p>
                    </div>
                    <Input
                      onChange={(e) => setFile(e.target.files?.[0])}
                      id="image"
                      type="file"
                      className="sr-only"
                    />
                  </Label>
                )}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="embed">
            <section className="space-y-8">
              <p className="text-muted-foreground text-sm">
                Paste a URL to embed an image from the web.
              </p>
              <div className="flex flex-col gap-6">
                <Input
                  value={embedUrl}
                  onChange={({ target }) => setEmbedUrl(target.value)}
                  placeholder="Paste your image link"
                />
                <Button
                  className="w-52 mx-auto"
                  onClick={() => handleEmbed(embedUrl)}
                >
                  Save
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
