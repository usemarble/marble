import { createRecordId } from "@marble/db/id";
import { user } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { AuthEnv } from "../env";
import { createAuth } from "../index";
import { testEnv } from "../test-env";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Polar customer hooks during signup", () => {
  it.each([
    { mode: "production", credentials: true },
    { mode: "production", credentials: false },
    { mode: "staging", credentials: true },
    { mode: "staging", credentials: false },
    { mode: "dev", credentials: false },
  ] satisfies { mode: AuthEnv["MODE"]; credentials: boolean }[])(
    "$mode signup and profile changes work despite a Polar outage, credentials=$credentials",
    async ({ mode, credentials }) => {
      const email = `${createRecordId()}@test.invalid`;
      const configuredEnv = testEnv({
        MODE: mode,
        REDIS_TOKEN: "justusemarble",
      });
      const {
        POLAR_ACCESS_TOKEN: _token,
        POLAR_WEBHOOK_SECRET: _secret,
        ...unconfiguredEnv
      } = configuredEnv;
      const env = credentials ? configuredEnv : unconfiguredEnv;
      const auth = createAuth({
        db: testDb.db,
        env,
      });
      const nativeFetch = globalThis.fetch;
      const polarRequests = vi.fn();
      let workspaceReady: boolean | undefined;
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      vi.stubGlobal(
        "fetch",
        async (input: string | URL | Request, init?: RequestInit) => {
          const request = new Request(input, init);
          if (new URL(request.url).hostname === "sandbox-api.polar.sh") {
            polarRequests(request.method);
            if (workspaceReady === undefined) {
              const created = await testDb.db.query.user.findFirst({
                where: eq(user.email, email),
                with: { members: true },
              });
              workspaceReady = created?.members.length === 1;
            }
            return new Response("Polar unavailable", { status: 503 });
          }
          return nativeFetch(input, init);
        }
      );

      const response = await auth.handler(
        new Request("http://localhost:8787/api/auth/sign-up/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            name: "Signup User",
            email,
            password: "correct-horse-battery",
          }),
        })
      );
      const created = await testDb.db.query.user.findFirst({
        where: eq(user.email, email),
        with: { accounts: true, members: { with: { organization: true } } },
      });

      expect(created?.id).toBeTruthy();
      expect(response.status).toBe(200);
      expect(created?.accounts).toHaveLength(1);
      expect(created?.members).toHaveLength(1);
      expect(created?.members[0]).toMatchObject({
        role: "owner",
        organization: { name: "Personal" },
      });
      const syncEnabled = mode === "production" && credentials;
      expect(polarRequests).toHaveBeenCalledTimes(syncEnabled ? 1 : 0);
      if (syncEnabled) {
        expect(workspaceReady).toBe(true);
      }

      const cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const request = (path: string, body: object) =>
        auth.handler(
          new Request(`http://localhost:8787/api/auth/${path}`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost:3000",
              cookie,
            },
            body: JSON.stringify(body),
          })
        );
      expect(
        (await request("update-user", { name: "Updated User" })).status
      ).toBe(200);
      expect(
        await testDb.db.query.user.findFirst({ where: eq(user.email, email) })
      ).toMatchObject({ name: "Updated User" });
      expect(
        (await request("delete-user", { password: "correct-horse-battery" }))
          .status
      ).toBe(200);
      expect(
        await testDb.db.query.user.findFirst({ where: eq(user.email, email) })
      ).toBeUndefined();
      expect(polarRequests.mock.calls.flat()).toEqual(
        syncEnabled ? ["GET", "PATCH", "DELETE"] : []
      );
    }
  );
});
