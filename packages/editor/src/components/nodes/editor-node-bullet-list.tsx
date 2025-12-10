import { useCurrentEditor } from "@tiptap/react";
import { ListIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeBulletListProps = Pick<EditorButtonProps, "hideName">;

/**
 * Bullet List Node Button
 *
 * Button to toggle the current selection to a bullet list (unordered list).
 * Active when the selection is within a bullet list.
 *
 * @example
 * ```tsx
 * <EditorNodeBulletList />
 * <EditorNodeBulletList hideName />
 * ```
 */
export const EditorNodeBulletList = ({
  hideName = false,
}: EditorNodeBulletListProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleBulletList().run()}
      hideName={hideName}
      icon={ListIcon}
      isActive={() => editor.isActive("bulletList") ?? false}
      name="Bullet List"
    />
  );
};
