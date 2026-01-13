import { TextHOneIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeHeading1Props = Pick<EditorButtonProps, "hideName">;

/**
 * Heading 1 Node Button
 *
 * Button to toggle the current selection to Heading 1 (largest heading).
 * Active when the selection is a heading with level 1.
 *
 * @example
 * ```tsx
 * <EditorNodeHeading1 />
 * <EditorNodeHeading1 hideName />
 * ```
 */
export const EditorNodeHeading1 = ({
  hideName = false,
}: EditorNodeHeading1Props) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      hideName={hideName}
      icon={TextHOneIcon}
      isActive={() => editor.isActive("heading", { level: 1 }) ?? false}
      name="Heading 1"
    />
  );
};
