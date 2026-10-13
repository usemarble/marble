import type {
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspaceEvent,
} from "@marble/db/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { signPayload } from "@/lib/signing";
import type {
  checkWebhookUsage,
  recordWebhookUsage,
  sendWebhookUsageAlert,
} from "@/lib/usage";
import type {
  claimWebhookDeliveryAttempt,
  renewWebhookDeliveryLease,
  updateWebhookDeliveryForLease,
} from "@/lib/webhook-delivery-lease";
import type { recordWebhookEndpointOutcome } from "@/lib/webhook-health";
import {
  MAX_QUEUE_DELAY_SECONDS,
  WebhookDeliveryDeferredError,
} from "@/lib/webhook-retry";
import type { WebhookMessage } from "@/types/env";
import { handleWebhookDeliveryQueue } from "./deliveries";

type Delivery = typeof webhookDelivery.$inferSelect & {
  event: typeof workspaceEvent.$inferSelect;
  webhookEndpoint: Pick<
    typeof webhookEndpoint.$inferSelect,
    "format" | "secret" | "enabled"
  >;
};

interface DeliverySession {
  query: {
    webhookDelivery: {
      findFirst: () => Promise<Delivery | undefined>;
    };
  };
  insert: () => {
    values: (
      attempt: typeof webhookDeliveryAttempt.$inferInsert
    ) => Promise<void>;
  };
  transaction: (
    callback: (session: DeliverySession) => Promise<{ count: number }>
  ) => Promise<{ count: number }>;
}

const mocks = vi.hoisted(() => {
  const findDelivery = vi.fn<() => Promise<Delivery | undefined>>();
  const insertAttempt =
    vi.fn<
      (attempt: typeof webhookDeliveryAttempt.$inferInsert) => Promise<void>
    >();
  const transaction =
    vi.fn<
      (
        callback: (session: DeliverySession) => Promise<{ count: number }>
      ) => Promise<{ count: number }>
    >();
  const db = {
    query: { webhookDelivery: { findFirst: findDelivery } },
    insert: () => ({ values: insertAttempt }),
    transaction,
  } satisfies DeliverySession;

  return {
    db,
    findDelivery,
    insertAttempt,
    transaction,
    claim: vi.fn<typeof claimWebhookDeliveryAttempt>(),
    renew: vi.fn<typeof renewWebhookDeliveryLease>(),
    transition: vi.fn<typeof updateWebhookDeliveryForLease>(),
    recordOutcome: vi.fn<typeof recordWebhookEndpointOutcome>(),
    checkUsage: vi.fn<typeof checkWebhookUsage>(),
    recordUsage: vi.fn<typeof recordWebhookUsage>(),
    sendUsageAlert: vi.fn<typeof sendWebhookUsageAlert>(),
    sign: vi.fn<typeof signPayload>(),
    enqueue:
      vi.fn<
        (body: WebhookMessage, options?: QueueSendOptions) => Promise<void>
      >(),
    fetch: vi.fn<typeof fetch>(),
  };
});

vi.mock("cloudflare:workers", () => ({
  env: { WEBHOOK_DELIVERY_QUEUE: { send: mocks.enqueue } },
}));
vi.mock("@/lib/db", () => ({
  createDbClient: () => mocks.db,
}));
vi.mock("@/lib/usage", () => ({
  checkWebhookUsage: mocks.checkUsage,
  recordWebhookUsage: mocks.recordUsage,
  sendWebhookUsageAlert: mocks.sendUsageAlert,
}));
vi.mock("@/lib/signing", () => ({ signPayload: mocks.sign }));
vi.mock("@/lib/webhook-health", () => ({
  recordWebhookEndpointOutcome: mocks.recordOutcome,
}));
vi.mock("@/lib/webhook-delivery-lease", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/webhook-delivery-lease")>()),
  claimWebhookDeliveryAttempt: mocks.claim,
  renewWebhookDeliveryLease: mocks.renew,
  updateWebhookDeliveryForLease: mocks.transition,
}));

const NOW = new Date("2026-10-13T12:00:00.000Z");
const LEASE = { deliveryId: "delivery-1", attemptNumber: 1, claimedAt: NOW };

function makeDelivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    id: "delivery-1",
    eventId: "event-1",
    workspaceId: "workspace-1",
    webhookEndpointId: "endpoint-1",
    url: "https://example.com/webhooks",
    status: "sending",
    isTest: true,
    attemptCount: 1,
    maxAttempts: 3,
    nextRetryAt: null,
    lastAttemptAt: NOW,
    deliveredAt: null,
    failedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    event: {
      id: "event-1",
      workspaceId: "workspace-1",
      type: "post_created",
      source: "system",
      resourceType: "post",
      resourceId: "post-1",
      actorType: "system",
      actorId: null,
      payload: {},
      enqueuedAt: NOW,
      processedAt: NOW,
      createdAt: NOW,
    },
    webhookEndpoint: { format: "json", secret: "secret", enabled: true },
    ...overrides,
  };
}

