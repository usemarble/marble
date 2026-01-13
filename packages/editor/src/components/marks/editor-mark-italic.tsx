import { TextItalicIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkItalicProps = Pick<EditorButtonProps, "hideName">;

/**
 * Italic Mark Button
 *
 * Button to toggle italic formatting on the selected text.
 * Active when the selection has italic formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkItalic />
 * <EditorMarkItalic hideName />
 * ```
 */
export const EditorMarkItalic = ({
  hideName = false,
}: EditorMarkItalicProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleItalic().run()}
      hideName={hideName}
      icon={TextItalicIcon}
      isActive={() => editor.isActive("italic") ?? false}
      name="Italic"
    />
  );
};
