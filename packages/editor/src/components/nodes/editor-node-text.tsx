import { useCurrentEditor } from "@tiptap/react";
import { TextIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeTextProps = Pick<EditorButtonProps, "hideName">;

/**
 * Text Node Button
 *
 * Button to toggle the current selection to plain text (paragraph) format.
 * Active when the selection is not a heading, list, or other block node.
 *
 * @example
 * ```tsx
 * <EditorNodeText />
 * <EditorNodeText hideName />
 * ```
 */
export const EditorNodeText = ({ hideName = false }: EditorNodeTextProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() =>
        editor.chain().focus().toggleNode("paragraph", "paragraph").run()
      }
      hideName={hideName}
      icon={TextIcon}
      isActive={() =>
        (editor &&
          !editor.isActive("paragraph") &&
          !editor.isActive("bulletList") &&
          !editor.isActive("orderedList")) ??
        false
      }
      name="Text"
    />
  );
};
