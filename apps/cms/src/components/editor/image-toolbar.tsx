"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { memo, useCallback, useEffect, useState } from "react";

function ImageToolbarComponent() {
  const { editor } = useCurrentEditor();
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");

  // Update local state when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      const { selection } = editor.state;
      const node = editor.state.doc.nodeAt(selection.from);

      if (node?.type.name === "figure") {
        setAlt(node.attrs.alt || "");
        setCaption(node.attrs.caption || "");
      }
    };

    updateState();
    editor.on("selectionUpdate", updateState);

    return () => {
      editor.off("selectionUpdate", updateState);
    };
  }, [editor]);

  const handleAltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAlt = e.target.value;
      setAlt(newAlt);
      editor?.commands.updateFigure({ alt: newAlt });
    },
    [editor]
  );

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCaption = e.target.value;
      setCaption(newCaption);
      editor?.commands.updateFigure({ caption: newCaption });
    },
    [editor]
  );

  const shouldShow = useCallback(
    ({ editor: ed }: { editor: typeof editor }) => {
      if (!ed) return false;

      const { selection } = ed.state;
      const node = ed.state.doc.nodeAt(selection.from);

      return node?.type.name === "figure";
    },
    []
  );

  if (!editor) {
    return null;
  }

  return (
    <TiptapBubbleMenu
      className="flex w-80 flex-col gap-3 rounded-lg border bg-background p-3 shadow-lg"
      editor={editor}
      shouldShow={shouldShow}
    >
      <div className="space-y-2">
        <Label className="font-medium text-xs" htmlFor="alt-text">
          Alt Text
        </Label>
        <Input
          className="h-8 text-sm"
          id="alt-text"
          onChange={handleAltChange}
          placeholder="Describe the image..."
          type="text"
          value={alt}
        />
      </div>
      <div className="space-y-2">
        <Label className="font-medium text-xs" htmlFor="caption">
          Caption
        </Label>
        <Input
          className="h-8 text-sm"
          id="caption"
          onChange={handleCaptionChange}
          placeholder="Add a caption..."
          type="text"
          value={caption}
        />
      </div>
    </TiptapBubbleMenu>
  );
}

export const ImageToolbar = memo(ImageToolbarComponent);
