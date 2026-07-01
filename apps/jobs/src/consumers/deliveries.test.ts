import { describe, expect, it, vi } from "vitest";

vi.mock("@marble/events", () => ({
  buildWebhookPayload: vi.fn(),
  serializeEventType: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ createDbClient: vi.fn() }));
vi.mock("@/lib/formats", () => ({ buildWebhookRequestBody: vi.fn() }));
vi.mock("@/lib/signing", () => ({ signPayload: vi.fn() }));
vi.mock("@/lib/usage", () => ({
  checkWebhookUsage: vi.fn(),
  recordWebhookUsage: vi.fn(),
  sendWebhookUsageAlert: vi.fn(),
}));

import { WEBHOOK_DELIVERY_STALE_SENDING_MS } from "@/lib/constants";
import { claimWebhookDeliveryAttempt } from "./deliveries";

function createDb({
  activeClaimCount,
  staleClaimCount,
  status,
}: {
  activeClaimCount: number;
  staleClaimCount: number;
  status?: string;
}) {
  const updateMany = vi
    .fn()
    .mockResolvedValueOnce({ count: activeClaimCount })
    .mockResolvedValueOnce({ count: staleClaimCount });
  const findUnique = vi
    .fn()
    .mockResolvedValue(status === undefined ? null : { status });

  return {
    webhookDelivery: {
      updateMany,
      findUnique,
    },
  };
}

describe("claimWebhookDeliveryAttempt", () => {
  it("claims pending or retrying deliveries for a new attempt", async () => {
    const now = new Date("2026-06-30T12:00:00.000Z");
    const db = createDb({ activeClaimCount: 1, staleClaimCount: 0 });

    await expect(
      claimWebhookDeliveryAttempt(db as never, "delivery_1", now)
    ).resolves.toBe(true);

    expect(db.webhookDelivery.updateMany).toHaveBeenCalledTimes(1);
    expect(db.webhookDelivery.updateMany).toHaveBeenCalledWith({
      where: {
        id: "delivery_1",
        status: { in: ["pending", "retrying"] },
      },
      data: {
        status: "sending",
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
      },
    });
    expect(db.webhookDelivery.findUnique).not.toHaveBeenCalled();
  });

  it("reclaims stale sending deliveries instead of acknowledging them", async () => {
    const now = new Date("2026-06-30T12:00:00.000Z");
    const db = createDb({ activeClaimCount: 0, staleClaimCount: 1 });

    await expect(
      claimWebhookDeliveryAttempt(db as never, "delivery_1", now)
    ).resolves.toBe(true);

    expect(db.webhookDelivery.updateMany).toHaveBeenCalledTimes(2);
    expect(db.webhookDelivery.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "delivery_1",
        status: "sending",
        OR: [
          {
            lastAttemptAt: {
              lt: new Date(
                now.getTime() - WEBHOOK_DELIVERY_STALE_SENDING_MS
              ),
            },
          },
          { lastAttemptAt: null },
        ],
      },
      data: {
        status: "sending",
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
      },
    });
    expect(db.webhookDelivery.findUnique).not.toHaveBeenCalled();
  });

  it("keeps active sending deliveries on the queue retry path", async () => {
    const now = new Date("2026-06-30T12:00:00.000Z");
    const db = createDb({
      activeClaimCount: 0,
      staleClaimCount: 0,
      status: "sending",
    });

    await expect(
      claimWebhookDeliveryAttempt(db as never, "delivery_1", now)
    ).rejects.toThrow("Webhook delivery delivery_1 is already sending");
  });

  it("skips terminal or missing deliveries", async () => {
    const now = new Date("2026-06-30T12:00:00.000Z");
    const db = createDb({
      activeClaimCount: 0,
      staleClaimCount: 0,
      status: "success",
    });

    await expect(
      claimWebhookDeliveryAttempt(db as never, "delivery_1", now)
    ).resolves.toBe(false);
  });
});
