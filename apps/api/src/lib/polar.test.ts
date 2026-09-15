import { afterEach, describe, expect, it, vi } from "vitest";
import { createPolarClient, POLAR_API_VERSION } from "./polar";

describe("createPolarClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pins every request to the configured Polar API version", async () => {
    let capturedRequest: Request | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        capturedRequest = request;

        return new Response(JSON.stringify({ inserted: 1, duplicates: 0 }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      })
    );

    const polar = createPolarClient("test_access_token");

    await polar.events.ingest({
      events: [{ externalCustomerId: "customer_123", name: "api_request" }],
    });

    expect(capturedRequest?.headers.get("Polar-Version")).toBe(
      POLAR_API_VERSION
    );
  });
});
