import { Button } from "@marble/ui/components/button";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { type JSX, memo, useCallback } from "react";
import { isRowGripSelected } from "./utils";

type MenuProps = {
  editor: Editor;
  appendTo?: React.RefObject<HTMLElement>;
};

type ShouldShowProps = {
  view: EditorView;
  state: EditorState;
  from: number;
};

function TableRowMenuComponent({ editor, appendTo }: MenuProps): JSX.Element {
  const shouldShow = useCallback(
    ({ view, state, from }: ShouldShowProps) => {
      if (!state || !from) {
        return false;
      }

      return isRowGripSelected({ editor, view, state, from } as Parameters<
        typeof isRowGripSelected
      >[0]);
    },
    [editor]
  );

  const onAddRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const onAddRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const onDeleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  return (
    <TiptapBubbleMenu
      appendTo={() => appendTo?.current ?? document.body}
      className="flex flex-col gap-0.5 overflow-hidden rounded-lg border bg-background p-1 shadow-sm"
      editor={editor}
      options={{
        placement: "left",
        offset: { mainAxis: 24, crossAxis: 0 },
      }}
      pluginKey="tableRowMenu"
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <Button
        className="justify-start gap-2"
        onClick={onAddRowBefore}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ArrowUpIcon className="size-4" />
        <span>Add row before</span>
      </Button>

      <Button
        className="justify-start gap-2"
        onClick={onAddRowAfter}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ArrowDownIcon className="size-4" />
        <span>Add row after</span>
      </Button>

      <Button
        className="justify-start gap-2"
        onClick={onDeleteRow}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon className="size-4" />
        <span>Delete row</span>
      </Button>
    </TiptapBubbleMenu>
  );
}

export const TableRowMenu = memo(TableRowMenuComponent);
TableRowMenu.displayName = "TableRowMenu";

export default TableRowMenu;
