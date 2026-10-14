import { beforeEach, describe, expect, it, vi } from "vitest";
import { openWorkspaceBilling } from "./billing";

const state = vi.hoisted(() => ({ checkout: vi.fn(), portal: vi.fn() }));
vi.mock("@/lib/auth/client", () => ({
  authClient: { checkout: state.checkout, customer: { portal: state.portal } },
}));

beforeEach(() => {
  state.checkout.mockReset().mockResolvedValue({ error: null });
  state.portal.mockReset().mockResolvedValue({ error: null });
});

describe("Workspace billing navigation", () => {
  it.each(["hobby", "hobby-yearly", "pro", "pro-yearly"] as const)(
    "opens the portal for an existing subscriber selecting %s",
    async (plan) => {
      await openWorkspaceBilling(
        { id: "workspace", hasSubscription: true },
        plan
      );
      expect(state.portal).toHaveBeenCalledOnce();
      expect(state.checkout).not.toHaveBeenCalled();
    }
  );

  it("starts checkout for an unsubscribed workspace", async () => {
    await openWorkspaceBilling(
      { id: "workspace", hasSubscription: false },
      "pro"
    );
    expect(state.checkout).toHaveBeenCalledWith({
      slug: "pro",
      reference_id: "workspace",
    });
    expect(state.portal).not.toHaveBeenCalled();
  });

  it("opens the portal if the server finds a subscription missing from the UI", async () => {
    state.checkout.mockResolvedValue({
      error: { code: "WORKSPACE_SUBSCRIPTION_EXISTS" },
    });
    await openWorkspaceBilling(
      { id: "workspace", hasSubscription: false },
      "pro"
    );
    expect(state.portal).toHaveBeenCalledOnce();
  });

  it("surfaces a billing outage without falling through to another checkout", async () => {
    state.checkout.mockResolvedValue({
      error: { code: "SERVICE_UNAVAILABLE", message: "Please try later" },
    });
    await expect(
      openWorkspaceBilling({ id: "workspace", hasSubscription: false }, "pro")
    ).rejects.toThrow("Please try later");
    expect(state.checkout).toHaveBeenCalledOnce();
    expect(state.portal).not.toHaveBeenCalled();
  });
});
