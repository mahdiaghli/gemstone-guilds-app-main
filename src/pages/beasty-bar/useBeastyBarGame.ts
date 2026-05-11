// Beasty Bar - Game Controller Hook

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  BeastyBarGameState,
  BeastyBarPlayer,
  AnimalCard,
  AnimalType,
  PendingEffect,
  PlayerColor,
} from "./types";
import { createGameState, getAnimalEmoji } from "./types";
import {
  playCard,
  resolveRepeatableAbilities,
  checkHeavensGate,
  checkGameOver,
  resolvePendingEffect,
  endTurn,
} from "./gameLogic";
import { getAIMove, getAIThinkingText } from "./aiLogic";
import type { AIDifficulty } from "@/lib/aiPlayer";

export interface UseBeastyBarGameProps {
  playerCount: number;
  humanPlayerCount: number;
  playerNames: string[];
  gameMode: "ai" | "local" | "online";
  aiDifficulty: AIDifficulty;
  onlinePlayerIndex?: number;
  isOnlineGame?: boolean;
}

export interface UseBeastyBarGameReturn {
  state: BeastyBarGameState;
  currentPlayer: BeastyBarPlayer;
  isCurrentPlayerTurn: boolean;
  playCard: (cardId: string) => void;
  resolveEffect: (choice: unknown) => void;
  endTurn: () => void;
  restart: () => void;
  getAnimalEmoji: (type: AnimalType) => string;
  getPlayerColor: (index: number) => PlayerColor;
  canPlayCard: (cardId: string) => boolean;
  isAIPlayer: (index: number) => boolean;
  isGameOver: boolean;
  winnerIndices: number[];
  lastAction: string;
  pendingEffect: PendingEffect | null;
  turn: number;
  aiThinking: boolean;
  aiThinkingText: string;
}

