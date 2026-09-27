import splendorBackground from "@/assets/background-game-splendor.webp";
import deadMansDrawBackground from "@/assets/background-zirkhaki.webp";
import defaultBackground from "@/assets/background-game-splendor.png";
import legacyDefaultBackground from "@/assets/background.webp";

import type { GameId } from "@/lib/gameCatalog";

type PageKey = "index" | "mode-setup" | "manual-room" | "find-match";

const pageBackgrounds: Record<PageKey, Partial<Record<GameId, string>>> = {
  index: {
    splendor: splendorBackground,
    "dead-mans-draw": deadMansDrawBackground,
    "beasty-bar": defaultBackground,
  },
  "mode-setup": {
    splendor: splendorBackground,
    "dead-mans-draw": deadMansDrawBackground,
    "beasty-bar": defaultBackground,
  },
  "manual-room": {
    splendor: splendorBackground,
    "dead-mans-draw": deadMansDrawBackground,
    "beasty-bar": defaultBackground,
  },
  "find-match": {
    splendor: splendorBackground,
    "dead-mans-draw": deadMansDrawBackground,
    "beasty-bar": defaultBackground,
  },
};

export function getPageBackground(gameId: string | null | undefined, page: PageKey) {
  return getSelectedBackground() || pageBackgrounds[page][gameId as GameId] || defaultBackground;
}

export function getSelectedBackground(userId?: string) {
  try {
    const storedUser = localStorage.getItem("splendor_user") || sessionStorage.getItem("splendor_user");
    const resolvedUserId = userId || JSON.parse(storedUser || "null")?.id;
    const raw = localStorage.getItem(`splendor-player-extras:${resolvedUserId || "guest"}`);
    const selectedBackground = raw ? JSON.parse(raw)?.selectedBackground : null;
    return !selectedBackground || selectedBackground === legacyDefaultBackground
      ? defaultBackground
      : selectedBackground;
  } catch {
    return defaultBackground;
  }
}

export const shellBackgrounds = {
  gamesList: defaultBackground,
  accountCenter: defaultBackground,
  friends: defaultBackground,
  shop: defaultBackground,
  groups: defaultBackground,
  events: defaultBackground,
  tutorial: defaultBackground,
} as const;
