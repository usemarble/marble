/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import {
  BubbleMenu as TiptapBubbleMenu,
  type BubbleMenuProps as TiptapBubbleMenuProps,
} from "@tiptap/react/menus";
import { useCallback } from "react";
import { isCustomNodeSelected, isTextSelected } from "../../lib";

export type EditorBubbleMenuProps = Omit<TiptapBubbleMenuProps, "editor">;

/**
 * Bubble Menu Component
 *
 * A floating menu that appears when text is selected in the editor.
 * Displays formatting options like text styles, marks, and other tools.
 * Automatically positions itself above the selected text using Floating UI.
 *
 * The menu will not appear when custom nodes (like YouTube embeds, code blocks, etc.) are selected.
 *
 * @example
 * ```tsx
 * <EditorBubbleMenu>
 *   <EditorSelector title="Text">
 *     <EditorNodeHeading1 />
 *   </EditorSelector>
 *   <EditorMarkBold />
 * </EditorBubbleMenu>
 * ```
 */
export const EditorBubbleMenu = ({
  className,
  children,
  shouldShow: customShouldShow,
  ...props
}: EditorBubbleMenuProps) => {
  const { editor } = useCurrentEditor();

  const shouldShow = useCallback(
    (
      props: Parameters<NonNullable<TiptapBubbleMenuProps["shouldShow"]>>[0]
    ) => {
      if (!editor || !props.view || editor.view.dragging) {
        return false;
      }

      // If a custom shouldShow is provided, check it first
      if (customShouldShow) {
        const customResult = customShouldShow(props);
        if (!customResult) {
          return false;
        }
      }

      const fromPos = props.from ?? 0;
      const domAtPos = props.view.domAtPos(fromPos).node as HTMLElement | null;
      const nodeDOM = props.view.nodeDOM(fromPos) as HTMLElement | null;
      const node = nodeDOM ?? domAtPos;

      // Don't show bubble menu if a custom node is selected
      if (isCustomNodeSelected(editor, node)) {
        return false;
      }

      // Only show if text is actually selected
      return isTextSelected({ editor });
    },
    [editor, customShouldShow]
  );

  return (
    <TiptapBubbleMenu
      className={cn(
        "flex rounded-xl border bg-background p-1 shadow",
        "[&>*:first-child]:rounded-l-[9px]",
        "[&>*:last-child]:rounded-r-[9px]",
        className
      )}
      editor={editor ?? undefined}
      shouldShow={shouldShow}
      {...props}
    >
      {children}
    </TiptapBubbleMenu>
  );
};
