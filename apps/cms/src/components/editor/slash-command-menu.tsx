import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  type EditorInstance,
} from "novel";
import { useState } from "react";
import { ComponentSelectorModal } from "./component-selector-modal";
import { ImageUploadModal } from "./image-upload-modal";
import { suggestionItems } from "./slash-command-items";
import { YoutubeEmbedModal } from "./youtube-embed-modal";

export function SlashCommandMenu() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editorInstance, setEditorInstance] = useState<
    EditorInstance | undefined
  >(undefined);

  return (
    <>
      <EditorCommand className="z-50 h-auto max-h-80 w-60 overflow-y-auto rounded-sm border bg-background px-1 py-2 shadow-xs transition-all">
        <EditorCommandEmpty className="px-2 text-muted-foreground">
          No results
        </EditorCommandEmpty>
        <EditorCommandList>
          {suggestionItems.map((item) => (
            <EditorCommandItem
              className="flex w-full cursor-pointer items-center space-x-2 rounded-[6px] px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              key={item.title}
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
                } else if (item.title === "Component") {
                  if (val.editor && val.range) {
                    val.editor.chain().focus().deleteRange(val.range).run();
                  }
                  setEditorInstance(val.editor);
                  setShowComponentModal(true);
                } else {
                  item.command?.(val);
                }
              }}
              value={item.title}
            >
              <div className="flex items-center justify-center border border-muted bg-background p-1">
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
      <ComponentSelectorModal
        editor={editorInstance}
        isOpen={showComponentModal}
        setIsOpen={setShowComponentModal}
      />
    </>
  );
}
