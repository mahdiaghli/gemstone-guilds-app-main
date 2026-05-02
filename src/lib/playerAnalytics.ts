import type { GameId } from "@/lib/gameCatalog";

export type AnalyticsMode = "local" | "ai" | "online";

export interface GameAnalyticsEntry {
  played: number;
  wins: number;
  losses: number;
}

export interface PlayerAnalytics {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalPlayerActivity: number;
  byGame: Partial<Record<GameId, GameAnalyticsEntry>>;
  byMode: Record<AnalyticsMode, GameAnalyticsEntry>;
}

const DEFAULT_ENTRY: GameAnalyticsEntry = {
  played: 0,
  wins: 0,
  losses: 0,
};

const DEFAULT_ANALYTICS: PlayerAnalytics = {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  totalPlayerActivity: 0,
  byGame: {},
  byMode: {
    local: { ...DEFAULT_ENTRY },
    ai: { ...DEFAULT_ENTRY },
    online: { ...DEFAULT_ENTRY },
  },
};

function getAnalyticsKey(userId?: string | null) {
  return `splendor-analytics:${userId || "guest"}`;
}

function normalizeEntry(entry?: Partial<GameAnalyticsEntry>): GameAnalyticsEntry {
  return {
    played: Number(entry?.played) || 0,
    wins: Number(entry?.wins) || 0,
    losses: Number(entry?.losses) || 0,
  };
}

export function readPlayerAnalytics(userId?: string | null): PlayerAnalytics {
  try {
    const raw = localStorage.getItem(getAnalyticsKey(userId));
    if (!raw) return { ...DEFAULT_ANALYTICS, byMode: { ...DEFAULT_ANALYTICS.byMode } };

    const parsed = JSON.parse(raw);
    const byMode = parsed?.byMode || {};
    const byGame = parsed?.byGame || {};

    return {
      totalGamesPlayed: Number(parsed?.totalGamesPlayed) || 0,
      totalWins: Number(parsed?.totalWins) || 0,
      totalLosses: Number(parsed?.totalLosses) || 0,
      totalPlayerActivity: Number(parsed?.totalPlayerActivity) || 0,
      byGame: Object.fromEntries(
        Object.entries(byGame).map(([gameId, entry]) => [gameId, normalizeEntry(entry as Partial<GameAnalyticsEntry>)]),
      ),
      byMode: {
        local: normalizeEntry(byMode.local),
        ai: normalizeEntry(byMode.ai),
        online: normalizeEntry(byMode.online),
      },
    };
  } catch {
    return { ...DEFAULT_ANALYTICS, byMode: { ...DEFAULT_ANALYTICS.byMode } };
  }
}

export function writePlayerAnalytics(
  userId: string | null | undefined,
  analytics: PlayerAnalytics,
) {
  localStorage.setItem(getAnalyticsKey(userId), JSON.stringify(analytics));
  window.dispatchEvent(
    new CustomEvent("splendor-analytics-updated", {
      detail: { userId: userId || "guest", analytics },
    }),
  );
}

export function recordFinishedGame(
  userId: string | null | undefined,
  gameId: GameId,
  mode: AnalyticsMode,
  won: boolean,
) {
  const current = readPlayerAnalytics(userId);
  const gameEntry = normalizeEntry(current.byGame[gameId]);
  const modeEntry = normalizeEntry(current.byMode[mode]);

  const next: PlayerAnalytics = {
    ...current,
    totalGamesPlayed: current.totalGamesPlayed + 1,
    totalWins: current.totalWins + (won ? 1 : 0),
    totalLosses: current.totalLosses + (won ? 0 : 1),
    totalPlayerActivity: current.totalPlayerActivity + 1,
    byGame: {
      ...current.byGame,
      [gameId]: {
        played: gameEntry.played + 1,
        wins: gameEntry.wins + (won ? 1 : 0),
        losses: gameEntry.losses + (won ? 0 : 1),
      },
    },
    byMode: {
      ...current.byMode,
      [mode]: {
        played: modeEntry.played + 1,
        wins: modeEntry.wins + (won ? 1 : 0),
        losses: modeEntry.losses + (won ? 0 : 1),
      },
    },
  };

  writePlayerAnalytics(userId, next);
  return next;
}

export function getWinRate(entry?: Partial<GameAnalyticsEntry>) {
  const played = Number(entry?.played) || 0;
  const wins = Number(entry?.wins) || 0;
  if (!played) return 0;
  return Math.round((wins / played) * 100);
}
