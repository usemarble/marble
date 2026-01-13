import { TextTSlashIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui";

/**
 * Clear Formatting Button
 *
 * Button that removes all formatting (marks and node styles) from the selected text.
 * Resets the selection to plain text/paragraph format.
 *
 * @example
 * ```tsx
 * <EditorClearFormatting />
 * <EditorClearFormatting hideName />
 * ```
 */
export type EditorClearFormattingProps = Pick<EditorButtonProps, "hideName">;

export const EditorClearFormatting = ({
  hideName = true,
}: EditorClearFormattingProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      hideName={hideName}
      icon={TextTSlashIcon}
      isActive={() => false}
      name="Clear Formatting"
    />
  );
};
