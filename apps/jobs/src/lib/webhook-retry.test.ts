import { describe, expect, it } from "vitest";
import {
  getWebhookQueueDelaySeconds,
  getWebhookRetryAt,
  MAX_QUEUE_DELAY_SECONDS,
  WEBHOOK_MAX_ATTEMPTS,
} from "./webhook-retry";

const NOW = new Date("2026-10-13T12:00:00.000Z");

function retryAt(status: number, retryAfter?: string, attemptNumber = 1) {
  const response = new Response(null, {
    status,
    headers: retryAfter === undefined ? {} : { "retry-after": retryAfter },
  });
  return getWebhookRetryAt(response, attemptNumber, NOW, () => 0);
}

describe("receiver retry policy", () => {
  it("honors nonnegative delay seconds, including zero", () => {
    expect(retryAt(429, "120")).toEqual(new Date(NOW.getTime() + 121_000));
    expect(retryAt(429, " 0 ")).toEqual(new Date(NOW.getTime() + 1000));
  });

  it("honors an HTTP-date and never sends ahead of it", () => {
    const requested = new Date(NOW.getTime() + 5 * 60_000);
    expect(retryAt(429, requested.toUTCString())).toEqual(
      new Date(requested.getTime() + 1000)
    );
  });

  it("accepts both obsolete HTTP-date formats", () => {
    expect(retryAt(429, "Tuesday, 13-Oct-26 12:05:00 GMT")).toEqual(
      new Date("2026-10-13T12:05:01.000Z")
    );
    expect(retryAt(429, "Tue Oct 13 12:05:00 2026")).toEqual(
      new Date("2026-10-13T12:05:01.000Z")
    );
  });

  it("interprets timezone-less asctime as UTC in a non-UTC process", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "Africa/Lagos";
    try {
      expect(retryAt(429, "Tue Oct 13 12:05:00 2026")).toEqual(
        new Date("2026-10-13T12:05:01.000Z")
      );
    } finally {
      if (previousTimezone === undefined) {
        Reflect.deleteProperty(process.env, "TZ");
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });

  it("adds positive delay when a date is already past", () => {
    expect(retryAt(429, "Mon, 12 Oct 2026 12:00:00 GMT")).toEqual(
      new Date(NOW.getTime() + 1000)
    );
  });

  it.each([undefined, "", "-1", "1.5", "1e3", "garbage", "999999999999999999"])(
    "backs off exponentially for an absent or invalid header: %s",
    (header) => {
      expect(retryAt(429, header, 1)).toEqual(new Date(NOW.getTime() + 61_000));
      expect(retryAt(429, header, 2)).toEqual(
        new Date(NOW.getTime() + 121_000)
      );
    }
  );

  it("bounds fallback delays and spreads retries with jitter", () => {
    const response = new Response(null, { status: 429 });
    expect(getWebhookRetryAt(response, 1, NOW, () => 0.999)).toEqual(
      new Date(NOW.getTime() + 72_000)
    );
    expect(getWebhookRetryAt(response, 1000, NOW, () => 0.999)).toEqual(
      new Date(NOW.getTime() + 3_600_000)
    );
  });

  it("honors Retry-After on 503 and follows the retry schedule otherwise", () => {
    expect(retryAt(503, "120")).toEqual(new Date(NOW.getTime() + 121_000));
    expect(retryAt(503)).toEqual(new Date(NOW.getTime() + 61_000));
    expect(retryAt(503, "-1")).toEqual(new Date(NOW.getTime() + 61_000));
    expect(retryAt(500, "120")).toEqual(new Date(NOW.getTime() + 61_000));
    expect(retryAt(400, "120")).toEqual(new Date(NOW.getTime() + 61_000));
  });

  it("preserves receiver deadlines longer than one queue delay", () => {
    const requested = new Date(NOW.getTime() + 3 * 24 * 60 * 60_000);
    const scheduled = retryAt(429, requested.toUTCString());
    expect(scheduled).toEqual(new Date(requested.getTime() + 1000));
    expect(getWebhookQueueDelaySeconds(requested, NOW)).toBe(
      MAX_QUEUE_DELAY_SECONDS
    );
    expect(
      getWebhookQueueDelaySeconds(
        requested,
        new Date(requested.getTime() - 1001)
      )
    ).toBe(2);
  });

  it("honors the seven-day ceiling for delay seconds and HTTP dates", () => {
    const requested = new Date("2026-10-20T12:00:00.000Z");
    const scheduled = new Date("2026-10-20T12:00:01.000Z");
    expect(retryAt(429, "604800")).toEqual(scheduled);
    expect(retryAt(503, requested.toUTCString())).toEqual(scheduled);
  });

  it.each([
    "604801",
    "999999999",
    "Tue, 20 Oct 2026 12:00:01 GMT",
    "Thu, 13 Oct 2050 12:00:00 GMT",
  ])("uses normal backoff instead of an excessive cooldown: %s", (header) => {
    expect(retryAt(429, header)).toEqual(new Date(NOW.getTime() + 61_000));
    expect(retryAt(503, header)).toEqual(new Date(NOW.getTime() + 61_000));
  });
});

describe("retry schedule", () => {
  it.each([
    { attemptNumber: 1, expected: "2026-10-13T12:01:01.000Z" },
    { attemptNumber: 10, expected: "2026-10-13T12:01:01.000Z" },
    { attemptNumber: 11, expected: "2026-10-13T13:00:01.000Z" },
    { attemptNumber: 34, expected: "2026-10-13T13:00:01.000Z" },
    { attemptNumber: 35, expected: "2026-10-13T13:00:01.000Z" },
    { attemptNumber: 1000, expected: "2026-10-13T13:00:01.000Z" },
  ])(
    "retries a 500 on attempt $attemptNumber at $expected",
    ({ attemptNumber, expected }) => {
      expect(retryAt(500, undefined, attemptNumber)).toEqual(
        new Date(expected)
      );
    }
  );

  it("retries every minute for ten minutes, then hourly", () => {
    const response = new Response(null, { status: 500 });
    let at = NOW;
    const delays: number[] = [];
    for (let attempt = 1; attempt < WEBHOOK_MAX_ATTEMPTS; attempt++) {
      const next = getWebhookRetryAt(response, attempt, at, () => 0);
      delays.push((next.getTime() - at.getTime()) / 1000);
      at = next;
    }
    expect(delays).toEqual([
      ...new Array<number>(10).fill(61),
      ...new Array<number>(24).fill(3601),
    ]);
    expect(at).toEqual(new Date("2026-10-14T12:10:34.000Z"));
  });

  it("schedules a request that got no response like any other failure", () => {
    expect(getWebhookRetryAt(null, 1, NOW, () => 0)).toEqual(
      new Date("2026-10-13T12:01:01.000Z")
    );
    expect(getWebhookRetryAt(null, 11, NOW, () => 0)).toEqual(
      new Date("2026-10-13T13:00:01.000Z")
    );
  });

  it("keeps scheduled jitter positive and bounded", () => {
    expect(getWebhookRetryAt(null, 1, NOW, () => 0.999)).toEqual(
      new Date("2026-10-13T12:01:12.000Z")
    );
    expect(getWebhookRetryAt(null, 11, NOW, () => 0.999)).toEqual(
      new Date("2026-10-13T13:00:30.000Z")
    );
  });

  it("keeps exponential backoff for a 429 without a usable header", () => {
    expect(retryAt(429, undefined, 3)).toEqual(
      new Date("2026-10-13T12:04:01.000Z")
    );
    expect(retryAt(429, undefined, 11)).toEqual(
      new Date("2026-10-13T12:59:31.000Z")
    );
  });

  it("allows 35 attempts, the documented default", () => {
    expect(WEBHOOK_MAX_ATTEMPTS).toBe(35);
  });
});
