import { EditorBubble } from "novel";
import React from "react";
import { TextButtons } from "./text-buttons";
import { LinkSelector } from "./link-selector";

function BubbleMenu() {
  return (
    <EditorBubble className="flex w-fit overflow-hidden rounded border bg-background shadow">
      <TextButtons />
      <LinkSelector />
    </EditorBubble>
  );
}

export default BubbleMenu;
