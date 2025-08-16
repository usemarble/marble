import { cn } from "@marble/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const lastUsedBadgeVariants = cva(
  "absolute text-xs px-1.5 py-0.5 rounded-full font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-primary-foreground text-primary",
      },
      position: {
        "top-right": "-top-2 -right-2",
        "top-left": "-top-2 -left-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      position: "top-right",
    },
  },
);

export interface LastUsedBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof lastUsedBadgeVariants> {
  show?: boolean;
  text?: string;
}

export function LastUsedBadge({
  className,
  variant,
  position,
  show = false,
  text = "LAST",
  ...props
}: LastUsedBadgeProps) {
  if (!show) return null;

  return (
    <span
      className={cn(lastUsedBadgeVariants({ variant, position }), className)}
      {...props}
    >
      {text}
    </span>
  );
}
