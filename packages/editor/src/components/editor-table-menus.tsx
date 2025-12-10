import { useCurrentEditor } from "@tiptap/react";
import { TableColumnMenu, TableRowMenu } from "../extensions/table";

/**
 * EditorTableMenus Component
 *
 * Component that renders table row and column menus.
 * These menus appear when clicking on table grip handles (row grips on the left,
 * column grips on the top) and allow users to add/remove rows and columns.
 *
 * The menus are automatically shown/hidden based on which grip handle is selected.
 * This component handles the editor instance check internally.
 *
 * @example
 * ```tsx
 * <EditorProvider>
 *   <EditorContent />
 *   <EditorTableMenus />
 * </EditorProvider>
 * ```
 */
export function EditorTableMenus() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <>
      <TableRowMenu editor={editor} />
      <TableColumnMenu editor={editor} />
    </>
  );
}
