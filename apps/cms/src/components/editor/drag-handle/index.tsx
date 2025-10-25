"use client";

import { offset } from "@floating-ui/dom";
import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import {
  Close as PopoverClose,
  Content as PopoverContent,
  Root as PopoverRoot,
  Trigger as PopoverTrigger,
} from "@radix-ui/react-popover";
import { DragHandle as TiptapDragHandle } from "@tiptap/extension-drag-handle-react";
import type { Editor } from "@tiptap/react";
import {
  Clipboard,
  Copy,
  GripVertical,
  Plus,
  RemoveFormatting,
  Trash2,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useDragActions } from "./hooks/use-drag-actions";
import { useDragData } from "./hooks/use-drag-data";

export type DragHandleProps = {
  editor: Editor;
};

function DragHandleComponent({ editor }: DragHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const data = useDragData();
  const actions = useDragActions(editor, data.currentNode, data.currentNodePos);

  useEffect(() => {
    if (menuOpen) {
      editor.commands.setMeta("lockDragHandle", true);
    } else {
      editor.commands.setMeta("lockDragHandle", false);
    }
  }, [menuOpen, editor]);

  // Don't render until editor view is fully initialized
  if (!editor?.view?.dom) {
    return null;
  }

  return (
    <TiptapDragHandle
      computePositionConfig={{
        placement: "left",
        strategy: "absolute",
        middleware: [
          offset({
            mainAxis: 10,
            crossAxis: 0,
          }),
        ],
      }}
      editor={editor}
      onNodeChange={data.handleNodeChange}
      pluginKey="contentItemMenu"
    >
      <div className="flex items-center gap-0.5">
        <Button
          className="size-8 cursor-grab active:cursor-grabbing"
          onClick={actions.handleAdd}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Plus className="size-4" />
        </Button>

        <PopoverRoot onOpenChange={setMenuOpen} open={menuOpen}>
          <PopoverTrigger asChild>
            <Button
              className="size-8 cursor-grab active:cursor-grabbing"
              size="icon"
              type="button"
              variant="ghost"
            >
              <GripVertical className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="z-50 min-w-[16rem] rounded-lg border bg-background p-2 shadow-md"
            side="bottom"
            sideOffset={8}
          >
            <div className="flex flex-col">
              <PopoverClose asChild>
                <Button
                  className="justify-start gap-2"
                  onClick={actions.resetTextFormatting}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <RemoveFormatting className="size-4" />
                  <span>Clear formatting</span>
                </Button>
              </PopoverClose>

              <PopoverClose asChild>
                <Button
                  className="justify-start gap-2"
                  onClick={actions.copyNodeToClipboard}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Clipboard className="size-4" />
                  <span>Copy to clipboard</span>
                </Button>
              </PopoverClose>

              <PopoverClose asChild>
                <Button
                  className="justify-start gap-2"
                  onClick={actions.duplicateNode}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-4" />
                  <span>Duplicate</span>
                </Button>
              </PopoverClose>

              <Separator className="my-2" />

              <PopoverClose asChild>
                <Button
                  className="justify-start gap-2 text-destructive hover:bg-destructive/10"
                  onClick={actions.deleteNode}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                  <span>Delete</span>
                </Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </div>
    </TiptapDragHandle>
  );
}

// Memoize to prevent unnecessary re-renders that cause plugin unregister/register cycles
export const DragHandle = memo(DragHandleComponent);
