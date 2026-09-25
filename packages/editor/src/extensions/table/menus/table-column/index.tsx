import { Button } from "@marble/ui/components/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { type JSX, memo, useCallback, useMemo } from "react";
import { isColumnGripSelected } from "./utils";

interface MenuProps {
  editor: Editor;
  appendTo?: React.RefObject<HTMLElement>;
  /**
   * The element the editor scrolls in, so the menu follows the table instead
   * of staying put when that element scrolls.
   */
  scrollTarget?: HTMLElement | null;
}

interface ShouldShowProps {
  view: unknown;
  state: unknown;
  from: number;
}

function TableColumnMenuComponent({
  editor,
  appendTo,
  scrollTarget,
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

  // Stable identities: the bubble menu re-sends its options to the plugin
  // whenever these change.
  const getAppendTarget = useCallback(
    () => appendTo?.current ?? document.body,
    [appendTo]
  );
  const options = useMemo(
    () => ({
      placement: "top" as const,
      offset: { mainAxis: 24, crossAxis: 0 },
      scrollTarget: scrollTarget ?? undefined,
    }),
    [scrollTarget]
  );

  return (
    <TiptapBubbleMenu
      appendTo={getAppendTarget}
      className="z-50 flex flex-col items-center gap-0.5 overflow-hidden rounded-lg border bg-background p-1 shadow-sm"
      editor={editor}
      options={options}
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
        <TrashIcon className="size-4" />
        <span>Delete column</span>
      </Button>
    </TiptapBubbleMenu>
  );
}

export const TableColumnMenu = memo(TableColumnMenuComponent);
TableColumnMenu.displayName = "TableColumnMenu";

export default TableColumnMenu;
