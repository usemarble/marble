import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

export function BubbleMenu() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="flex h-fit w-fit overflow-hidden rounded-md border bg-background p-1 shadow-sm"
    >
      <TextButtons />
      <LinkSelector />
    </TiptapBubbleMenu>
  );
}
