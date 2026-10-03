import { createRecordId } from "@marble/db/id";
import { member } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findMembership, membershipKey } from "./access";
import { createAuth } from "./index";
import { testEnv } from "./test-env";

// The Redis HTTP proxy from the root docker-compose.yml.
const env = testEnv({
  REDIS_URL: "http://localhost:8079",
  REDIS_TOKEN: "justusemarble",
});

let testDb: TestDatabase;
let redis: Redis;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  testDb = await createTestDatabase();
  redis = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
  auth = createAuth({ db: testDb.db, env });
});

afterAll(async () => {
  await testDb.close();
});

async function signUp(label: string) {
  const email = `${label}-${createRecordId()}@staging.invalid`;
  const { headers, response } = await auth.api.signUpEmail({
    body: { name: label, email, password: "correct-horse-battery" },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return {
    id: response.user.id,
    email,
    headers: new Headers({ cookie }),
  };
}

/** An owner's workspace with a plain member added alongside them. */
async function workspaceWithMember() {
  const owner = await signUp("owner");
  const teammate = await signUp("teammate");
  const found = await testDb.db.query.member.findFirst({
    where: eq(member.userId, owner.id),
  });
  if (!found) {
    throw new Error("sign-up did not create the owner's workspace");
  }
  const workspaceId = found.organizationId;
  const [added] = await testDb.db
    .insert(member)
    .values({
      id: createRecordId(),
      organizationId: workspaceId,
      userId: teammate.id,
      role: "member",
    })
    .returning();
  if (!added) {
    throw new Error("could not add the teammate");
  }
  return { owner, teammate, workspaceId, memberId: added.id };
}

const lookup = (workspaceId: string, userId: string) =>
  findMembership({ db: testDb.db, redis }, workspaceId, userId);

describe("membership cache", () => {
  it("serves a member's role from Redis after the first lookup", async () => {
    const { teammate, workspaceId, memberId } = await workspaceWithMember();

    expect(await lookup(workspaceId, teammate.id)).toEqual({ role: "member" });
    expect(await redis.get(membershipKey(workspaceId, teammate.id))).toEqual({
      role: "member",
    });

    // Removing the row behind the cache's back proves the second read doesn't
    // reach the database.
    await testDb.db.delete(member).where(eq(member.id, memberId));
    expect(await lookup(workspaceId, teammate.id)).toEqual({ role: "member" });
  });

  it("never caches a non-member", async () => {
    const { owner, workspaceId } = await workspaceWithMember();
    const outsider = await signUp("outsider");

    expect(await lookup(workspaceId, outsider.id)).toBeNull();
    expect(await redis.get(membershipKey(workspaceId, outsider.id))).toBeNull();

    // Once they join, the next lookup sees it without any invalidation.
    await testDb.db.insert(member).values({
      id: createRecordId(),
      organizationId: workspaceId,
      userId: outsider.id,
      role: "member",
    });
    expect(await lookup(workspaceId, outsider.id)).toEqual({ role: "member" });
    expect(await lookup(workspaceId, owner.id)).toEqual({ role: "owner" });
  });

  it("is cleared when a member is removed", async () => {
    const { owner, teammate, workspaceId } = await workspaceWithMember();
    await lookup(workspaceId, teammate.id);

    await auth.api.removeMember({
      headers: owner.headers,
      body: { memberIdOrEmail: teammate.email, organizationId: workspaceId },
    });

    expect(await redis.get(membershipKey(workspaceId, teammate.id))).toBeNull();
    expect(await lookup(workspaceId, teammate.id)).toBeNull();
  });

  it("is cleared when a member's role changes", async () => {
    const { owner, teammate, workspaceId, memberId } =
      await workspaceWithMember();
    expect(await lookup(workspaceId, teammate.id)).toEqual({ role: "member" });

    await auth.api.updateMemberRole({
      headers: owner.headers,
      body: { memberId, role: "admin", organizationId: workspaceId },
    });

    expect(await lookup(workspaceId, teammate.id)).toEqual({ role: "admin" });
  });

  it("is cleared when a member leaves", async () => {
    const { teammate, workspaceId } = await workspaceWithMember();
    await lookup(workspaceId, teammate.id);

    await auth.api.leaveOrganization({
      headers: teammate.headers,
      body: { organizationId: workspaceId },
    });

    expect(await lookup(workspaceId, teammate.id)).toBeNull();
  });
});
