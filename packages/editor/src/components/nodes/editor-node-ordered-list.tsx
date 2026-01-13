import { ListNumbersIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeOrderedListProps = Pick<EditorButtonProps, "hideName">;

/**
 * Ordered List Node Button
 *
 * Button to toggle the current selection to an ordered list (numbered list).
 * Active when the selection is within an ordered list.
 *
 * @example
 * ```tsx
 * <EditorNodeOrderedList />
 * <EditorNodeOrderedList hideName />
 * ```
 */
export const EditorNodeOrderedList = ({
  hideName = false,
}: EditorNodeOrderedListProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleOrderedList().run()}
      hideName={hideName}
      icon={ListNumbersIcon}
      isActive={() => editor.isActive("orderedList") ?? false}
      name="Numbered List"
    />
  );
};
