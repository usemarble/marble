import { createRecordId } from "@marble/db/id";
import { account, session, user } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "./index";
import { testEnv } from "./test-env";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

const stagingEnv = testEnv({
  MODE: "staging",
  BETTER_AUTH_URL: "https://api-staging.marblecms.com",
  APP_URL: "https://staging.marblecms.com",
  AUTH_COOKIE_DOMAIN: ".marblecms.com",
  AUTH_COOKIE_PREFIX: "marble-staging",
  REDIS_TOKEN: "justusemarble",
});
const localEnv = testEnv({ REDIS_TOKEN: "justusemarble" });

describe("Worker sign-in", () => {
  it.each([
    {
      env: stagingEnv,
      ip: "203.0.113.42",
      storedIp: "203.0.113.42",
      name: "__Secure-marble-staging.session_token",
      attributes: [
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Domain=.marblecms.com",
      ],
    },
    {
      env: localEnv,
      ip: "2001:db8::42",
      storedIp: "2001:0db8:0000:0000:0000:0000:0000:0000",
      name: "marble-dev.session_token",
      attributes: ["HttpOnly", "SameSite=Lax"],
    },
  ])(
    "stores the Cloudflare IP and sets the $name cookie",
    async ({ env, ip, storedIp, name, attributes }) => {
      const auth = createAuth({ db: testDb.db, env });
      const userId = createRecordId();
      const email = `${userId}@test.invalid`;
      const password = "correct-horse-battery";
      const { password: passwordHasher } = await auth.$context;
      await testDb.db.insert(user).values({
        id: userId,
        name: "IP User",
        email,
        emailVerified: true,
      });
      await testDb.db.insert(account).values({
        id: createRecordId(),
        accountId: userId,
        userId,
        providerId: "credential",
        password: await passwordHasher.hash(password),
      });

      const response = await auth.handler(
        new Request(`${env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: env.APP_URL,
            "cf-connecting-ip": ip,
            "x-forwarded-for": "198.51.100.10",
          },
          body: JSON.stringify({ email, password }),
        })
      );

      expect(response.status).toBe(200);
      const cookie = response.headers
        .getSetCookie()
        .find((value) => value.startsWith(`${name}=`));
      expect(cookie).toBeDefined();
      const cookieAttributes = cookie?.split("; ").slice(1);
      expect(cookieAttributes).toEqual(expect.arrayContaining(attributes));
      if (env.MODE === "dev") {
        expect(cookie).not.toMatch(/; (?:Secure|Domain=)/);
      }
      const sessions = await testDb.db
        .select({ ipAddress: session.ipAddress })
        .from(session)
        .where(eq(session.userId, userId));
      expect(sessions).toEqual([{ ipAddress: storedIp }]);
    }
  );
});

it("serves the auth health endpoint locally without Polar credentials", async () => {
  const {
    POLAR_ACCESS_TOKEN: _token,
    POLAR_WEBHOOK_SECRET: _secret,
    ...env
  } = localEnv;
  const auth = createAuth({ db: testDb.db, env });
  const response = await auth.handler(
    new Request("http://localhost:8787/api/auth/ok")
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
