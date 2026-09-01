import defaultAvatar from "@/assets/avatar.webp";
import { syncSelectedAvatar } from "@/lib/social";
import type { CardBackId } from "@/lib/cosmetics";

export interface PlayerExtras {
  gems: number;
  avatars: string[];
  stickers: string[];
  selectedAvatar: string;
  cardBacks: CardBackId[];
  selectedCardBack: CardBackId;
  dailyRewardClaimedOn: string | null;
  dailyRewardIndex: number;
  premiumExpiresAt: string | null;
  premiumPlanId: string | null;
  premiumProvider: "cafe-bazaar" | "myket" | null;
}

const DEFAULT_EXTRAS: PlayerExtras = {
  gems: 150,
  avatars: [defaultAvatar],
  stickers: ["hello"],
  selectedAvatar: defaultAvatar,
  cardBacks: ["classic"],
  selectedCardBack: "classic",
  dailyRewardClaimedOn: null,
  dailyRewardIndex: 0,
  premiumExpiresAt: null,
  premiumPlanId: null,
  premiumProvider: null,
};

function getKey(userId?: string) {
  return `splendor-player-extras:${userId || "guest"}`;
}

export function readPlayerExtras(userId?: string): PlayerExtras {
  if (typeof window === "undefined") return DEFAULT_EXTRAS;
  const raw = localStorage.getItem(getKey(userId));
  if (!raw) {
    localStorage.setItem(getKey(userId), JSON.stringify(DEFAULT_EXTRAS));
    return DEFAULT_EXTRAS;
  }

  try {
    return {
      ...DEFAULT_EXTRAS,
      ...JSON.parse(raw),
    };
  } catch {
    localStorage.setItem(getKey(userId), JSON.stringify(DEFAULT_EXTRAS));
    return DEFAULT_EXTRAS;
  }
}

export function writePlayerExtras(userId: string | undefined, extras: PlayerExtras) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(userId), JSON.stringify(extras));
  syncSelectedAvatar(userId, extras.selectedAvatar);
  window.dispatchEvent(
    new CustomEvent("splendor-player-extras-updated", {
      detail: { userId: userId || "guest", extras },
    }),
  );
}

export function updatePlayerExtras(
  userId: string | undefined,
  updater: (current: PlayerExtras) => PlayerExtras,
) {
  const next = updater(readPlayerExtras(userId));
  writePlayerExtras(userId, next);
  return next;
}
