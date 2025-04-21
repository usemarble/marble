import { cn } from "@marble/ui/lib/utils";
import type { ReactNode } from "react";

export default function WorkspaceWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full max-w-4xl mx-auto py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
