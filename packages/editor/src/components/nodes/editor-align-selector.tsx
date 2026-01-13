import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
} from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import { useState } from "react";

export interface EditorAlignSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Alignment = "left" | "center" | "right" | "justify";

const alignments: {
  value: Alignment;
  icon: typeof TextAlignLeft;
  label: string;
}[] = [
  { value: "left", icon: TextAlignLeft, label: "Align Left" },
  { value: "center", icon: TextAlignCenter, label: "Align Center" },
  { value: "right", icon: TextAlignRight, label: "Align Right" },
  { value: "justify", icon: TextAlignJustify, label: "Justify" },
];

/**
 * Align Selector Component
 *
 * A popover component for setting text alignment.
 * Shows alignment options when clicked.
 *
 * @example
 * ```tsx
 * <EditorAlignSelector />
 * <EditorAlignSelector open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export const EditorAlignSelector = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditorAlignSelectorProps) => {
  const { editor } = useCurrentEditor();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalOpen;

  if (!editor) {
    return null;
  }

  const getCurrentAlignment = (): Alignment => {
    for (const alignment of alignments) {
      if (editor.isActive({ textAlign: alignment.value })) {
        return alignment.value;
      }
    }
    return "left";
  };

  const currentAlignment = getCurrentAlignment();
  const CurrentIcon =
    alignments.find((a) => a.value === currentAlignment)?.icon ?? TextAlignLeft;

  const handleAlignmentChange = (alignment: Alignment) => {
    editor.chain().focus().setTextAlign(alignment).run();
    setIsOpen(false);
  };

  return (
    <Popover modal onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger
        render={
          <Button
            className={cn("gap-2 rounded-none border-none")}
            size="sm"
            variant="ghost"
          >
            <CurrentIcon size={12} />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-fit p-1" sideOffset={10}>
        <div className="flex items-center gap-0.5">
          {alignments.map(({ value, icon: Icon, label }) => (
            <Tooltip key={value}>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    className={cn(
                      "h-8 w-8",
                      currentAlignment === value && "text-primary"
                    )}
                    onClick={() => handleAlignmentChange(value)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Icon size={14} />
                  </Button>
                }
              />
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
