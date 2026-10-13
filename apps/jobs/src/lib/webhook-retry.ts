// Cloudflare Queues supports at most a 24-hour delay for each send or retry.
export const MAX_QUEUE_DELAY_SECONDS = 24 * 60 * 60;

const BASE_RATE_LIMIT_DELAY_SECONDS = 60;
const MAX_RATE_LIMIT_DELAY_SECONDS = 60 * 60;
const MAX_RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_JITTER_SECONDS = 30;
const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000;

const HTTP_DATE_PATTERNS = [
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/,
  /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2} \d{2}:\d{2}:\d{2} GMT$/,
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (?: \d|\d{2}) \d{2}:\d{2}:\d{2} \d{4}$/,
];

function parseRetryAfter(value: string | null, now: Date): number | null {
  if (value === null) {
    return null;
  }

  const header = value.trim();
  let timestamp: number;

  if (/^\d+$/.test(header)) {
    const seconds = Number(header);
    if (!Number.isSafeInteger(seconds)) {
      return null;
    }
    timestamp = now.getTime() + seconds * 1000;
  } else if (HTTP_DATE_PATTERNS.some((pattern) => pattern.test(header))) {
    // Obsolete asctime has no timezone suffix, but every HTTP-date is UTC.
    timestamp = Date.parse(header.endsWith("GMT") ? header : `${header} GMT`);
  } else {
    return null;
  }

  if (
    !Number.isFinite(timestamp) ||
    timestamp > MAX_DATE_TIMESTAMP - MAX_JITTER_SECONDS * 1000 ||
    timestamp - now.getTime() > MAX_RETRY_AFTER_MS
  ) {
    return null;
  }

  return Math.max(now.getTime(), timestamp);
}

/** A delivery received before its persisted cooldown must stay queued. */
export class WebhookDeliveryDeferredError extends Error {
  readonly retryAt: Date;

  constructor(deliveryId: string, retryAt: Date) {
    super(
      `Webhook delivery ${deliveryId} is waiting until ${retryAt.toISOString()}`
    );
    this.name = "WebhookDeliveryDeferredError";
    this.retryAt = retryAt;
  }
}

/** A receiver requested a cooldown after an actual outbound attempt. */
export class WebhookDeliveryRetryError extends Error {
  readonly retryAt: Date;

  constructor(status: number, retryAt: Date) {
    super(`Webhook returned ${status}; retry after ${retryAt.toISOString()}`);
    this.name = "WebhookDeliveryRetryError";
    this.retryAt = retryAt;
  }
}

/**
 * Honor Retry-After up to seven days on 429 and 503. Without a usable header,
 * only 429 gets exponential backoff; other failures retain the default delay.
 * Positive jitter never advances a retry ahead of an accepted deadline.
 */
export function getWebhookRetryAt(
  response: Pick<Response, "status" | "headers">,
  attemptNumber: number,
  now = new Date(),
  random = Math.random
): Date | null {
  if (response.status !== 429 && response.status !== 503) {
    return null;
  }

  const requestedTimestamp = parseRetryAfter(
    response.headers.get("retry-after"),
    now
  );

  if (requestedTimestamp !== null) {
    const jitterSeconds = 1 + Math.floor(random() * MAX_JITTER_SECONDS);
    return new Date(requestedTimestamp + jitterSeconds * 1000);
  }

  if (response.status !== 429) {
    return null;
  }

  const exponent = Math.min(6, Math.max(0, attemptNumber - 1));
  const delaySeconds = Math.min(
    MAX_RATE_LIMIT_DELAY_SECONDS - MAX_JITTER_SECONDS,
    BASE_RATE_LIMIT_DELAY_SECONDS * 2 ** exponent
  );
  const jitterLimit = Math.min(
    MAX_JITTER_SECONDS,
    Math.ceil(delaySeconds * 0.2)
  );
  const jitterSeconds = 1 + Math.floor(random() * jitterLimit);
  return new Date(now.getTime() + (delaySeconds + jitterSeconds) * 1000);
}

/** Round up so second-granularity queue delays cannot send before retryAt. */
export function getWebhookQueueDelaySeconds(retryAt: Date, now = new Date()) {
  return Math.min(
    MAX_QUEUE_DELAY_SECONDS,
    Math.max(1, Math.ceil((retryAt.getTime() - now.getTime()) / 1000))
  );
}
