/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import {
  EditorProvider as TiptapEditorProvider,
  type EditorProviderProps as TiptapEditorProviderProps,
  type UseEditorOptions,
  useEditor,
} from "@tiptap/react";
import { ExtensionKit } from "../extensions/extension-kit";
import { handleCommandNavigation } from "../extensions/slash-command";

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
  const defaultExtensions = ExtensionKit({ limit, placeholder });

  return (
    <TiptapEditorProvider
      editorProps={{
        handleKeyDown: (_view, event) => {
          handleCommandNavigation(event);
        },
      }}
      extensions={[...defaultExtensions, ...(extensions ?? [])]}
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
 * This is a convenience hook that sets up the editor with ExtensionKit and handleCommandNavigation.
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
  const { limit, placeholder, extensions = [], ...restOptions } = options;
  const defaultExtensions = ExtensionKit({ limit, placeholder });

  return useEditor({
    immediatelyRender: false,
    editorProps: {
      handleKeyDown: (_view, event) => {
        handleCommandNavigation(event);
      },
      ...restOptions.editorProps,
    },
    extensions: [...defaultExtensions, ...extensions],
    ...restOptions,
  });
}

export type UseMarbleEditorOptions = Omit<UseEditorOptions, "extensions"> & {
  limit?: number;
  placeholder?: string;
  extensions?: any[];
};
