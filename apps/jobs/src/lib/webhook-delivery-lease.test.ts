import { schema } from "@marble/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimWebhookDeliveryAttempt,
  renewWebhookDeliveryLease,
  updateWebhookDeliveryForLease,
} from "./webhook-delivery-lease";
import { WebhookDeliveryDeferredError } from "./webhook-retry";

// Exercise the real Drizzle queries and row decoding without a local Postgres.
// The scripted driver results cover claim/lease outcomes; SQL assertions cover
// the atomic cooldown and stale-owner guards, rather than emulating a database.
const query = vi.hoisted(() =>
  vi.fn<
    (
      config: { text: string },
      params: unknown[]
    ) => Promise<{ rows: unknown[][] }>
  >()
);

vi.mock("cloudflare:workers", () => ({ env: {} }));

const NOW = new Date("2026-10-13T12:00:00.000Z");
const LEASE = { deliveryId: "delivery-1", attemptNumber: 2, claimedAt: NOW };

function makeDb() {
  const db = drizzle.mock({ schema });
  const client: unknown = db.$client;
  if (!client || typeof client !== "object") {
    throw new Error("Expected Drizzle's mock client to be an object");
  }
  Reflect.set(client, "query", query);
  return db;
}

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ rows: [] });
});

describe("webhook delivery cooldown leases", () => {
  it("atomically checks the cooldown before incrementing and clears it on claim", async () => {
    query.mockResolvedValueOnce({
      rows: [["delivery-1", 2, NOW.toISOString().slice(0, -1)]],
    });
    expect(
      await claimWebhookDeliveryAttempt(makeDb(), "delivery-1", NOW)
    ).toEqual(LEASE);
    const sql = query.mock.calls[0]?.[0].text;
    expect(sql).toContain('"webhook_delivery"."nextRetryAt" is null');
    expect(sql).toMatch(/"webhook_delivery"\."nextRetryAt" <= \$\d+/);
    expect(sql).toContain(
      '"attemptCount" = "webhook_delivery"."attemptCount" + 1'
    );
    expect(sql).toMatch(/"nextRetryAt" = \$\d+/);
    expect(query.mock.calls[0]?.[1]).toContain(null);
    expect(query.mock.calls[0]?.[1]).toContain(NOW.toISOString());
  });

  it("returns the persisted future deadline without creating an HTTP attempt", async () => {
    const retryAt = new Date(NOW.getTime() + 120_000);
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [["retrying", retryAt.toISOString().slice(0, -1)]],
      });
    await expect(
      claimWebhookDeliveryAttempt(makeDb(), "delivery-1", NOW)
    ).rejects.toMatchObject({
      name: "WebhookDeliveryDeferredError",
      retryAt,
    });
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("terminates exhausted attempts and clears cooldown rather than requeueing", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [["delivery-1"]] });
    expect(
      await claimWebhookDeliveryAttempt(makeDb(), "delivery-1", NOW)
    ).toBeNull();
    const sql = query.mock.calls[1]?.[0].text;
    expect(sql).toContain(
      '"webhook_delivery"."attemptCount" >= "webhook_delivery"."maxAttempts"'
    );
    expect(sql).toMatch(/"nextRetryAt" = \$\d+/);
    expect(query.mock.calls[1]?.[1]).toContain(null);
  });

  it("keeps an active lease distinct from a deferred retry", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [["sending", null]] });
    const claim = claimWebhookDeliveryAttempt(makeDb(), "delivery-1", NOW);
    await expect(claim).rejects.toThrow("already being processed");
    await expect(claim).rejects.not.toBeInstanceOf(
      WebhookDeliveryDeferredError
    );
  });

  it("guards cooldown writes and renewals with the exact lease owner", async () => {
    const db = makeDb();
    expect(
      await updateWebhookDeliveryForLease(db, LEASE, {
        status: "retrying",
        nextRetryAt: new Date(NOW.getTime() + 120_000),
      })
    ).toEqual({ count: 0 });
    expect(await renewWebhookDeliveryLease(db, LEASE, NOW)).toBeNull();
    for (const [config, params] of query.mock.calls) {
      expect(config.text).toMatch(/"webhook_delivery"\."status" = \$\d+/);
      expect(config.text).toMatch(/"webhook_delivery"\."attemptCount" = \$\d+/);
      expect(config.text).toMatch(
        /"webhook_delivery"\."lastAttemptAt" = \$\d+/
      );
      expect(params).toContain("sending");
      expect(params).toContain(LEASE.attemptNumber);
      expect(params).toContain(LEASE.claimedAt.toISOString());
    }
  });
});
