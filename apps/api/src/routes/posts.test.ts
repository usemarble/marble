import { OpenAPIHono } from "@hono/zod-openapi";
import { publishDuePosts } from "@marble/api/services/scheduled-posts";
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
import { and, eq } from "drizzle-orm";
import { createRequestLogger } from "evlog";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashApiKey } from "@/lib/crypto";
import { restrictLegacyPostStatus } from "@/lib/legacy-posts";
import { keyAuthorization } from "@/middleware/key-authorization";
import { scopeAuthorization } from "@/middleware/scope-authorization";
import {
  CreatePostResponseSchema,
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

async function fixture(timezone = "Europe/London") {
  const workspaceId = createRecordId();
  const categoryId = createRecordId();
  const authorId = createRecordId();
  await testDb.db
    .insert(workspace)
    .values({ id: workspaceId, name: "Posts", slug: workspaceId, timezone });
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
  async function request(
    path: string,
    key?: string,
    body?: unknown,
    method = body === undefined ? "GET" : "PATCH"
  ) {
    const response = await app.request(
      `http://localhost${path}`,
      {
        method,
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
  const byStatus = (status: string) => {
    const row = rows.find((entry) => entry.status === status);
    if (!row) {
      throw new Error(`Missing ${status} fixture`);
    }
    return row;
  };
  const scheduled = byStatus("scheduled");
  const draft = byStatus("draft");
  const published = byStatus("published");
  const createBody = {
    title: "New post",
    content: "<p>Body</p>",
    description: "Body",
    slug: "new-post",
    categoryId,
  };
  return {
    request,
    keys,
    rows,
    scheduled,
    draft,
    published,
    createBody,
    workspaceId,
    env,
  };
}

const postRow = (id: string) =>
  testDb.db.query.post.findFirst({ where: eq(post.id, id) });
const eventsFor = (id: string) =>
  testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.resourceId, id),
  });
const eventTypes = async (id: string) =>
  (await eventsFor(id)).map((event) => event.type);
const setPublishedAt = (id: string, publishedAt: Date) =>
  testDb.db.update(post).set({ publishedAt }).where(eq(post.id, id));

const FUTURE = "2031-06-01T09:00:00.000Z";
const PAST = "2020-06-01T09:00:00.000Z";

describe("public post status compatibility", () => {
  it("lists only public-contract statuses, including all with an unpublished-read private key", async () => {
    const f = await fixture();
    for (const [key, status, expected] of [
      [f.keys.public, "published", ["published"]],
      [f.keys.private, "published", ["published"]],
      [f.keys.unpublished, "all", ["draft", "published"]],
      [f.keys.unpublished, "draft", ["draft"]],
      [f.keys.unpublished, "scheduled", ["scheduled"]],
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
        const listed = path === "/v1/posts" ? 200 : 404;
        const expected = { all: listed, draft: listed, scheduled: 200 };
        expect(response.status).toBe(
          expected[status as keyof typeof expected] ?? 400
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

describe("scheduling posts", () => {
  it("creates a scheduled post that stays out of default reads", async () => {
    const f = await fixture();
    const response = await f.request(
      "/v1/posts",
      f.keys.private,
      { ...f.createBody, status: "scheduled", publishedAt: FUTURE },
      "POST"
    );
    expect(response.status).toBe(201);
    const body = CreatePostResponseSchema.parse(await response.json());
    expect(body).toMatchObject({
      post: { status: "scheduled", publishedAt: FUTURE },
      workspaceTimezone: "Europe/London",
    });
    expect(await eventTypes(body.post.id)).toEqual(["post_created"]);
    expect((await f.request("/v1/posts/new-post", f.keys.public)).status).toBe(
      404
    );
    expect(
      (
        await f.request(
          "/v1/posts/new-post?status=scheduled",
          f.keys.unpublished
        )
      ).status
    ).toBe(200);
  });

  it("schedules a draft with PATCH using a sent or a stored future time", async () => {
    const f = await fixture();
    const sent = await f.request(`/v1/posts/${f.draft.id}`, f.keys.private, {
      status: "scheduled",
      publishedAt: FUTURE,
    });
    expect(sent.status).toBe(200);
    expect(UpdatePostResponseSchema.parse(await sent.json())).toMatchObject({
      post: { status: "scheduled", publishedAt: FUTURE },
      workspaceTimezone: "Europe/London",
    });
    expect(await eventTypes(f.draft.id)).toEqual(["post_updated"]);

    const other = await fixture();
    const stored = await other.request(
      `/v1/posts/${other.draft.id}`,
      other.keys.private,
      { status: "scheduled" }
    );
    expect(stored.status).toBe(200);
    expect(await postRow(other.draft.id)).toMatchObject({
      status: "scheduled",
      publishedAt: other.draft.publishedAt,
    });
  });

  it("leaves status and date alone on an edit that sends neither", async () => {
    const f = await fixture();
    for (const row of f.rows) {
      const response = await f.request(`/v1/posts/${row.id}`, f.keys.private, {
        title: "Updated",
      });
      expect(response.status).toBe(200);
      expect(
        UpdatePostResponseSchema.parse(await response.json()).post
      ).toMatchObject({
        status: row.status,
        title: "Updated",
        publishedAt: "2030-05-01T15:30:00.000Z",
      });
      expect(await eventTypes(row.id)).toEqual(["post_updated"]);
    }
  });

  it("reports the workspace timezone on a PATCH that changes nothing", async () => {
    const f = await fixture("Asia/Tokyo");
    const response = await f.request(
      `/v1/posts/${f.draft.id}`,
      f.keys.private,
      {}
    );
    expect(response.status).toBe(200);
    expect(UpdatePostResponseSchema.parse(await response.json())).toMatchObject(
      {
        post: { status: "draft" },
        workspaceTimezone: "Asia/Tokyo",
      }
    );
    expect(await eventTypes(f.draft.id)).toEqual([]);
  });

  it("reschedules, unschedules and pulls a live post with the right events", async () => {
    const f = await fixture();
    expect(
      (
        await f.request(`/v1/posts/${f.scheduled.id}`, f.keys.private, {
          publishedAt: FUTURE,
        })
      ).status
    ).toBe(200);
    expect(await postRow(f.scheduled.id)).toMatchObject({
      status: "scheduled",
      publishedAt: new Date(FUTURE),
    });
    expect(
      (
        await f.request(`/v1/posts/${f.scheduled.id}`, f.keys.private, {
          status: "draft",
        })
      ).status
    ).toBe(200);
    expect(await eventTypes(f.scheduled.id)).toEqual([
      "post_updated",
      "post_updated",
    ]);
    expect(
      (
        await f.request(`/v1/posts/${f.published.id}`, f.keys.private, {
          status: "scheduled",
          publishedAt: FUTURE,
        })
      ).status
    ).toBe(200);
    expect(await eventTypes(f.published.id)).toEqual(["post_unpublished"]);
  });

  it("deletes a scheduled post", async () => {
    const f = await fixture();
    const response = await f.request(
      `/v1/posts/${f.scheduled.id}`,
      f.keys.private,
      undefined,
      "DELETE"
    );
    expect(response.status).toBe(200);
    expect(await postRow(f.scheduled.id)).toBeUndefined();
  });

  describe("a go-live time that isn't in the future", () => {
    it.each([
      ["a past time", { publishedAt: PAST }],
      ["no time", {}],
    ])("rejects a create with %s", async (_case, extra) => {
      const f = await fixture();
      const response = await f.request(
        "/v1/posts",
        f.keys.private,
        { ...f.createBody, status: "scheduled", ...extra },
        "POST"
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: "Invalid publishedAt",
      });
      expect(
        await testDb.db.query.post.findFirst({
          where: and(
            eq(post.workspaceId, f.workspaceId),
            eq(post.slug, "new-post")
          ),
        })
      ).toBeUndefined();
    });

    it("rejects a PATCH and leaves the post alone", async () => {
      const f = await fixture();
      await setPublishedAt(f.published.id, new Date(PAST));
      for (const [id, body] of [
        [f.draft.id, { status: "scheduled", publishedAt: PAST }],
        [f.published.id, { status: "scheduled" }],
        [f.scheduled.id, { publishedAt: PAST }],
        [f.scheduled.id, { status: "scheduled", publishedAt: PAST }],
      ] as const) {
        const before = await postRow(id);
        const response = await f.request(`/v1/posts/${id}`, f.keys.private, {
          title: "Overwrite",
          tags: [],
          ...body,
        });
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: "Invalid publishedAt",
        });
        expect(await postRow(id)).toEqual(before);
        expect(await eventsFor(id)).toEqual([]);
      }
      expect(f.env.EVENT_QUEUE.send).not.toHaveBeenCalled();
    });

    it("still lets an overdue scheduled post take an edit", async () => {
      const f = await fixture();
      await setPublishedAt(f.scheduled.id, new Date(PAST));
      const response = await f.request(
        `/v1/posts/${f.scheduled.id}`,
        f.keys.private,
        { title: "Typo fixed" }
      );
      expect(response.status).toBe(200);
      expect(await postRow(f.scheduled.id)).toMatchObject({
        title: "Typo fixed",
        status: "scheduled",
        publishedAt: new Date(PAST),
      });
    });
  });

  describe("publishedAt forms", () => {
    it.each([
      ["Europe/London", "2031-07-01T09:00:00", "2031-07-01T08:00:00.000Z"],
      ["Europe/London", "2031-01-15T09:00:00", "2031-01-15T09:00:00.000Z"],
      ["America/New_York", "2031-07-01T09:00:00", "2031-07-01T13:00:00.000Z"],
      ["America/New_York", "2031-01-15T09:00:00", "2031-01-15T14:00:00.000Z"],
      ["Europe/London", "2031-10-26T01:30:00", "2031-10-26T00:30:00.000Z"],
      ["Australia/Sydney", "2031-04-06T02:30:00", "2031-04-05T15:30:00.000Z"],
      ["Asia/Tokyo", "2031-07-01T09:00:00", "2031-07-01T00:00:00.000Z"],
      ["Asia/Tokyo", "2031-07-01T09:15:30.250", "2031-07-01T00:15:30.250Z"],
      ["Asia/Tokyo", "2031-07-01T09:00", "2031-07-01T00:00:00.000Z"],
      ["Asia/Tokyo", "2031-07-01T09:00:00Z", "2031-07-01T09:00:00.000Z"],
      ["Asia/Tokyo", "2031-07-01T09:00:00+01:00", "2031-07-01T08:00:00.000Z"],
      ["Asia/Tokyo", "2031-07-01T09:00:00-05:30", "2031-07-01T14:30:00.000Z"],
    ])("in %s reads %s as %s", async (timezone, sent, expected) => {
      const f = await fixture(timezone);
      const created = await f.request(
        "/v1/posts",
        f.keys.private,
        { ...f.createBody, status: "scheduled", publishedAt: sent },
        "POST"
      );
      expect(created.status).toBe(201);
      expect(await created.json()).toMatchObject({
        post: { publishedAt: expected },
        workspaceTimezone: timezone,
      });

      const updated = await f.request(
        `/v1/posts/${f.scheduled.id}`,
        f.keys.private,
        { publishedAt: sent }
      );
      expect(updated.status).toBe(200);
      expect(await updated.json()).toMatchObject({
        post: { publishedAt: expected },
        workspaceTimezone: timezone,
      });
    });

    it.each([
      ["America/New_York", "2031-03-09T02:30:00"],
      ["Europe/London", "2031-03-30T01:30:00"],
    ])("rejects %s %s, which daylight saving skips", async (timezone, sent) => {
      const f = await fixture(timezone);
      const before = await postRow(f.scheduled.id);
      for (const response of [
        await f.request(
          "/v1/posts",
          f.keys.private,
          { ...f.createBody, status: "scheduled", publishedAt: sent },
          "POST"
        ),
        await f.request(`/v1/posts/${f.scheduled.id}`, f.keys.private, {
          publishedAt: sent,
        }),
      ]) {
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: "Invalid publishedAt",
          message: expect.stringContaining(timezone),
        });
      }
      expect(await postRow(f.scheduled.id)).toEqual(before);
    });

    it.each(["2031-02-30T09:00:00", "tomorrow", "2031-07-01"])(
      "rejects %s before it reaches the route",
      async (sent) => {
        const f = await fixture();
        const response = await f.request(
          `/v1/posts/${f.scheduled.id}`,
          f.keys.private,
          { publishedAt: sent }
        );
        expect(response.status).toBe(400);
      }
    );
  });

  describe("the date when a post is published", () => {
    it("becomes now when a scheduled post is published early", async () => {
      const f = await fixture();
      const before = Date.now();
      const response = await f.request(
        `/v1/posts/${f.scheduled.id}`,
        f.keys.private,
        { status: "published" }
      );
      expect(response.status).toBe(200);
      const row = await postRow(f.scheduled.id);
      expect(row?.status).toBe("published");
      expect(row?.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(row?.publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(await eventTypes(f.scheduled.id)).toEqual(["post_published"]);
    });

    it("follows a date sent with a scheduled post published early", async () => {
      const f = await fixture();
      await f.request(`/v1/posts/${f.scheduled.id}`, f.keys.private, {
        status: "published",
        publishedAt: FUTURE,
      });
      expect(await postRow(f.scheduled.id)).toMatchObject({
        status: "published",
        publishedAt: new Date(FUTURE),
      });
    });

    it("stays put for an overdue scheduled post", async () => {
      const f = await fixture();
      await setPublishedAt(f.scheduled.id, new Date(PAST));
      await f.request(`/v1/posts/${f.scheduled.id}`, f.keys.private, {
        status: "published",
      });
      expect(await postRow(f.scheduled.id)).toMatchObject({
        status: "published",
        publishedAt: new Date(PAST),
      });
    });

    it("stays future for a draft published with PATCH", async () => {
      const f = await fixture();
      const response = await f.request(
        `/v1/posts/${f.draft.id}`,
        f.keys.private,
        { status: "published" }
      );
      expect(response.status).toBe(200);
      expect(
        UpdatePostResponseSchema.parse(await response.json()).post
      ).toMatchObject({
        status: "published",
        publishedAt: "2030-05-01T15:30:00.000Z",
      });
      expect(await eventTypes(f.draft.id)).toEqual(["post_published"]);
    });

    it("keeps published with a future date live immediately", async () => {
      const f = await fixture();
      const created = await f.request(
        "/v1/posts",
        f.keys.private,
        { ...f.createBody, status: "published", publishedAt: FUTURE },
        "POST"
      );
      expect(created.status).toBe(201);
      await f.request(`/v1/posts/${f.draft.id}`, f.keys.private, {
        status: "published",
        publishedAt: FUTURE,
      });
      for (const slug of ["new-post", f.draft.slug]) {
        const response = await f.request(`/v1/posts/${slug}`, f.keys.public);
        expect(response.status).toBe(200);
        expect(
          PostResponseSchema.parse(await response.json()).post
        ).toMatchObject({ status: "published", publishedAt: FUTURE });
      }
    });
  });

  describe("racing the cron", () => {
    const transaction = () => testDb.db.transaction.bind(testDb.db);

    async function cronContext() {
      return {
        db: await testDb.connect(),
        env: {
          REDIS_URL: "http://localhost:8079",
          REDIS_TOKEN: "justusemarble",
        },
        queues: { events: { send: vi.fn(async () => undefined) } },
      };
    }

    it("sends one post_published when the cron publishes after the lookup", async () => {
      const f = await fixture();
      await setPublishedAt(f.scheduled.id, new Date(PAST));
      const cron = await cronContext();
      const realTransaction = transaction();
      const race = vi
        .spyOn(testDb.db, "transaction")
        .mockImplementationOnce(async (callback) => {
          await publishDuePosts(cron);
          return realTransaction(callback);
        });
      try {
        const response = await f.request(
          `/v1/posts/${f.scheduled.id}`,
          f.keys.private,
          { status: "published" }
        );
        expect(response.status).toBe(200);
      } finally {
        race.mockRestore();
      }
      expect(await postRow(f.scheduled.id)).toMatchObject({
        status: "published",
        publishedAt: new Date(PAST),
      });
      expect((await eventTypes(f.scheduled.id)).sort()).toEqual([
        "post_published",
        "post_updated",
      ]);
      const [published] = (await eventsFor(f.scheduled.id)).filter(
        (event) => event.type === "post_published"
      );
      expect(published?.actorType).toBe("system");
    });

    it("sends one post_published when the cron runs while the PATCH holds the row", async () => {
      const f = await fixture();
      const cron = await cronContext();
      // The scan is global, so overdue posts from other tests go first.
      await publishDuePosts(cron);
      await setPublishedAt(f.scheduled.id, new Date(PAST));
      const realTransaction = transaction();
      const during = { published: -1 };
      const race = vi
        .spyOn(testDb.db, "transaction")
        .mockImplementationOnce((callback) =>
          realTransaction(async (tx) => {
            const result = await callback(tx);
            const run = await publishDuePosts(cron);
            during.published = run.published;
            return result;
          })
        );
      try {
        const response = await f.request(
          `/v1/posts/${f.scheduled.id}`,
          f.keys.private,
          { status: "published" }
        );
        expect(response.status).toBe(200);
      } finally {
        race.mockRestore();
      }
      expect(during.published).toBe(0);
      expect(await eventTypes(f.scheduled.id)).toEqual(["post_published"]);
      await publishDuePosts(cron);
      expect(await eventTypes(f.scheduled.id)).toEqual(["post_published"]);
    });

    it("returns 404 when the post is deleted after the lookup", async () => {
      const f = await fixture();
      const realTransaction = transaction();
      const race = vi
        .spyOn(testDb.db, "transaction")
        .mockImplementationOnce(async (callback) => {
          await testDb.db.delete(post).where(eq(post.id, f.draft.id));
          return realTransaction(callback);
        });
      try {
        const response = await f.request(
          `/v1/posts/${f.draft.id}`,
          f.keys.private,
          { title: "Too late" }
        );
        expect(response.status).toBe(404);
      } finally {
        race.mockRestore();
      }
      expect(await eventsFor(f.draft.id)).toEqual([]);
    });
  });
});
