import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { meRouter } from "../routers/me";
import { createTestContext, seedUser, sessionFor } from "../testing";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

function clientFor(user: Awaited<ReturnType<typeof seedUser>>) {
  return createRouterClient(meRouter, {
    context: createTestContext(testDb.db, { session: sessionFor(user) })
      .context,
  });
}

describe("profile", () => {
  it("trims the name, ignores a blank one and lets an empty image clear the avatar", async () => {
    const user = await seedUser(testDb.db);
    const client = clientFor(user);

    const renamed = await client.update({ name: "  Ada Lovelace  " });
    expect(renamed).toMatchObject({ id: user.id, name: "Ada Lovelace" });

    const blank = await client.update({
      name: "   ",
      image: "https://cdn.example/a.png",
    });
    expect(blank).toMatchObject({
      name: "Ada Lovelace",
      image: "https://cdn.example/a.png",
    });

    expect((await client.update({ image: "" })).image).toBe("");
    // Reads come from the user row, not the session's snapshot of it.
    expect(await client.get()).toMatchObject({
      name: "Ada Lovelace",
      image: "",
    });
  });
});
