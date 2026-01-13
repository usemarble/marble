import { TextUnderlineIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkUnderlineProps = Pick<EditorButtonProps, "hideName">;

/**
 * Underline Mark Button
 *
 * Button to toggle underline formatting on the selected text.
 * Active when the selection has underline formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkUnderline />
 * <EditorMarkUnderline hideName />
 * ```
 */
export const EditorMarkUnderline = ({
  hideName = false,
}: EditorMarkUnderlineProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleUnderline().run()}
      hideName={hideName}
      icon={TextUnderlineIcon}
      isActive={() => editor.isActive("underline") ?? false}
      name="Underline"
    />
  );
};
