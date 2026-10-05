import { createHmac } from "node:crypto";
import type { DbClient } from "@marble/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearWorkspacePlan } from "../access";
import { createAuth } from "../index";
import { testEnv } from "../test-env";

vi.mock("../access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../access")>()),
  clearWorkspacePlan: vi.fn().mockResolvedValue(undefined),
}));

const secret = `whsec_${Buffer.from("test-signing-key-for-polar-webhooks").toString("base64")}`;
const eventTimestamp = "2026-10-04T13:16:51.000Z";
const body = JSON.stringify({
  type: "subscription.created",
  timestamp: eventTimestamp,
  api_version: "2026-10",
  data: {
    id: "subscription-test",
    metadata: { referenceId: "workspace-test" },
    customer: { external_id: "user-test" },
    product: { name: "Pro" },
    status: "active",
    current_period_start: "2026-10-04T00:00:00Z",
    current_period_end: "2026-11-04T00:00:00Z",
    cancel_at_period_end: false,
    recurring_interval: "month",
    started_at: "2026-10-04T00:00:00Z",
    product_id: "product-test",
    amount: 2000,
    currency: "usd",
    discount_id: null,
  },
});

function signedRequest(scheme: "standard" | "legacy", tamper = false) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const id = "webhook-test";
  const key =
    scheme === "standard"
      ? Buffer.from(secret.slice("whsec_".length), "base64")
      : Buffer.from(secret);
  const signature = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return new Request("http://localhost:8787/api/auth/polar/webhooks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    },
    body: tamper ? body.replace("2000", "9000") : body,
  });
}

function setup() {
  const values = vi.fn().mockResolvedValue(undefined);
  const db = {
    query: {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "user-test" }) },
      workspace: {
        findFirst: vi.fn().mockResolvedValue({ id: "workspace-test" }),
      },
      subscription: { findFirst: vi.fn().mockResolvedValue(undefined) },
    },
    insert: vi.fn().mockReturnValue({ values }),
  };
  const auth = createAuth({
    db: db as unknown as DbClient,
    env: testEnv({ POLAR_WEBHOOK_SECRET: secret }),
  });
  return { auth, db, values };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Polar webhook signatures", () => {
  it.each(["standard", "legacy"] as const)(
    "accepts %s signatures and stores the 2026-10 subscription payload",
    async (scheme) => {
      vi.spyOn(console, "log").mockImplementation(() => undefined);
      const { auth, values } = setup();
      const response = await auth.handler(signedRequest(scheme));
      expect(response.status).toBe(200);
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          polarId: "subscription-test",
          userId: "user-test",
          workspaceId: "workspace-test",
          currentPeriodStart: new Date("2026-10-04T00:00:00Z"),
          currentPeriodEnd: new Date("2026-11-04T00:00:00Z"),
          startedAt: new Date("2026-10-04T00:00:00Z"),
          lastPolarEventAt: new Date(eventTimestamp),
          productId: "product-test",
          cancelAtPeriodEnd: false,
          recurringInterval: "month",
          amount: 2000,
        })
      );
      expect(clearWorkspacePlan).toHaveBeenCalledWith(
        expect.anything(),
        "workspace-test"
      );
    }
  );

  it("rejects a modified body before invoking the subscription handler", async () => {
    const { auth, db, values } = setup();
    const response = await auth.handler(signedRequest("standard", true));
    expect(response.status).toBe(403);
    expect(db.query.user.findFirst).not.toHaveBeenCalled();
    expect(values).not.toHaveBeenCalled();
  });
});
