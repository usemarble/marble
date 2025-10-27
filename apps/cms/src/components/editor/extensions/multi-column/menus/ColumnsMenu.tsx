"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { Columns2, PanelLeft, PanelRight } from "lucide-react";
import { type JSX, memo, useCallback } from "react";
import { ColumnLayout } from "../Columns";

type MenuProps = {
  editor: Editor;
  appendTo?: React.RefObject<HTMLElement>;
};

type ShouldShowProps = {
  view: unknown;
  state: unknown;
  from: number;
};

function ColumnsMenuComponent({ editor, appendTo }: MenuProps): JSX.Element {
  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return editor.isActive("columns");
    },
    [editor]
  );

  const onColumnLeft = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarLeft).run();
  }, [editor]);

  const onColumnRight = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarRight).run();
  }, [editor]);

  const onColumnTwo = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.TwoColumn).run();
  }, [editor]);

  const { isColumnLeft, isColumnRight, isColumnTwo } = useEditorState({
    editor,
    selector: (ctx) => ({
      isColumnLeft: ctx.editor.isActive("columns", {
        layout: ColumnLayout.SidebarLeft,
      }),
      isColumnRight: ctx.editor.isActive("columns", {
        layout: ColumnLayout.SidebarRight,
      }),
      isColumnTwo: ctx.editor.isActive("columns", {
        layout: ColumnLayout.TwoColumn,
      }),
    }),
  });

  return (
    <TiptapBubbleMenu
      appendTo={() => appendTo?.current ?? document.body}
      className="z-50 flex h-fit w-fit gap-0.5 overflow-hidden rounded-lg border bg-background p-1 shadow-sm"
      editor={editor}
      options={{
        placement: "top",
        offset: { mainAxis: 18, crossAxis: 0 },
      }}
      pluginKey="columnsMenu"
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
              data-active={isColumnLeft}
              onClick={onColumnLeft}
              size="icon"
              type="button"
              variant="ghost"
            >
              <PanelLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sidebar left</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
              data-active={isColumnTwo}
              onClick={onColumnTwo}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Columns2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Two columns</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
              data-active={isColumnRight}
              onClick={onColumnRight}
              size="icon"
              type="button"
              variant="ghost"
            >
              <PanelRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sidebar right</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TiptapBubbleMenu>
  );
}

export const ColumnsMenu = memo(ColumnsMenuComponent);
export default ColumnsMenu;
