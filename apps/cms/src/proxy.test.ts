import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const successUrl = "https://cms.example.com/billing/success";

describe("billing success proxy", () => {
  it.each([
    "checkout_id=legacy",
    "customer_session_token=token",
    "checkout_id=legacy&customer_session_token=token",
    "checkout_id=",
    "customer_session_token=",
    "checkout_id=&customer_session_token=",
    "checkout_id=&checkout_id=legacy&customer_session_token=token&customer_session_token=",
  ])(
    "redirects %s without rendering or dropping unrelated query",
    async (query) => {
      const request = new NextRequest(
        `${successUrl}?source=email&tag=a&${query}&tag=b&_rsc=flight`
      );
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${successUrl}?source=email&tag=a&tag=b&_rsc=flight`
      );
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).toBe("");
    }
  );

  it("continues the clean second request without a redirect loop", () => {
    const cleanUrl = `${successUrl}?source=email&_rsc=flight`;
    const redirect = proxy(
      new NextRequest(`${cleanUrl}&customer_session_token=token`)
    );
    expect(redirect.headers.get("location")).toBe(cleanUrl);

    const response = proxy(new NextRequest(cleanUrl));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("referrer-policy")).toBeNull();
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it.each(["/billing/success", "/billing/success/"])(
    "matches the success route %s with Next's matcher",
    (pathname) => {
      expect(unstable_doesMiddlewareMatch({ config, url: pathname })).toBe(
        true
      );
    }
  );

  it.each(["/billing", "/billing/successful", "/billing/success/child"])(
    "leaves %s unaffected in both the matcher and handler",
    (pathname) => {
      const request = new NextRequest(
        `https://cms.example.com${pathname}?checkout_id=legacy&customer_session_token=token`
      );
      expect(unstable_doesMiddlewareMatch({ config, url: request.url })).toBe(
        false
      );

      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("referrer-policy")).toBeNull();
      expect(response.headers.get("cache-control")).toBeNull();
    }
  );
});
