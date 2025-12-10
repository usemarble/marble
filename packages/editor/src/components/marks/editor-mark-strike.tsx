import { useCurrentEditor } from "@tiptap/react";
import { StrikethroughIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorMarkStrikeProps = Pick<EditorButtonProps, "hideName">;

/**
 * Strikethrough Mark Button
 *
 * Button to toggle strikethrough formatting on the selected text.
 * Active when the selection has strikethrough formatting applied.
 *
 * @example
 * ```tsx
 * <EditorMarkStrike />
 * <EditorMarkStrike hideName />
 * ```
 */
export const EditorMarkStrike = ({
  hideName = false,
}: EditorMarkStrikeProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleStrike().run()}
      hideName={hideName}
      icon={StrikethroughIcon}
      isActive={() => editor.isActive("strike") ?? false}
      name="Strikethrough"
    />
  );
};
