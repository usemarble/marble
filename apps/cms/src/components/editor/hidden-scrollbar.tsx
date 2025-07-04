import { cn } from "@marble/ui/lib/utils";
import type React from "react";

interface HiddenScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
}

export function HiddenScrollbar({
  className,
  children,
  orientation = "vertical",
  ...props
}: HiddenScrollbarProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide overflow-y-auto",
        // Hide scrollbar for different browsers
        "[&::-webkit-scrollbar]:hidden",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        orientation === "vertical" && "overflow-y-auto",
        orientation === "horizontal" && "overflow-x-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
