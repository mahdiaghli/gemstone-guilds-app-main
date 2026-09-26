import type { TranslationKey } from "@/hooks/useLanguage";
import { awardCoins } from "@/lib/progression";
import { readPlayerExtras, updatePlayerExtras } from "@/lib/playerExtras";
import merchantImage from "@/assets/merchant.webp";
import merchantGirlImage from "@/assets/merchant girl.webp";
import merchantTwoImage from "@/assets/merchant2.webp";
import merchantGirlTwoImage from "@/assets/merchant girl2.webp";
import merchantThreeImage from "@/assets/merchant3.webp";
import merchantGirlThreeImage from "@/assets/merchant girl3.webp";
import background1 from "@/assets/back-ground1.png";
import background2 from "@/assets/back-ground2.png";
import background3 from "@/assets/back-ground3.png";
import background4 from "@/assets/back-ground4.png";
import background5 from "@/assets/back-ground5.png";
import background6 from "@/assets/back-ground6.png";

export interface ShopOffer {
  id: string;
  titleKey: TranslationKey;
  amount: number;
  amountKey: TranslationKey;
  price: number;
  discount: number;
  rewardType: "coins" | "gems" | "avatar" | "sticker" | "background";
  currency?: "tomans" | "gems";
}

export interface ShopSection {
  id: "coins" | "diamonds" | "avatars" | "backgrounds";
  bannerTitleKey: TranslationKey;
  bannerDescKey: TranslationKey;
  offers: ShopOffer[];
}

export type StoreProvider = "cafe-bazaar" | "myket" | "app-store";
export type PremiumPlanId = "premium-monthly" | "premium-quarterly" | "premium-yearly";

export interface PremiumPlan {
  id: PremiumPlanId;
  durationDays: number;
  priceTomans: number;
  bonusGems: number;
  cafeBazaarProductId: string;
  myketProductId: string;
  appStoreProductId: string;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "premium-monthly",
    durationDays: 30,
    priceTomans: 99,
    bonusGems: 20,
    cafeBazaarProductId: "rokhaki_premium_1m",
    myketProductId: "rokhaki_premium_1m",
    appStoreProductId: "com.expert.boardgames.rokhaki.premium.1m",
  },
  {
    id: "premium-quarterly",
    durationDays: 90,
    priceTomans: 199,
    bonusGems: 20,
    cafeBazaarProductId: "rokhaki_premium_3m",
    myketProductId: "rokhaki_premium_3m",
    appStoreProductId: "com.expert.boardgames.rokhaki.premium.3m",
  },
  {
    id: "premium-yearly",
    durationDays: 365,
    priceTomans: 599,
    bonusGems: 20,
    cafeBazaarProductId: "rokhaki_premium_12m",
    myketProductId: "rokhaki_premium_12m",
    appStoreProductId: "com.expert.boardgames.rokhaki.premium.12m",
  },
];

