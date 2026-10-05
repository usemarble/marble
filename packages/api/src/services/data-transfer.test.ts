import { createRecordId } from "@marble/db/id";
import { exportJob } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dataTransferRouter } from "../routers/data-transfer";
import { uploadsRouter } from "../routers/uploads";
import {
  createTestContext,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";
import { getExportDownloadByToken } from "./data-transfer";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

describe("dashboard data transfers", () => {
  it("queues the jobs Worker messages and scopes job lists to the workspace", async () => {
    const actor = await seedUser(testDb.db);
    const ws = await seedWorkspace(testDb.db, actor.id);
    const second = await seedWorkspace(testDb.db, actor.id);
    const objects = new Map<
      string,
      { size: number; httpMetadata: { contentType: string } }
    >();
    const storage = {
      head: async (key: string) => objects.get(key) ?? null,
      get: async (_key: string) => null,
      delete: async (_key: string | string[]) => {
        // This test does not delete uploads.
      },
    };
    const request = createTestContext(testDb.db, {
      session: sessionFor(actor),
      env: { ...testEnv, STORAGE: storage },
    });
    const data = createRouterClient(dataTransferRouter, {
      context: request.context,
    });
    const uploads = createRouterClient(uploadsRouter, {
      context: request.context,
    });
    const createdExport = await data.exports.create({ workspaceId: ws.id });
    expect(request.tasks.sent).toContainEqual({
      type: "export.process",
      jobId: createdExport.job.id,
    });
    expect((await data.exports.list({ workspaceId: second.id })).jobs).toEqual(
      []
    );
    const started = await uploads.initiate({
      workspaceId: ws.id,
      type: "import",
      fileType: "text/markdown",
      fileSize: 9,
      fileName: "post.md",
    });
    objects.set(started.key, {
      size: 9,
      httpMetadata: { contentType: "text/markdown" },
    });
    const createdImport = await data.imports.create({
      workspaceId: ws.id,
      token: started.token,
      key: started.key,
      fileType: "text/markdown",
      fileSize: 9,
      fileName: "post.md",
    });
    expect(request.tasks.sent).toContainEqual({
      type: "import.process",
      jobId: createdImport.id,
    });
    expect((await data.imports.list({ workspaceId: second.id })).jobs).toEqual(
      []
    );
    expect((await data.imports.list({ workspaceId: ws.id })).jobs[0]?.id).toBe(
      createdImport.id
    );
  });

  it("the emailed export link needs its token and a live export", async () => {
    const ws = await seedWorkspace(testDb.db);
    const token = "emailed-download-token";
    const tokenHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
      ),
      (byte) => byte.toString(16).padStart(2, "0")
    ).join("");
    const insertExport = async (expiresAt: Date) => {
      const id = createRecordId();
      await testDb.db.insert(exportJob).values({
        id,
        workspaceId: ws.id,
        status: "ready",
        scope: {},
        storageKey: `exports/${ws.id}/${id}.zip`,
        downloadTokenHash: tokenHash,
        expiresAt,
      });
      return id;
    };
    const ctx = {
      db: testDb.db,
      env: {
        ...testEnv,
        STORAGE: {
          ...testEnv.STORAGE,
          head: async () => ({ size: 1, httpMetadata: {} }),
        },
      },
    };
    const live = await insertExport(new Date(Date.now() + 60_000));
    const expired = await insertExport(new Date(Date.now() - 60_000));

    const { url } = await getExportDownloadByToken(ctx, live, token);
    expect(new URL(url).pathname).toBe(
      `/${testEnv.R2_BUCKET_NAME}/exports/${ws.id}/${live}.zip`
    );
    expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("300");
    await expect(
      getExportDownloadByToken(ctx, live, "wrong-token")
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      getExportDownloadByToken(ctx, expired, token)
    ).rejects.toMatchObject({ status: 410 });
    await expect(
      getExportDownloadByToken(ctx, createRecordId(), token)
    ).rejects.toMatchObject({ status: 404 });
  });
});
