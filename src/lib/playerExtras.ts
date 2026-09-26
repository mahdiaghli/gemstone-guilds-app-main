import defaultAvatar from "@/assets/avatar.webp";
import defaultGameBackground from "@/assets/background-game-splendor.png";
import legacyDefaultBackground from "@/assets/background.webp";
import { syncSelectedAvatar } from "@/lib/social";
import type { CardBackId } from "@/lib/cosmetics";

export interface PlayerExtras {
  gems: number;
  avatars: string[];
  stickers: string[];
  selectedAvatar: string;
  cardBacks: CardBackId[];
  selectedCardBack: CardBackId;
  backgrounds: string[];
  selectedBackground: string;
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
  backgrounds: [defaultGameBackground],
  selectedBackground: defaultGameBackground,
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
    const parsed = JSON.parse(raw) as Partial<PlayerExtras>;
    const legacyDefault = legacyDefaultBackground;
    const savedBackgrounds = Array.isArray(parsed.backgrounds) ? parsed.backgrounds : [];
    const backgrounds = Array.from(new Set([
      defaultGameBackground,
      ...savedBackgrounds.map((background) => background === legacyDefault ? defaultGameBackground : background),
    ]));
    return {
      ...DEFAULT_EXTRAS,
      ...parsed,
      backgrounds,
      selectedBackground: !parsed.selectedBackground || parsed.selectedBackground === legacyDefault
        ? defaultGameBackground
        : parsed.selectedBackground,
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
