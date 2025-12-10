import { useCurrentEditor } from "@tiptap/react";
import { BoldIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkBoldProps = Pick<EditorButtonProps, "hideName">;

/**
 * Bold Mark Button
 *
 * Button to toggle bold formatting on the selected text.
 * Active when the selection has bold formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkBold />
 * <EditorMarkBold hideName />
 * ```
 */
export const EditorMarkBold = ({ hideName = false }: EditorMarkBoldProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleBold().run()}
      hideName={hideName}
      icon={BoldIcon}
      isActive={() => editor.isActive("bold") ?? false}
      name="Bold"
    />
  );
};
