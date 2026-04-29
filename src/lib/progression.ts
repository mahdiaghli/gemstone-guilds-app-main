export interface PlayerProgress {
  points: number;
  coins: number;
  xp: number;
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  points: 0,
  coins: 1000,
  xp: 0,
};

export const GAME_ENTRY_FEE = 5;
export const WIN_REWARD_COINS = 10;
export const WIN_REWARD_XP = 25;
export const MATCHMAKING_WIN_REWARD_COINS = 20;
export const MATCHMAKING_WIN_REWARD_XP = 50;

export const XP_PER_LEVEL = 100;
export const WIN_SCORE_GAIN = 12;
export const LOSS_SCORE_PENALTY = 4;

function getProgressKey(userId?: string | null) {
  return `splendor-progress:${userId || "guest"}`;
}

export function readProgress(userId?: string | null): PlayerProgress {
  try {
    const raw = localStorage.getItem(getProgressKey(userId));
    if (!raw) return { ...DEFAULT_PROGRESS };

    const parsed = JSON.parse(raw);
    return {
      points: Number(parsed?.points) || 0,
      coins:
        typeof parsed?.coins === "number"
          ? parsed.coins
          : DEFAULT_PROGRESS.coins,
      xp: Number(parsed?.xp) || 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function writeProgress(
  userId: string | null | undefined,
  progress: PlayerProgress,
) {
  localStorage.setItem(getProgressKey(userId), JSON.stringify(progress));
  window.dispatchEvent(
    new CustomEvent("splendor-progress-updated", {
      detail: { userId: userId || "guest", progress },
    }),
  );
}

export function updateProgress(
  userId: string | null | undefined,
  updater: (current: PlayerProgress) => PlayerProgress,
) {
  const next = updater(readProgress(userId));
  writeProgress(userId, next);
  return next;
}

export function payGameEntryFee(userId?: string | null) {
  const current = readProgress(userId);
  if (current.coins < GAME_ENTRY_FEE) {
    return { ok: true as const, progress: current, charged: 0 };
  }

  const next = {
    ...current,
    coins: current.coins - GAME_ENTRY_FEE,
  };
  writeProgress(userId, next);
  return { ok: true as const, progress: next, charged: GAME_ENTRY_FEE };
}

export function awardWinProgress(
  userId: string | null | undefined,
  earnedPoints: number,
  rewardMode: "standard" | "matchmaking" = "standard",
) {
  const rewardCoins =
    rewardMode === "matchmaking"
      ? MATCHMAKING_WIN_REWARD_COINS
      : WIN_REWARD_COINS;

  const rewardXp =
    (rewardMode === "matchmaking" ? MATCHMAKING_WIN_REWARD_XP : WIN_REWARD_XP) +
    Math.max(earnedPoints, 0) * (rewardMode === "matchmaking" ? 12 : 8);

  const rewardPoints =
    rewardMode === "matchmaking" ? earnedPoints * 2 : earnedPoints;

  return updateProgress(userId, (current) => ({
    points: current.points + Math.max(0, rewardPoints) + WIN_SCORE_GAIN,
    coins: current.coins + rewardCoins,
    xp: current.xp + rewardXp,
  }));
}

export function awardLossProgress(userId: string | null | undefined) {
  return updateProgress(userId, (current) => ({
    ...current,
    points: Math.max(0, current.points - LOSS_SCORE_PENALTY),
  }));
}

export function awardCoins(
  userId: string | null | undefined,
  amount: number,
) {
  return updateProgress(userId, (current) => ({
    ...current,
    coins: current.coins + Math.max(0, amount),
  }));
}

/**
 * Level از روی XP کل
 * level 1 = 0..99
 * level 2 = 100..199
 * ...
 */
export function getLevelFromXp(xp: number) {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

/**
 * وضعیت XP برای لول فعلی:
 * - currentXp: XP داخل این لول (۰ تا XP_PER_LEVEL)
 * - requiredXp: XP لازم تا لول بعد
 * - percent: درصد پر شدن XP bar
 */
export function getLevelProgress(xp: number) {
  const safeXp = Math.max(0, xp);
  const currentXp = safeXp % XP_PER_LEVEL;
  const requiredXp = XP_PER_LEVEL;

  return {
    level: getLevelFromXp(safeXp),
    currentXp,
    requiredXp,
    percent: (currentXp / XP_PER_LEVEL) * 100,
  };
}
