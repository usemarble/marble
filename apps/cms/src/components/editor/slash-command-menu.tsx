import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
} from "novel";
import { useState } from "react";
import { ImageUploadModal } from "./image-upload-modal";
import { suggestionItems } from "./slash-command-items";
import { YoutubeEmbedModal } from "./youtube-embed-modal";

export function SlashCommandMenu() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  return (
    <>
      <EditorCommand className="bg-background shadow-xs z-50 h-auto max-h-80 w-60 overflow-y-auto rounded-sm border px-1 py-2 transition-all">
        <EditorCommandEmpty className="text-muted-foreground px-2">
          No results
        </EditorCommandEmpty>
        <EditorCommandList>
          {suggestionItems.map((item) => (
            <EditorCommandItem
              value={item.title}
              onCommand={(val) => {
                if (item.title === "Image") {
                  if (val.editor && val.range) {
                    val.editor.chain().focus().deleteRange(val.range).run();
                  }
                  setShowImageModal(true);
                } else if (item.title === "YouTube") {
                  if (val.editor && val.range) {
                    val.editor.chain().focus().deleteRange(val.range).run();
                  }
                  setShowYoutubeModal(true);
                } else {
                  item.command?.(val);
                }
              }}
              key={item.title}
              className="hover:bg-accent aria-selected:bg-accent flex w-full cursor-pointer items-center space-x-2 rounded-[6px] px-2 py-1 text-left text-sm"
            >
              <div className="border-muted bg-background flex items-center justify-center border p-1">
                {item.icon}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
              </div>
            </EditorCommandItem>
          ))}
        </EditorCommandList>
      </EditorCommand>
      <ImageUploadModal isOpen={showImageModal} setIsOpen={setShowImageModal} />
      <YoutubeEmbedModal
        isOpen={showYoutubeModal}
        setIsOpen={setShowYoutubeModal}
      />
    </>
  );
}
