import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { Highlighter } from "lucide-react";
import { useCallback } from "react";
import type { EditorButtonProps } from "../../types";
import { ColorPicker } from "../color-picker";

export type EditorMarkHighlightProps = Pick<EditorButtonProps, "hideName">;

/**
 * Highlight Mark Button
 *
 * Button that opens a color picker to highlight the selected text.
 * Uses a Popover to display the ColorPicker component.
 * Active when the selection has a highlight color applied.
 *
 * @example
 * ```tsx
 * <EditorMarkHighlight />
 * <EditorMarkHighlight hideName />
 * ```
 */
export const EditorMarkHighlight = ({
  hideName = true,
}: EditorMarkHighlightProps) => {
  const { editor } = useCurrentEditor();

  const currentHighlight = useEditorState({
    editor,
    selector: (ctx) =>
      ctx.editor?.getAttributes("highlight")?.color || undefined,
  });

  const isActive = Boolean(currentHighlight);

  const handleColorChange = useCallback(
    (color: string) => {
      if (!editor) {
        return;
      }
      editor.chain().focus().setHighlight({ color }).run();
    },
    [editor]
  );

  const handleClearHighlight = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  // Check if Highlight extension is available
  const hasHighlightExtension = editor.can().setHighlight({ color: "#000000" });

  if (!hasHighlightExtension) {
    return null;
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            hideName ? "" : "w-full",
            isActive &&
              "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
          )}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Highlighter
            className={cn(
              "shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            size={12}
          />
          {!hideName && <span className="flex-1 text-left">Highlight</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="top"
      >
        <ColorPicker
          color={currentHighlight}
          onChange={handleColorChange}
          onClear={handleClearHighlight}
        />
      </PopoverContent>
    </Popover>
  );
};
