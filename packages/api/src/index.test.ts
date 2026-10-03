import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { protectedProcedure, workspaceProcedure } from "./index";
import {
  createTestContext,
  seedMember,
  seedUser,
  seedWorkspace,
  sessionFor,
} from "./testing";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

const router = {
  whoami: protectedProcedure.handler(({ context }) => context.session.user.id),
  workspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), note: z.string().optional() }))
    .handler(({ context }) => ({
      workspaceId: context.workspaceId,
      role: context.role,
    })),
};

function clientFor(session: ReturnType<typeof sessionFor> | null) {
  const { context } = createTestContext(testDb.db, { session });
  return createRouterClient(router, { context });
}

describe("protectedProcedure", () => {
  it("rejects a request without a session", async () => {
    await expect(clientFor(null).whoami()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a user who has not verified their email", async () => {
    const unverified = await seedUser(testDb.db, false);
    await expect(
      clientFor(sessionFor(unverified)).whoami()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lets a verified user through", async () => {
    const verified = await seedUser(testDb.db);
    expect(await clientFor(sessionFor(verified)).whoami()).toBe(verified.id);
  });
});

describe("workspaceProcedure", () => {
  it("rejects a request without a session before looking at the workspace", async () => {
    const { id } = await seedWorkspace(testDb.db);
    await expect(
      clientFor(null).workspace({ workspaceId: id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("gives a member their role in that workspace", async () => {
    const admin = await seedUser(testDb.db);
    const { id } = await seedWorkspace(testDb.db);
    await seedMember(testDb.db, id, admin.id, "admin");

    expect(
      await clientFor(sessionFor(admin)).workspace({ workspaceId: id })
    ).toEqual({ workspaceId: id, role: "admin" });
  });

  it("rejects a user who is not a member of the workspace", async () => {
    const outsider = await seedUser(testDb.db);
    const { id } = await seedWorkspace(testDb.db);

    await expect(
      clientFor(sessionFor(outsider)).workspace({ workspaceId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("answers a workspace that doesn't exist the same way", async () => {
    const someone = await seedUser(testDb.db);

    await expect(
      clientFor(sessionFor(someone)).workspace({ workspaceId: "nope" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("checks the workspaceId in the input, not the session's active organization", async () => {
    const user = await seedUser(testDb.db);
    const home = await seedWorkspace(testDb.db, user.id);
    const other = await seedWorkspace(testDb.db);
    const session = sessionFor(user);
    session.session.activeOrganizationId = home.id;

    // Active in `home`, but not a member of `other`.
    await expect(
      clientFor(session).workspace({ workspaceId: other.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // A member of `other` too, with `home` still active: allowed, as a member.
    await seedMember(testDb.db, other.id, user.id, "member");
    expect(
      await clientFor(session).workspace({ workspaceId: other.id })
    ).toEqual({ workspaceId: other.id, role: "member" });
  });

  it("requires a workspaceId in the input", async () => {
    const user = await seedUser(testDb.db);

    for (const input of [{}, { workspaceId: "" }, { workspaceId: 7 }]) {
      await expect(
        clientFor(sessionFor(user)).workspace(input as never)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });
});
