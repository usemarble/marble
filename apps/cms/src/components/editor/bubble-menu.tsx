import { EditorBubble } from "novel";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

export function BubbleMenu() {
  return (
    <EditorBubble className="flex h-fit w-fit overflow-hidden rounded-md border bg-background p-1 shadow-sm">
      <TextButtons />
      <LinkSelector />
    </EditorBubble>
  );
}
