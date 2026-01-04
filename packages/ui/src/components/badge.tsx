"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@marble/ui/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        positive:
          "border-0 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 [a]:hover:bg-emerald-500/20 dark:[a]:hover:bg-emerald-500/25",
        negative:
          "border-0 bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400 [a]:hover:bg-red-500/20 dark:[a]:hover:bg-red-500/25",
        pending:
          "border-0 bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 [a]:hover:bg-amber-500/20 dark:[a]:hover:bg-amber-500/25",
        info: "border-0 bg-blue-500/20 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300 [a]:hover:bg-blue-500/30 dark:[a]:hover:bg-blue-500/35",
        neutral:
          "border-0 bg-gray-500/10 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400 [a]:hover:bg-gray-500/20 dark:[a]:hover:bg-gray-500/25",
        paid: "border-0 bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 [a]:hover:bg-blue-500/20 dark:[a]:hover:bg-blue-500/25",
        free: "border-0 bg-gray-500/10 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 [a]:hover:bg-gray-500/20 dark:[a]:hover:bg-gray-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
