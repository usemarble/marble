import type { models } from "@polar-sh/sdk/2026-10";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testEnv } from "../test-env";
import { createPolarAuthClient } from "./client";
import {
  createPolarCustomer,
  deletePolarCustomer,
  updatePolarCustomer,
} from "./customer";

const user = {
  id: "user/test",
  email: "owner@test.invalid",
  name: "Test Owner",
};
const customer = {
  id: "polar-customer",
  created_at: "2026-10-01T00:00:00Z",
  modified_at: null,
  metadata: {},
  external_id: user.id,
  email: user.email,
  email_verified: false,
  type: "individual",
  name: user.name,
  billing_name: null,
  billing_address: null,
  tax_id: null,
  organization_id: "polar-organization",
  deleted_at: null,
  first_user_event_at: null,
  avatar_url: null,
} satisfies models.Customer;
const env = testEnv({ MODE: "production" });
const polar = createPolarAuthClient(env.POLAR_ACCESS_TOKEN, env.POLAR_SERVER);
const options = { polar, env, user };
const http = vi.fn<typeof globalThis.fetch>();

beforeEach(() => {
  http
    .mockReset()
    .mockImplementation(() => Promise.resolve(Response.json(customer)));
  vi.stubGlobal("fetch", http);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Polar customer creation", () => {
  it("looks up the email and creates the same identity as the plugin", async () => {
    http.mockResolvedValueOnce(
      Response.json({ items: [], pagination: { total_count: 0, max_page: 1 } })
    );
    await createPolarCustomer(options);
    expect(http).toHaveBeenCalledTimes(2);
    const lookup = new URL(String(http.mock.calls[0]?.[0]));
    expect(lookup.pathname).toBe("/v1/customers/");
    expect(lookup.searchParams.get("email")).toBe(user.email);
    expect(http.mock.calls[1]?.[1]?.method).toBe("POST");
    expect(JSON.parse(String(http.mock.calls[1]?.[1]?.body))).toEqual({
      email: user.email,
      name: user.name,
      external_id: user.id,
    });
  });

  it.each([
    { label: "same user", existing: customer, link: false, conflict: false },
    {
      label: "unlinked individual",
      existing: { ...customer, external_id: null },
      link: true,
      conflict: false,
    },
    {
      label: "another user",
      existing: { ...customer, external_id: "another-user" },
      link: false,
      conflict: true,
    },
    {
      label: "team",
      existing: { ...customer, type: "team" },
      link: false,
      conflict: true,
    },
  ])(
    "handles an existing $label without replacing its data",
    async ({ existing, link, conflict }) => {
      http.mockResolvedValueOnce(
        Response.json({
          items: [existing],
          pagination: { total_count: 1, max_page: 1 },
        })
      );
      await expect(createPolarCustomer(options)).resolves.toBeUndefined();
      expect(http).toHaveBeenCalledTimes(link ? 2 : 1);
      if (link) {
        expect(http).toHaveBeenLastCalledWith(
          "https://sandbox-api.polar.sh/v1/customers/polar-customer",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ external_id: user.id }),
          })
        );
      }
      expect(console.warn).toHaveBeenCalledTimes(conflict ? 1 : 0);
      expect(console.error).not.toHaveBeenCalled();
    }
  );

  it.each(["create", "link"])(
    "swallows a failed %s write without a fallback overwrite",
    async (operation) => {
      http.mockResolvedValueOnce(
        Response.json({
          items:
            operation === "link" ? [{ ...customer, external_id: null }] : [],
          pagination: {
            total_count: operation === "link" ? 1 : 0,
            max_page: 1,
          },
        })
      );
      http.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
      await expect(createPolarCustomer(options)).resolves.toBeUndefined();
      expect(http).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledOnce();
    }
  );
});

describe("Polar customer profile and deletion", () => {
  it("updates only name and email and deletes by the encoded external user ID", async () => {
    await updatePolarCustomer(options);
    await deletePolarCustomer(options);
    const externalUrl =
      "https://sandbox-api.polar.sh/v1/customers/external/user%2Ftest";
    expect(http).toHaveBeenNthCalledWith(
      1,
      externalUrl,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ email: user.email, name: user.name }),
      })
    );
    expect(http).toHaveBeenNthCalledWith(
      2,
      externalUrl,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it.each([401, 404, 429, 503])(
    "logs and swallows HTTP %i without retrying",
    async (status) => {
      http.mockImplementation(() =>
        Promise.resolve(Response.json({ detail: "unavailable" }, { status }))
      );
      await expect(updatePolarCustomer(options)).resolves.toBeUndefined();
      await expect(deletePolarCustomer(options)).resolves.toBeUndefined();
      expect(http).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledTimes(2);
    }
  );

  it("aborts a stalled SDK request after three seconds and continues without retrying", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    http.mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true }
          );
        })
    );
    await expect(updatePolarCustomer(options)).resolves.toBeUndefined();
    expect(timeout).toHaveBeenCalledWith(3000);
    expect(http).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledOnce();
  });
});

describe("Polar customer sync configuration", () => {
  it.each(["dev", "staging"] as const)(
    "makes zero customer requests in %s even with credentials",
    async (MODE) => {
      for (const sync of [
        createPolarCustomer,
        updatePolarCustomer,
        deletePolarCustomer,
      ]) {
        await sync({ ...options, env: testEnv({ MODE }) });
      }
      expect(http).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "", "   "])(
    "skips missing production credentials %j with a diagnostic",
    async (token) => {
      const missingEnv = testEnv({ POLAR_ACCESS_TOKEN: token });
      missingEnv.MODE = "production";
      for (const sync of [
        createPolarCustomer,
        updatePolarCustomer,
        deletePolarCustomer,
      ]) {
        await sync({ ...options, env: missingEnv });
      }
      expect(http).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(3);
    }
  );
});
