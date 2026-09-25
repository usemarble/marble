import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import {
  FloatingMenu as TiptapFloatingMenu,
  type FloatingMenuProps as TiptapFloatingMenuProps,
} from "@tiptap/react/menus";

export type EditorFloatingMenuProps = Omit<TiptapFloatingMenuProps, "editor">;

/**
 * Floating Menu Component
 * Shows formatting options on empty lines
 * Updated for Tiptap v3 with Floating UI
 */
export const EditorFloatingMenu = ({
  className,
  ...props
}: EditorFloatingMenuProps) => {
  const { editor } = useCurrentEditor();

  return (
    <TiptapFloatingMenu
      // Above the drag handle (z-40), which shares this container.
      className={cn("z-50 flex items-center bg-secondary", className)}
      editor={editor ?? null}
      {...props}
    />
  );
};
