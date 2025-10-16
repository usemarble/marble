"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { useCurrentEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useState } from "react";

type YoutubeEmbedModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editor?: Editor | null;
};

export function YoutubeEmbedModal({
  isOpen,
  setIsOpen,
  editor: editorProp,
}: YoutubeEmbedModalProps) {
  const [url, setUrl] = useState("");
  const { editor: editorFromContext } = useCurrentEditor();
  const editor = editorProp || editorFromContext;

  const handleEmbed = (url: string) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setYoutubeVideo({ src: url })
        .run();
      setIsOpen(false);
      setUrl("");
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Input
            onChange={({ target }) => setUrl(target.value)}
            placeholder="Paste YouTube URL"
            value={url}
          />
          <Button onClick={() => handleEmbed(url)}>Embed Video</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
