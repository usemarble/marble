import { useCurrentEditor } from "@tiptap/react";
import { Heading3Icon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeHeading3Props = Pick<EditorButtonProps, "hideName">;

/**
 * Heading 3 Node Button
 *
 * Button to toggle the current selection to Heading 3 (small heading).
 * Active when the selection is a heading with level 3.
 *
 * @example
 * ```tsx
 * <EditorNodeHeading3 />
 * <EditorNodeHeading3 hideName />
 * ```
 */
export const EditorNodeHeading3 = ({
  hideName = false,
}: EditorNodeHeading3Props) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      hideName={hideName}
      icon={Heading3Icon}
      isActive={() => editor.isActive("heading", { level: 3 }) ?? false}
      name="Heading 3"
    />
  );
};
