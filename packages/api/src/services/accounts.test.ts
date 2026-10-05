import { createRecordId } from "@marble/db/id";
import { account } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accountsRouter } from "../routers/accounts";
import { createTestContext, seedUser, sessionFor } from "../testing";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

function clientFor(user: Awaited<ReturnType<typeof seedUser>>) {
  return createRouterClient(accountsRouter, {
    context: createTestContext(testDb.db, { session: sessionFor(user) })
      .context,
  });
}

async function linkAccount(userId: string, providerId: string) {
  const id = createRecordId();
  await testDb.db.insert(account).values({
    id,
    userId,
    providerId,
    accountId: `${providerId}-${id}`,
    accessToken: "secret-access-token",
    refreshToken: "secret-refresh-token",
    password: "secret-hash",
  });
  return id;
}

describe("linked accounts", () => {
  it("lists only the caller's accounts, without tokens", async () => {
    const user = await seedUser(testDb.db);
    const stranger = await seedUser(testDb.db);
    await linkAccount(user.id, "github");
    await linkAccount(stranger.id, "google");

    const accounts = await clientFor(user).list();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      providerId: "github",
      email: user.email,
    });
    expect(JSON.stringify(accounts)).not.toContain("secret-");
  });

  it("unlinks the caller's own account and leaves someone else's alone", async () => {
    const user = await seedUser(testDb.db);
    const stranger = await seedUser(testDb.db);
    const own = await linkAccount(user.id, "github");
    const foreign = await linkAccount(stranger.id, "github");
    const client = clientFor(user);

    await client.delete({ id: foreign });
    expect(
      await testDb.db.query.account.findFirst({
        where: eq(account.id, foreign),
      })
    ).toBeDefined();

    await client.delete({ id: own });
    expect(await client.list()).toEqual([]);
  });
});
