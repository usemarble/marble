import { createRecordId } from "@marble/db/id";
import {
  category,
  importItem,
  importJob,
  post,
  postToTag,
  tag,
  workspace,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { asc, eq } from "drizzle-orm";
import { strToU8, zipSync } from "fflate";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runImport } from "./import";

const uploads = vi.hoisted(() => new Map<string, Uint8Array>());

vi.mock("cloudflare:workers", () => ({
  env: {
    STORAGE: {
      get: async (key: string) => {
        const bytes = uploads.get(key);
        return bytes ? { body: new Blob([bytes]).stream() } : null;
      },
    },
  },
}));

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function queueImport(files: Record<string, string>) {
  const workspaceId = createRecordId();
  const jobId = createRecordId();
  const uploadKey = `imports/${jobId}.zip`;

  await testDb.db.insert(workspace).values({
    id: workspaceId,
    name: "Test Workspace",
    slug: `ws-${workspaceId}`,
  });
  await testDb.db
    .insert(importJob)
    .values({ id: jobId, workspaceId, source: "file", uploadKey });
  uploads.set(
    uploadKey,
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([name, content]) => [name, strToU8(content)])
      )
    )
  );

  return { jobId, workspaceId };
}

describe("runImport", () => {
  it("files posts under their frontmatter category, tags and date", async () => {
    const { jobId, workspaceId } = await queueImport({
      "a-docker.md": `---
title: Connect a Docker container
date: 2024-01-15
category: coding
tags: [docker, networking]
---

Run Tailscale as a sidecar next to your app.
`,
      "b-rust.md": `---
title: Learning Rust
category: Coding
tags: Rust, docker
---

Ownership takes a while to click.
`,
      "c-untitled.md": "Just a quick note without frontmatter.",
    });

    await runImport(testDb.db, jobId);

    const job = await testDb.db.query.importJob.findFirst({
      where: eq(importJob.id, jobId),
    });
    expect(job).toMatchObject({ status: "completed", importedItems: 3 });

    const categories = await testDb.db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
      orderBy: asc(category.slug),
    });
    expect(categories.map(({ name, slug }) => ({ name, slug }))).toEqual([
      { name: "coding", slug: "coding" },
      { name: "Uncategorized", slug: "uncategorized" },
    ]);
    const [coding, uncategorized] = categories;

    const tags = await testDb.db.query.tag.findMany({
      where: eq(tag.workspaceId, workspaceId),
      orderBy: asc(tag.slug),
    });
    expect(tags.map(({ slug }) => slug)).toEqual([
      "docker",
      "networking",
      "rust",
    ]);

    const posts = await testDb.db.query.post.findMany({
      where: eq(post.workspaceId, workspaceId),
      orderBy: asc(post.slug),
    });
    expect(posts).toMatchObject([
      {
        title: "Connect a Docker container",
        description: "Run Tailscale as a sidecar next to your app.",
        categoryId: coding?.id,
        status: "draft",
        publishedAt: new Date("2024-01-15T12:00:00.000Z"),
      },
      {
        title: "c untitled",
        description: "Just a quick note without frontmatter.",
        categoryId: uncategorized?.id,
        status: "draft",
      },
      {
        title: "Learning Rust",
        description: "Ownership takes a while to click.",
        categoryId: coding?.id,
        status: "draft",
      },
    ]);

    const tagSlugsFor = async (postId: string) => {
      const rows = await testDb.db
        .select({ slug: tag.slug })
        .from(postToTag)
        .innerJoin(tag, eq(tag.id, postToTag.b))
        .where(eq(postToTag.a, postId))
        .orderBy(asc(tag.slug));
      return rows.map(({ slug }) => slug);
    };
    expect(await tagSlugsFor(posts[0]?.id ?? "")).toEqual([
      "docker",
      "networking",
    ]);
    expect(await tagSlugsFor(posts[1]?.id ?? "")).toEqual([]);
    expect(await tagSlugsFor(posts[2]?.id ?? "")).toEqual(["docker", "rust"]);

    const items = await testDb.db.query.importItem.findMany({
      where: eq(importItem.importJobId, jobId),
      orderBy: asc(importItem.sourceRef),
    });
    expect(items[0]).toMatchObject({
      status: "imported",
      rawCategory: "coding",
      resolvedCategoryId: coding?.id,
      resolvedTagIds: [
        tags.find(({ slug }) => slug === "docker")?.id,
        tags.find(({ slug }) => slug === "networking")?.id,
      ],
    });
  });

  it("doesn't create Uncategorized when every file has a category", async () => {
    const { jobId, workspaceId } = await queueImport({
      "post.md": "---\ncategory: Travel\n---\n\nBody.",
    });

    await runImport(testDb.db, jobId);

    const categories = await testDb.db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
    });
    expect(categories.map(({ slug }) => slug)).toEqual(["travel"]);
  });
});
