import {
  userNotificationPreferences,
  workspaceNotificationPreferences,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { notificationsRouter } from "../routers/notifications";
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

function clientFor(user: Awaited<ReturnType<typeof seedUser>>) {
  return createRouterClient(notificationsRouter, {
    context: createTestContext(testDb.db, { session: sessionFor(user) })
      .context,
  });
}

describe("notification preferences", () => {
  async function fixture() {
    const user = await seedUser(testDb.db);
    const workspace = await seedWorkspace(testDb.db, user.id);
    return { user, workspace, client: clientFor(user) };
  }

  it("returns the defaults until something is saved", async () => {
    const f = await fixture();
    expect(await f.client.get({ workspaceId: f.workspace.id })).toEqual({
      user: { marketing: false, product: true },
      workspace: { usageAlerts: true, subscriptions: true },
    });
  });

  it("records marketing consent and unsubscription with their timestamps", async () => {
    const f = await fixture();
    const input = {
      workspaceId: f.workspace.id,
      scope: "user" as const,
      key: "marketing",
    };

    const on = await f.client.update({ ...input, value: true });
    expect(on.user).toEqual({ marketing: true, product: true });
    let row = await testDb.db.query.userNotificationPreferences.findFirst({
      where: eq(userNotificationPreferences.userId, f.user.id),
    });
    expect(row?.marketingConsentedAt).toBeInstanceOf(Date);
    expect(row).toMatchObject({
      marketingConsentSource: "settings",
      marketingUnsubscribedAt: null,
    });

    const off = await f.client.update({ ...input, value: false });
    expect(off.user.marketing).toBe(false);
    row = await testDb.db.query.userNotificationPreferences.findFirst({
      where: eq(userNotificationPreferences.userId, f.user.id),
    });
    expect(row?.marketingUnsubscribedAt).toBeInstanceOf(Date);

    const product = await f.client.update({
      workspaceId: f.workspace.id,
      scope: "user",
      key: "product",
      value: false,
    });
    expect(product.user).toEqual({ marketing: false, product: false });
  });

  it("saves workspace preferences against the caller's own membership only", async () => {
    const f = await fixture();
    const teammate = await seedUser(testDb.db);
    await seedMember(testDb.db, f.workspace.id, teammate.id, "member");
    const otherWorkspace = await seedWorkspace(testDb.db, f.user.id);

    const saved = await f.client.update({
      workspaceId: f.workspace.id,
      scope: "workspace",
      key: "usageAlerts",
      value: false,
    });
    expect(saved.workspace).toEqual({
      usageAlerts: false,
      subscriptions: true,
    });

    expect(
      (
        await clientFor(teammate).get({
          workspaceId: f.workspace.id,
        })
      ).workspace
    ).toEqual({ usageAlerts: true, subscriptions: true });
    expect(
      (await f.client.get({ workspaceId: otherWorkspace.id })).workspace
        .usageAlerts
    ).toBe(true);
    expect(
      await testDb.db.select().from(workspaceNotificationPreferences)
    ).toHaveLength(1);
  });

  it("rejects a key that doesn't belong to the scope", async () => {
    const f = await fixture();
    for (const [scope, key] of [
      ["user", "usageAlerts"],
      ["workspace", "marketing"],
    ] as const) {
      await expect(
        f.client.update({
          workspaceId: f.workspace.id,
          scope,
          key,
          value: true,
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Invalid key",
      });
    }
  });

  it("gives a user outside the workspace 403 on both procedures", async () => {
    const f = await fixture();
    const outsider = clientFor(await seedUser(testDb.db));
    await expect(
      outsider.get({ workspaceId: f.workspace.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    await expect(
      outsider.update({
        workspaceId: f.workspace.id,
        scope: "user",
        key: "product",
        value: false,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });
});
