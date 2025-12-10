import { useCurrentEditor } from "@tiptap/react";
import { SuperscriptIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkSuperscriptProps = Pick<EditorButtonProps, "hideName">;

/**
 * Superscript Mark Button
 *
 * Button to toggle superscript formatting on the selected text.
 * Active when the selection has superscript formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkSuperscript />
 * <EditorMarkSuperscript hideName />
 * ```
 */
export const EditorMarkSuperscript = ({
  hideName = false,
}: EditorMarkSuperscriptProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleSuperscript().run()}
      hideName={hideName}
      icon={SuperscriptIcon}
      isActive={() => editor.isActive("superscript") ?? false}
      name="Superscript"
    />
  );
};
