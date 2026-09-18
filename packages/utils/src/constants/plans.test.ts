import { describe, expect, it } from "vitest";
import {
  getWorkspacePlan,
  isSubscriptionActive,
  SUBSCRIPTION_ACCESS_GRACE_MS,
} from "./plans";

const NOW = new Date("2026-09-18T12:00:00.000Z");
const days = (n: number) => n * 24 * 60 * 60 * 1000;
const fromNow = (ms: number) => new Date(NOW.getTime() + ms);

describe("isSubscriptionActive", () => {
  it("denies access when there is no subscription", () => {
    expect(isSubscriptionActive(null, NOW)).toBe(false);
    expect(isSubscriptionActive(undefined, NOW)).toBe(false);
  });

  it("grants access inside the current period", () => {
    for (const status of ["active", "trialing"]) {
      expect(
        isSubscriptionActive(
          {
            status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: fromNow(days(10)),
          },
          NOW
        )
      ).toBe(true);
    }
  });

  it("keeps a renewing subscription alive while a cycle webhook is late", () => {
    expect(
      isSubscriptionActive(
        {
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: fromNow(-days(1)),
        },
        NOW
      )
    ).toBe(true);
  });

  it("stops granting access once the period is stale beyond the grace window", () => {
    // A row left `active`/`trialing` by a webhook we never received must not
    // grant a paid plan forever.
    for (const status of ["active", "trialing"]) {
      expect(
        isSubscriptionActive(
          {
            status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: new Date(
              NOW.getTime() - SUBSCRIPTION_ACCESS_GRACE_MS - 1000
            ),
          },
          NOW
        )
      ).toBe(false);
    }
  });

  describe("cancellation scheduled at period end", () => {
    it("grants access until the period ends", () => {
      // Cancelling during a trial: Polar leaves the status `trialing` and sets
      // currentPeriodEnd to the trial end.
      expect(
        isSubscriptionActive(
          {
            status: "trialing",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: fromNow(days(2)),
          },
          NOW
        )
      ).toBe(true);
    });

    it("gets no grace window once that end date passes", () => {
      expect(
        isSubscriptionActive(
          {
            status: "trialing",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: fromNow(-1000),
          },
          NOW
        )
      ).toBe(false);
    });

    it("honours rows this app historically stored as canceled", () => {
      expect(
        isSubscriptionActive(
          {
            status: "canceled",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: fromNow(days(2)),
          },
          NOW
        )
      ).toBe(true);
      expect(
        isSubscriptionActive(
          {
            status: "canceled",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: fromNow(-1000),
          },
          NOW
        )
      ).toBe(false);
    });
  });

  it("denies access when the period end is missing or unparseable", () => {
    // The column is NOT NULL, so this only guards malformed input - but
    // granting access here would reopen the stale-row hole entirely.
    for (const currentPeriodEnd of [null, undefined, "", "not-a-date"]) {
      expect(
        isSubscriptionActive(
          { status: "active", cancelAtPeriodEnd: false, currentPeriodEnd },
          NOW
        )
      ).toBe(false);
      expect(
        isSubscriptionActive(
          { status: "trialing", cancelAtPeriodEnd: true, currentPeriodEnd },
          NOW
        )
      ).toBe(false);
    }
  });

  it("denies access for statuses that are not entitled", () => {
    for (const status of [
      "canceled",
      "expired",
      "paused",
      "past_due",
      "incomplete",
      "unpaid",
    ]) {
      expect(
        isSubscriptionActive(
          {
            status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: fromNow(days(10)),
          },
          NOW
        )
      ).toBe(false);
    }
  });
});

describe("getWorkspacePlan", () => {
  it("resolves the paid plan while the subscription is active", () => {
    expect(
      getWorkspacePlan({
        plan: "hobby",
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: fromNow(days(10)),
      })
    ).toBe("hobby");
  });

  it("falls back to free without a subscription", () => {
    expect(getWorkspacePlan(null)).toBe("free");
  });

  it("falls back to free once a revoked subscription is no longer entitled", () => {
    expect(
      getWorkspacePlan({
        plan: "pro",
        status: "expired",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: fromNow(-days(1)),
      })
    ).toBe("free");
  });
});
