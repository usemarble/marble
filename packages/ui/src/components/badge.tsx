import { cn } from "@marble/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        positive:
          "border-0 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 [a&]:hover:bg-emerald-500/20 dark:[a&]:hover:bg-emerald-500/25",
        negative:
          "border-0 bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400 [a&]:hover:bg-red-500/20 dark:[a&]:hover:bg-red-500/25",
        pending:
          "border-0 bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 [a&]:hover:bg-amber-500/20 dark:[a&]:hover:bg-amber-500/25",
        info: "border-0 bg-blue-500/20 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300 [a&]:hover:bg-blue-500/30 dark:[a&]:hover:bg-blue-500/35",
        neutral:
          "border-0 bg-gray-500/10 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400 [a&]:hover:bg-gray-500/20 dark:[a&]:hover:bg-gray-500/25",
        paid:
          "border-0 bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 [a&]:hover:bg-blue-500/20 dark:[a&]:hover:bg-blue-500/25",
        free: "border-0 bg-gray-500/10 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 [a&]:hover:bg-gray-500/20 dark:[a&]:hover:bg-gray-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
