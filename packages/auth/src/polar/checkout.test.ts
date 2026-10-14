import type { DbClient } from "@marble/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuth } from "../index";
import { testEnv } from "../test-env";

const state = vi.hoisted(() => ({
  session: { user: { id: "user-test" } } as { user: { id: string } } | null,
  subscriptions: [] as Record<string, unknown>[],
  checkouts: [] as Record<string, unknown>[],
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  listSubscriptions: vi.fn(),
  redisSet: vi.fn(),
  redisGet: vi.fn(),
  redisDel: vi.fn(),
  redisEval: vi.fn(),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    set = state.redisSet;
    get = state.redisGet;
    del = state.redisDel;
    eval = state.redisEval;
  },
}));

vi.mock("better-auth/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("better-auth/api")>()),
  getSessionFromCtx: vi.fn(async () => state.session),
}));

vi.mock("@polar-sh/sdk/2026-10/services/subscriptions", () => ({
  iterListSubscriptions: () => state.listSubscriptions,
}));
vi.mock("@polar-sh/sdk/2026-10/services/checkouts", () => ({
  createCheckouts: () => state.create,
  getCheckouts: () => state.get,
  updateCheckouts: () => state.update,
  iterListCheckouts: () =>
    async function* () {
      yield* state.checkouts;
    },
}));

const reservationKey = "billing:checkout:dev:sandbox:workspace-test";
let storage: Map<string, unknown>;

function checkout(overrides: Record<string, unknown> = {}) {
  return {
    id: "checkout-test",
    url: "https://sandbox.polar.sh/checkout/checkout-test",
    status: "open",
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    external_customer_id: "user-test",
    product_id: "pro-monthly",
    products: [{ id: "pro-monthly" }, { id: "hobby-monthly" }],
    metadata: { referenceId: "workspace-test" },
    ...overrides,
  };
}

function setup(existing = false) {
  const auth = createAuth({
    db: {
      query: {
        member: { findFirst: vi.fn().mockResolvedValue({ role: "owner" }) },
        subscription: {
          findFirst: vi
            .fn()
            .mockResolvedValue(existing ? { id: "existing" } : null),
        },
      },
    } as unknown as DbClient,
    env: testEnv(),
  });
  return (
    body: Record<string, unknown> = {
      slug: "pro",
      reference_id: "workspace-test",
    }
  ) =>
    auth.handler(
      new Request("http://localhost:8787/api/auth/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify(body),
      })
    );
}

