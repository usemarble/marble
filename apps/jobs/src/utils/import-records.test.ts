import { createRecordId } from "@marble/db/id";
import { category, tag, workspace } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createImportTaxonomy } from "./import-records";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function seedWorkspace() {
  const id = createRecordId();
  await testDb.db
    .insert(workspace)
    .values({ id, name: "Test Workspace", slug: `ws-${id}` });
  return id;
}

describe("createImportTaxonomy", () => {
  it("falls back to Uncategorized when there's no usable category", async () => {
    const workspaceId = await seedWorkspace();
    const taxonomy = createImportTaxonomy(testDb.db, workspaceId);

    const missing = await taxonomy.category();
    const slugless = await taxonomy.category("日本語");

    expect(slugless).toBe(missing);
    const rows = await testDb.db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
    });
    expect(rows).toMatchObject([
      { id: missing, name: "Uncategorized", slug: "uncategorized" },
    ]);
  });

  it("reuses categories by slug and creates missing ones", async () => {
    const workspaceId = await seedWorkspace();
    const otherWorkspaceId = await seedWorkspace();
    const existingId = createRecordId();
    await testDb.db.insert(category).values([
      { id: existingId, name: "Coding", slug: "coding", workspaceId },
      {
        id: createRecordId(),
        name: "Travel",
        slug: "travel",
        workspaceId: otherWorkspaceId,
      },
    ]);
    const taxonomy = createImportTaxonomy(testDb.db, workspaceId);

    expect(await taxonomy.category("coding")).toBe(existingId);
    const travelId = await taxonomy.category("Travel");

    const rows = await testDb.db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
      columns: { id: true, name: true, slug: true },
    });
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({
      id: travelId,
      name: "Travel",
      slug: "travel",
    });
  });

  it("dedupes tags by slug, reusing existing ones", async () => {
    const workspaceId = await seedWorkspace();
    const existingId = createRecordId();
    await testDb.db
      .insert(tag)
      .values({ id: existingId, name: "Docker", slug: "docker", workspaceId });
    const taxonomy = createImportTaxonomy(testDb.db, workspaceId);

    const ids = await taxonomy.tags(["docker", "Docker", "Home Lab", "日本語"]);

    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(existingId);
    const created = await testDb.db.query.tag.findFirst({
      where: eq(tag.id, ids[1] ?? ""),
    });
    expect(created).toMatchObject({ name: "Home Lab", slug: "home-lab" });
    expect(await taxonomy.tags()).toEqual([]);
  });

  it("resolves to one row when two imports create the same slug", async () => {
    const workspaceId = await seedWorkspace();

    const [first, second] = await Promise.all([
      createImportTaxonomy(testDb.db, workspaceId).category("Coding"),
      createImportTaxonomy(testDb.db, workspaceId).category("Coding"),
    ]);

    expect(first).toBe(second);
    const rows = await testDb.db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
    });
    expect(rows).toHaveLength(1);
  });
});
