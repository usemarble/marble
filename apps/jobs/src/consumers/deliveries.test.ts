import { createRecordId } from "@marble/db/id";
import {
  member,
  usageEvent,
  user,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspace,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import type { sendUsageLimitEmail } from "@marble/email";
import { eq, sql } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { WebhookMessage } from "@/types/env";
import { handleWebhookDeliveryQueue } from "./deliveries";

const mocks = vi.hoisted(() => ({
  enqueue:
    vi.fn<
      (body: WebhookMessage, options?: QueueSendOptions) => Promise<void>
    >(),
  fetch: vi.fn<typeof fetch>(),
  sendUsageLimitEmail: vi.fn<typeof sendUsageLimitEmail>(),
}));
vi.mock("cloudflare:workers", () => ({
  env: {
    WEBHOOK_DELIVERY_QUEUE: { send: mocks.enqueue },
    RESEND_API_KEY: "test-key",
  },
}));
vi.mock("@/lib/db", () => ({ createDbClient: () => testDb.db }));
vi.mock("@marble/email", () => ({
  sendUsageLimitEmail: mocks.sendUsageLimitEmail,
}));

const NOW = new Date("2026-10-13T12:00:00.000Z");
const RECEIVER_URL = "https://receiver.example.com/events";
let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.setSystemTime(NOW);
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type DeliveryState = Pick<
  typeof webhookDelivery.$inferInsert,
  "status" | "attemptCount" | "maxAttempts" | "nextRetryAt" | "isTest"
>;
type EndpointState = Pick<
  typeof webhookEndpoint.$inferInsert,
  "enabled" | "secret" | "consecutiveFailures" | "failureIncidentId"
>;

async function fixture(
  delivery: DeliveryState = {},
  endpoint: Partial<EndpointState> = {}
) {
  const workspaceId = createRecordId();
  const endpointId = createRecordId();
  const eventId = createRecordId();
  const deliveryId = createRecordId();
  await testDb.db.insert(workspace).values({
    id: workspaceId,
    name: "Webhook delivery test",
    slug: workspaceId,
  });
  await testDb.db.insert(webhookEndpoint).values({
    id: endpointId,
    workspaceId,
    name: "Receiver",
    url: RECEIVER_URL,
    secret: "test-secret",
    events: ["tag_created"],
    ...endpoint,
  });
  await testDb.db
    .insert(workspaceEvent)
    .values({ id: eventId, workspaceId, type: "tag_created" });
  await testDb.db.insert(webhookDelivery).values({
    id: deliveryId,
    webhookEndpointId: endpointId,
    eventId,
    workspaceId,
    url: RECEIVER_URL,
    ...delivery,
  });

  return {
    workspaceId,
    async deliver() {
      const message = {
        id: createRecordId(),
        body: { type: "webhook.delivery", deliveryId },
        timestamp: new Date(),
        attempts: 1,
        ack: vi.fn<() => void>(),
        retry: vi.fn<(options?: QueueRetryOptions) => void>(),
      } satisfies Message<WebhookMessage>;
      await handleWebhookDeliveryQueue({
        queue: "marble-webhook-deliveries",
        messages: [message],
        metadata: { metrics: { backlogCount: 1, backlogBytes: 100 } },
        ackAll: vi.fn<() => void>(),
        retryAll: vi.fn<(options?: QueueRetryOptions) => void>(),
      });
      return message;
    },
    delivery: () =>
      testDb.db.query.webhookDelivery.findFirst({
        where: eq(webhookDelivery.id, deliveryId),
      }),
    attempts: () =>
      testDb.db.query.webhookDeliveryAttempt.findMany({
        where: eq(webhookDeliveryAttempt.deliveryId, deliveryId),
      }),
    endpoint: () =>
      testDb.db.query.webhookEndpoint.findFirst({
        where: eq(webhookEndpoint.id, endpointId),
      }),
    usage: () =>
      testDb.db.query.usageEvent.findMany({
        where: eq(usageEvent.workspaceId, workspaceId),
      }),
  };
}

function unreadableBody() {
  return new ReadableStream({
    start(controller) {
      controller.error(new Error("connection reset"));
    },
  });
}

describe("webhook receiver cooldowns", () => {
  it.each([429, 503])(
    "persists and schedules Retry-After on %i even if the response body fails",
    async (status) => {
      const f = await fixture();
      mocks.fetch.mockResolvedValue(
        new Response(unreadableBody(), {
          status,
          headers: { "retry-after": "120" },
        })
      );

      const message = await f.deliver();

      expect(await f.delivery()).toMatchObject({
        status: "retrying",
        nextRetryAt: new Date("2026-10-13T12:02:01.000Z"),
      });
      expect(await f.attempts()).toMatchObject([
        { attemptNumber: 1, statusCode: status, success: false },
      ]);
      expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 1 });
      expect(message.retry).toHaveBeenCalledExactlyOnceWith({
        delaySeconds: 121,
      });
      expect(message.ack).not.toHaveBeenCalled();
    }
  );

  it("requeues an early duplicate and sends only once the cooldown expires", async () => {
    const nextRetryAt = new Date("2026-10-13T12:02:00.000Z");
    const f = await fixture({
      status: "retrying",
      attemptCount: 1,
      nextRetryAt,
    });

    const early = await f.deliver();

    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(early.body, {
      delaySeconds: 120,
    });
    expect(early.ack).toHaveBeenCalledOnce();
    expect(early.retry).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(await f.attempts()).toEqual([]);
    expect(await f.delivery()).toMatchObject({
      status: "retrying",
      attemptCount: 1,
      nextRetryAt,
    });

    vi.setSystemTime(nextRetryAt);
    mocks.fetch.mockResolvedValue(
      new Response(unreadableBody(), { status: 200 })
    );
    const due = await f.deliver();

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(await f.attempts()).toMatchObject([
      { attemptNumber: 2, statusCode: 200, success: true },
    ]);
    expect(await f.delivery()).toMatchObject({
      status: "success",
      deliveredAt: nextRetryAt,
      nextRetryAt: null,
    });
    expect(due.ack).toHaveBeenCalledOnce();
    expect(due.retry).not.toHaveBeenCalled();
  });

  it("chunks long cooldowns without shortening the persisted deadline", async () => {
    const f = await fixture();
    mocks.fetch.mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "retry-after": "Fri, 16 Oct 2026 12:00:00 GMT" },
      })
    );

    const message = await f.deliver();

    expect(await f.delivery()).toMatchObject({
      status: "retrying",
      nextRetryAt: new Date("2026-10-16T12:00:01.000Z"),
    });
    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(message.body, {
      delaySeconds: 86_400,
    });
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("keeps a deferred message unacked when the queue rejects the replacement", async () => {
    const f = await fixture({
      status: "retrying",
      nextRetryAt: new Date("2026-10-13T12:02:00.000Z"),
    });
    mocks.enqueue.mockRejectedValue(new Error("queue unavailable"));

    const message = await f.deliver();

    expect(message.ack).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("schedules an hourly retry after the eleventh 500", async () => {
    const f = await fixture({ status: "retrying", attemptCount: 10 });
    mocks.fetch.mockResolvedValue(new Response(null, { status: 500 }));

    const message = await f.deliver();

    expect(await f.delivery()).toMatchObject({
      status: "retrying",
      nextRetryAt: new Date("2026-10-13T13:00:01.000Z"),
    });
    expect(message.retry).toHaveBeenCalledExactlyOnceWith({
      delaySeconds: 3601,
    });
    expect(message.ack).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it("records a network failure and retries in one minute", async () => {
    const f = await fixture();
    mocks.fetch.mockRejectedValue(new Error("DNS resolution failed"));

    const message = await f.deliver();

    expect(await f.attempts()).toMatchObject([
      {
        attemptNumber: 1,
        success: false,
        errorMessage: "DNS resolution failed",
      },
    ]);
    expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 1 });
    expect(await f.delivery()).toMatchObject({
      status: "retrying",
      nextRetryAt: new Date("2026-10-13T12:01:01.000Z"),
    });
    expect(message.retry).toHaveBeenCalledExactlyOnceWith({ delaySeconds: 61 });
    expect(message.ack).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "a receiver cooldown",
      respond: () =>
        new Response(null, { status: 429, headers: { "retry-after": "120" } }),
    },
    {
      name: "a network failure",
      respond: () => Promise.reject(new Error("connection refused")),
    },
  ])("ends after $name on the final attempt", async ({ respond }) => {
    const f = await fixture({
      status: "retrying",
      attemptCount: 34,
      maxAttempts: 35,
    });
    mocks.fetch.mockImplementation(async () => respond());

    const message = await f.deliver();

    expect(await f.delivery()).toMatchObject({
      status: "failed",
      failedAt: NOW,
      nextRetryAt: null,
    });
    expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 1 });
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it("clears the cooldown without sending when the attempt budget is spent", async () => {
    const f = await fixture({
      status: "retrying",
      attemptCount: 3,
      maxAttempts: 3,
      nextRetryAt: new Date("2026-10-13T12:02:00.000Z"),
    });

    const message = await f.deliver();

    expect(await f.delivery()).toMatchObject({
      status: "failed",
      attemptCount: 3,
      nextRetryAt: null,
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalledOnce();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});

describe("webhook delivery ownership", () => {
  it("does not make a second request while a delivery is in flight", async () => {
    const f = await fixture();
    mocks.fetch.mockImplementationOnce(async () => {
      const duplicate = await f.deliver();
      expect(duplicate.retry).toHaveBeenCalledExactlyOnceWith();
      expect(duplicate.ack).not.toHaveBeenCalled();
      return new Response(null, { status: 204 });
    });

    const first = await f.deliver();

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(await f.delivery()).toMatchObject({
      status: "success",
      attemptCount: 1,
    });
    expect(first.ack).toHaveBeenCalledOnce();
  });

  it.each([
    {
      name: "a cooldown header",
      respond: () =>
        new Response(null, { status: 429, headers: { "retry-after": "120" } }),
    },
    {
      name: "a network error",
      respond: () => Promise.reject(new Error("connection reset")),
    },
  ])(
    "ignores $name from a worker whose lease was reclaimed",
    async ({ respond }) => {
      const f = await fixture();
      mocks.fetch
        .mockImplementationOnce(async () => {
          vi.setSystemTime(new Date("2026-10-13T12:05:00.000Z"));
          const replacement = await f.deliver();
          expect(replacement.ack).toHaveBeenCalledOnce();
          return respond();
        })
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      const stale = await f.deliver();

      expect(mocks.fetch).toHaveBeenCalledTimes(2);
      expect(await f.delivery()).toMatchObject({
        status: "success",
        attemptCount: 2,
        nextRetryAt: null,
      });
      expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
      expect(await f.usage()).toMatchObject([
        { type: "webhook_delivery", endpoint: RECEIVER_URL },
      ]);
      expect(stale.ack).toHaveBeenCalledOnce();
      expect(stale.retry).not.toHaveBeenCalled();
      expect(mocks.enqueue).not.toHaveBeenCalled();
    }
  );
});

describe("webhook endpoint outcomes", () => {
  it("does not count an unsent request when signing fails", async () => {
    const f = await fixture({}, { secret: "" });

    const message = await f.deliver();

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(await f.attempts()).toEqual([]);
    expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
    expect(message.retry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(["delivery", "workspace"] as const)(
    "does not count an unsent request when the %s cannot be read",
    async (source) => {
      const f = await fixture();
      const query =
        source === "delivery"
          ? testDb.db.query.webhookDelivery
          : testDb.db.query.workspace;
      vi.spyOn(query, "findFirst").mockRejectedValueOnce(
        new Error("database unavailable")
      );

      const message = await f.deliver();

      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(await f.attempts()).toEqual([]);
      expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
      expect(message.retry).toHaveBeenCalledExactlyOnceWith();
    }
  );

  it("does not count a failure if the HTTP attempt cannot be saved", async () => {
    const f = await fixture();
    mocks.fetch.mockResolvedValue(new Response(null, { status: 500 }));
    await testDb.db.execute(
      sql`ALTER TABLE webhook_delivery_attempt ADD CONSTRAINT test_reject_attempt CHECK (false) NOT VALID`
    );
    try {
      const message = await f.deliver();

      expect(mocks.fetch).toHaveBeenCalledOnce();
      expect(await f.attempts()).toEqual([]);
      expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
      expect(message.retry).toHaveBeenCalledExactlyOnceWith();
    } finally {
      await testDb.db.execute(
        sql`ALTER TABLE webhook_delivery_attempt DROP CONSTRAINT test_reject_attempt`
      );
    }
  });

  it("leaves the delivery for retry if its endpoint outcome cannot be saved", async () => {
    const f = await fixture();
    mocks.fetch.mockResolvedValue(new Response(null, { status: 500 }));
    await testDb.db.execute(
      sql`ALTER TABLE webhook_endpoint ADD CONSTRAINT test_reject_failure CHECK ("consecutiveFailures" = 0) NOT VALID`
    );
    try {
      const message = await f.deliver();

      expect(await f.attempts()).toMatchObject([{ statusCode: 500 }]);
      expect(await f.delivery()).toMatchObject({
        status: "sending",
        nextRetryAt: null,
      });
      expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
      expect(message.retry).toHaveBeenCalledExactlyOnceWith();
    } finally {
      await testDb.db.execute(
        sql`ALTER TABLE webhook_endpoint DROP CONSTRAINT test_reject_failure`
      );
    }
  });

  it("preserves a success and clears the incident when usage accounting fails", async () => {
    const f = await fixture(
      {},
      { consecutiveFailures: 2, failureIncidentId: "incident" }
    );
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await testDb.db.execute(
      sql`ALTER TABLE usage_event ADD CONSTRAINT test_reject_usage CHECK (false) NOT VALID`
    );
    try {
      const message = await f.deliver();

      expect(await f.delivery()).toMatchObject({ status: "success" });
      expect(await f.endpoint()).toMatchObject({
        consecutiveFailures: 0,
        failureIncidentId: null,
      });
      expect(message.ack).toHaveBeenCalledOnce();
      expect(message.retry).not.toHaveBeenCalled();
    } finally {
      await testDb.db.execute(
        sql`ALTER TABLE usage_event DROP CONSTRAINT test_reject_usage`
      );
    }
  });

  it("alerts the owner when quota is exhausted without counting an endpoint failure", async () => {
    const f = await fixture();
    const userId = createRecordId();
    const email = `${userId}@test.invalid`;
    await testDb.db.insert(user).values({
      id: userId,
      name: "Owner",
      email,
      emailVerified: true,
    });
    await testDb.db
      .insert(member)
      .values({ organizationId: f.workspaceId, userId, role: "owner" });
    await testDb.db.insert(usageEvent).values(
      Array.from({ length: 100 }, () => ({
        type: "webhook_delivery" as const,
        workspaceId: f.workspaceId,
      }))
    );

    const message = await f.deliver();

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(await f.attempts()).toEqual([]);
    expect(await f.endpoint()).toMatchObject({ consecutiveFailures: 0 });
    expect(await f.delivery()).toMatchObject({ status: "failed" });
    expect(mocks.sendUsageLimitEmail).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({
        userEmail: [email],
        usageAmount: 100,
        limitAmount: 100,
      })
    );
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it("skips normal deliveries to a disabled endpoint", async () => {
    const f = await fixture({}, { enabled: false });

    const message = await f.deliver();

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(await f.attempts()).toEqual([]);
    expect(await f.delivery()).toMatchObject({ status: "failed" });
    expect(message.ack).toHaveBeenCalledOnce();
  });

  it.each([
    { status: 204, remainingFailures: 0 },
    { status: 400, remainingFailures: 2 },
  ])(
    "lets a manual $status reach a disabled endpoint without using quota",
    async ({ status, remainingFailures }) => {
      const f = await fixture(
        { isTest: true },
        {
          enabled: false,
          consecutiveFailures: 2,
          failureIncidentId: "incident",
        }
      );
      mocks.fetch.mockResolvedValue(new Response(null, { status }));

      await f.deliver();

      expect(await f.attempts()).toMatchObject([{ statusCode: status }]);
      expect(await f.endpoint()).toMatchObject({
        enabled: false,
        consecutiveFailures: remainingFailures,
      });
      expect(await f.usage()).toEqual([]);
    }
  );
});
