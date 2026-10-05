import { workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { transact } from "../lib/transaction";
import { createTestContext, createTestQueue, seedWorkspace } from "../testing";
import { sweepEvents } from "./events";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

// The sweep looks across every workspace, so each test starts from no events.
beforeEach(async () => {
  await testDb.db.delete(workspaceEvent);
});

const eventRows = (workspaceId: string) =>
  testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.workspaceId, workspaceId),
  });

const postCreated = (workspaceId: string) => ({
  type: "post_created" as const,
  workspaceId,
  resourceType: "post" as const,
  resourceId: "post_1",
  payload: { title: "Hello" },
});

describe("outbox", () => {
  it("writes the event row with the transaction and sends it after the commit", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    const { context, events, flush } = createTestContext(testDb.db);

    await transact(context, async ({ emitEvent }) => {
      await emitEvent(postCreated(workspaceId));
      // Nothing is sent while the transaction is still open.
      expect(events.sent).toEqual([]);
    });
    await flush();

    const [row] = await eventRows(workspaceId);
    expect(row).toMatchObject({ type: "post_created", resourceId: "post_1" });
    expect(row?.enqueuedAt).toBeInstanceOf(Date);
    expect(events.sent).toEqual([{ type: "event.fanout", eventId: row?.id }]);
  });

  it("writes no row and sends nothing when the transaction rolls back", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    const { context, events, flush } = createTestContext(testDb.db);

    await expect(
      transact(context, async ({ emitEvent }) => {
        await emitEvent(postCreated(workspaceId));
        throw new Error("the write failed");
      })
    ).rejects.toThrow("the write failed");
    await flush();

    expect(await eventRows(workspaceId)).toEqual([]);
    expect(events.sent).toEqual([]);
  });

  it("keeps the committed row, unstamped, when the queue is down", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    const { context, events, flush } = createTestContext(testDb.db);
    events.queue.failing = true;

    await transact(context, ({ emitEvent }) =>
      emitEvent(postCreated(workspaceId))
    );
    await flush();

    const [row] = await eventRows(workspaceId);
    expect(row).toBeDefined();
    expect(row?.enqueuedAt).toBeNull();
  });
});

describe("sweepEvents", () => {
  async function strandedEvent(workspaceId: string) {
    const { context, events, flush } = createTestContext(testDb.db);
    events.queue.failing = true;
    await transact(context, ({ emitEvent }) =>
      emitEvent(postCreated(workspaceId))
    );
    await flush();
    const [row] = await eventRows(workspaceId);
    if (!row) {
      throw new Error("expected a stranded event");
    }
    return row;
  }

  it("re-sends an event that never reached the queue and stamps it", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    const stranded = await strandedEvent(workspaceId);
    const { queue, sent } = createTestQueue<never>();

    const later = new Date(Date.now() + 5 * 60_000);
    const enqueued = await sweepEvents(
      { db: testDb.db, queue },
      { now: later }
    );

    expect(enqueued).toBe(1);
    expect(sent).toEqual([{ type: "event.fanout", eventId: stranded.id }]);
    const [row] = await eventRows(workspaceId);
    expect(row?.enqueuedAt).toBeInstanceOf(Date);

    // A second pass has nothing left to do.
    expect(await sweepEvents({ db: testDb.db, queue }, { now: later })).toBe(0);
  });

  it("leaves a fresh event alone while its publish may still be in flight", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    await strandedEvent(workspaceId);
    const { queue, sent } = createTestQueue<never>();

    expect(await sweepEvents({ db: testDb.db, queue })).toBe(0);
    expect(sent).toEqual([]);
  });

  it("skips events that were already processed", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    const stranded = await strandedEvent(workspaceId);
    await testDb.db
      .update(workspaceEvent)
      .set({ processedAt: new Date() })
      .where(eq(workspaceEvent.id, stranded.id));
    const { queue, sent } = createTestQueue<never>();

    const later = new Date(Date.now() + 5 * 60_000);
    expect(await sweepEvents({ db: testDb.db, queue }, { now: later })).toBe(0);
    expect(sent).toEqual([]);
  });

  it("leaves the event for the next run when the queue is still down", async () => {
    const { id: workspaceId } = await seedWorkspace(testDb.db);
    await strandedEvent(workspaceId);
    const { queue } = createTestQueue<never>();
    queue.failing = true;

    const later = new Date(Date.now() + 5 * 60_000);
    expect(await sweepEvents({ db: testDb.db, queue }, { now: later })).toBe(0);
    const [row] = await eventRows(workspaceId);
    expect(row?.enqueuedAt).toBeNull();
  });
});