function makeBatch() {
  const message = {
    id: "queue-message-1",
    body: { type: "webhook.delivery", deliveryId: "delivery-1" },
    timestamp: NOW,
    attempts: 1,
    ack: vi.fn<() => void>(),
    retry: vi.fn<(options?: QueueRetryOptions) => void>(),
  } satisfies Message<WebhookMessage>;
  const batch = {
    queue: "marble-webhook-deliveries",
    messages: [message],
    metadata: { metrics: { backlogCount: 1, backlogBytes: 100 } },
    ackAll: vi.fn<() => void>(),
    retryAll: vi.fn<(options?: QueueRetryOptions) => void>(),
  } satisfies MessageBatch<WebhookMessage>;
  return { message, batch };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.claim.mockResolvedValue(LEASE);
  mocks.renew.mockResolvedValue(LEASE);
  mocks.transition.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation((callback) => callback(mocks.db));
  mocks.recordOutcome.mockResolvedValue(undefined);
  mocks.sign.mockResolvedValue("test-signature");
  mocks.checkUsage.mockResolvedValue({
    allowed: true,
    currentUsage: 0,
    limit: 100,
    period: {
      start: new Date("2026-10-01T00:00:00.000Z"),
      end: new Date("2026-11-01T00:00:00.000Z"),
    },
    plan: "free",
  });
  mocks.recordUsage.mockResolvedValue(undefined);
  mocks.sendUsageAlert.mockResolvedValue(undefined);
  mocks.findDelivery.mockResolvedValue(makeDelivery());
  mocks.enqueue.mockResolvedValue(undefined);
  mocks.insertAttempt.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("webhook receiver cooldowns", () => {
  it.each([429, 503])(
    "persists and schedules Retry-After on %i",
    async (status) => {
      mocks.fetch.mockResolvedValue(
        new Response("slow down", { status, headers: { "retry-after": "120" } })
      );
      const { message, batch } = makeBatch();
      await handleWebhookDeliveryQueue(batch);
      expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
        status: "retrying",
        nextRetryAt: new Date(NOW.getTime() + 121_000),
      });
      expect(mocks.insertAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: status,
          attemptNumber: 1,
          success: false,
        })
      );
      expect(message.retry).toHaveBeenCalledWith({ delaySeconds: 121 });
      expect(message.ack).not.toHaveBeenCalled();
    }
  );

  it("uses increasing fallback delays for rate limiting without a header", async () => {
    const lease = { ...LEASE, attemptNumber: 2 };
    mocks.claim.mockResolvedValue(lease);
    mocks.renew.mockResolvedValue(lease);
    mocks.findDelivery.mockResolvedValue(makeDelivery({ attemptCount: 2 }));
    mocks.fetch.mockResolvedValue(new Response(null, { status: 429 }));
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(message.retry).toHaveBeenCalledWith({ delaySeconds: 121 });
  });

  it.each([429, 503])(
    "uses bounded retries instead of an endless cooldown chain on %i",
    async (status) => {
      mocks.fetch.mockResolvedValue(
        new Response("unavailable", {
          status,
          headers: { "retry-after": "999999999" },
        })
      );
      const { message, batch } = makeBatch();
      await handleWebhookDeliveryQueue(batch);
      expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
        status: "retrying",
        nextRetryAt: status === 429 ? new Date(NOW.getTime() + 61_000) : null,
      });
      if (status === 429) {
        expect(message.retry).toHaveBeenCalledWith({ delaySeconds: 61 });
      } else {
        expect(message.retry).toHaveBeenCalledWith();
      }
      expect(message.ack).not.toHaveBeenCalled();
      expect(mocks.enqueue).not.toHaveBeenCalled();
    }
  );

  it.each([429, 503])(
    "honors %i retry headers when reading the response body fails",
    async (status) => {
      const body = new ReadableStream({
        start(controller) {
          controller.error(new Error("connection reset"));
        },
      });
      mocks.fetch.mockResolvedValue(
        new Response(body, { status, headers: { "retry-after": "120" } })
      );
      const { message, batch } = makeBatch();
      await handleWebhookDeliveryQueue(batch);
      expect(mocks.insertAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: status,
          errorMessage:
            "Failed to read webhook response body: connection reset",
        })
      );
      expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
        status: "retrying",
        nextRetryAt: new Date(NOW.getTime() + 121_000),
      });
      expect(message.retry).toHaveBeenCalledWith({ delaySeconds: 121 });
    }
  );

  it("accepts a 2xx even if reading its response body fails", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });
    mocks.fetch.mockResolvedValue(new Response(body, { status: 200 }));
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
      status: "success",
      deliveredAt: NOW,
      nextRetryAt: null,
    });
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it("requeues early duplicate messages without sending or consuming an attempt", async () => {
    const retryAt = new Date(NOW.getTime() + 120_000);
    mocks.claim.mockRejectedValue(
      new WebhookDeliveryDeferredError("delivery-1", retryAt)
    );
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(mocks.enqueue).toHaveBeenCalledWith(message.body, {
      delaySeconds: 120,
    });
    expect(message.ack).toHaveBeenCalledOnce();
    expect(mocks.enqueue.mock.invocationCallOrder[0]).toBeLessThan(
      message.ack.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    );
    expect(message.retry).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.insertAttempt).not.toHaveBeenCalled();
    expect(mocks.transition).not.toHaveBeenCalled();
  });

  it("chunks long cooldowns without reducing the persisted deadline", async () => {
    const retryAt = new Date(
      NOW.getTime() + 3 * MAX_QUEUE_DELAY_SECONDS * 1000
    );
    mocks.fetch.mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "retry-after": retryAt.toUTCString() },
      })
    );
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
      status: "retrying",
      nextRetryAt: new Date(retryAt.getTime() + 1000),
    });
    expect(mocks.enqueue).toHaveBeenCalledWith(message.body, {
      delaySeconds: MAX_QUEUE_DELAY_SECONDS,
    });
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("keeps a deferred message unacked if enqueueing fails", async () => {
    mocks.claim.mockRejectedValue(
      new WebhookDeliveryDeferredError(
        "delivery-1",
        new Date(NOW.getTime() + 120_000)
      )
    );
    mocks.enqueue.mockRejectedValue(new Error("queue unavailable"));
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(message.ack).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledWith();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each([400, 500, 503])(
    "preserves default retries for an ordinary %i",
    async (status) => {
      mocks.fetch.mockResolvedValue(new Response(null, { status }));
      const { message, batch } = makeBatch();
      await handleWebhookDeliveryQueue(batch);
      expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
        status: "retrying",
        nextRetryAt: null,
      });
      expect(message.retry).toHaveBeenCalledWith();
      expect(mocks.enqueue).not.toHaveBeenCalled();
    }
  );

  it("exhausts the existing HTTP attempt limit even when rate limited", async () => {
    const lease = { ...LEASE, attemptNumber: 3 };
    mocks.claim.mockResolvedValue(lease);
    mocks.renew.mockResolvedValue(lease);
    mocks.findDelivery.mockResolvedValue(makeDelivery({ attemptCount: 3 }));
    mocks.fetch.mockResolvedValue(
      new Response(null, { status: 429, headers: { "retry-after": "120" } })
    );
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), lease, {
      status: "failed",
      failedAt: NOW,
      nextRetryAt: null,
    });
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it("clears cooldown after success", async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(mocks.transition).toHaveBeenCalledWith(expect.anything(), LEASE, {
      status: "success",
      deliveredAt: NOW,
      nextRetryAt: null,
    });
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("does not schedule a cooldown from a stale worker's response", async () => {
    mocks.transition.mockResolvedValue({ count: 0 });
    mocks.fetch.mockResolvedValue(
      new Response(null, { status: 429, headers: { "retry-after": "120" } })
    );
    const { message, batch } = makeBatch();
    await handleWebhookDeliveryQueue(batch);
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
  });
});

