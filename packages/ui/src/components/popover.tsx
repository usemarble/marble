"use client";

import { cn } from "@marble/ui/lib/utils";
import {
  Anchor as PopoverAnchorPrimitive,
  Content as PopoverContentPrimitive,
  Portal as PopoverPortal,
  Root as PopoverRoot,
  Trigger as PopoverTriggerPrimitive,
} from "@radix-ui/react-popover";
import type { ComponentProps } from "react";

const POPOVER_CONTENT_CLASSES =
  "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

function Popover({ ...props }: ComponentProps<typeof PopoverRoot>) {
  return <PopoverRoot data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: ComponentProps<typeof PopoverTriggerPrimitive>) {
  return <PopoverTriggerPrimitive data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  container,
  ...props
}: ComponentProps<typeof PopoverContentPrimitive> & {
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPortal container={container}>
      <PopoverContentPrimitive
        align={align}
        className={cn(POPOVER_CONTENT_CLASSES, className)}
        data-slot="popover-content"
        sideOffset={sideOffset}
        updatePositionStrategy="always"
        {...props}
      />
    </PopoverPortal>
  );
}

function PopoverAnchor({
  ...props
}: ComponentProps<typeof PopoverAnchorPrimitive>) {
  return <PopoverAnchorPrimitive data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
