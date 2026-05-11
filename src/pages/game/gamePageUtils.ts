import type { Socket } from "socket.io-client";

import type { GameState, TokenType } from "@/lib/gameData";
import type { AIDifficulty } from "@/lib/aiPlayer";
import type { CardBackId } from "@/lib/cosmetics";
import { buildBackCardsByLevel } from "@/lib/cosmetics";
import { getPlayerScore } from "@/lib/gameLogic";

export type Phase =
  | "idle"
  | "selectingTokens"
  | "mustReturnTokens"
  | "cardAction"
  | "aiThinking";

export type PostGameActionButton = {
  key: string;
  label: string;
  onClick: () => void;
  variant?: "game" | "ghost" | "outline" | "secondary" | "game-secondary";
  disabled?: boolean;
};

export type PostGameNoticeDialog = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export interface GameProps {
  mode?: "local" | "ai" | "online";
  roomId?: string;
  playerId?: string;
  playerName?: string;
  playerIndex?: number;
  roomPlayers?: Record<string, unknown>;
  playerNamesList?: string[];
  socket?: Socket | null;
  serverGameState?: GameState | null;
  onGameStateChange?: (state: GameState) => void;
  onGameEnd?: () => void;
  gameOverActions?: PostGameActionButton[];
  postGameNoticeDialog?: PostGameNoticeDialog | null;
}

export function getBackCardsByLevel(selectedCardBack: CardBackId) {
  return buildBackCardsByLevel(selectedCardBack);
}

export function getAiDelay(aiDifficulty: AIDifficulty) {
  // Bots should think for 2 seconds before making a move
  return 2000;
}

export function getTimeoutReturnToken(state: GameState, playerIndex: number) {
  const player = state.players[playerIndex];
  if (!player) return null;

  const tokenOrder: TokenType[] = ["diamond", "sapphire", "emerald", "ruby", "onyx", "gold"];

  return (
    tokenOrder
      .filter((tokenType) => player.tokens[tokenType] > 0)
      .sort((a, b) => {
        const av = player.tokens[a];
        const bv = player.tokens[b];
        if (a === "gold" && b !== "gold") return 1;
        if (b === "gold" && a !== "gold") return -1;
        return bv - av;
      })[0] ?? null
  );
}

export function buildTurnWarningMessage(
  lang: "fa" | "en",
  currentPlayerName: string,
) {
  if (lang === "fa") {
    return `⏳ نوبت شما نیست | اکنون نوبت ${currentPlayerName} است`;
  }
  return `⏳ Not your turn | Waiting for ${currentPlayerName}'s turn`;
}

export function buildWinnerRewardKey(state: GameState) {
  if (state.winner === null) return "";
  return `${state.winner}-${state.players.length}-${getPlayerScore(state.players[state.winner])}`;
}
