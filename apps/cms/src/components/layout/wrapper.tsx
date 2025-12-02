"use client";

import { cn } from "@marble/ui/lib/utils";
import type { ReactNode } from "react";

export function WorkspacePageWrapper({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        size === "compact"
          ? "workspace-container-compact"
          : "workspace-container",
        "mx-auto flex h-full w-full flex-col py-8",
        className
      )}
    >
      {children}
    </div>
  );
}
