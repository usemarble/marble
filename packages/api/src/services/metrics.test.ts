import { createRecordId } from "@marble/db/id";
import { category, media, post, usageEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { format } from "date-fns";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { metricsRouter } from "../routers/metrics";
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

describe("dashboard metrics", () => {
  it("scopes usage, recent uploads and publishing to the explicit workspace, regardless of the active organization", async () => {
    const user = await seedUser(testDb.db);
    const home = await seedWorkspace(testDb.db, user.id);
    const other = await seedWorkspace(testDb.db, user.id);
    const now = new Date();
    for (const ws of [home, other]) {
      await testDb.db.insert(usageEvent).values([
        { workspaceId: ws.id, type: "api_request", createdAt: now },
        {
          workspaceId: ws.id,
          type: "webhook_delivery",
          endpoint: ws.slug,
          createdAt: now,
        },
        { workspaceId: ws.id, type: "media_upload", createdAt: now },
      ]);
      await testDb.db.insert(media).values({
        id: createRecordId(),
        workspaceId: ws.id,
        name: ws.slug,
        url: "https://cdn.invalid/image.png",
        storageKey: ws.id,
        size: 42,
      });
      const categoryId = createRecordId();
      await testDb.db.insert(category).values({
        id: categoryId,
        workspaceId: ws.id,
        name: "News",
        slug: "news",
      });
      await testDb.db.insert(post).values([
        {
          workspaceId: ws.id,
          categoryId,
          title: "Published",
          slug: "published",
          content: "<p>Public</p>",
          contentJson: {},
          description: "Published",
          publishedAt: now,
          status: "published",
        },
        {
          workspaceId: ws.id,
          categoryId,
          title: "Draft",
          slug: "draft",
          content: "<p>Draft</p>",
          contentJson: {},
          description: "Draft",
          publishedAt: now,
          status: "draft",
        },
        {
          workspaceId: ws.id,
          categoryId,
          title: "Old",
          slug: "old",
          content: "<p>Old</p>",
          contentJson: {},
          description: "Old",
          publishedAt: new Date(now.getFullYear() - 1, 0, 1),
          status: "published",
        },
      ]);
    }
    const session = sessionFor(user);
    session.session.activeOrganizationId = other.id;
    const { context } = createTestContext(testDb.db, { session });
    const client = createRouterClient(metricsRouter, { context });
    const usage = await client.usage({ workspaceId: home.id });
    expect(usage.api.totals).toEqual({
      total: 1,
      lastPeriod: 1,
      changePercentage: 100,
    });
    expect(usage.api.chart).toHaveLength(30);
    expect(usage.webhooks).toMatchObject({
      total: 1,
      last7Days: 1,
      last24Hours: 1,
      topEndpoint: home.slug,
      topEndpointCount: 1,
    });
    expect(usage.media).toMatchObject({
      total: 1,
      last30Days: 1,
      recentUploadsSize: 42,
      recentUploads: [{ name: home.slug, mimeType: null }],
    });
    const { graph } = await client.publishing({ workspaceId: home.id });
    expect(graph.activity.reduce((sum, day) => sum + day.count, 0)).toBe(1);
    expect(
      graph.activity.find((day) => day.date === format(now, "yyyy-MM-dd"))
    ).toMatchObject({ count: 1, level: 4 });
  });

  it("rejects unauthenticated and non-member reads and preserves all member roles' read access", async () => {
    const user = await seedUser(testDb.db);
    const { context } = createTestContext(testDb.db, {
      session: sessionFor(user),
    });
    const client = createRouterClient(metricsRouter, { context });
    const foreign = await seedWorkspace(testDb.db);
    for (const read of [client.usage, client.publishing]) {
      await expect(read({ workspaceId: foreign.id })).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    }
    for (const role of ["owner", "admin", "member"]) {
      const ws = await seedWorkspace(testDb.db);
      await seedMember(testDb.db, ws.id, user.id, role);
      expect(
        (await client.usage({ workspaceId: ws.id })).api.totals.total
      ).toBe(0);
      expect(
        (await client.publishing({ workspaceId: ws.id })).graph.activity.every(
          (day) => day.count === 0
        )
      ).toBe(true);
    }
    const anonymous = createRouterClient(metricsRouter, {
      context: createTestContext(testDb.db).context,
    });
    for (const read of [anonymous.usage, anonymous.publishing]) {
      await expect(read({ workspaceId: foreign.id })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
  });
});
