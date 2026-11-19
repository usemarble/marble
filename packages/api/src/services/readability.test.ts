import { createRecordId } from "@marble/db/id";
import { category, post, subscription } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import type { LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { aiRouter } from "../routers/ai";
import {
  createTestContext,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";
import { authorizeChat } from "./assistant";

const fake = vi.hoisted(() => ({
  model: undefined as unknown as LanguageModel,
}));
vi.mock("../ai/model", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../ai/model")>();
  return {
    ...actual,
    createModel: ({ log }: { log: Parameters<typeof actual.wrapModel>[0] }) =>
      actual.wrapModel(log, fake.model),
  };
});

const usage = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

function answering(suggestions: { text: string }[]) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify({ suggestions }) }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });
}

const metrics = {
  wordCount: 120,
  sentenceCount: 8,
  wordsPerSentence: 15,
  readabilityScore: 62,
  readingTime: 1,
};
const redis = new Redis({
  url: testEnv.REDIS_URL,
  token: testEnv.REDIS_TOKEN,
});

async function keysMatching(pattern: string) {
  const found: string[] = [];
  let cursor: string | number = "0";
  do {
    const [next, keys]: [string | number, string[]] = await redis.scan(cursor, {
      match: pattern,
      count: 1000,
    });
    found.push(...keys);
    cursor = next;
  } while (String(cursor) !== "0");
  return found;
}

let testDb: TestDatabase;

async function seedPost(workspaceId: string) {
  const categoryId = createRecordId();
  await testDb.db.insert(category).values({
    id: categoryId,
    workspaceId,
    name: "News",
    slug: "news",
  });
  const id = createRecordId();
  await testDb.db.insert(post).values({
    id,
    workspaceId,
    categoryId,
    title: "A post",
    slug: `post-${id}`,
    content: "<p>Body</p>",
    contentJson: { type: "doc" },
    description: "Body",
    publishedAt: new Date(),
  });
  return id;
}
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function fixture(paid = true) {
  const user = await seedUser(testDb.db);
  const workspace = await seedWorkspace(testDb.db, user.id);
  if (paid) {
    await testDb.db.insert(subscription).values({
      id: createRecordId(),
      workspaceId: workspace.id,
      userId: user.id,
      plan: "hobby",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
      cancelAtPeriodEnd: false,
      polarId: createRecordId(),
    });
  }
  const request = createTestContext(testDb.db, {
    session: sessionFor(user),
    clientIp: "203.0.113.7",
  });
  return {
    user,
    workspace,
    context: request.context,
    client: createRouterClient(aiRouter, { context: request.context }),
  };
}

beforeEach(() => {
  fake.model = answering([{ text: "Shorten the opening sentence." }]);
});

