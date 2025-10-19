"use client";

import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { memo, useRef } from "react";
import { FloatingPortalProvider } from "@/components/editor/floating-portal-context";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

function BubbleMenuComponent() {
  const { editor } = useCurrentEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!editor) {
    return null;
  }

  return (
    <div className="contents" ref={containerRef}>
      <FloatingPortalProvider container={containerRef.current}>
        <TiptapBubbleMenu
          appendTo={() => document.body}
          className="z-50 flex h-fit w-fit gap-0.5 overflow-hidden rounded-lg border bg-background p-1 shadow-sm"
          editor={editor}
        >
          <TextButtons />
          <LinkSelector />
        </TiptapBubbleMenu>
      </FloatingPortalProvider>
    </div>
  );
}

// Memoize to prevent context cascade rerenders
export const BubbleMenu = memo(BubbleMenuComponent);
