"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { BubbleMenu } from "@tiptap/react";
import { useEditor } from "novel";
import { useState } from "react";

export function ImageBubbleMenu() {
  const editor = useEditor();
  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [altText, setAltText] = useState("");

  if (!editor) return null;

  const handleEditAlt = () => {
    const { src, alt } = editor.getAttributes("image");
    setAltText(alt || "");
    setIsEditingAlt(true);
  };

  const handleSaveAlt = () => {
    editor
      .chain()
      .focus()
      .updateAttributes("image", { alt: altText })
      .run();
    setIsEditingAlt(false);
  };

  const handleCancel = () => {
    setIsEditingAlt(false);
    setAltText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveAlt();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor, view, state, oldState, from, to }) => {
        const { selection } = state;
        const { empty } = selection;
        
        if (empty) return false;
        
        const node = state.doc.nodeAt(selection.from);
        return node?.type.name === "image";
      }}
    >
      <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
        {isEditingAlt ? (
          <>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image..."
              className="w-48"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveAlt}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditAlt}
            className="flex items-center gap-2"
          >
            <PencilSimpleIcon size={16} />
            Edit alt text
          </Button>
        )}
      </div>
    </BubbleMenu>
  );
}
