import { describe, expect, it } from "vitest";
import { resolveSignupTimezone } from "./timezone";

describe("resolveSignupTimezone", () => {
  it.each([
    [
      "a valid cookie",
      "marble_timezone=America%2FNew_York",
      "America/New_York",
    ],
    [
      "a valid cookie among others",
      "marble_app_id=abc12345; marble_timezone=Africa%2FLagos; other=1",
      "Africa/Lagos",
    ],
    ["an unencoded cookie", "marble_timezone=Asia/Tokyo", "Asia/Tokyo"],
    [
      "another spelling of a listed zone",
      "marble_timezone=Asia%2FKolkata",
      "Asia/Calcutta",
    ],
  ])("uses %s", (_case, cookieHeader, expected) => {
    expect(resolveSignupTimezone({ cookieHeader })).toBe(expected);
  });

  it.each([
    ["an unknown zone", "marble_timezone=Mars%2FOlympus"],
    ["UTC, which V8 does not list", "marble_timezone=UTC"],
    ["bad percent encoding", "marble_timezone=%E0%A4%A"],
    ["an empty cookie", "marble_timezone="],
    ["no timezone cookie", "marble_app_id=abc12345"],
    ["no cookie header", null],
  ])("falls back to Cloudflare, then London, for %s", (_case, cookieHeader) => {
    expect(
      resolveSignupTimezone({ cookieHeader, cloudflareTimezone: "Asia/Tokyo" })
    ).toBe("Asia/Tokyo");
    expect(resolveSignupTimezone({ cookieHeader })).toBe("Europe/London");
  });

  it("prefers the cookie over Cloudflare", () => {
    expect(
      resolveSignupTimezone({
        cookieHeader: "marble_timezone=America%2FNew_York",
        cloudflareTimezone: "Asia/Tokyo",
      })
    ).toBe("America/New_York");
  });

  it.each([["Mars/Olympus"], ["UTC"], [42], [null]])(
    "ignores the Cloudflare value %j",
    (cloudflareTimezone) => {
      expect(resolveSignupTimezone({ cloudflareTimezone })).toBe(
        "Europe/London"
      );
    }
  );
});
