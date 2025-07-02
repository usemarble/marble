import { EditorBubble } from "novel";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

function BubbleMenu() {
  return (
    <EditorBubble className="flex w-fit overflow-hidden rounded border bg-background shadow">
      <TextButtons />
      <LinkSelector />
    </EditorBubble>
  );
}

export default BubbleMenu;
