import { createRecordId } from "@marble/db/id";
import { invitation, subscription } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { workspacesRouter } from "../routers/workspaces";
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
  return createRouterClient(workspacesRouter, {
    context: createTestContext(testDb.db, { session: sessionFor(user) })
      .context,
  });
}

async function invite(workspaceId: string, inviterId: string, email: string) {
  await testDb.db.insert(invitation).values({
    id: createRecordId(),
    organizationId: workspaceId,
    email,
    role: "member",
    status: "pending",
    inviterId,
    expiresAt: new Date(Date.now() + 86_400_000),
  });
}

describe("workspaces.list", () => {
  it("returns the caller's workspaces with their role, member count and plan, and nothing else", async () => {
    const owner = await seedUser(testDb.db);
    const teammate = await seedUser(testDb.db);
    const stranger = await seedUser(testDb.db);
    const shared = await seedWorkspace(testDb.db, owner.id);
    await seedMember(testDb.db, shared.id, teammate.id, "admin");
    const own = await seedWorkspace(testDb.db, teammate.id);
    const foreign = await seedWorkspace(testDb.db, stranger.id);
    await invite(shared.id, owner.id, "someone@staging.invalid");
    await testDb.db.insert(subscription).values({
      id: createRecordId(),
      userId: owner.id,
      workspaceId: shared.id,
      polarId: createRecordId(),
      plan: "pro",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(Date.now() - 86_400_000),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
    });

    const list = await clientFor(teammate).list();
    expect(list.map((entry) => entry.id).sort()).toEqual(
      [shared.id, own.id].sort()
    );
    expect(list.map((entry) => entry.id)).not.toContain(foreign.id);

    const sharedEntry = list.find((entry) => entry.id === shared.id);
    expect(sharedEntry).toMatchObject({
      currentUserRole: "admin",
      memberCount: 2,
      subscription: { plan: "pro", activePlan: "pro" },
    });
    expect(list.find((entry) => entry.id === own.id)).toMatchObject({
      currentUserRole: "owner",
      memberCount: 1,
      subscription: null,
    });
    for (const entry of list) {
      expect(entry).not.toHaveProperty("members");
      expect(entry).not.toHaveProperty("invitations");
    }
  });

  it("is empty for a user with no workspace", async () => {
    expect(await clientFor(await seedUser(testDb.db)).list()).toEqual([]);
  });
});

describe("workspace members and invitations", () => {
  async function fixture() {
    const owner = await seedUser(testDb.db);
    const workspace = await seedWorkspace(testDb.db, owner.id);
    const teammate = await seedUser(testDb.db);
    await seedMember(testDb.db, workspace.id, teammate.id, "member");
    await invite(workspace.id, owner.id, "invitee@staging.invalid");
    return { owner, teammate, workspace };
  }

  it("lets any member read them, scoped to the workspace", async () => {
    const f = await fixture();
    const other = await fixture();
    const client = clientFor(f.teammate);

    const members = await client.members.list({ workspaceId: f.workspace.id });
    expect(members.map((entry) => [entry.userId, entry.role]).sort()).toEqual(
      [
        [f.owner.id, "owner"],
        [f.teammate.id, "member"],
      ].sort()
    );
    expect(
      members.find((entry) => entry.userId === f.owner.id)?.user
    ).toMatchObject({ id: f.owner.id, email: f.owner.email });

    const invitations = await client.invitations.list({
      workspaceId: f.workspace.id,
    });
    expect(invitations).toHaveLength(1);
    expect(invitations[0]).toMatchObject({
      email: "invitee@staging.invalid",
      status: "pending",
    });

    // The other workspace's roster and invitations stay out of reach.
    for (const proc of [client.members.list, client.invitations.list]) {
      await expect(
        proc({ workspaceId: other.workspace.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    }
  });
});