export const SHOP_SECTIONS: ShopSection[] = [
  {
    id: "coins",
    bannerTitleKey: "coinsBannerTitle",
    bannerDescKey: "coinsBannerDesc",
    offers: [
      { id: "coins-ad", titleKey: "coinsOffer1", amount: 50, amountKey: "coinsLabel", price: 0, discount: 100, rewardType: "coins" },
      { id: "coins-1", titleKey: "coinsOffer2", amount: 200, amountKey: "coinsLabel", price: 49000, discount: 10, rewardType: "coins" },
      { id: "coins-2", titleKey: "coinsOffer3", amount: 450, amountKey: "coinsLabel", price: 89000, discount: 15, rewardType: "coins" },
      { id: "coins-3", titleKey: "coinsOffer4", amount: 800, amountKey: "coinsLabel", price: 149000, discount: 20, rewardType: "coins" },
      { id: "coins-4", titleKey: "coinsOffer5", amount: 1500, amountKey: "coinsLabel", price: 239000, discount: 25, rewardType: "coins" },
      { id: "coins-5", titleKey: "coinsOffer6", amount: 3000, amountKey: "coinsLabel", price: 399000, discount: 35, rewardType: "coins" },
    ],
  },
  {
    id: "diamonds",
    bannerTitleKey: "diamondsBannerTitle",
    bannerDescKey: "diamondsBannerDesc",
    offers: [
      { id: "diamonds-ad", titleKey: "diamondsOffer1", amount: 5, amountKey: "gemsLabel", price: 0, discount: 100, rewardType: "gems" },
      { id: "diamonds-1", titleKey: "diamondsOffer2", amount: 20, amountKey: "gemsLabel", price: 59000, discount: 10, rewardType: "gems" },
      { id: "diamonds-2", titleKey: "diamondsOffer3", amount: 50, amountKey: "gemsLabel", price: 129000, discount: 15, rewardType: "gems" },
      { id: "diamonds-3", titleKey: "diamondsOffer4", amount: 120, amountKey: "gemsLabel", price: 249000, discount: 20, rewardType: "gems" },
      { id: "diamonds-4", titleKey: "diamondsOffer5", amount: 260, amountKey: "gemsLabel", price: 449000, discount: 25, rewardType: "gems" },
      { id: "diamonds-5", titleKey: "diamondsOffer6", amount: 600, amountKey: "gemsLabel", price: 799000, discount: 35, rewardType: "gems" },
    ],
  },
  {
    id: "avatars",
    bannerTitleKey: "avatarsBannerTitle",
    bannerDescKey: "avatarsBannerDesc",
    offers: [
      { id: "avatars-ad", titleKey: "avatarsOffer1", amount: 1, amountKey: "avatarsLabel", price: 0, discount: 100, rewardType: "avatar" },
      { id: "avatars-1", titleKey: "avatarsOffer2", amount: 1, amountKey: "avatarsLabel", price: 49000, discount: 10, rewardType: "avatar" },
      { id: "avatars-2", titleKey: "avatarsOffer3", amount: 1, amountKey: "avatarsLabel", price: 79000, discount: 12, rewardType: "avatar" },
      { id: "avatars-3", titleKey: "avatarsOffer4", amount: 1, amountKey: "avatarsLabel", price: 109000, discount: 15, rewardType: "avatar" },
      { id: "avatars-4", titleKey: "avatarsOffer5", amount: 1, amountKey: "avatarsLabel", price: 149000, discount: 20, rewardType: "avatar" },
      { id: "avatars-5", titleKey: "avatarsOffer6", amount: 1, amountKey: "avatarsLabel", price: 199000, discount: 25, rewardType: "avatar" },
    ],
  },
  {
    id: "backgrounds",
    bannerTitleKey: "backgroundsBannerTitle",
    bannerDescKey: "backgroundsBannerDesc",
    offers: [
      { id: "background-1", titleKey: "backgroundName1", amount: 1, amountKey: "backgroundsLabel", price: 50, discount: 0, rewardType: "background", currency: "gems" },
      { id: "background-2", titleKey: "backgroundName2", amount: 1, amountKey: "backgroundsLabel", price: 75, discount: 0, rewardType: "background", currency: "gems" },
      { id: "background-3", titleKey: "backgroundName3", amount: 1, amountKey: "backgroundsLabel", price: 100, discount: 10, rewardType: "background", currency: "gems" },
      { id: "background-4", titleKey: "backgroundName4", amount: 1, amountKey: "backgroundsLabel", price: 125, discount: 10, rewardType: "background", currency: "gems" },
      { id: "background-5", titleKey: "backgroundName5", amount: 1, amountKey: "backgroundsLabel", price: 150, discount: 15, rewardType: "background", currency: "gems" },
      { id: "background-6", titleKey: "backgroundName6", amount: 1, amountKey: "backgroundsLabel", price: 200, discount: 15, rewardType: "background", currency: "gems" },
    ],
  },
];

