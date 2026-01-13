import { TextSubscriptIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkSubscriptProps = Pick<EditorButtonProps, "hideName">;

/**
 * Subscript Mark Button
 *
 * Button to toggle subscript formatting on the selected text.
 * Active when the selection has subscript formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkSubscript />
 * <EditorMarkSubscript hideName />
 * ```
 */
export const EditorMarkSubscript = ({
  hideName = false,
}: EditorMarkSubscriptProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleSubscript().run()}
      hideName={hideName}
      icon={TextSubscriptIcon}
      isActive={() => editor.isActive("subscript") ?? false}
      name="Subscript"
    />
  );
};
