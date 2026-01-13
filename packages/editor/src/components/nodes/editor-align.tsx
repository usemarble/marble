import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
} from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

/**
 * Align Left Button
 *
 * Button that aligns text to the left.
 *
 * @example
 * ```tsx
 * <EditorAlignLeft />
 * <EditorAlignLeft hideName />
 * ```
 */
export type EditorAlignProps = Pick<EditorButtonProps, "hideName">;

export const EditorAlignLeft = ({ hideName = true }: EditorAlignProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().setTextAlign("left").run()}
      hideName={hideName}
      icon={TextAlignLeft}
      isActive={() => editor.isActive({ textAlign: "left" }) ?? false}
      name="Align Left"
    />
  );
};

/**
 * Align Center Button
 *
 * Button that centers text.
 *
 * @example
 * ```tsx
 * <EditorAlignCenter />
 * <EditorAlignCenter hideName />
 * ```
 */
export const EditorAlignCenter = ({ hideName = true }: EditorAlignProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().setTextAlign("center").run()}
      hideName={hideName}
      icon={TextAlignCenter}
      isActive={() => editor.isActive({ textAlign: "center" }) ?? false}
      name="Align Center"
    />
  );
};

/**
 * Align Right Button
 *
 * Button that aligns text to the right.
 *
 * @example
 * ```tsx
 * <EditorAlignRight />
 * <EditorAlignRight hideName />
 * ```
 */
export const EditorAlignRight = ({ hideName = true }: EditorAlignProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().setTextAlign("right").run()}
      hideName={hideName}
      icon={TextAlignRight}
      isActive={() => editor.isActive({ textAlign: "right" }) ?? false}
      name="Align Right"
    />
  );
};

/**
 * Justify Button
 *
 * Button that justifies text.
 *
 * @example
 * ```tsx
 * <EditorAlignJustify />
 * <EditorAlignJustify hideName />
 * ```
 */
export const EditorAlignJustify = ({ hideName = true }: EditorAlignProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().setTextAlign("justify").run()}
      hideName={hideName}
      icon={TextAlignJustify}
      isActive={() => editor.isActive({ textAlign: "justify" }) ?? false}
      name="Justify"
    />
  );
};