export const WEEKLY_REWARDS = [
  { day: 1, type: "coins", amount: 50 },
  { day: 2, type: "gems", amount: 5 },
  { day: 3, type: "coins", amount: 80 },
  { day: 4, type: "avatar", amount: 1 },
  { day: 5, type: "coins", amount: 120 },
  { day: 6, type: "gems", amount: 10 },
  { day: 7, type: "coins", amount: 200 },
] as const;

const avatarOfferMap = {
  "avatars-ad": merchantImage,
  "avatars-1": merchantGirlImage,
  "avatars-2": merchantTwoImage,
  "avatars-3": merchantGirlTwoImage,
  "avatars-4": merchantThreeImage,
  "avatars-5": merchantGirlThreeImage,
} as const;

const backgroundOfferMap = {
  "background-1": background1,
  "background-2": background2,
  "background-3": background3,
  "background-4": background4,
  "background-5": background5,
  "background-6": background6,
} as const;

export function formatTomans(amount: number) {
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

function getPremiumPlan(planId: PremiumPlanId) {
  return PREMIUM_PLANS.find((plan) => plan.id === planId);
}

export function getPremiumStatus(userId?: string) {
  const extras = readPlayerExtras(userId);
  const expiresAt = extras.premiumExpiresAt ? new Date(extras.premiumExpiresAt) : null;
  const now = Date.now();
  const active = Boolean(expiresAt && expiresAt.getTime() > now);
  const remainingDays = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    active,
    expiresAt,
    remainingDays,
    planId: extras.premiumPlanId as PremiumPlanId | null,
    provider: extras.premiumProvider,
  };
}

export function hasActivePremium(userId?: string) {
  return getPremiumStatus(userId).active;
}

export function grantPremiumPlan(
  userId: string | undefined,
  planId: PremiumPlanId,
  provider: StoreProvider,
) {
  const plan = getPremiumPlan(planId);
  if (!plan) return null;

  return updatePlayerExtras(userId, (current) => {
    const now = Date.now();
    const currentExpiry = current.premiumExpiresAt
      ? new Date(current.premiumExpiresAt).getTime()
      : 0;
    const startAt = Math.max(now, currentExpiry);
    const nextExpiry = new Date(startAt + plan.durationDays * 24 * 60 * 60 * 1000);

    return {
      ...current,
      gems: current.gems + plan.bonusGems,
      premiumExpiresAt: nextExpiry.toISOString(),
      premiumPlanId: plan.id,
      premiumProvider: provider,
    };
  });
}

export function canGrantPaidReward(
  nativeBilling: { purchaseSubscription?: unknown; purchaseProduct?: unknown } | undefined,
) {
  return Boolean(nativeBilling?.purchaseSubscription || nativeBilling?.purchaseProduct);
}

export async function purchasePremiumPlan(
  userId: string | undefined,
  planId: PremiumPlanId,
  provider: StoreProvider,
) {
  const plan = getPremiumPlan(planId);
  if (!plan) {
    return { ok: false as const, message: "Invalid premium plan." };
  }

  // A native success flag is not a verified receipt. Until a native store SDK
  // and server-side receipt validation are installed, do not start a charge or
  // grant an entitlement that could be spoofed by client JavaScript.
  return { ok: false as const, message: "Verified in-app billing is not configured." };
}

function addAvatar(userId?: string, avatarPath = merchantImage) {
  updatePlayerExtras(userId, (current) => ({
    ...current,
    avatars: Array.from(new Set([...current.avatars, avatarPath])),
    selectedAvatar: current.selectedAvatar || avatarPath,
  }));
}

function addSticker(userId?: string) {
  updatePlayerExtras(userId, (current) => ({
    ...current,
    stickers: Array.from(new Set([...current.stickers, `sticker-${Date.now()}`])),
  }));
}

