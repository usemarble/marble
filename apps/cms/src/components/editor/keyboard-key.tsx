import { cn } from "@marble/ui/lib/utils";
import type { Icon } from "@phosphor-icons/react";

type KeyboardKeyProps = {
  children?: string;
  icon?: Icon;
  className?: string;
};

export function KeyboardKey({
  children,
  icon: IconComponent,
  className,
}: KeyboardKeyProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-medium font-mono text-[10px] shadow-sm",
        className
      )}
    >
      {IconComponent ? (
        <IconComponent className="size-2.5" weight="bold" />
      ) : (
        children
      )}
    </kbd>
  );
}
