import { describe, expect, it } from "vitest";
import { restrictLegacyPostStatus } from "./legacy-posts";

const WORKSPACE_ID = "workspace_123";

describe("restrictLegacyPostStatus", () => {
  it.each(["draft", "all"] as const)(
    "coerces legacy list requests for %s posts to published",
    (status) => {
      const url = new URL(
        `https://api.marblecms.com/v1/${WORKSPACE_ID}/posts?status=${status}&limit=20`
      );

      expect(restrictLegacyPostStatus(url, WORKSPACE_ID)).toBe(status);
      expect(url.searchParams.get("status")).toBe("published");
      expect(url.searchParams.get("limit")).toBe("20");
    }
  );

  it("coerces legacy single-post requests to published", () => {
    const url = new URL(
      `https://api.marblecms.com/v1/${WORKSPACE_ID}/posts/my-draft?status=draft`
    );

    expect(restrictLegacyPostStatus(url, WORKSPACE_ID)).toBe("draft");
    expect(url.searchParams.get("status")).toBe("published");
  });

  it.each([
    `/v1/${WORKSPACE_ID}/posts`,
    `/v1/${WORKSPACE_ID}/posts?status=published`,
    `/v1/${WORKSPACE_ID}/authors?status=draft`,
    `/v1/${WORKSPACE_ID}/postscript?status=draft`,
  ])("leaves non-sensitive legacy requests unchanged: %s", (path) => {
    const url = new URL(`https://api.marblecms.com${path}`);
    const originalUrl = url.toString();

    expect(restrictLegacyPostStatus(url, WORKSPACE_ID)).toBeNull();
    expect(url.toString()).toBe(originalUrl);
  });
});
