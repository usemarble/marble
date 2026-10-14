import { createRecordId } from "@marble/db/id";
import { member, user, workspace } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { Redis } from "@upstash/redis";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vitest";
import { testEnv } from "../test-env";
import { startWorkspaceCheckout } from "./checkout";
import { createPolarAuthClient } from "./client";

let testDb: TestDatabase;
const env = testEnv({ REDIS_TOKEN: "justusemarble" });
const redis = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
const polar = createPolarAuthClient(env.POLAR_ACCESS_TOKEN, "sandbox");
const keys: string[] = [];
let created: Record<string, unknown> | null;
let createCount: number;
let subscriptions: Record<string, unknown>[];
let metadataWorkspaceId: string | null;
let beforeCreate: () => Promise<void>;

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});
beforeEach(() => {
  created = null;
  createCount = 0;
  subscriptions = [];
  metadataWorkspaceId = null;
  beforeCreate = () => Promise.resolve();
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      );
      // Only Polar is simulated; Postgres and Redis use the local containers.
      if (url.hostname !== "sandbox-api.polar.sh") {
        return nativeFetch(input, init);
      }
      if (url.pathname === "/v1/subscriptions/") {
        metadataWorkspaceId = url.searchParams.get("metadata[referenceId]");
        return Response.json({
          items: subscriptions,
          pagination: { total_count: subscriptions.length, max_page: 1 },
        });
      }
      if (url.pathname === "/v1/checkouts/" && init?.method === "POST") {
        await beforeCreate();
        createCount += 1;
        const body = JSON.parse(String(init.body));
        created = {
          id: createRecordId(),
          status: "open",
          url: "https://sandbox.polar.sh/checkout/test",
          external_customer_id: body.external_customer_id,
          metadata: body.metadata,
          expires_at: new Date(Date.now() + 86_400_000).toISOString(),
          product_id: body.products[0],
          products: body.products.map((id: string) => ({ id })),
        };
        return Response.json(created);
      }
      if (url.pathname === "/v1/checkouts/") {
        return Response.json({
          items: created ? [created] : [],
          pagination: { total_count: created ? 1 : 0, max_page: 1 },
        });
      }
      if (created && url.pathname === `/v1/checkouts/${created.id}`) {
        return Response.json(created);
      }
      throw new Error(`Unexpected Polar request: ${url.pathname}`);
    })
  );
});
afterEach(async () => {
  vi.unstubAllGlobals();
  if (keys.length) {
    await redis.del(...keys.splice(0));
  }
});

async function fixture() {
  const userId = createRecordId();
  const workspaceId = createRecordId();
  await testDb.db.insert(user).values({
    id: userId,
    name: "Checkout Owner",
    email: `${userId}@test.invalid`,
    emailVerified: true,
  });
  await testDb.db
    .insert(workspace)
    .values({ id: workspaceId, name: "Checkout Test", slug: workspaceId });
  await testDb.db.insert(member).values({
    id: createRecordId(),
    organizationId: workspaceId,
    userId,
    role: "owner",
  });
  const key = `billing:checkout:dev:sandbox:${workspaceId}`;
  keys.push(key, `${key}:lock`);
  return {
    workspaceId,
    start: () =>
      startWorkspaceCheckout({
        db: testDb.db,
        redis,
        polar,
        env,
        userId,
        body: { slug: "pro", reference_id: workspaceId },
      }),
  };
}

it("uses the real Redis lock and reservation to serialize and reuse checkout", async () => {
  const f = await fixture();
  let finish!: () => void;
  let started!: () => void;
  const starting = new Promise<void>((resolve) => {
    started = resolve;
  });
  beforeCreate = () =>
    new Promise<void>((resolve) => {
      finish = resolve;
      started();
    });
  const first = f.start();
  await starting;
  await expect(f.start()).rejects.toThrow("Checkout is already being prepared");
  finish();
  const result = await first;
  expect(await f.start()).toEqual(result);
  expect(createCount).toBe(1);
  expect(metadataWorkspaceId).toBe(f.workspaceId);
});

it("checks Polar through the SDK before a missing webhook can allow a second checkout", async () => {
  const f = await fixture();
  subscriptions = [{ id: "already-paid", status: "active", ended_at: null }];
  await expect(f.start()).rejects.toThrow(
    "This workspace already has a subscription"
  );
  expect(metadataWorkspaceId).toBe(f.workspaceId);
  expect(createCount).toBe(0);
});