describe("ai.suggestions", () => {
  it("returns the model's suggestions and caches them for 20 minutes", async () => {
    const { workspace, client } = await fixture();
    const content = `<p>Unique draft ${createRecordId()}</p>`;

    const result = await client.suggestions({
      workspaceId: workspace.id,
      content,
      metrics,
    });

    expect(result).toEqual({
      suggestions: [{ text: "Shorten the opening sentence." }],
      unavailable: false,
    });
    const [key] = await keysMatching(`ai:suggestions:${workspace.id}:*`);
    if (!key) {
      throw new Error("Missing suggestions cache entry");
    }
    const ttl = await redis.ttl(key);
    expect(ttl).toBeGreaterThan(1100);
    expect(ttl).toBeLessThanOrEqual(1200);
  });

  it("serves a cache hit without calling the model", async () => {
    const { workspace, client } = await fixture();
    const input = {
      workspaceId: workspace.id,
      content: `<p>Cached draft ${createRecordId()}</p>`,
      metrics,
    };
    await client.suggestions(input);
    const model = answering([{ text: "A different answer." }]);
    fake.model = model;

    const result = await client.suggestions(input);

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(result.suggestions).toEqual([
      { text: "Shorten the opening sentence." },
    ]);
  });

  it("calls the model again and refreshes the cache when asked to bypass it", async () => {
    const { workspace, client } = await fixture();
    const input = {
      workspaceId: workspace.id,
      content: `<p>Bypass draft ${createRecordId()}</p>`,
      metrics,
    };
    await client.suggestions(input);
    const model = answering([{ text: "A fresh answer." }]);
    fake.model = model;

    const bypassed = await client.suggestions({ ...input, bypassCache: true });
    fake.model = answering([{ text: "Another answer." }]);
    const afterwards = await client.suggestions(input);

    expect(bypassed.suggestions).toEqual([{ text: "A fresh answer." }]);
    expect(afterwards.suggestions).toEqual([{ text: "A fresh answer." }]);
  });

  it("reuses suggestions for the same post after an edit", async () => {
    const { workspace, client } = await fixture();
    const input = {
      workspaceId: workspace.id,
      content: "<p>Before edit</p>",
      metrics,
      postId: await seedPost(workspace.id),
    };
    await client.suggestions(input);
    fake.model = answering([{ text: "A different answer." }]);

    expect(
      (await client.suggestions({ ...input, content: "<p>After edit</p>" }))
        .suggestions
    ).toEqual([{ text: "Shorten the opening sentence." }]);
  });

  it("rejects a post from another workspace", async () => {
    const { workspace, client } = await fixture();
    const other = await fixture();
    const otherPostId = await seedPost(other.workspace.id);

    await expect(
      client.suggestions({
        workspaceId: workspace.id,
        content: "<p>Body</p>",
        metrics,
        postId: otherPostId,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("is gated on the free plan and never reaches the model", async () => {
    const { workspace, client } = await fixture(false);
    const model = answering([{ text: "Should not run." }]);
    fake.model = model;

    await expect(
      client.suggestions({
        workspaceId: workspace.id,
        content: "<p>Draft</p>",
        metrics,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Upgrade to Hobby to use AI readability insights",
    });
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("is forbidden to a user who is not a member", async () => {
    const { workspace } = await fixture();
    const outsider = await seedUser(testDb.db);
    const request = createTestContext(testDb.db, {
      session: sessionFor(outsider),
    });
    const client = createRouterClient(aiRouter, { context: request.context });

    await expect(
      client.suggestions({
        workspaceId: workspace.id,
        content: "<p>Draft</p>",
        metrics,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("limits suggestions to 20 per minute independently of chat", async () => {
    const { workspace, user, context, client } = await fixture();

    for (let i = 0; i < 20; i++) {
      await client.suggestions({
        workspaceId: workspace.id,
        content: `<p>Draft ${i} ${createRecordId()}</p>`,
        metrics,
      });
    }
    const model = answering([{ text: "Over the limit." }]);
    fake.model = model;

    await expect(
      client.suggestions({
        workspaceId: workspace.id,
        content: `<p>One too many ${user.id}</p>`,
        metrics,
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", status: 429 });
    expect(model.doGenerateCalls).toHaveLength(0);
    await expect(
      authorizeChat(context, user.id, workspace.id)
    ).resolves.toEqual({
      workspaceName: workspace.name,
    });
  });

  it("returns no suggestions and unavailable when the model fails, without caching", async () => {
    const { workspace, client } = await fixture();
    fake.model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("gateway down");
      },
    });

    const input = {
      workspaceId: workspace.id,
      content: "<p>Failing draft</p>",
      metrics,
    };

    expect(await client.suggestions(input)).toEqual({
      suggestions: [],
      unavailable: true,
    });
    fake.model = answering([{ text: "Try a stronger opening." }]);
    expect(await client.suggestions(input)).toEqual({
      suggestions: [{ text: "Try a stronger opening." }],
      unavailable: false,
    });
  });

  it("treats an unreadable result as unavailable rather than an error", async () => {
    const { workspace, client } = await fixture();
    fake.model = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "text", text: "not json" }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      }),
    });

    const result = await client.suggestions({
      workspaceId: workspace.id,
      content: `<p>Odd draft ${createRecordId()}</p>`,
      metrics,
    });

    expect(result).toEqual({ suggestions: [], unavailable: true });
  });
});
