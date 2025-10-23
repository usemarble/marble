"use client";

import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { memo, useCallback, useRef } from "react";
import { FloatingPortalProvider } from "@/components/editor/floating-portal-context";
import { isColumnGripSelected } from "./extensions/table/menus/TableColumn/utils";
import { isRowGripSelected } from "./extensions/table/menus/TableRow/utils";
import { LinkSelector } from "./link-selector";
import { TextButtons } from "./text-buttons";

function BubbleMenuComponent() {
  const { editor } = useCurrentEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldShow = useCallback(
    ({
      view,
      state,
      from,
    }: {
      view: unknown;
      state: unknown;
      from: number;
    }) => {
      if (!editor || !state) {
        return false;
      }

      // Hide bubble menu if table row or column grip is selected
      const isRowGrip = isRowGripSelected({
        editor,
        view,
        state,
        from,
      } as Parameters<typeof isRowGripSelected>[0]);

      const isColumnGrip = isColumnGripSelected({
        editor,
        view,
        state,
        from: from || 0,
      } as Parameters<typeof isColumnGripSelected>[0]);

      if (isRowGrip || isColumnGrip) {
        return false;
      }

      // Show for normal text selection
      return !editor.state.selection.empty;
    },
    [editor]
  );

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
          shouldShow={shouldShow}
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