export function useBeastyBarGame(props: UseBeastyBarGameProps): UseBeastyBarGameReturn {
  const {
    playerCount,
    humanPlayerCount,
    playerNames,
    gameMode,
    aiDifficulty,
    onlinePlayerIndex = 0,
    isOnlineGame = false,
  } = props;

  const [state, setState] = useState<BeastyBarGameState>(() =>
    createGameState(playerCount, humanPlayerCount, playerNames)
  );

  const [aiThinking, setAiThinking] = useState(false);
  const [aiThinkingText, setAiThinkingText] = useState("");
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAIPlayer = useCallback(
    (index: number) => {
      if (gameMode === "ai") return index !== 0;
      if (gameMode === "local") return index >= humanPlayerCount;
      if (gameMode === "online") return false; // Online handles turns differently
      return false;
    },
    [gameMode, humanPlayerCount]
  );

  const isCurrentPlayerTurn = useCallback(() => {
    if (isOnlineGame) {
      return state.currentPlayerIndex === onlinePlayerIndex;
    }
    return !isAIPlayer(state.currentPlayerIndex);
  }, [isOnlineGame, onlinePlayerIndex, state.currentPlayerIndex, isAIPlayer]);

  const canPlayCard = useCallback(
    (cardId: string) => {
      if (state.gameOver) return false;
      if (state.phase !== "playing") return false;
      if (state.pendingEffect !== null) return false;
      if (!isCurrentPlayerTurn()) return false;

      const currentPlayer = state.players[state.currentPlayerIndex];
      return currentPlayer.hand.some((c) => c.id === cardId);
    },
    [state, isCurrentPlayerTurn]
  );

  const playCardAction = useCallback(
    (cardId: string) => {
      if (!canPlayCard(cardId)) return;

      setState((prev) => {
        let newState = playCard(prev, prev.currentPlayerIndex, cardId);

        // Check if we need player input (kangaroo, parrot, chameleon)
        if (newState.pendingEffect) {
          return newState;
        }

        // Resolve repeatable abilities
        newState = resolveRepeatableAbilities(newState);

        // Check game over
        newState = checkGameOver(newState);

        // Check if bumping zone has 5 cards - if so, let the useEffect handle it with delay
        // The Heaven's Gate resolution will happen after a 1-second delay
        if (newState.bumpingZone.animals.length === 5) {
          // Don't advance turn yet - wait for gate resolution
          return newState;
        }

        // Auto-advance to next player's turn after card is played
        // (unless we're waiting for a player decision or gate resolution)
        if (!newState.pendingEffect && !newState.gameOver && newState.bumpingZone.animals.length < 5) {
          newState = endTurn(newState);
        }

        return newState;
      });
    },
    [canPlayCard]
  );

  const resolveEffectAction = useCallback(
    (choice: unknown) => {
      if (!state.pendingEffect) return;

      setState((prev) => {
        let newState = resolvePendingEffect(prev, choice);

        // Resolve repeatable abilities
        newState = resolveRepeatableAbilities(newState);

        // Check Heaven's Gate
        newState = checkHeavensGate(newState);

        // Check game over
        newState = checkGameOver(newState);

        // Auto-advance turn after resolving effect (e.g., kangaroo jump)
        if (!newState.pendingEffect && !newState.gameOver) {
          newState = endTurn(newState);
        }

        return newState;
      });
    },
    [state.pendingEffect]
  );

  const endTurnAction = useCallback(() => {
    if (state.gameOver) return;
    if (state.pendingEffect !== null) return;

    setState((prev) => {
      let newState = endTurn(prev);
      newState = checkGameOver(newState);
      return newState;
    });
  }, [state.gameOver, state.pendingEffect]);

  // Heaven's Gate resolution delay (1 second after 5th card)
  useEffect(() => {
    if (state.bumpingZone.animals.length === 5 && state.phase !== "checkingGate") {
      // Set phase to checkingGate to trigger the delay
      setState((prev) => ({
        ...prev,
        phase: "checkingGate",
      }));

      // Wait 1 second so players can see all 5 cards, then resolve
      gateTimeoutRef.current = setTimeout(() => {
        setState((prev) => {
          let newState = structuredClone(prev) as BeastyBarGameState;
          newState = checkHeavensGate(newState);
          newState = checkGameOver(newState);
          newState.phase = "playing";

          // Advance to next player if game not over
          if (!newState.gameOver) {
            newState = endTurn(newState);
          }

          return newState;
        });
      }, 1000);
    }

    return () => {
      if (gateTimeoutRef.current) {
        clearTimeout(gateTimeoutRef.current);
      }
    };
  }, [state.bumpingZone.animals.length, state.phase]);

  // AI turn handling
  useEffect(() => {
    if (state.gameOver) return;
    if (isOnlineGame) return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;
    if (aiThinking) return;

    const executeAI = async () => {
      setAiThinking(true);
      const player = state.players[state.currentPlayerIndex];
      setAiThinkingText(getAIThinkingText(state, state.currentPlayerIndex, "en"));

      // Delay based on difficulty
      const delay =
        aiDifficulty === "easy" ? 1000 : aiDifficulty === "medium" ? 1500 : 2000;

      aiTimeoutRef.current = setTimeout(() => {
        setState((prev) => {
          let newState = prev;
          const move = getAIMove(prev, prev.currentPlayerIndex, aiDifficulty);

          if (move.cardId) {
            // Play a card
            newState = playCard(newState, newState.currentPlayerIndex, move.cardId);

            // If playing the card created a pending effect (kangaroo, parrot, chameleon),
            // the AI should immediately resolve it
            if (newState.pendingEffect && newState.pendingEffect.playerIndex === newState.currentPlayerIndex) {
              const choiceMove = getAIMove(newState, newState.currentPlayerIndex, aiDifficulty);
              if (choiceMove.choice !== undefined) {
                newState = resolvePendingEffect(newState, choiceMove.choice);
              }
            }
          } else if (move.choice !== undefined) {
            // Resolve pending effect (for cases where it wasn't resolved above)
            newState = resolvePendingEffect(newState, move.choice);
          }

          // Continue processing if no more pending effects
          if (!newState.pendingEffect) {
            newState = resolveRepeatableAbilities(newState);
            newState = checkHeavensGate(newState);
            newState = checkGameOver(newState);
            newState = endTurn(newState);
          }

          return newState;
        });

        setAiThinking(false);
        setAiThinkingText("");
      }, delay);
    };

    executeAI();

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [state.currentPlayerIndex, state.gameOver, isAIPlayer, aiDifficulty, isOnlineGame]);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const getPlayerColor = useCallback(
    (index: number) => {
      return state.players[index]?.color || "red";
    },
    [state.players]
  );

  const restart = useCallback(() => {
    // Clear any pending AI timeouts
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    // Clear any pending gate timeouts
    if (gateTimeoutRef.current) {
      clearTimeout(gateTimeoutRef.current);
    }
    setAiThinking(false);
    setAiThinkingText("");
    // Create new game state
    setState(createGameState(playerCount, humanPlayerCount, playerNames));
  }, [playerCount, humanPlayerCount, playerNames]);

  return {
    state,
    currentPlayer,
    isCurrentPlayerTurn: isCurrentPlayerTurn(),
    playCard: playCardAction,
    resolveEffect: resolveEffectAction,
    endTurn: endTurnAction,
    restart,
    getAnimalEmoji,
    getPlayerColor,
    canPlayCard,
    isAIPlayer,
    isGameOver: state.gameOver,
    winnerIndices: state.winnerIndices,
    lastAction: state.lastAction,
    pendingEffect: state.pendingEffect,
    turn: state.turn,
    aiThinking,
    aiThinkingText,
  };
}
