import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

async function writeCookie(protocol: string, timeZone: string) {
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);
  const document = { cookie: "" };
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", { location: { protocol } });
  const { saveBrowserTimezone } = await import("./signup-timezone");
  saveBrowserTimezone();
  return document.cookie;
}

describe("saveBrowserTimezone", () => {
  it("shares a secure cookie on the auth cookie domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_COOKIE_DOMAIN", ".marblecms.com");

    expect(await writeCookie("https:", "America/New_York")).toBe(
      "marble_timezone=America%2FNew_York; Max-Age=600; Path=/api/auth; SameSite=Lax; Domain=.marblecms.com; Secure"
    );
  });

  it("writes a host-only cookie on localhost", async () => {
    expect(await writeCookie("http:", "Etc/GMT+5")).toBe(
      "marble_timezone=Etc%2FGMT%2B5; Max-Age=600; Path=/api/auth; SameSite=Lax"
    );
  });
});
