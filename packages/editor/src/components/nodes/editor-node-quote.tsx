import { QuotesIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeQuoteProps = Pick<EditorButtonProps, "hideName">;

/**
 * Quote Node Button
 *
 * Button to toggle the current selection to a blockquote (quote block).
 * Active when the selection is within a blockquote.
 *
 * @example
 * ```tsx
 * <EditorNodeQuote />
 * <EditorNodeQuote hideName />
 * ```
 */
export const EditorNodeQuote = ({ hideName = false }: EditorNodeQuoteProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() =>
        editor
          .chain()
          .focus()
          .toggleNode("paragraph", "paragraph")
          .toggleBlockquote()
          .run()
      }
      hideName={hideName}
      icon={QuotesIcon}
      isActive={() => editor.isActive("blockquote") ?? false}
      name="Quote"
    />
  );
};
