import { describe, expect, it } from "vitest";
import { canGrantPaidReward } from "@/lib/shop";

describe("canGrantPaidReward", () => {
  it("is false without native billing", () => {
    expect(canGrantPaidReward(undefined)).toBe(false);
  });

  it("is true when purchaseSubscription exists", () => {
    expect(canGrantPaidReward({ purchaseSubscription: async () => ({ success: true }) })).toBe(true);
  });
});
