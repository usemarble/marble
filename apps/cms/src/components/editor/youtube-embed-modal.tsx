"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { YoutubeLogo } from "@phosphor-icons/react";
import { useEditor } from "novel";
import { useState } from "react";

type YoutubeEmbedModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function YoutubeEmbedModal({
  isOpen,
  setIsOpen,
}: YoutubeEmbedModalProps) {
  const [url, setUrl] = useState("");
  const editorInstance = useEditor();

  const handleEmbed = (url: string) => {
    if (editorInstance) {
      editorInstance.editor
        ?.chain()
        .focus()
        .setYoutubeVideo({ src: url })
        .run();
      setIsOpen(false);
      setUrl("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Input
            value={url}
            onChange={({ target }) => setUrl(target.value)}
            placeholder="Paste YouTube URL"
          />
          <Button onClick={() => handleEmbed(url)}>
            <YoutubeLogo className="mr-2 size-4" />
            Embed Video
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
