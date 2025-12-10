import { useCurrentEditor } from "@tiptap/react";
import { TableIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeTableProps = Pick<EditorButtonProps, "hideName">;

/**
 * Table Node Button
 *
 * Button to insert a new table (3x3 with header row) at the current position.
 * Active when the cursor is inside a table.
 *
 * @example
 * ```tsx
 * <EditorNodeTable />
 * <EditorNodeTable hideName />
 * ```
 */
export const EditorNodeTable = ({ hideName = false }: EditorNodeTableProps) => {
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
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      }
      hideName={hideName}
      icon={TableIcon}
      isActive={() => editor.isActive("table") ?? false}
      name="Table"
    />
  );
};
