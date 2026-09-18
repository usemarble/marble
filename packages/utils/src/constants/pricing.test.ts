import { describe, expect, it } from "vitest";
import { getPlanTrialCopy, getPlanTrialDays, PRICING_PLANS } from "./pricing";

describe("plan trials", () => {
  it("offers no trial on free or hobby", () => {
    for (const plan of ["free", "hobby"] as const) {
      expect(getPlanTrialDays(plan)).toBeUndefined();
      expect(getPlanTrialCopy(plan)).toBeUndefined();
    }
  });

  it("offers a trial on pro", () => {
    expect(getPlanTrialDays("pro")).toBe(3);
    expect(getPlanTrialCopy("pro")).toBe("3 day free trial");
  });

  it("lists every plan exactly once", () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual([
      "free",
      "hobby",
      "pro",
    ]);
  });
});
