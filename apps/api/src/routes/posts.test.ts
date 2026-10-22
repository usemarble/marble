import { OpenAPIHono } from "@hono/zod-openapi";
import { createRecordId } from "@marble/db/id";
import {
  apiKey,
  author,
  category,
  post,
  workspace,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import type { ApiScope } from "@marble/utils/api-key-scopes";
import { eq } from "drizzle-orm";
import { createRequestLogger } from "evlog";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashApiKey } from "@/lib/crypto";
import { restrictLegacyPostStatus } from "@/lib/legacy-posts";
import { keyAuthorization } from "@/middleware/key-authorization";
import { scopeAuthorization } from "@/middleware/scope-authorization";
import {
  PostResponseSchema,
  PostsListResponseSchema,
  UpdatePostResponseSchema,
} from "@/schemas/posts";
import type { ApiKeyApp } from "@/types/env";
import posts from "./posts";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function fixture() {
  const workspaceId = createRecordId();
  const categoryId = createRecordId();
  const authorId = createRecordId();
  await testDb.db
    .insert(workspace)
    .values({ id: workspaceId, name: "Posts", slug: workspaceId });
  await testDb.db
    .insert(category)
    .values({ id: categoryId, workspaceId, name: "News", slug: "news" });
  await testDb.db
    .insert(author)
    .values({ id: authorId, workspaceId, name: "Writer", slug: "writer" });
  const rows = await testDb.db
    .insert(post)
    .values(
      (["published", "draft", "scheduled"] as const).map((status) => ({
        id: createRecordId(),
        workspaceId,
        categoryId,
        primaryAuthorId: authorId,
        title: `${status} post`,
        slug: status,
        status,
        content: "<p>Body</p>",
        contentJson: { type: "doc", content: [] },
        description: "Body",
        publishedAt: new Date("2030-05-01T15:30:00Z"),
      }))
    )
    .returning();
  const keys: Record<string, string> = {};
  for (const [name, type, scopes] of [
    ["public", "public", ["posts_read"]],
    ["private", "private", ["posts_read", "posts_write"]],
    [
      "unpublished",
      "private",
      ["posts_read", "posts_read_drafts", "posts_write"],
    ],
  ] satisfies [string, "public" | "private", ApiScope[]][]) {
    const key = createRecordId();
    keys[name] = key;
    await testDb.db.insert(apiKey).values({
      id: createRecordId(),
      workspaceId,
      name,
      key: await hashApiKey(key),
      preview: key.slice(0, 4),
      type,
      scopes,
    });
  }
  const app = new OpenAPIHono<ApiKeyApp>();
  app.use("*", async (c, next) => {
    c.set("db", testDb.db);
    c.set("log", createRequestLogger({}));
    await next();
  });
  app.use("/v1/*", keyAuthorization());
  app.use("/v1/*", scopeAuthorization());
  app.route("/v1/posts", posts);
  app.use("/legacy/*", async (c, next) => {
    c.set("workspaceId", workspaceId);
    await next();
  });
  app.route("/legacy/posts", posts);
  const deferred: Promise<unknown>[] = [];
  const env = {
    APP_URL: "http://localhost:3000",
    REDIS_URL: "http://localhost:8079",
    REDIS_TOKEN: "justusemarble",
    EVENT_QUEUE: { send: vi.fn(async () => undefined) },
    TASK_QUEUE: { send: vi.fn(async () => undefined) },
  };
  async function request(path: string, key?: string, body?: unknown) {
    const response = await app.request(
      `http://localhost${path}`,
      {
        method: body === undefined ? "GET" : "PATCH",
        headers: {
          ...(key ? { authorization: `Bearer ${key}` } : {}),
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      env,
      {
        waitUntil: (work: Promise<unknown>) => {
          deferred.push(work);
        },
        passThroughOnException: vi.fn(),
        props: {},
      }
    );
    await Promise.all(deferred.splice(0));
    return response;
  }
  const scheduled = rows.find((row) => row.status === "scheduled");
  if (!scheduled) {
    throw new Error("Missing scheduled fixture");
  }
  return { request, keys, rows, scheduled, workspaceId, env };
}

describe("public post status compatibility", () => {
  it("lists only public-contract statuses, including all with an unpublished-read private key", async () => {
    const f = await fixture();
    for (const [key, status, expected] of [
      [f.keys.public, "published", ["published"]],
      [f.keys.private, "published", ["published"]],
      [f.keys.unpublished, "all", ["draft", "published"]],
      [f.keys.unpublished, "draft", ["draft"]],
    ] as const) {
      const response = await f.request(`/v1/posts?status=${status}`, key);
      expect(response.status).toBe(200);
      const body = PostsListResponseSchema.parse(await response.json());
      expect(
        body.posts.map((row: { status: string }) => row.status).sort()
      ).toEqual(expected);
      expect(body.pagination.totalItems).toBe(expected.length);
    }
    const omitted = await f.request("/v1/posts", f.keys.public);
    expect(
      PostsListResponseSchema.parse(await omitted.json()).posts
    ).toMatchObject([
      { status: "published", publishedAt: "2030-05-01T15:30:00.000Z" },
    ]);
  });

  it.each(["draft", "all", "scheduled", "unknown", ""])(
    "requires a private key and unpublished scope for explicit %s reads",
    async (status) => {
      const f = await fixture();
      for (const path of ["/v1/posts", `/v1/posts/${f.scheduled.id}`]) {
        expect(
          (await f.request(`${path}?status=${status}`, f.keys.public)).status
        ).toBe(403);
        expect(
          (await f.request(`${path}?status=${status}`, f.keys.private)).status
        ).toBe(403);
        const response = await f.request(
          `${path}?status=${status}`,
          f.keys.unpublished
        );
        expect(response.status).toBe(
          status === "all" || status === "draft"
            ? path === "/v1/posts"
              ? 200
              : 404
            : 400
        );
      }
    }
  );

  it("excludes scheduled ID and slug lookups and preserves future-dated published posts", async () => {
    const f = await fixture();
    expect((await f.request("/v1/posts")).status).toBe(401);
    for (const identifier of [f.scheduled.id, f.scheduled.slug]) {
      for (const status of ["published", "draft", "all"]) {
        expect(
          (
            await f.request(
              `/v1/posts/${identifier}?status=${status}`,
              f.keys.unpublished
            )
          ).status
        ).toBe(404);
      }
      expect(
        (await f.request(`/v1/posts/${identifier}`, f.keys.public)).status
      ).toBe(404);
    }
    const published = f.rows.find((row) => row.status === "published");
    if (!published) {
      throw new Error("Missing published fixture");
    }
    for (const identifier of [published.id, published.slug]) {
      const response = await f.request(
        `/v1/posts/${identifier}`,
        f.keys.public
      );
      expect(response.status).toBe(200);
      expect(
        PostResponseSchema.parse(await response.json()).post
      ).toMatchObject({
        status: "published",
        publishedAt: "2030-05-01T15:30:00.000Z",
      });
    }
  });

  it("rejects scheduled PATCH targets including no-op bodies and scheduled input", async () => {
    const f = await fixture();
    const original = await testDb.db.query.post.findFirst({
      where: eq(post.id, f.scheduled.id),
    });
    for (const identifier of [f.scheduled.id, f.scheduled.slug]) {
      for (const body of [
        {},
        { title: "Overwrite" },
        { status: "draft" },
        { status: "published" },
      ]) {
        expect(
          (await f.request(`/v1/posts/${identifier}`, f.keys.unpublished, body))
            .status
        ).toBe(404);
      }
      expect(
        (
          await f.request(`/v1/posts/${identifier}`, f.keys.unpublished, {
            status: "scheduled",
          })
        ).status
      ).toBe(400);
    }
    expect(
      await testDb.db.query.post.findFirst({
        where: eq(post.id, f.scheduled.id),
      })
    ).toEqual(original);
    expect(
      await testDb.db.query.workspaceEvent.findMany({
        where: eq(workspaceEvent.workspaceId, f.workspaceId),
      })
    ).toEqual([]);
    expect(f.env.EVENT_QUEUE.send).not.toHaveBeenCalled();
    for (const row of f.rows.filter((entry) => entry.status !== "scheduled")) {
      const response = await f.request(
        `/v1/posts/${row.id}`,
        f.keys.unpublished,
        { title: "Updated" }
      );
      expect(response.status).toBe(200);
      expect(
        UpdatePostResponseSchema.parse(await response.json()).post
      ).toMatchObject({
        status: row.status,
        title: "Updated",
        publishedAt: "2030-05-01T15:30:00.000Z",
      });
    }
  });

  it("guards the transactional PATCH when a target becomes scheduled after lookup", async () => {
    const f = await fixture();
    const row = f.rows.find((entry) => entry.status === "draft");
    if (!row) {
      throw new Error("Missing draft fixture");
    }
    const transaction = testDb.db.transaction.bind(testDb.db);
    const race = vi
      .spyOn(testDb.db, "transaction")
      .mockImplementationOnce(async (callback) => {
        await testDb.db
          .update(post)
          .set({ status: "scheduled" })
          .where(eq(post.id, row.id));
        return transaction(callback);
      });
    try {
      const response = await f.request(
        `/v1/posts/${row.id}`,
        f.keys.unpublished,
        { title: "Overwrite", tags: [] }
      );
      expect(response.status).toBe(404);
      expect(
        await testDb.db.query.post.findFirst({ where: eq(post.id, row.id) })
      ).toMatchObject({
        status: "scheduled",
        title: row.title,
        publishedAt: row.publishedAt,
      });
      expect(
        await testDb.db.query.workspaceEvent.findMany({
          where: eq(workspaceEvent.workspaceId, f.workspaceId),
        })
      ).toEqual([]);
      expect(f.env.EVENT_QUEUE.send).not.toHaveBeenCalled();
    } finally {
      race.mockRestore();
    }
  });

  it.each(["draft", "all", "scheduled", "unknown", ""])(
    "legacy %s is published-only before validation and filtering",
    async (status) => {
      const f = await fixture();
      for (const identifier of [
        "",
        `/${f.scheduled.id}`,
        `/${f.scheduled.slug}`,
      ]) {
        const url = new URL(
          `http://localhost/v1/${f.workspaceId}/posts${identifier}?status=${status}`
        );
        restrictLegacyPostStatus(url, f.workspaceId);
        const response = await f.request(
          `/legacy/posts${identifier}${url.search}`
        );
        expect(response.status).toBe(identifier ? 404 : 200);
        if (!identifier) {
          expect(
            PostsListResponseSchema.parse(await response.json()).posts
          ).toMatchObject([{ status: "published" }]);
        }
      }
    }
  );
});
