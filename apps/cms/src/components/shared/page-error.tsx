"use client";

import { Button } from "@marble/ui/components/button";
import { DashboardBody } from "@/components/layout/wrapper";

interface PageErrorProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function PageError({
  message,
  onRetry,
  title = "Unable to load this page",
}: PageErrorProps) {
  return (
    <DashboardBody className="items-center overflow-y-auto p-6" flush>
      <div
        aria-live="polite"
        className="my-auto flex w-full max-w-sm shrink-0 flex-col items-center gap-4 text-center"
      >
        <div className="space-y-2">
          <h2 className="font-medium">{title}</h2>
          <p className="break-words text-muted-foreground text-sm">{message}</p>
        </div>
        {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
      </div>
    </DashboardBody>
  );
}