export async function purchaseShopOffer(
  userId: string | undefined,
  sectionId: ShopSection["id"],
  offerId: string,
  provider: StoreProvider,
) {
  const section = SHOP_SECTIONS.find((entry) => entry.id === sectionId);
  const offer = section?.offers.find((entry) => entry.id === offerId);
  if (!offer) return { ok: false as const };
  if (offer.rewardType === "background") return applyOfferPurchase(userId, sectionId, offerId);
  if (offer.price > 0) {
    return { ok: false as const, message: "Verified in-app billing is not configured." };
  }
  return applyOfferPurchase(userId, sectionId, offerId);
}

export function applyOfferPurchase(
  userId: string | undefined,
  sectionId: ShopSection["id"],
  offerId: string,
) {
  const section = SHOP_SECTIONS.find((entry) => entry.id === sectionId);
  const offer = section?.offers.find((entry) => entry.id === offerId);
  if (!offer) return { ok: false as const };

  if (offer.rewardType === "background") {
    const image = backgroundOfferMap[offer.id as keyof typeof backgroundOfferMap];
    if (!image) return { ok: false as const, message: "Background not found." };
    const extras = readPlayerExtras(userId);
    if (extras.backgrounds.includes(image)) {
      return { ok: false as const, message: "Background already owned." };
    }
    if (extras.gems < offer.price) {
      return { ok: false as const, message: "Not enough gems." };
    }
    updatePlayerExtras(userId, (current) => ({
      ...current,
      gems: current.gems - offer.price,
      backgrounds: Array.from(new Set([...current.backgrounds, image])),
      selectedBackground: current.selectedBackground,
    }));
    return { ok: true as const };
  }

  if (offer.price > 0) {
    return { ok: false as const };
  }

  if (offer.rewardType === "coins") {
    awardCoins(userId, offer.amount);
    return { ok: true as const };
  }

  if (offer.rewardType === "gems") {
    updatePlayerExtras(userId, (current) => ({
      ...current,
      gems: current.gems + offer.amount,
    }));
    return { ok: true as const };
  }

  if (offer.rewardType === "avatar") {
    addAvatar(userId, avatarOfferMap[offer.id as keyof typeof avatarOfferMap] || merchantImage);
    return { ok: true as const };
  }

  addSticker(userId);
  return { ok: true as const };
}

export function getCurrentRewardState(userId: string | undefined) {
  const extras = readPlayerExtras(userId);
  const today = new Date();
  const lastClaim = extras.dailyRewardClaimedOn ? new Date(extras.dailyRewardClaimedOn) : null;

  if (!lastClaim) return { canClaim: true, rewardIndex: 0, claimedToday: false };

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfLastClaim = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfLastClaim.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return { canClaim: false, rewardIndex: (extras.dailyRewardIndex - 1 + WEEKLY_REWARDS.length) % WEEKLY_REWARDS.length, claimedToday: true };
  if (diffDays === 1) return { canClaim: true, rewardIndex: extras.dailyRewardIndex, claimedToday: false };
  return { canClaim: true, rewardIndex: 0, claimedToday: false };
}

export function claimWeeklyReward(userId: string | undefined, avatarChoice?: "merchant" | "merchantGirl") {
  const state = getCurrentRewardState(userId);
  const reward = WEEKLY_REWARDS[state.rewardIndex];
  if (!state.canClaim || !reward) return null;

  if (reward.type === "coins") {
    awardCoins(userId, reward.amount);
  } else if (reward.type === "gems") {
    updatePlayerExtras(userId, (current) => ({
      ...current,
      gems: current.gems + reward.amount,
    }));
  } else if (reward.type === "avatar") {
    addAvatar(userId, avatarChoice === "merchantGirl" ? merchantGirlImage : merchantImage);
  } else {
    addSticker(userId);
  }

  updatePlayerExtras(userId, (current) => ({
    ...current,
    dailyRewardClaimedOn: new Date().toISOString(),
    dailyRewardIndex: (state.rewardIndex + 1) % WEEKLY_REWARDS.length,
  }));

  return reward;
}
