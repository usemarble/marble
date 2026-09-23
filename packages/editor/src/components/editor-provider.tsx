/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import type { AnyExtension } from "@tiptap/core";
import {
  EditorProvider as TiptapEditorProvider,
  type EditorProviderProps as TiptapEditorProviderProps,
  type UseEditorOptions,
  useEditor,
} from "@tiptap/react";
import { useMemo } from "react";
import { ExtensionKit } from "../extensions/extension-kit";

/**
 * The default kit merged with any overrides, rebuilt only when its inputs
 * change. `useEditor` compares extensions by identity on every render and
 * calls `editor.setOptions()` when they differ, which re-runs every plugin
 * view, so a fresh kit per render makes each keystroke that re-renders the
 * host pay for it. Pass a stable (memoised) `extensions` array to benefit.
 */
function useEditorExtensions(
  extensions: AnyExtension[] | undefined,
  limit: number | undefined,
  placeholder: string | undefined
) {
  return useMemo(
    () =>
      deduplicateExtensions(
        ExtensionKit({ limit, placeholder }),
        extensions ?? []
      ),
    [extensions, limit, placeholder]
  );
}

function deduplicateExtensions(
  defaults: AnyExtension[],
  overrides: AnyExtension[]
): AnyExtension[] {
  const overrideNames = new Set(overrides.map((ext) => ext.name));
  return [
    ...defaults.filter((ext) => !overrideNames.has(ext.name)),
    ...overrides,
  ];
}

export type EditorProviderProps = Omit<
  TiptapEditorProviderProps,
  "extensions"
> & {
  limit?: number;
  placeholder?: string;
  extensions?: any[];
};

/**
 * Editor Provider Component
 *
 * The root component that wraps the Tiptap editor with default extensions and configuration.
 * Provides the editor context to all child components. Use this as the wrapper for your
 * editor content and menus.
 *
 *
 * @example
 * ```tsx
 * <EditorProvider
 *   className="border rounded-lg p-4"
 *   content={content}
 *   onUpdate={handleUpdate}
 *   placeholder="Start typing..."
 * >
 *   <EditorBubbleMenu>...</EditorBubbleMenu>
 *   <EditorContent editor={editor} />
 * </EditorProvider>
 * ```
 */
export const EditorProvider = ({
  extensions,
  limit,
  placeholder,
  onUpdate,
  ...props
}: EditorProviderProps) => {
  const editorExtensions = useEditorExtensions(extensions, limit, placeholder);

  return (
    <TiptapEditorProvider
      extensions={editorExtensions}
      immediatelyRender={false}
      onUpdate={onUpdate}
      {...props}
    />
  );
};

// biome-ignore lint/performance/noBarrelFile: Re-exporting TipTap hooks for convenience
export { EditorContext, useCurrentEditor, useEditor } from "@tiptap/react";

/**
 * Hook to create a Marble editor instance with default extensions and configuration.
 * This is a convenience hook that sets up the editor with ExtensionKit.
 *
 * Use this with EditorContext.Provider to avoid layout issues:
 *
 * @example
 * ```tsx
 * const editor = useMarbleEditor({
 *   content: "<p>Hello</p>",
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getHTML());
 *   },
 * });
 *
 * return (
 *   <EditorContext.Provider value={{ editor }}>
 *     <EditorContent />
 *     <EditorSidebar />
 *   </EditorContext.Provider>
 * );
 * ```
 */
export function useMarbleEditor(options: UseMarbleEditorOptions) {
  const { limit, placeholder, extensions, ...restOptions } = options;
  const editorExtensions = useEditorExtensions(extensions, limit, placeholder);

  return useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    ...restOptions,
  });
}

export type UseMarbleEditorOptions = Omit<UseEditorOptions, "extensions"> & {
  limit?: number;
  placeholder?: string;
  extensions?: any[];
};
