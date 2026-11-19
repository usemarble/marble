import { createRecordId } from "@marble/db/id";
import { member, user, workspace } from "@marble/db/schema";
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
import { createAuth } from "./index";
import { testEnv } from "./test-env";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const avatarUrl = "https://avatars.githubusercontent.com/u/42";

function googleIdToken(email: string) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const claims = { sub: email, email, email_verified: false };
  return `${encode({ alg: "none" })}.${encode(claims)}.signature`;
}

const providerResponses = {
  github: (email: string, id: number): Record<string, unknown> => ({
    "https://github.com/login/oauth/access_token": {
      access_token: "provider-access-token",
    },
    "https://api.github.com/user": {
      id,
      avatar_url: avatarUrl,
      login: "timezone-user",
      name: "Timezone User",
      email,
    },
    "https://api.github.com/user/emails": [
      { email, primary: true, verified: false },
    ],
  }),
  google: (email: string): Record<string, unknown> => ({
    "https://oauth2.googleapis.com/token": {
      access_token: "provider-access-token",
      id_token: googleIdToken(email),
    },
  }),
};

describe("OAuth sign-up timezone", () => {
  it.each([
    {
      provider: "github",
      id: 42,
      checksAvatar: true,
      cookie: "marble_timezone=America%2FNew_York",
      timezone: "Asia/Tokyo",
      expected: "America/New_York",
    },
    {
      provider: "google",
      id: 43,
      cookie: "marble_timezone=America%2FNew_York",
      expected: "America/New_York",
    },
    {
      provider: "github",
      id: 44,
      timezone: "Asia/Tokyo",
      expected: "Asia/Tokyo",
    },
    {
      provider: "github",
      id: 45,
      cookie: "marble_timezone=Mars%2FOlympus",
      expected: "Europe/London",
    },
  ] as const)(
    "creates a Personal workspace in $expected from the $provider callback",
    async ({ provider, id, expected, ...requestContext }) => {
      const email = `${createRecordId()}@test.invalid`;
      const responses = providerResponses[provider](email, id);
      const nativeFetch = globalThis.fetch;
      vi.stubGlobal(
        "fetch",
        async (input: string | URL | Request, init?: RequestInit) => {
          const url = new Request(input, init).url;
          if (url === avatarUrl) {
            return new Response("avatar", {
              headers: { "content-type": "image/png" },
            });
          }
          return url in responses
            ? Response.json(responses[url])
            : nativeFetch(input, init);
        }
      );
      const auth = createAuth({
        db: testDb.db,
        env: testEnv({ REDIS_TOKEN: "justusemarble" }),
      });

      const started = await auth.handler(
        new Request("http://localhost:8787/api/auth/sign-in/social", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            provider,
            callbackURL: "http://localhost:3000/",
          }),
        })
      );
      const { url } = (await started.json()) as { url: string };
      const state = new URL(url).searchParams.get("state");
      const stateCookies = started.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0]);

      if ("cookie" in requestContext) {
        stateCookies.push(requestContext.cookie);
      }
      const callbackRequest = new Request(
        `http://localhost:8787/api/auth/callback/${provider}?code=provider-code&state=${state}`,
        { headers: { cookie: stateCookies.join("; ") } }
      );
      if ("timezone" in requestContext) {
        Object.assign(callbackRequest, {
          cf: { timezone: requestContext.timezone },
        });
      }
      const callback = await auth.handler(callbackRequest);

      expect(callback.headers.get("location")).toBe("http://localhost:3000/");
      const rows = await testDb.db
        .select({ name: workspace.name, timezone: workspace.timezone })
        .from(user)
        .innerJoin(member, eq(member.userId, user.id))
        .innerJoin(workspace, eq(workspace.id, member.organizationId))
        .where(eq(user.email, email));
      expect(rows).toEqual([{ name: "Personal", timezone: expected }]);

      if ("checksAvatar" in requestContext) {
        const sessionCookies = callback.headers
          .getSetCookie()
          .map((cookie) => cookie.split(";")[0])
          .join("; ");
        const session = await auth.handler(
          new Request("http://localhost:8787/api/auth/get-session", {
            headers: { cookie: sessionCookies },
          })
        );
        expect(await session.json()).toMatchObject({
          user: {
            email,
            image: expect.stringMatching(
              /^https:\/\/cdn-test\.marblecms\.com\/avatars\//
            ),
          },
        });
      }
    }
  );
});
