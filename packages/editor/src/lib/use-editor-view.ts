import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { useEffect, useState } from "react";

/**
 * The editor's ProseMirror view, or null until it is mounted. Tiptap hands out
 * a placeholder view before `EditorContent` mounts the real one, and reading
 * `view.dom` from the placeholder throws.
 */
export function getMountedView(editor: Editor | null): EditorView | null {
  if (!editor || editor.isDestroyed) {
    return null;
  }

  try {
    return editor.view.dom ? editor.view : null;
  } catch {
    return null;
  }
}

export function useMountedEditorView(editor: Editor | null) {
  const [view, setView] = useState<EditorView | null>(() =>
    getMountedView(editor)
  );

  useEffect(() => {
    const sync = () => setView(getMountedView(editor));

    sync();

    if (!editor) {
      return;
    }

    editor.on("mount", sync);
    editor.on("unmount", sync);

    return () => {
      editor.off("mount", sync);
      editor.off("unmount", sync);
    };
  }, [editor]);

  return view;
}
