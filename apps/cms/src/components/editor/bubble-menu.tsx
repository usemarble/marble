import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { memo } from "react";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

function BubbleMenuComponent() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <TiptapBubbleMenu
      className="flex h-fit w-fit overflow-hidden rounded-md border bg-background p-1 shadow-sm"
      editor={editor}
    >
      <TextButtons />
      <LinkSelector />
    </TiptapBubbleMenu>
  );
}

// Memoize to prevent context cascade rerenders
export const BubbleMenu = memo(BubbleMenuComponent);
