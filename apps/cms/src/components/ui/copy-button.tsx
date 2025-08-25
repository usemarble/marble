"use client";

import { Button, type buttonVariants } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { useOptimistic, useTransition } from "react";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function CopyButton({
  textToCopy,
  toastMessage,
  className,
  ...props
}: { textToCopy: string; toastMessage?: string } & Omit<
  ButtonProps,
  "onClick" | "children"
>) {
  const [state, setState] = useOptimistic<"idle" | "copied">("idle");
  const [, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("px-3", className)}
      {...props}
      onClick={() => {
        startTransition(async () => {
          if (!textToCopy) return;
          await navigator.clipboard.writeText(textToCopy);
          if (toastMessage) {
            toast.success(toastMessage);
          }
          setState("copied");
          await new Promise((resolve) => setTimeout(resolve, 1500));
        });
      }}
    >
      <span className="sr-only">Copy</span>
      {state === "idle" ? (
        <CopyIcon className="size-4" />
      ) : (
        <CheckIcon className="size-4" />
      )}
    </Button>
  );
}
