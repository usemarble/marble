import { describe, expect, it } from "vitest";
import { webhookDisableDue, webhookWarningDue } from "./webhook-health";

type EndpointHealth = Parameters<typeof webhookWarningDue>[0];

const STARTED = new Date("2026-10-13T12:00:00.000Z");
const WARNED = new Date("2026-10-13T12:10:00.000Z");
const DEADLINE = new Date("2026-10-16T12:10:00.000Z");

function failingEndpoint(
  overrides: Partial<EndpointHealth> = {}
): EndpointHealth {
  return {
    enabled: true,
    consecutiveFailures: 10,
    failureStartedAt: STARTED,
    lastFailureAt: WARNED,
    lastFailureEmailAt: null,
    failureIncidentId: "incident-1",
    ...overrides,
  };
}

describe("webhook failure warning policy", () => {
  it.each([
    { count: 9, elapsedMs: 600_000, due: false },
    { count: 10, elapsedMs: 599_999, due: false },
    { count: 10, elapsedMs: 600_000, due: true },
    { count: 11, elapsedMs: 600_001, due: true },
  ])(
    "requires ten failures across ten minutes: $count failures in $elapsedMs ms",
    ({ count, elapsedMs, due }) => {
      const endpoint = failingEndpoint({ consecutiveFailures: count });
      const now = new Date(STARTED.getTime() + elapsedMs);
      expect(webhookWarningDue(endpoint, now)).toBe(due);
    }
  );

  it.each([
    { enabled: false },
    { failureIncidentId: null },
    { failureStartedAt: null },
    { lastFailureEmailAt: WARNED },
  ])("does not warn an inactive or already warned incident: %o", (override) => {
    expect(webhookWarningDue(failingEndpoint(override), WARNED)).toBe(false);
  });
});

describe("webhook disablement policy", () => {
  it.each([
    { nowOffset: -1, failureOffset: -1, due: false },
    { nowOffset: 0, failureOffset: -1, due: false },
    { nowOffset: 0, failureOffset: 0, due: true },
    { nowOffset: 1, failureOffset: 1, due: true },
  ])(
    "requires three days after the warning and a failure at or after that deadline: %o",
    ({ nowOffset, failureOffset, due }) => {
      const endpoint = failingEndpoint({
        lastFailureEmailAt: WARNED,
        lastFailureAt: new Date(DEADLINE.getTime() + failureOffset),
      });
      expect(
        webhookDisableDue(endpoint, new Date(DEADLINE.getTime() + nowOffset))
      ).toBe(due);
    }
  );

  it("does not disable a quiet endpoint even days after the grace period", () => {
    const endpoint = failingEndpoint({ lastFailureEmailAt: WARNED });
    const muchLater = new Date("2026-10-23T12:10:00.000Z");
    expect(webhookDisableDue(endpoint, muchLater)).toBe(false);
  });

  it.each([
    { enabled: false },
    { failureIncidentId: null },
    { lastFailureEmailAt: null },
    { lastFailureAt: null },
    { consecutiveFailures: 9 },
  ])("does not disable an ineligible endpoint: %o", (override) => {
    const endpoint = failingEndpoint({
      lastFailureEmailAt: WARNED,
      lastFailureAt: DEADLINE,
      ...override,
    });
    expect(webhookDisableDue(endpoint, DEADLINE)).toBe(false);
  });

  it("does not warn or disable after a successful response clears the incident", () => {
    const recovered = failingEndpoint({
      consecutiveFailures: 0,
      failureStartedAt: null,
      lastFailureAt: null,
      failureIncidentId: null,
      lastFailureEmailAt: null,
    });
    expect(webhookWarningDue(recovered, DEADLINE)).toBe(false);
    expect(webhookDisableDue(recovered, DEADLINE)).toBe(false);
  });
});
