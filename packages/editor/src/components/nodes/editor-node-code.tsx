import { CodeIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeCodeProps = Pick<EditorButtonProps, "hideName">;

/**
 * Code Block Node Button
 *
 * Button to toggle the current selection to a code block (syntax-highlighted code).
 * Active when the selection is within a code block.
 *
 * @example
 * ```tsx
 * <EditorNodeCode />
 * <EditorNodeCode hideName />
 * ```
 */
export const EditorNodeCode = ({ hideName = false }: EditorNodeCodeProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleCodeBlock().run()}
      hideName={hideName}
      icon={CodeIcon}
      isActive={() => editor.isActive("codeBlock") ?? false}
      name="Code"
    />
  );
};
