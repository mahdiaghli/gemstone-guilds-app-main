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

  const finalizeAfterAction = useCallback((nextState: BeastyBarGameState) => {
    let resolvedState = resolveRepeatableAbilities(nextState);
    resolvedState = checkGameOver(resolvedState);

    if (resolvedState.gameOver) {
      return resolvedState;
    }

    if (resolvedState.bumpingZone.animals.length >= 5) {
      return {
        ...resolvedState,
        phase: "checkingGate",
      };
    }

    if (!resolvedState.pendingEffect) {
      resolvedState = endTurn(resolvedState);
      resolvedState = checkGameOver(resolvedState);
    }

    return resolvedState;
  }, []);

  const playCardAction = useCallback(
    (cardId: string) => {
      if (!canPlayCard(cardId)) return;

      setState((prev) => {
        let newState = playCard(prev, prev.currentPlayerIndex, cardId);

        // Check if we need player input (kangaroo, parrot, chameleon)
        if (newState.pendingEffect) {
          return newState;
        }
        return finalizeAfterAction(newState);
      });
    },
    [canPlayCard, finalizeAfterAction]
  );

  const resolveEffectAction = useCallback(
    (choice: unknown) => {
      if (!state.pendingEffect) return;

      setState((prev) => {
        let newState = resolvePendingEffect(prev, choice);
        return finalizeAfterAction(newState);
      });
    },
    [finalizeAfterAction, state.pendingEffect]
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
    if (state.phase !== "checkingGate") return;
    if (state.bumpingZone.animals.length < 5) return;
    if (gateTimeoutRef.current) return;

    // Wait 1 second so players can see all 5 cards, then resolve.
    gateTimeoutRef.current = setTimeout(() => {
      gateTimeoutRef.current = null;
      setState((prev) => {
        let newState = structuredClone(prev) as BeastyBarGameState;
        newState = checkHeavensGate(newState);
        newState = checkGameOver(newState);
        newState.phase = "playing";

        if (!newState.gameOver) {
          newState = endTurn(newState);
        }

        return newState;
      });
    }, 1000);

    return () => {
      if (gateTimeoutRef.current) {
        clearTimeout(gateTimeoutRef.current);
        gateTimeoutRef.current = null;
      }
    };
  }, [state.bumpingZone.animals.length, state.phase]);

  // AI turn handling
  useEffect(() => {
    if (state.gameOver) return;
    if (isOnlineGame) return;
    if (state.phase !== "playing") return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;
    if (aiTimeoutRef.current) return;

    const executeAI = async () => {
      setAiThinking(true);
      setAiThinkingText(getAIThinkingText(state, state.currentPlayerIndex, "en"));

      const delay =
        aiDifficulty === "easy" ? 500 : aiDifficulty === "medium" ? 800 : 1000;

      aiTimeoutRef.current = setTimeout(() => {
        aiTimeoutRef.current = null;
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
            newState = finalizeAfterAction(newState);
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
        aiTimeoutRef.current = null;
      }
    };
  }, [aiDifficulty, finalizeAfterAction, isAIPlayer, isOnlineGame, state.currentPlayerIndex, state.gameOver, state.phase]);

  useEffect(() => {
    if (state.gameOver) return;
    if (state.pendingEffect) return;
    if (state.phase !== "playing") return;

    const activePlayer = state.players[state.currentPlayerIndex];
    if (activePlayer.hand.length > 0) return;

    setAiThinking(false);
    setAiThinkingText("");
    setState((prev) => {
      let nextState = endTurn(prev);
      nextState = checkGameOver(nextState);
      return nextState;
    });
  }, [state]);

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