beforeEach(() => {
  storage = new Map();
  state.session = { user: { id: "user-test" } };
  state.subscriptions = [];
  state.checkouts = [];
  state.create.mockReset().mockResolvedValue(checkout());
  state.get.mockReset().mockResolvedValue(checkout());
  state.update
    .mockReset()
    .mockResolvedValue(checkout({ product_id: "hobby-monthly" }));
  state.listSubscriptions.mockReset().mockImplementation(async function* () {
    yield* state.subscriptions;
  });
  state.redisSet
    .mockReset()
    .mockImplementation(
      async (key: string, value: unknown, options?: { nx?: boolean }) => {
        if (options && "nx" in options && options.nx && storage.has(key)) {
          return null;
        }
        storage.set(key, value);
        return "OK";
      }
    );
  state.redisGet
    .mockReset()
    .mockImplementation(async (key: string) => storage.get(key) ?? null);
  state.redisDel.mockReset().mockImplementation(async (...keys: string[]) => {
    for (const key of keys) {
      storage.delete(key);
    }
    return keys.length;
  });
  state.redisEval
    .mockReset()
    .mockImplementation(
      async (script: string, keys: string[], args: string[]) => {
        const key = String(keys[0]);
        if (storage.get(key) !== args?.[0]) {
          return 0;
        }
        if (script.includes("'del'")) {
          storage.delete(key);
        }
        return 1;
      }
    );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe("Polar checkout authorization", () => {
  it("checks workspace ownership for the adapter's reference_id field", async () => {
    const findFirst = vi.fn().mockResolvedValue({ role: "member" });
    const auth = createAuth({
      db: { query: { member: { findFirst } } } as unknown as DbClient,
      env: testEnv(),
    });
    const response = await auth.handler(
      new Request("http://localhost:8787/api/auth/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ slug: "pro", reference_id: "workspace-test" }),
      })
    );
    expect(response.status).toBe(403);
    expect(findFirst).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({
      message: "Only workspace owners can start checkout",
    });
  });
});

describe("Workspace subscription checkout", () => {
  it.each([
    { slug: "pro" },
    { slug: "pro", referenceId: "workspace-test" },
    { slug: "pro", metadata: { referenceId: "workspace-test" } },
  ])("requires an explicit workspace: %j", async (body) => {
    expect((await setup()(body)).status).toBe(400);
    expect(state.create).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    state.session = null;
    expect((await setup()()).status).toBe(401);
  });

  it("blocks a locally known subscription before contacting Polar", async () => {
    const response = await setup(true)();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "WORKSPACE_SUBSCRIPTION_EXISTS",
    });
    expect(state.listSubscriptions).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it.each([
    "active",
    "trialing",
    "past_due",
    "incomplete",
    "unpaid",
    "paused",
    "canceled",
  ])(
    "blocks Polar's %s subscription even before its webhook arrives",
    async (status) => {
      state.subscriptions = [
        {
          status,
          ended_at: null,
          current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
        },
      ];
      const response = await setup()();
      expect(response.status).toBe(409);
      expect(state.listSubscriptions).toHaveBeenCalledWith(
        { metadata: { referenceId: "workspace-test" }, limit: 100 },
        expect.anything()
      );
      expect(state.create).not.toHaveBeenCalled();
    }
  );

  it("creates a workspace checkout after checking Polar", async () => {
    const response = await setup()({
      slug: "pro",
      reference_id: "workspace-test",
      redirect: false,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: checkout().url,
      redirect: false,
    });
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({
        external_customer_id: "user-test",
        metadata: { referenceId: "workspace-test" },
        products: [
          "pro-monthly",
          "hobby-monthly",
          "hobby-yearly",
          "pro-yearly",
        ],
      }),
      expect.anything()
    );
  });

  it("reuses the same checkout on a later request", async () => {
    const request = setup();
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    expect(state.create).toHaveBeenCalledOnce();
    expect(state.get).toHaveBeenCalledWith("checkout-test", expect.anything());
  });

  it("changes the plan within the same unfinished checkout", async () => {
    state.checkouts = [checkout()];
    expect(
      (await setup()({ slug: "hobby", reference_id: "workspace-test" })).status
    ).toBe(200);
    expect(state.update).toHaveBeenCalledWith(
      "checkout-test",
      { product_id: "hobby-monthly" },
      expect.anything()
    );
    expect(state.create).not.toHaveBeenCalled();
  });

  it("serializes concurrent checkout creation", async () => {
    let finish!: (value: ReturnType<typeof checkout>) => void;
    let started!: () => void;
    const creating = new Promise<void>((resolve) => {
      started = resolve;
    });
    state.create.mockImplementation(() => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const request = setup();
    const first = request();
    await creating;
    expect((await request()).status).toBe(409);
    finish(checkout());
    expect((await first).status).toBe(200);
    expect(state.create).toHaveBeenCalledOnce();
  });

  it.each(["confirmed", "succeeded"])(
    "blocks a %s checkout while webhooks catch up",
    async (status) => {
      storage.set(reservationKey, { id: "checkout-test", userId: "user-test" });
      state.get.mockResolvedValue(checkout({ status }));
      expect((await setup()()).status).toBe(409);
      expect(state.create).not.toHaveBeenCalled();
    }
  );

  it("allows a new checkout after a subscription has actually ended", async () => {
    storage.set(reservationKey, { id: "old-checkout", userId: "user-test" });
    state.subscriptions = [
      {
        status: "canceled",
        ended_at: new Date().toISOString(),
        checkout_id: "old-checkout",
      },
    ];
    expect((await setup()()).status).toBe(200);
    expect(state.get).not.toHaveBeenCalled();
    expect(state.create).toHaveBeenCalledOnce();
  });

  it("stops if Polar billing cannot be verified", async () => {
    state.listSubscriptions.mockImplementation(() => {
      throw new Error("Polar unavailable");
    });
    expect((await setup()()).status).toBe(503);
    expect(state.create).not.toHaveBeenCalled();
    expect(storage.has(`${reservationKey}:lock`)).toBe(false);
  });

  it("preserves an ambiguous create and recovers it without another checkout", async () => {
    const request = setup();
    state.create.mockRejectedValueOnce(new Error("network timeout"));
    expect((await request()).status).toBe(503);
    expect((await request()).status).toBe(503);
    state.checkouts = [checkout()];
    expect((await request()).status).toBe(200);
    expect(state.create).toHaveBeenCalledOnce();
  });

  it("does not expose another owner's pending checkout", async () => {
    storage.set(reservationKey, { id: "checkout-test", userId: "other-owner" });
    state.get.mockResolvedValue(
      checkout({ external_customer_id: "other-owner" })
    );
    expect((await setup()()).status).toBe(409);
    expect(state.create).not.toHaveBeenCalled();
  });

  it("ignores another workspace's checkout", async () => {
    state.checkouts = [
      checkout({ metadata: { referenceId: "other-workspace" } }),
    ];
    expect((await setup()()).status).toBe(200);
    expect(state.create).toHaveBeenCalledOnce();
  });
});
