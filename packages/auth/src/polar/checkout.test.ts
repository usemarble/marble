import type { DbClient } from "@marble/db";
import { describe, expect, it, vi } from "vitest";
import { createAuth } from "../index";
import { testEnv } from "../test-env";

vi.mock("better-auth/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("better-auth/api")>()),
  getSessionFromCtx: vi.fn().mockResolvedValue({ user: { id: "user-test" } }),
}));

describe("Polar checkout authorization", () => {
  it("checks workspace ownership for the adapter's reference_id field", async () => {
    const findFirst = vi.fn().mockResolvedValue({ role: "member" });
    const auth = createAuth({
      db: { query: { member: { findFirst } } } as unknown as DbClient,
      env: testEnv(),
    });
    const response = await auth.handler(
      new Request("http://localhost:8787/api/auth/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ slug: "pro", reference_id: "workspace-test" }),
      })
    );
    expect(response.status).toBe(403);
    expect(findFirst).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({
      message: "Only workspace owners can start checkout",
    });
  });
});
