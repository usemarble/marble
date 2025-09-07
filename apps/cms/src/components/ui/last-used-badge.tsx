import { Badge, type badgeVariants } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const lastUsedBadgePositions = cva("absolute", {
  variants: {
    position: {
      "top-right": "-top-2 -right-2",
      "top-left": "-top-2 -left-2",
    },
  },
  defaultVariants: {
    position: "top-right",
  },
});

export interface LastUsedBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants>,
    VariantProps<typeof lastUsedBadgePositions> {
  show?: boolean;
  text?: string;
}

export function LastUsedBadge({
  className,
  variant = "default",
  position = "top-right",
  show = false,
  text,
  ...props
}: LastUsedBadgeProps) {
  if (!show) return null;

  return (
    <Badge
      variant={variant}
      className={cn(
        lastUsedBadgePositions({ position }),
        "px-1.5 py-0 text-[11px] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {text ?? "Last Used"}
    </Badge>
  );
}
