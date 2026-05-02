import type { GameState, GemType, Card } from "@/lib/gameData";
import merchantImage from "@/assets/merchant.png";
import { awardCoins } from "@/lib/progression";
import { CardBackId } from "@/lib/cosmetics";
import { readPlayerExtras, updatePlayerExtras } from "@/lib/playerExtras";

export type SoloChallengeId = "daily-puzzle" | "bot-survival" | "turn-limit";
export type BotSurvivalStage = "easy" | "medium" | "hard";

export interface DailyPuzzleAction {
  type: "takeTokens" | "purchaseCard";
  gems?: GemType[];
  cardId?: Card["id"];
}

export interface SoloChallengeProgress {
  dailyPuzzleSolvedOn: string | null;
  botSurvivalStage: BotSurvivalStage;
  botSurvivalCompleted: boolean;
  turnLimitCompleted: boolean;
}

const DEFAULT_PROGRESS: SoloChallengeProgress = {
  dailyPuzzleSolvedOn: null,
  botSurvivalStage: "easy",
  botSurvivalCompleted: false,
  turnLimitCompleted: false,
};

const DAILY_PUZZLE_STEP_ONE: Card = {
  id: 9101,
  level: 1,
  gemBonus: "onyx",
  points: 1,
  cost: { emerald: 2, ruby: 2 },
};

const DAILY_PUZZLE_STEP_TWO: Card = {
  id: 9102,
  level: 2,
  gemBonus: "diamond",
  points: 2,
  cost: { onyx: 3, sapphire: 2 },
};

function getKey(userId?: string | null) {
  return `splendor-solo-challenges:${userId || "guest"}`;
}

function isSameDay(iso: string | null) {
  if (!iso) return false;
  const today = new Date();
  const date = new Date(iso);
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
}

export function readSoloChallengeProgress(
  userId?: string | null,
): SoloChallengeProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function writeSoloChallengeProgress(
  userId: string | null | undefined,
  progress: SoloChallengeProgress,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(userId), JSON.stringify(progress));
  window.dispatchEvent(
    new CustomEvent("splendor-solo-challenges-updated", {
      detail: { userId: userId || "guest", progress },
    }),
  );
}

export function updateSoloChallengeProgress(
  userId: string | null | undefined,
  updater: (current: SoloChallengeProgress) => SoloChallengeProgress,
) {
  const next = updater(readSoloChallengeProgress(userId));
  writeSoloChallengeProgress(userId, next);
  return next;
}

export function getDailyPuzzleDefinition() {
  const initialState: GameState = {
    players: [
      {
        id: 0,
        tokens: {
          diamond: 1,
          sapphire: 1,
          emerald: 1,
          ruby: 1,
          onyx: 0,
          gold: 0,
        },
        cards: [
          { id: 9001, level: 3, gemBonus: "diamond", points: 4, cost: {} },
          { id: 9002, level: 3, gemBonus: "sapphire", points: 4, cost: {} },
          { id: 9003, level: 2, gemBonus: "emerald", points: 2, cost: {} },
          { id: 9004, level: 2, gemBonus: "onyx", points: 2, cost: {} },
        ],
        reservedCards: [],
        nobles: [],
      },
      {
        id: 1,
        tokens: {
          diamond: 0,
          sapphire: 0,
          emerald: 0,
          ruby: 0,
          onyx: 0,
          gold: 0,
        },
        cards: [],
        reservedCards: [],
        nobles: [],
      },
    ],
    currentPlayerIndex: 0,
    tokenPool: {
      diamond: 3,
      sapphire: 3,
      emerald: 3,
      ruby: 3,
      onyx: 4,
      gold: 5,
    },
    decks: { 1: [], 2: [], 3: [] },
    visibleCards: {
      1: [DAILY_PUZZLE_STEP_ONE, null, null, null],
      2: [DAILY_PUZZLE_STEP_TWO, null, null, null],
      3: [null, null, null, null],
    },
    nobles: [],
    isLastRound: false,
    lastRoundTriggerIndex: null,
    gameOver: false,
    winner: null,
  };

  const actions: DailyPuzzleAction[] = [
    { type: "takeTokens", gems: ["emerald", "ruby", "onyx"] },
    { type: "purchaseCard", cardId: DAILY_PUZZLE_STEP_ONE.id },
    { type: "purchaseCard", cardId: DAILY_PUZZLE_STEP_TWO.id },
  ];

  return { initialState, actions };
}

export function cloneChallengeState(state: GameState) {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function rewardDailyPuzzle(userId?: string | null) {
  const current = readSoloChallengeProgress(userId);
  if (isSameDay(current.dailyPuzzleSolvedOn)) return false;

  awardCoins(userId, 500);
  updateSoloChallengeProgress(userId, (progress) => ({
    ...progress,
    dailyPuzzleSolvedOn: new Date().toISOString(),
  }));
  return true;
}

export function handleBotSurvivalWin(userId?: string | null) {
  const current = readSoloChallengeProgress(userId);

  if (current.botSurvivalStage === "easy") {
    writeSoloChallengeProgress(userId, {
      ...current,
      botSurvivalStage: "medium",
    });
    return { completed: false, nextStage: "medium" as const };
  }

  if (current.botSurvivalStage === "medium") {
    writeSoloChallengeProgress(userId, {
      ...current,
      botSurvivalStage: "hard",
    });
    return { completed: false, nextStage: "hard" as const };
  }

  if (!current.botSurvivalCompleted) {
    updatePlayerExtras(userId || undefined, (extras) => {
      const nextCardBacks = Array.from(
        new Set<CardBackId>([...extras.cardBacks, "royal"]),
      );
      return {
        ...extras,
        cardBacks: nextCardBacks,
        selectedCardBack: "royal",
      };
    });
  }

  writeSoloChallengeProgress(userId, {
    ...current,
    botSurvivalStage: "hard",
    botSurvivalCompleted: true,
  });

  return { completed: true, nextStage: null };
}

export function resetBotSurvival(userId?: string | null) {
  updateSoloChallengeProgress(userId, (progress) => ({
    ...progress,
    botSurvivalStage: "easy",
    botSurvivalCompleted: false,
  }));
}

export function rewardTurnLimitChallenge(userId?: string | null) {
  const progress = readSoloChallengeProgress(userId);
  if (!progress.turnLimitCompleted) {
    updatePlayerExtras(userId || undefined, (extras) => ({
      ...extras,
      avatars: Array.from(new Set([...extras.avatars, merchantImage])),
      selectedAvatar: extras.selectedAvatar || merchantImage,
    }));
  }

  writeSoloChallengeProgress(userId, {
    ...progress,
    turnLimitCompleted: true,
  });
}
