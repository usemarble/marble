import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import type { ReactNode } from "react";

export interface EditorCharacterCountProps {
  children: ReactNode;
  className?: string;
}

/**
 * Character Count Component
 *
 * Displays character or word count statistics for the editor content.
 * Provides two variants: Characters and Words.
 *
 * @example
 * ```tsx
 * <EditorCharacterCount.Words>Words: </EditorCharacterCount.Words>
 * <EditorCharacterCount.Characters>Characters: </EditorCharacterCount.Characters>
 * ```
 */
export const EditorCharacterCount = {
  Characters({ children, className }: EditorCharacterCountProps) {
    const { editor } = useCurrentEditor();

    if (!editor) {
      return null;
    }

    return (
      <div
        className={cn(
          "absolute right-4 bottom-4 rounded-md border bg-background p-2 text-muted-foreground text-sm shadow",
          className
        )}
      >
        {children}
        {editor.storage.characterCount.characters()}
      </div>
    );
  },

  Words({ children, className }: EditorCharacterCountProps) {
    const { editor } = useCurrentEditor();

    if (!editor) {
      return null;
    }

    return (
      <div
        className={cn(
          "absolute right-4 bottom-4 rounded-md border bg-background p-2 text-muted-foreground text-sm shadow",
          className
        )}
      >
        {children}
        {editor.storage.characterCount.words()}
      </div>
    );
  },
};
