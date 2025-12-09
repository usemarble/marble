import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import { ChevronDownIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

export type EditorSelectorProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  children?: ReactNode;
};

/**
 * Editor Selector Component
 *
 * A popover-based selector that groups related editor buttons together.
 * Displays a button with a title and dropdown arrow that opens a popover
 * containing child components (typically editor node or mark buttons).
 *
 * @example
 * ```tsx
 * <EditorSelector title="Text">
 *   <EditorNodeHeading1 />
 *   <EditorNodeHeading2 />
 *   <EditorNodeHeading3 />
 * </EditorSelector>
 * ```
 */
export const EditorSelector = ({
  open,
  onOpenChange,
  title,
  className,
  children,
  ...props
}: EditorSelectorProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        render={
          <Button
            className="gap-2 rounded-none border-none"
            size="sm"
            variant="ghost"
          />
        }
      >
        <span className="whitespace-nowrap text-xs">{title}</span>
        <ChevronDownIcon size={12} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-48 p-1", className)}
        sideOffset={5}
        {...props}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};
