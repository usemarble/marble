"use client";

import { Button, type ButtonProps } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { Check, Copy } from "@phosphor-icons/react";
import { useOptimistic, useTransition } from "react";

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
        <Copy className="size-4" />
      ) : (
        <Check className="size-4" />
      )}
    </Button>
  );
}
