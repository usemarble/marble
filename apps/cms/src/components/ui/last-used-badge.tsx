import { Badge, type badgeVariants } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const lastUsedBadgePositions = {
  "top-right": "-top-2 -right-2",
  "top-left": "-top-2 -left-2",
} as const;

type PositionVariant = keyof typeof lastUsedBadgePositions;

export type LastUsedBadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    position?: PositionVariant;
    show?: boolean;
    text?: string;
  };

export function LastUsedBadge({
  className,
  variant = "default",
  position = "top-right",
  show = false,
  text,
  ...props
}: LastUsedBadgeProps) {
  if (!show) {
    return null;
  }

  return (
    <Badge
      className={cn(
        "absolute",
        lastUsedBadgePositions[position],
        "px-1.5 py-0 text-[11px] backdrop-blur-sm",
        className
      )}
      variant={variant}
      {...props}
    >
      {text ?? "Last Used"}
    </Badge>
  );
}
