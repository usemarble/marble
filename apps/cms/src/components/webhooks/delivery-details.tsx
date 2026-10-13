"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import type { WebhookDelivery, WebhookDeliveryAttempt } from "@/types/webhook";

function formatResponse(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-xs">{value}</dd>
    </>
  );
}

function CopyTextButton({ label, text }: { label: string; text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  };

  return (
    <Button
      className="h-8 px-3 text-xs"
      onClick={copy}
      type="button"
      variant="outline"
    >
      <HugeiconsIcon className="size-3.5" icon={Copy01Icon} />
      Copy {label}
    </Button>
  );
}

function DeliveryResponse({
  attempt,
  status,
}: {
  attempt: WebhookDeliveryAttempt | null;
  status: string;
}) {
  const responseBody = attempt?.responseBody;
  const hasResponseBody =
    responseBody !== null &&
    responseBody !== undefined &&
    responseBody.length > 0;
  const responseToCopy = hasResponseBody ? responseBody : attempt?.errorMessage;

  let emptyResponse = "No HTTP response was recorded for this attempt.";
  if (attempt?.statusCode !== null && attempt?.statusCode !== undefined) {
    emptyResponse = "The endpoint returned an empty response body.";
  } else if (!attempt) {
    if (status === "pending") {
      emptyResponse = "This delivery is waiting to be sent.";
    } else if (status === "sending") {
      emptyResponse =
        "This delivery is being sent. No response has been recorded yet.";
    } else {
      emptyResponse =
        "No HTTP attempt result was recorded. The available record does not identify the cause.";
    }
  }

  return (
    <div className="grid min-w-0 gap-3 border-t border-dashed pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-sm">Response</h3>
        {responseToCopy ? (
          <CopyTextButton label="response" text={responseToCopy} />
        ) : null}
      </div>

      {attempt?.errorMessage ? (
        <div className="grid gap-2 rounded-[14px] border border-destructive/20 bg-destructive/5 p-4">
          <p className="font-medium text-destructive text-sm">Recorded error</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
            {attempt.errorMessage}
          </pre>
        </div>
      ) : null}

      {hasResponseBody ? (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[14px] border border-dashed bg-background p-4 font-mono text-xs leading-relaxed">
          {formatResponse(responseBody)}
        </pre>
      ) : attempt?.errorMessage ? null : (
        <p className="text-muted-foreground text-sm">{emptyResponse}</p>
      )}

      {hasResponseBody && responseBody.length === 5000 ? (
        <p className="text-muted-foreground text-xs">
          Responses are limited to 5,000 characters; this response may be
          truncated.
        </p>
      ) : null}
    </div>
  );
}

export function DeliveryDetails({ delivery }: { delivery: WebhookDelivery }) {
  const payload = JSON.stringify(delivery.payload, null, 2);
  const latestAttempt = delivery.latestAttempt;

  return (
    <div className="grid min-w-0 gap-5">
      <dl className="grid gap-3 text-sm md:grid-cols-[180px_minmax(0,1fr)]">
        <DetailItem label="Event ID" value={delivery.eventId} />
        <DetailItem label="Event timestamp" value={delivery.eventCreatedAt} />
        <DetailItem label="Delivery ID" value={delivery.id} />
        <DetailItem label="Endpoint URL" value={delivery.url} />
        <DetailItem
          label="Last attempt"
          value={
            delivery.lastAttemptAt ?? latestAttempt?.createdAt ?? "Not recorded"
          }
        />
        <DetailItem
          label="Attempts"
          value={`${delivery.attemptCount} of ${delivery.maxAttempts}`}
        />
        <DetailItem
          label="HTTP response"
          value={
            latestAttempt?.statusCode != null
              ? String(latestAttempt.statusCode)
              : latestAttempt
                ? "No HTTP response"
                : "No response recorded"
          }
        />
        <DetailItem
          label="Duration"
          value={
            latestAttempt?.durationMs != null
              ? `${latestAttempt.durationMs}ms`
              : "Not recorded"
          }
        />
        {delivery.status === "retrying" && delivery.nextRetryAt ? (
          <DetailItem label="Next retry" value={delivery.nextRetryAt} />
        ) : null}
      </dl>

      <DeliveryResponse attempt={latestAttempt} status={delivery.status} />

      <div className="grid min-w-0 gap-3 border-t border-dashed pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-sm">Payload</h3>
          <CopyTextButton label="payload" text={payload} />
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-[14px] border border-dashed bg-background p-4 font-mono text-xs leading-relaxed">
          {payload}
        </pre>
      </div>
    </div>
  );
}
