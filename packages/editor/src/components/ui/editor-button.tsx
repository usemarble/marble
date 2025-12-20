import { Button } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import { CheckIcon, RemoveFormattingIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";

/**
 * Base Button Component for Editor Toolbar
 * Used in BubbleMenu and other UI components
 */
export const BubbleMenuButton = ({
  name,
  isActive,
  command,
  icon: Icon,
  hideName,
}: EditorButtonProps) => (
  <Button
    className={cn("flex gap-4", hideName ? "" : "w-full")}
    onClick={() => command()}
    size="sm"
    variant="ghost"
  >
    <Icon className="shrink-0" size={12} />
    {!hideName && <span className="flex-1 text-left">{name}</span>}
    {isActive() ? <CheckIcon className="shrink-0" size={12} /> : null}
  </Button>
);

/**
 * Clear Formatting Button
 *
 * Button that removes all formatting (marks and node styles) from the selected text.
 * Resets the selection to plain text/paragraph format.
 *
 * @example
 * ```tsx
 * <EditorClearFormatting />
 * <EditorClearFormatting hideName />
 * ```
 */
export type EditorClearFormattingProps = Pick<EditorButtonProps, "hideName">;

export const EditorClearFormatting = ({
  hideName = true,
}: EditorClearFormattingProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      hideName={hideName}
      icon={RemoveFormattingIcon}
      isActive={() => false}
      name="Clear Formatting"
    />
  );
};
