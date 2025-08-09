import { cn } from "@marble/ui/lib/utils";
import type { ReactNode } from "react";

export function WorkspacePageWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-full w-full max-w-5xl flex-col py-8",
        className
      )}
    >
      {children}
    </div>
  );
}
