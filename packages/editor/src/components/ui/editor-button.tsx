import { Button } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import { CheckIcon } from "@phosphor-icons/react";
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
    <Icon className={cn("shrink-0", isActive() && "text-primary")} size={12} />
    {!hideName && <span className="flex-1 text-left">{name}</span>}
    {!hideName && isActive() ? (
      <CheckIcon className="shrink-0" size={12} />
    ) : null}
  </Button>
);
