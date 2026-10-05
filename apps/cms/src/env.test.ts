import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("public env", () => {
  it("accepts the required values, defaults the site URL and leaves analytics off", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_DATABUDDY_CLIENT_ID", "");

    const { env } = await import("./env");

    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:8787");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://marblecms.com");
    expect(env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID).toBeUndefined();
  });

  it.each([
    ["NEXT_PUBLIC_API_URL", ""],
    ["NEXT_PUBLIC_API_URL", "not a url"],
    ["NEXT_PUBLIC_APP_URL", ""],
  ])("refuses %s = %j", async (name, value) => {
    vi.stubEnv(name, value);

    await expect(import("./env")).rejects.toThrow(
      /Invalid environment variables/
    );
  });
});
