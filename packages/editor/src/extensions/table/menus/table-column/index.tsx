import { Button } from "@marble/ui/components/button";
import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { ArrowLeftIcon, ArrowRightIcon, Trash2Icon } from "lucide-react";
import { type JSX, memo, useCallback } from "react";
import { isColumnGripSelected } from "./utils";

type MenuProps = {
  editor: Editor;
  appendTo?: React.RefObject<HTMLElement>;
};

type ShouldShowProps = {
  view: unknown;
  state: unknown;
  from: number;
};

function TableColumnMenuComponent({
  editor,
  appendTo,
}: MenuProps): JSX.Element {
  const shouldShow = useCallback(
    ({ view, state, from }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return isColumnGripSelected({
        editor,
        view,
        state,
        from: from || 0,
      } as Parameters<typeof isColumnGripSelected>[0]);
    },
    [editor]
  );

  const onAddColumnBefore = useCallback(() => {
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const onAddColumnAfter = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const onDeleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  return (
    <TiptapBubbleMenu
      appendTo={() => appendTo?.current ?? document.body}
      className="flex flex-col items-center gap-0.5 overflow-hidden rounded-lg border bg-background p-1 shadow-sm"
      editor={editor}
      options={{
        placement: "top",
        offset: { mainAxis: 24, crossAxis: 0 },
      }}
      pluginKey="tableColumnMenu"
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <Button
        className="w-full justify-start gap-2"
        onClick={onAddColumnBefore}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ArrowLeftIcon className="size-4" />
        <span>Add column before</span>
      </Button>

      <Button
        className="w-full justify-start gap-2"
        onClick={onAddColumnAfter}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ArrowRightIcon className="size-4" />
        <span>Add column after</span>
      </Button>

      <Button
        className="w-full justify-start gap-2"
        onClick={onDeleteColumn}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon className="size-4" />
        <span>Delete column</span>
      </Button>
    </TiptapBubbleMenu>
  );
}

export const TableColumnMenu = memo(TableColumnMenuComponent);
TableColumnMenu.displayName = "TableColumnMenu";

export default TableColumnMenu;
