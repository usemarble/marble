import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@marble/ui/components/sonner", () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("CMS auth HTTP client", () => {
  it("forwards incoming headers to the Worker and includes browser credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api-staging.marblecms.com");
    const fetch = vi.fn().mockResolvedValue(Response.json(null));
    vi.stubGlobal("fetch", fetch);
    const { authClient } = await import("./client");
    const result = await authClient.getSession({
      fetchOptions: {
        headers: new Headers({
          cookie: "marble-staging.session_token=test-session",
          "x-request-id": "test-request",
        }),
      },
    });
    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://api-staging.marblecms.com/api/auth/get-session"
    );
    expect(options.credentials).toBe("include");
    expect(options.headers.get("cookie")).toBe(
      "marble-staging.session_token=test-session"
    );
    expect(options.headers.get("x-request-id")).toBe("test-request");
  });

  it("returns server-side rate-limit errors without calling a browser toast", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api-staging.marblecms.com");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { message: "Too many requests", code: "TOO_MANY_REQUESTS" },
            { status: 429 }
          )
        )
    );
    const { authClient } = await import("./client");
    const { toast } = await import("@marble/ui/components/sonner");
    const result = await authClient.getSession();
    expect(result.error?.status).toBe(429);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
