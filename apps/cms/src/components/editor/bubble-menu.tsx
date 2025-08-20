import { EditorBubble } from "novel";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

export function BubbleMenu() {
  return (
    <EditorBubble className="flex w-fit overflow-hidden rounded border bg-background shadow-sm">
      <TextButtons />
      <LinkSelector />
    </EditorBubble>
  );
}
