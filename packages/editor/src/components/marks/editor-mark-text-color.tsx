import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { Palette } from "lucide-react";
import { useCallback } from "react";
import type { EditorButtonProps } from "../../types";
import { ColorPicker } from "../color-picker";

export type EditorMarkTextColorProps = Pick<EditorButtonProps, "hideName">;

/**
 * Text Color Mark Button
 *
 * Button that opens a color picker to change the text color of the selected text.
 * Uses a Popover to display the ColorPicker component.
 * Active when the selection has a text color applied.
 *
 * @example
 * ```tsx
 * <EditorMarkTextColor />
 * <EditorMarkTextColor hideName />
 * ```
 */
export const EditorMarkTextColor = ({
  hideName = true,
}: EditorMarkTextColorProps) => {
  const { editor } = useCurrentEditor();

  const currentColor = useEditorState({
    editor,
    selector: (ctx) =>
      ctx.editor?.getAttributes("textStyle")?.color || undefined,
  });

  const isActive = Boolean(currentColor);

  const handleColorChange = useCallback(
    (color: string) => {
      if (!editor) {
        return;
      }
      editor.chain().focus().setColor(color).run();
    },
    [editor]
  );

  const handleClearColor = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.chain().focus().unsetColor().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  // Check if Color extension is available
  const hasColorExtension = editor.can().setColor("#000000");

  if (!hasColorExtension) {
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
          <Palette
            className={cn("shrink-0", isActive && "text-primary")}
            size={12}
          />
          {!hideName && <span className="flex-1 text-left">Text Color</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="top"
      >
        <ColorPicker
          color={currentColor}
          onChange={handleColorChange}
          onClear={handleClearColor}
        />
      </PopoverContent>
    </Popover>
  );
};
