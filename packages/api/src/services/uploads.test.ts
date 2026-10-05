import { createRecordId } from "@marble/db/id";
import {
  media,
  usageEvent,
  user,
  workspace,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { and, count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestContext,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";
import { completeUpload, initiateUpload, signUploadIntent } from "./uploads";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function fixture() {
  const actor = await seedUser(testDb.db);
  const ws = await seedWorkspace(testDb.db, actor.id);
  const objects = new Map<
    string,
    { size: number; httpMetadata: { contentType: string } }
  >();
  const deleted: string[] = [];
  const storage = {
    head: async (key: string) => objects.get(key) ?? null,
    get: async (_key: string) => null,
    delete: async (key: string | string[]) => {
      deleted.push(...(Array.isArray(key) ? key : [key]));
    },
  };
  const request = createTestContext(testDb.db, {
    session: sessionFor(actor),
    env: { ...testEnv, STORAGE: storage },
  });
  const input = { type: "media" as const, fileType: "image/png", fileSize: 17 };
  const initiate = () =>
    initiateUpload(request.context, actor, ws.id, "owner", input);
  const complete = (
    upload: Awaited<ReturnType<typeof initiate>>,
    values = {}
  ) =>
    completeUpload(request.context, actor, ws.id, "owner", {
      type: "media",
      key: upload.key,
      token: upload.token,
      fileType: input.fileType,
      fileSize: input.fileSize,
      name: "test.png",
      ...values,
    });
  return {
    actor,
    ws,
    objects,
    deleted,
    storage,
    request,
    initiate,
    complete,
    input,
  };
}

async function fillStorage(workspaceId: string, size: number) {
  await testDb.db.insert(media).values({
    id: createRecordId(),
    workspaceId,
    name: "existing.png",
    url: "https://cdn.example.invalid/existing.png",
    storageKey: `media/${workspaceId}/${createRecordId()}.png`,
    size,
    type: "image",
  });
}

describe("dashboard uploads", () => {
  it("rejects expired and altered intents, and wrong user or workspace completion", async () => {
    const f = await fixture();
    const upload = await f.initiate();
    f.objects.set(upload.key, {
      size: 17,
      httpMetadata: { contentType: "image/png" },
    });
    await expect(
      f.complete(upload, { token: `${upload.token}x` })
    ).rejects.toThrow("Invalid upload intent");
    const expired = await signUploadIntent(testEnv.BETTER_AUTH_SECRET, {
      userId: f.actor.id,
      workspaceId: f.ws.id,
      key: upload.key,
      type: "media",
      mimeType: "image/png",
      size: 17,
      expiresAt: Date.now() - 1000,
    });
    await expect(f.complete(upload, { token: expired })).rejects.toThrow(
      "expired"
    );
    const another = await seedUser(testDb.db);
    await expect(
      completeUpload(f.request.context, another, f.ws.id, "owner", {
        type: "media",
        key: upload.key,
        token: upload.token,
        fileType: "image/png",
        fileSize: 17,
        name: "test.png",
      })
    ).rejects.toThrow("Invalid upload intent");
    const otherWs = await seedWorkspace(testDb.db, f.actor.id);
    await expect(
      completeUpload(f.request.context, f.actor, otherWs.id, "owner", {
        type: "media",
        key: upload.key,
        token: upload.token,
        fileType: "image/png",
        fileSize: 17,
        name: "test.png",
      })
    ).rejects.toThrow("Invalid upload intent");
  });

  it("rejects missing objects and actual size or MIME mismatches", async () => {
    const f = await fixture();
    const upload = await f.initiate();
    await expect(f.complete(upload)).rejects.toThrow("missing");
    f.objects.set(upload.key, {
      size: 18,
      httpMetadata: { contentType: "image/png" },
    });
    await expect(f.complete(upload)).rejects.toThrow("does not match");
    f.objects.set(upload.key, {
      size: 17,
      httpMetadata: { contentType: "image/jpeg" },
    });
    await expect(f.complete(upload)).rejects.toThrow("does not match");
  });

  it("enforces MIME, file size, owner role, and allowance at initiation", async () => {
    const f = await fixture();
    await expect(
      initiateUpload(f.request.context, f.actor, f.ws.id, "owner", {
        type: "media",
        fileType: "application/pdf",
        fileSize: 10,
      })
    ).rejects.toThrow("not allowed");
    await expect(
      initiateUpload(f.request.context, f.actor, f.ws.id, "owner", {
        type: "media",
        fileType: "image/png",
        fileSize: 250 * 1024 * 1024 + 1,
      })
    ).rejects.toThrow("maximum limit");
    await expect(
      initiateUpload(f.request.context, f.actor, f.ws.id, "member", {
        type: "logo",
        fileType: "image/png",
        fileSize: 10,
      })
    ).rejects.toThrow("owners");
    await fillStorage(f.ws.id, 1024 * 1024 * 1024 - 1);
    await expect(f.initiate()).rejects.toThrow("storage limit");
  });

  it("rechecks allowance at completion and creates no record when full", async () => {
    const f = await fixture();
    const upload = await f.initiate();
    f.objects.set(upload.key, {
      size: 17,
      httpMetadata: { contentType: "image/png" },
    });
    await fillStorage(f.ws.id, 1024 * 1024 * 1024 - 1);
    await expect(f.complete(upload)).rejects.toThrow("storage limit");
    const [rows] = await testDb.db
      .select({ value: count() })
      .from(media)
      .where(eq(media.storageKey, upload.key));
    expect(rows?.value).toBe(0);
  });

  it("completes media once across retries, with one event and usage row", async () => {
    const f = await fixture();
    const upload = await f.initiate();
    f.objects.set(upload.key, {
      size: 17,
      httpMetadata: { contentType: "image/png" },
    });
    const first = await f.complete(upload);
    const second = await f.complete(upload);
    if (!("id" in first) || !("id" in second)) {
      throw new Error("media completion returned no media record");
    }
    await f.request.flush();
    expect(second.id).toBe(first.id);
    const [mediaCount] = await testDb.db
      .select({ value: count() })
      .from(media)
      .where(eq(media.storageKey, upload.key));
    const [usageCount] = await testDb.db
      .select({ value: count() })
      .from(usageEvent)
      .where(
        and(
          eq(usageEvent.workspaceId, f.ws.id),
          eq(usageEvent.type, "media_upload")
        )
      );
    const events = await testDb.db
      .select()
      .from(workspaceEvent)
      .where(
        and(
          eq(workspaceEvent.workspaceId, f.ws.id),
          eq(workspaceEvent.type, "media_uploaded")
        )
      );
    expect(mediaCount?.value).toBe(1);
    expect(usageCount?.value).toBe(1);
    expect(events).toHaveLength(1);
    expect(f.request.events.sent).toHaveLength(1);
  });

  it("updates user avatar and workspace logo after verified uploads", async () => {
    const f = await fixture();
    for (const type of ["avatar", "logo"] as const) {
      const started = await initiateUpload(
        f.request.context,
        f.actor,
        f.ws.id,
        "owner",
        { type, fileType: "image/png", fileSize: 17 }
      );
      f.objects.set(started.key, {
        size: 17,
        httpMetadata: { contentType: "image/png" },
      });
      const result = await completeUpload(
        f.request.context,
        f.actor,
        f.ws.id,
        "owner",
        {
          type,
          key: started.key,
          token: started.token,
          fileType: "image/png",
          fileSize: 17,
        }
      );
      expect(result.url).toContain(started.key);
      if (type === "avatar") {
        const row = await testDb.db.query.user.findFirst({
          where: eq(user.id, f.actor.id),
        });
        expect(row?.image).toBe(result.url);
      } else {
        const row = await testDb.db.query.workspace.findFirst({
          where: eq(workspace.id, f.ws.id),
        });
        expect(row?.logo).toBe(result.url);
      }
    }
  });
});