describe("webhook endpoint outcomes", () => {
  it.each([
    { status: 204, success: true },
    { status: 400, success: false },
    { status: 500, success: false },
    { status: 429, success: false },
  ])(
    "records HTTP $status only after an owned delivery transition",
    async ({ status, success }) => {
      mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
      mocks.fetch.mockResolvedValue(new Response(null, { status }));
      const { batch } = makeBatch();

      await handleWebhookDeliveryQueue(batch);

      expect(mocks.recordOutcome).toHaveBeenCalledExactlyOnceWith(mocks.db, {
        endpointId: "endpoint-1",
        url: "https://example.com/webhooks",
        observedAt: NOW,
        success,
        isTest: false,
      });
      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.insertAttempt.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.transition.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
      );
      expect(mocks.transition.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.recordOutcome.mock.invocationCallOrder[0] ??
          Number.POSITIVE_INFINITY
      );
    }
  );

  it.each([1, 3])(
    "records a completed network failure on attempt %i",
    async (attemptNumber) => {
      const lease = { ...LEASE, attemptNumber };
      mocks.claim.mockResolvedValue(lease);
      mocks.renew.mockResolvedValue(lease);
      mocks.findDelivery.mockResolvedValue(
        makeDelivery({ isTest: false, attemptCount: attemptNumber })
      );
      mocks.fetch.mockRejectedValue(new Error("DNS resolution failed"));
      const { message, batch } = makeBatch();

      await handleWebhookDeliveryQueue(batch);

      expect(mocks.insertAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: "DNS resolution failed",
          attemptNumber,
        })
      );
      expect(mocks.recordOutcome).toHaveBeenCalledExactlyOnceWith(mocks.db, {
        endpointId: "endpoint-1",
        url: "https://example.com/webhooks",
        observedAt: NOW,
        success: false,
        isTest: false,
      });
      expect(mocks.transition.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.recordOutcome.mock.invocationCallOrder[0] ??
          Number.POSITIVE_INFINITY
      );
      if (attemptNumber === 3) {
        expect(message.ack).toHaveBeenCalledOnce();
        expect(message.retry).not.toHaveBeenCalled();
      } else {
        expect(message.retry).toHaveBeenCalledOnce();
        expect(message.ack).not.toHaveBeenCalled();
      }
    }
  );

  it("does not record a stale worker's network failure", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.fetch.mockRejectedValue(new Error("connection timed out"));
    mocks.transition.mockResolvedValue({ count: 0 });
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it("does not record failures when signing fails before sending", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.sign.mockRejectedValue(new Error("signing service unavailable"));
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.insertAttempt).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
    expect(message.ack).not.toHaveBeenCalled();
  });

  it("does not record failures when the delivery cannot be read", async () => {
    mocks.findDelivery.mockRejectedValue(new Error("database unavailable"));
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
  });

  it("does not record failures when persisting the attempt fails", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.fetch.mockResolvedValue(new Response(null, { status: 500 }));
    mocks.insertAttempt.mockRejectedValue(new Error("database unavailable"));
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
  });

  it("does not record failures when the owned delivery transition fails", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.fetch.mockResolvedValue(new Response(null, { status: 500 }));
    mocks.transition.mockRejectedValue(new Error("database unavailable"));
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.insertAttempt).toHaveBeenCalledOnce();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
  });

  it("does not record failures when the usage check fails", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.checkUsage.mockRejectedValue(new Error("usage database unavailable"));
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
  });

  it("does not count quota exhaustion as an endpoint failure", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.checkUsage.mockResolvedValue({
      allowed: false,
      currentUsage: 100,
      limit: 100,
      period: {
        start: new Date("2026-10-01T00:00:00.000Z"),
        end: new Date("2026-11-01T00:00:00.000Z"),
      },
      plan: "free",
    });
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.insertAttempt).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(mocks.sendUsageAlert).toHaveBeenCalledOnce();
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("preserves a successful receiver outcome if usage accounting fails", async () => {
    mocks.findDelivery.mockResolvedValue(makeDelivery({ isTest: false }));
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    mocks.recordUsage.mockRejectedValue(
      new Error("usage database unavailable")
    );
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.recordOutcome).toHaveBeenCalledExactlyOnceWith(
      mocks.db,
      expect.objectContaining({ success: true, isTest: false })
    );
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it("does not send queued normal deliveries to a disabled endpoint", async () => {
    mocks.findDelivery.mockResolvedValue(
      makeDelivery({
        isTest: false,
        webhookEndpoint: { format: "json", secret: "secret", enabled: false },
      })
    );
    const { message, batch } = makeBatch();

    await handleWebhookDeliveryQueue(batch);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.checkUsage).not.toHaveBeenCalled();
    expect(mocks.insertAttempt).not.toHaveBeenCalled();
    expect(mocks.recordOutcome).not.toHaveBeenCalled();
    expect(mocks.transition).toHaveBeenCalledWith(mocks.db, LEASE, {
      status: "failed",
      failedAt: NOW,
      nextRetryAt: null,
    });
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it.each([
    { status: 204, success: true },
    { status: 400, success: false },
  ])(
    "allows disabled endpoint tests and identifies their HTTP $status outcome as manual",
    async ({ status, success }) => {
      mocks.findDelivery.mockResolvedValue(
        makeDelivery({
          webhookEndpoint: {
            format: "json",
            secret: "secret",
            enabled: false,
          },
        })
      );
      mocks.fetch.mockResolvedValue(new Response(null, { status }));
      const { batch } = makeBatch();

      await handleWebhookDeliveryQueue(batch);

      expect(mocks.fetch).toHaveBeenCalledOnce();
      expect(mocks.checkUsage).not.toHaveBeenCalled();
      // The health module ignores failed manual tests and allows successful
      // ones to clear an incident. The consumer must preserve that distinction.
      expect(mocks.recordOutcome).toHaveBeenCalledExactlyOnceWith(mocks.db, {
        endpointId: "endpoint-1",
        url: "https://example.com/webhooks",
        observedAt: NOW,
        success,
        isTest: true,
      });
    }
  );
});
