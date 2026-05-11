import splendorBackground from "@/assets/background-game-splendor.png";
import deadMansDrawBackground from "@/assets/background-zirkhaki.png";
import defaultBackground from "@/assets/background.png";

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
  return pageBackgrounds[page][gameId as GameId] || defaultBackground;
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
