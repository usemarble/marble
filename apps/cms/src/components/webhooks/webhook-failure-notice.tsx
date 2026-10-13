"use client";

import { cn } from "@marble/ui/lib/utils";
import type { Webhook } from "@/types/webhook";

export function WebhookFailureNotice({ webhook }: { webhook: Webhook }) {
  const automaticallyDisabled = !webhook.enabled && Boolean(webhook.disabledAt);
  const failing = webhook.enabled && webhook.consecutiveFailures >= 10;

  if (!(automaticallyDisabled || failing)) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "grid min-w-0 gap-2 rounded-[14px] border p-4 text-sm",
        automaticallyDisabled
          ? "border-destructive/20 bg-destructive/5"
          : "border-amber-500/20 bg-amber-500/5"
      )}
    >
      <h2
        className={cn(
          "font-medium",
          automaticallyDisabled
            ? "text-destructive"
            : "text-amber-800 dark:text-amber-400"
        )}
      >
        {automaticallyDisabled
          ? "Webhook disabled after repeated failures"
          : "Webhook deliveries are failing"}
      </h2>
      <p className="text-muted-foreground">
        {automaticallyDisabled
          ? "Delivery has been paused because this endpoint continued to fail."
          : "This endpoint has repeatedly failed to accept deliveries. We are continuing to retry eligible deliveries."}
      </p>
      {automaticallyDisabled && webhook.disabledReason ? (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-dashed bg-background p-3 font-mono text-xs leading-relaxed">
          {webhook.disabledReason}
        </pre>
      ) : null}
      <p className="text-muted-foreground">
        {automaticallyDisabled
          ? "Review the responses below, check your endpoint, and send a test webhook. When the test succeeds, turn Enabled on in the edit panel and save."
          : "Review the responses below, check your endpoint URL and server logs, then send a test webhook to verify the fix."}
      </p>
    </div>
  );
}
