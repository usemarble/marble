import { useCurrentEditor } from "@tiptap/react";
import { CodeIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkCodeProps = Pick<EditorButtonProps, "hideName">;

/**
 * Inline Code Mark Button
 *
 * Button to toggle inline code formatting on the selected text (monospace font).
 * Active when the selection has inline code formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkCode />
 * <EditorMarkCode hideName />
 * ```
 */
export const EditorMarkCode = ({ hideName = false }: EditorMarkCodeProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleCode().run()}
      hideName={hideName}
      icon={CodeIcon}
      isActive={() => editor.isActive("code") ?? false}
      name="Code"
    />
  );
};
