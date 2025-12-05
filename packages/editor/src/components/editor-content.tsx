import {
  EditorContent as TiptapEditorContent,
  useCurrentEditor,
} from "@tiptap/react";

/**
 * EditorContent Component
 *
 * Component that renders the actual editor content area.
 * This is the EditorContent component from @tiptap/react - the main editable area
 * where users type and edit content.
 *
 */
export function EditorContent() {
  const { editor } = useCurrentEditor();
  if (!editor) {
    return null;
  }
  return <TiptapEditorContent editor={editor} />;
}
