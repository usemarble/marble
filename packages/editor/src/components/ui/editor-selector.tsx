import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import { type HTMLAttributes, type ReactNode, useState } from "react";

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
  const [internalOpen, setInternalOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={currentOpen}>
      <PopoverTrigger
        render={
          <Button
            className="gap-2 rounded-none border-none"
            size="sm"
            variant="ghost"
          >
            <span className="whitespace-nowrap font-normal text-xs">
              {title}
            </span>
            <CaretDownIcon size={12} />
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className={cn("w-48 p-1", className)}
        onClick={() => handleOpenChange(false)}
        sideOffset={5}
        {...props}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};
