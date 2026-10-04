import { createRecordId } from "@marble/db/id";
import {
  author,
  category,
  post,
  postToAuthor,
  postToTag,
  shareLink,
  subscription,
  tag,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { shareRouter } from "../routers/share";
import {
  createTestContext,
  seedMember,
  seedUser,
  seedWorkspace,
  sessionFor,
} from "../testing";

let testDb: TestDatabase;
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
  const categoryId = createRecordId();
  await testDb.db.insert(category).values({
    id: categoryId,
    workspaceId: workspace.id,
    name: "News",
    slug: "news",
    description: "Private category details",
  });
  const [row] = await testDb.db
    .insert(post)
    .values({
      id: createRecordId(),
      workspaceId: workspace.id,
      categoryId,
      title: "Shared draft",
      slug: "private-slug",
      content: "<p>Preview</p>",
      contentJson: { type: "doc" },
      description: "Preview",
      publishedAt: new Date(),
      attribution: { secret: true },
      views: 999,
    })
    .returning();
  if (!row) {
    throw new Error("Could not seed a post");
  }
  const request = createTestContext(testDb.db, { session: sessionFor(user) });
  const client = createRouterClient(shareRouter, { context: request.context });
  return {
    ...request,
    user,
    workspace,
    post: row,
    client,
    input: { workspaceId: workspace.id, postId: row.id },
  };
}

describe("dashboard share links", () => {
  it("creates a 32-character link for 24 hours, reuses it and replaces expired or inactive links", async () => {
    const f = await fixture();
    const before = Date.now();
    const created = await f.client.create(f.input);
    const token = created.shareLink.split("/").at(-1);
    expect(token).toMatch(/^[a-zA-Z0-9_-]{32}$/);
    expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 86_400_000 - 1000
    );
    expect(created.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 86_400_000 + 1000
    );
    expect(await f.client.create(f.input)).toEqual(created);
    await testDb.db
      .update(shareLink)
      .set({ expiresAt: new Date(0) })
      .where(eq(shareLink.token, token ?? ""));
    const replaced = await f.client.create(f.input);
    expect(replaced.shareLink).not.toBe(created.shareLink);
    await testDb.db
      .update(shareLink)
      .set({ isActive: false })
      .where(eq(shareLink.token, replaced.shareLink.split("/").at(-1) ?? ""));
    expect((await f.client.create(f.input)).shareLink).not.toBe(
      replaced.shareLink
    );
    await f.flush();
    expect(f.events.sent).toEqual([]);
  });

  it("checks paid-plan membership and post workspace scope, retaining admin and member access", async () => {
    const f = await fixture();
    const foreign = await fixture();
    await expect(
      f.client.create({
        ...f.input,
        workspaceId: foreign.workspace.id,
        postId: foreign.post.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      f.client.create({ ...f.input, postId: foreign.post.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Post not found" });
    const free = await fixture(false);
    await expect(free.client.create(free.input)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Upgrade to Hobby to share drafts",
    });
    for (const role of ["admin", "member"]) {
      const member = await seedUser(testDb.db);
      await seedMember(testDb.db, f.workspace.id, member.id, role);
      const session = sessionFor(member);
      session.session.activeOrganizationId = foreign.workspace.id;
      const client = createRouterClient(shareRouter, {
        context: createTestContext(testDb.db, { session }).context,
      });
      expect((await client.create(f.input)).shareLink).toContain("/share/");
    }
    await expect(
      f.client.create({ ...f.input, postId: "" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid request body",
    });
    const anonymous = createRouterClient(shareRouter, {
      context: createTestContext(testDb.db).context,
    });
    await expect(anonymous.create(f.input)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("reads a valid preview without a session and exposes exactly the former CMS fields", async () => {
    const f = await fixture();
    const authorId = createRecordId();
    const tagId = createRecordId();
    await testDb.db.insert(author).values({
      id: authorId,
      workspaceId: f.workspace.id,
      userId: f.user.id,
      name: "Writer",
      slug: "writer",
      email: "private@staging.invalid",
      role: "Secret role",
      bio: "Public biography",
    });
    await testDb.db.insert(tag).values({
      id: tagId,
      workspaceId: f.workspace.id,
      name: "Topic",
      slug: "topic",
      description: "Private tag details",
    });
    await testDb.db.insert(postToAuthor).values({ a: authorId, b: f.post.id });
    await testDb.db.insert(postToTag).values({ a: f.post.id, b: tagId });
    const created = await f.client.create(f.input);
    const token = created.shareLink.split("/").at(-1) ?? "";
    const anonymous = createRouterClient(shareRouter, {
      context: createTestContext(testDb.db).context,
    });
    expect(await anonymous.get({ token })).toEqual({
      expiresAt: created.expiresAt,
      post: {
        id: f.post.id,
        title: f.post.title,
        content: f.post.content,
        contentJson: f.post.contentJson,
        description: f.post.description,
        coverImage: null,
        status: "draft",
        createdAt: f.post.createdAt,
        updatedAt: f.post.updatedAt,
        publishedAt: f.post.publishedAt,
        authors: [
          {
            id: authorId,
            name: "Writer",
            image: null,
            bio: "Public biography",
          },
        ],
        category: { id: f.post.categoryId, name: "News", slug: "news" },
        tags: [{ id: tagId, name: "Topic", slug: "topic" }],
        workspace: {
          id: f.workspace.id,
          name: f.workspace.name,
          slug: f.workspace.slug,
          logo: null,
        },
      },
    });
  });

  it("preserves no-store and the 410/404 distinction for expired, inactive and invalid tokens", async () => {
    const f = await fixture();
    const created = await f.client.create(f.input);
    const token = created.shareLink.split("/").at(-1) ?? "";
    const handler = new RPCHandler(
      { share: shareRouter },
      { plugins: [new ResponseHeadersPlugin()] }
    );
    const read = async (value: string) => {
      const result = await handler.handle(
        new Request("http://localhost/rpc/share/get", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ json: { token: value } }),
        }),
        { prefix: "/rpc", context: createTestContext(testDb.db).context }
      );
      if (!result.matched) {
        throw new Error("Share procedure did not match");
      }
      expect(result.response.headers.get("cache-control")).toBe("no-store");
      return result.response;
    };
    expect((await read(token)).status).toBe(200);
    await testDb.db
      .update(shareLink)
      .set({ expiresAt: new Date(0) })
      .where(eq(shareLink.token, token));
    const expired = await read(token);
    expect(expired.status).toBe(410);
    expect(await expired.text()).toContain("Share link has expired");
    await testDb.db
      .update(shareLink)
      .set({ isActive: false })
      .where(eq(shareLink.token, token));
    expect((await read(token)).status).toBe(404);
    const invalid = await read("invalid-token");
    expect(invalid.status).toBe(404);
    expect(await invalid.text()).toContain("Share link not found");
  });
});
