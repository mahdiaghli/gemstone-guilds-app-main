import { describe, expect, it, vi } from "vitest";
import { applyOfferPurchase, canGrantPaidReward, purchasePremiumPlan, purchaseShopOffer } from "@/lib/shop";
import { readPlayerExtras } from "@/lib/playerExtras";

describe("canGrantPaidReward", () => {
  it("is false without native billing", () => {
    expect(canGrantPaidReward(undefined)).toBe(false);
  });

  it("is true when purchaseSubscription exists", () => {
    expect(canGrantPaidReward({ purchaseSubscription: async () => ({ success: true }) })).toBe(true);
  });
});

describe("paid shop purchases", () => {
  it("does not deliver a paid offer without server receipt verification", async () => {
    const userId = "unverified-shop-purchase";
    const gemsBefore = readPlayerExtras(userId).gems;
    const purchaseProduct = vi.fn().mockResolvedValue({ success: true });
    window.GemstoneNativeBilling = { purchaseProduct };

    expect((await purchaseShopOffer(userId, "diamonds", "diamonds-1", "cafe-bazaar")).ok).toBe(false);
    expect(applyOfferPurchase(userId, "diamonds", "diamonds-1").ok).toBe(false);
    expect(readPlayerExtras(userId).gems).toBe(gemsBefore);
    expect(purchaseProduct).not.toHaveBeenCalled();
    delete window.GemstoneNativeBilling;
  });

  it("does not activate premium from a client-side success flag", async () => {
    const userId = "unverified-premium-purchase";
    const purchaseSubscription = vi.fn().mockResolvedValue({ success: true });
    window.GemstoneNativeBilling = { purchaseSubscription };

    expect((await purchasePremiumPlan(userId, "premium-monthly", "myket")).ok).toBe(false);
    expect(readPlayerExtras(userId).premiumExpiresAt).toBeNull();
    expect(purchaseSubscription).not.toHaveBeenCalled();
    delete window.GemstoneNativeBilling;
  });
});
