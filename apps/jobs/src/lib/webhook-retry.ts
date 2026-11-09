// Cloudflare Queues supports at most a 24-hour delay for each send or retry.
export const MAX_QUEUE_DELAY_SECONDS = 24 * 60 * 60;

const HOURLY_RETRY_DELAY_SECONDS = 60 * 60;

const WEBHOOK_RETRY_DELAYS_SECONDS: readonly number[] = [
  ...new Array<number>(10).fill(60),
  ...new Array<number>(24).fill(HOURLY_RETRY_DELAY_SECONDS),
];
export const WEBHOOK_MAX_ATTEMPTS = WEBHOOK_RETRY_DELAYS_SECONDS.length + 1;
export const WEBHOOK_TEST_MAX_ATTEMPTS = 3;

const INTERNAL_ERROR_QUEUE_RETRIES = 16;
export const WEBHOOK_DELIVERY_QUEUE_MAX_RETRIES =
  WEBHOOK_RETRY_DELAYS_SECONDS.length + INTERNAL_ERROR_QUEUE_RETRIES;

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

export class WebhookDeliveryRetryError extends Error {
  readonly retryAt: Date;

  constructor(reason: string, retryAt: Date) {
    super(`${reason}; retry after ${retryAt.toISOString()}`);
    this.name = "WebhookDeliveryRetryError";
    this.retryAt = retryAt;
  }
}

function withJitter(now: Date, delaySeconds: number, random: () => number) {
  const jitterLimit = Math.min(
    MAX_JITTER_SECONDS,
    Math.ceil(delaySeconds * 0.2)
  );
  const jitterSeconds = 1 + Math.floor(random() * jitterLimit);
  return new Date(now.getTime() + (delaySeconds + jitterSeconds) * 1000);
}

export function getWebhookRetryAt(
  response: Pick<Response, "status" | "headers"> | null,
  attemptNumber: number,
  now = new Date(),
  random = Math.random
): Date {
  if (response?.status === 429 || response?.status === 503) {
    const requestedTimestamp = parseRetryAfter(
      response.headers.get("retry-after"),
      now
    );

    if (requestedTimestamp !== null) {
      const jitterSeconds = 1 + Math.floor(random() * MAX_JITTER_SECONDS);
      return new Date(requestedTimestamp + jitterSeconds * 1000);
    }
  }

  if (response?.status === 429) {
    const exponent = Math.min(6, Math.max(0, attemptNumber - 1));
    const delaySeconds = Math.min(
      MAX_RATE_LIMIT_DELAY_SECONDS - MAX_JITTER_SECONDS,
      BASE_RATE_LIMIT_DELAY_SECONDS * 2 ** exponent
    );
    return withJitter(now, delaySeconds, random);
  }

  const delaySeconds =
    WEBHOOK_RETRY_DELAYS_SECONDS[attemptNumber - 1] ??
    HOURLY_RETRY_DELAY_SECONDS;
  return withJitter(now, delaySeconds, random);
}

/** Round up so second-granularity queue delays cannot send before retryAt. */
export function getWebhookQueueDelaySeconds(retryAt: Date, now = new Date()) {
  return Math.min(
    MAX_QUEUE_DELAY_SECONDS,
    Math.max(1, Math.ceil((retryAt.getTime() - now.getTime()) / 1000))
  );
}
