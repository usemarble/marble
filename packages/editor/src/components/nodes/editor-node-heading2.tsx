import { TextHTwoIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeHeading2Props = Pick<EditorButtonProps, "hideName">;

/**
 * Heading 2 Node Button
 *
 * Button to toggle the current selection to Heading 2 (medium heading).
 * Active when the selection is a heading with level 2.
 *
 * @example
 * ```tsx
 * <EditorNodeHeading2 />
 * <EditorNodeHeading2 hideName />
 * ```
 */
export const EditorNodeHeading2 = ({
  hideName = false,
}: EditorNodeHeading2Props) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      hideName={hideName}
      icon={TextHTwoIcon}
      isActive={() => editor.isActive("heading", { level: 2 }) ?? false}
      name="Heading 2"
    />
  );
};
