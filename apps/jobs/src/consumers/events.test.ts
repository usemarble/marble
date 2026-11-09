import { createRecordId } from "@marble/db/id";
import {
  webhookDelivery,
  webhookEndpoint,
  workspace,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { EventMessage, WebhookMessage } from "@/types/env";
import { handleEventQueue } from "./events";

const mocks = vi.hoisted(() => ({
  database: { current: null as TestDatabase | null },
  enqueue: vi.fn<(body: WebhookMessage) => Promise<void>>(),
}));
vi.mock("cloudflare:workers", () => ({
  env: { WEBHOOK_DELIVERY_QUEUE: { send: mocks.enqueue } },
}));
vi.mock("@/lib/db", () => ({
  createDbClient: () => mocks.database.current?.db,
}));

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
  mocks.database.current = testDb;
});
afterAll(async () => {
  await testDb.close();
});
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.enqueue.mockResolvedValue(undefined);
  await testDb.db.delete(workspace);
});

async function seedEvent() {
  const [organization] = await testDb.db
    .insert(workspace)
    .values({ name: "Test Workspace", slug: createRecordId() })
    .returning();
  if (!organization) {
    throw new Error("Could not seed workspace");
  }
  const [endpoint] = await testDb.db
    .insert(webhookEndpoint)
    .values({
      name: "Receiver",
      url: `https://receiver.staging.invalid/${createRecordId()}`,
      secret: "test-secret",
      workspaceId: organization.id,
      events: ["tag_created"],
    })
    .returning();
  const [event] = await testDb.db
    .insert(workspaceEvent)
    .values({ workspaceId: organization.id, type: "tag_created" })
    .returning();
  if (!endpoint || !event) {
    throw new Error("Could not seed event");
  }
  return { endpoint, event };
}

async function fanOut(body: EventMessage) {
  const message = {
    id: "queue-message-1",
    body,
    timestamp: new Date(),
    attempts: 1,
    ack: vi.fn<() => void>(),
    retry: vi.fn<(options?: QueueRetryOptions) => void>(),
  } satisfies Message<EventMessage>;
  await handleEventQueue({
    queue: "marble-events",
    messages: [message],
    metadata: { metrics: { backlogCount: 1, backlogBytes: 100 } },
    ackAll: vi.fn<() => void>(),
    retryAll: vi.fn<(options?: QueueRetryOptions) => void>(),
  });
  return message;
}

describe("webhook delivery attempt budget", () => {
  it.each([
    { isTest: false, maxAttempts: 35 },
    { isTest: true, maxAttempts: 3 },
  ])(
    "creates a delivery with isTest $isTest and $maxAttempts attempts",
    async ({ isTest, maxAttempts }) => {
      const { endpoint, event } = await seedEvent();

      const message = await fanOut({
        type: "event.fanout",
        eventId: event.id,
        targetWebhookEndpointId: isTest ? endpoint.id : undefined,
        isTest,
      });

      const deliveries = await testDb.db
        .select({
          id: webhookDelivery.id,
          status: webhookDelivery.status,
          isTest: webhookDelivery.isTest,
          maxAttempts: webhookDelivery.maxAttempts,
        })
        .from(webhookDelivery)
        .where(eq(webhookDelivery.eventId, event.id));
      expect(deliveries).toEqual([
        {
          id: expect.any(String),
          status: "pending",
          isTest,
          maxAttempts,
        },
      ]);
      expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith({
        type: "webhook.delivery",
        deliveryId: deliveries[0]?.id,
      });
      expect(message.ack).toHaveBeenCalledOnce();
    }
  );
});
