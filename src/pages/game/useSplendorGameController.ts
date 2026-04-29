import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useLanguage } from "@/hooks/useLanguage";
import {
  GemType,
  TokenType,
  Card,
  GameState,
} from "@/lib/gameData";
import {
  getPlayerScore,
  getTotalTokens,
  initializeGame,
  performTakeTokens,
  performPurchaseCard,
  performReserveCard,
  performReturnToken,
  advanceTurn,
} from "@/lib/gameLogic";
import { getAIActionCandidates, AIDifficulty, type AIAction } from "@/lib/aiPlayer";
import { audioManager } from "@/lib/audioManager";
// import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from "@/hooks/useAuth";
import { readPlayerExtras } from "@/lib/playerExtras";
import {
  awardWinProgress,
  awardLossProgress,
} from "@/lib/progression";
import {
  cloneChallengeState,
  getDailyPuzzleDefinition,
  handleBotSurvivalWin,
  readSoloChallengeProgress,
  resetBotSurvival,
  rewardDailyPuzzle,
  rewardTurnLimitChallenge,
  type DailyPuzzleAction,
  type SoloChallengeId,
} from "@/lib/challenges";
import {
  getBackCardsByLevel,
  buildTurnWarningMessage,
  buildWinnerRewardKey,
  getAiDelay,
  getTimeoutReturnToken,
  type GameProps,
  type Phase,
} from "@/pages/game/gamePageUtils";
import { getGameById, getGameMenuPath } from "@/lib/gameCatalog";
import type { SplendorGameSceneProps } from "@/pages/game/splendorGameSceneTypes";
import splendorBackground from "@/assets/background-game-splendor.png";

export default function useSplendorGameController(props: GameProps = {}) {
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get("challenge") as SoloChallengeId | null;
  const playerCount = Math.min(
    4,
    Math.max(2, parseInt(searchParams.get("players") || "2")),
  );
  const gameMode = props.mode || searchParams.get("mode") || "local";
  const humanPlayerCount = Math.min(
    playerCount,
    Math.max(
      1,
      parseInt(
        searchParams.get("humans") ||
          (gameMode === "ai" ? "1" : String(playerCount)),
      ),
    ),
  );
  const aiDifficulty = (searchParams.get("difficulty") ||
    "medium") as AIDifficulty;
  const turnDurationSeconds = (() => {
    const paramValue = Number(searchParams.get("turnTime"));
    if (paramValue === 15 || paramValue === 30 || paramValue === 45 || paramValue === 60) {
      return paramValue;
    }

    try {
      const storedRoom = JSON.parse(localStorage.getItem("splendor-online-room") || "{}");
      const storedValue = Number(storedRoom?.turnTime);
      if (storedValue === 15 || storedValue === 30 || storedValue === 45 || storedValue === 60) {
        return storedValue;
      }
    } catch {}

    return 45;
  })();
  const navigate = useNavigate();
  const selectedGame = getGameById(searchParams.get("game"));
  const menuPath = getGameMenuPath(searchParams.get("game"));
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const awardedWinnerRef = useRef<string | null>(null);
  const awardedLossRef = useRef<string | null>(null);
  const handledChallengeOutcomeRef = useRef<string | null>(null);
  const dailyPuzzleDefinition = useMemo(
    () => (challengeId === "daily-puzzle" ? getDailyPuzzleDefinition() : null),
    [challengeId],
  );
  const initialLocalState = useMemo(
    () =>
      dailyPuzzleDefinition
        ? cloneChallengeState(dailyPuzzleDefinition.initialState)
        : initializeGame(playerCount),
    [dailyPuzzleDefinition, playerCount],
  );
  const selectedCardBack = readPlayerExtras(user?.id).selectedCardBack;
  const backCardsByLevel = useMemo(
    () => getBackCardsByLevel(selectedCardBack),
    [selectedCardBack],
  );

  const {
    state: localGameState,
    setState: setLocalGameState,
    takeTokens,
    purchaseCard,
    reserveCard,
    returnToken,
    endTurn,
    resetGame,
  } = useGame(playerCount, initialLocalState);

  // For online games, serverGameState is the source of truth
  // We display serverGameState but perform actions on localGameState then sync
  const [displayState, setDisplayState] = useState(localGameState);
  const lastServerStateRef = useRef<GameState | null>(null);

  // Update display state based on server updates (for other players' actions)
  // Only update if the server state actually changed to prevent infinite loops
  useEffect(() => {
    if (gameMode === "online" && props.serverGameState) {
      // Only update if server state has actually changed
      const serverStateStr = JSON.stringify(props.serverGameState);
      const lastStateStr = JSON.stringify(lastServerStateRef.current);
      if (serverStateStr !== lastStateStr) {
        lastServerStateRef.current = props.serverGameState;
        setDisplayState(props.serverGameState);
      }
    } else if (gameMode !== "online") {
      setDisplayState(localGameState);
    }
  }, [props.serverGameState, localGameState, gameMode]);

  const state = displayState;
  const panelCount = gameMode === "online" ? state.players.length : playerCount;

  const isAIPlayer = useCallback(
    (index: number) => {
      if (gameMode === "ai") return index !== 0;
      if (gameMode === "local") return index >= humanPlayerCount;
      return false;
    },
    [gameMode, humanPlayerCount],
  );

  const getPlayerDisplayName = useCallback(
    (index: number) => {
      if (gameMode === "online") {
        return props.playerNamesList?.[index] || `${t("player")} ${index + 1}`;
      }

      if (isAIPlayer(index)) {
        return `${t("bot")} ${index - humanPlayerCount + 1}`;
      }

      if (index === 0 && user?.username) {
        return user.username;
      }

      return `${t("player")} ${index + 1}`;
    },
    [gameMode, humanPlayerCount, isAIPlayer, props.playerNamesList, t, user?.username],
  );

  const getTimeoutReturnTokenForPlayer = useCallback(
    (playerIndex: number) => getTimeoutReturnToken(state, playerIndex),
    [state],
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedGems, setSelectedGems] = useState<GemType[]>([]);
  const [tempPoolDisplay, setTempPoolDisplay] = useState<Record<
    TokenType,
    number
  > | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [turnWarning, setTurnWarning] = useState("");
  const [systemNotice, setSystemNotice] = useState("");
  const [showQuickRules, setShowQuickRules] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(turnDurationSeconds);
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  const [dailyPuzzleStep, setDailyPuzzleStep] = useState(0);
  const [turnLimitTurnsUsed, setTurnLimitTurnsUsed] = useState(0);
  const previousPlayerIndexRef = useRef(0);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const localPlayerIndex = gameMode === "online" ? (props.playerIndex ?? 0) : 0;
  const isMatchmakingRoom =
    gameMode === "online" && Boolean(props.roomId?.startsWith("MM-"));
  const isManualOnlineRoom = gameMode === "online" && !isMatchmakingRoom;
  const expectedDailyPuzzleAction = dailyPuzzleDefinition?.actions[dailyPuzzleStep] ?? null;

  const showSystemNotice = useCallback((message: string, duration = 2400) => {
    setSystemNotice(message);
    window.setTimeout(() => setSystemNotice(""), duration);
  }, []);

  const isExpectedDailyPuzzleAction = useCallback(
    (action: DailyPuzzleAction | null) => {
      if (!expectedDailyPuzzleAction || !action) return false;
      if (expectedDailyPuzzleAction.type !== action.type) return false;

      if (action.type === "takeTokens") {
        const expected = [...(expectedDailyPuzzleAction.gems || [])].sort();
        const received = [...(action.gems || [])].sort();
        return expected.join(",") === received.join(",");
      }

      return expectedDailyPuzzleAction.cardId === action.cardId;
    },
    [expectedDailyPuzzleAction],
  );

  const applyLocalChallengeState = useCallback((nextState: GameState) => {
    setLocalGameState(nextState);
    setDisplayState(nextState);
  }, [setLocalGameState]);

  useEffect(() => {
    if (gameMode === "online") return;
    resetGame(initialLocalState);
    setDisplayState(initialLocalState);
    setDailyPuzzleStep(0);
    setTurnLimitTurnsUsed(0);
    setSelectedGems([]);
    setSelectedCard(null);
    setTempPoolDisplay(null);
    setTurnWarning("");
    setSystemNotice("");
    setPhase("idle");
    handledChallengeOutcomeRef.current = null;
    previousPlayerIndexRef.current = initialLocalState.currentPlayerIndex;
  }, [challengeId, gameMode, initialLocalState, resetGame]);

  const handleLeaveGame = useCallback(() => {
    if (gameMode === "online") {
      props.onGameEnd?.();
    }
    navigate(menuPath);
  }, [gameMode, menuPath, navigate, props]);

  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState({ splendorGameGuard: true }, "", window.location.href);
      setShowExitConfirm(true);
    };

    window.history.pushState({ splendorGameGuard: true }, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!state.gameOver) {
      awardedWinnerRef.current = null;
      awardedLossRef.current = null;
      handledChallengeOutcomeRef.current = null;
    }
  }, [state.gameOver]);

  useEffect(() => {
    if (!state.gameOver || state.winner === null) return;

    const rewardKey = buildWinnerRewardKey(state);
    if (awardedWinnerRef.current === rewardKey) return;
    awardedWinnerRef.current = rewardKey;

    if (state.winner !== localPlayerIndex) return;

    const earnedPoints = getPlayerScore(state.players[state.winner]);
    awardWinProgress(
      user?.id,
      earnedPoints,
      isMatchmakingRoom ? "matchmaking" : "standard",
    );
    setSystemNotice(t("rewardsAdded"));
    setTimeout(() => setSystemNotice(""), 4000);
  }, [gameMode, isMatchmakingRoom, localPlayerIndex, state.gameOver, state.players, state.winner, t, user?.id]);

  useEffect(() => {
    if (!state.gameOver || state.winner === null) return;
    if (state.winner === localPlayerIndex) return;
    const lossKey = `${state.winner}-${localPlayerIndex}-${state.players.length}`;
    if (awardedLossRef.current === lossKey) return;
    awardedLossRef.current = lossKey;
    if (gameMode === "online" || gameMode === "local" || gameMode === "ai") {
      awardLossProgress(user?.id);
    }
  }, [gameMode, localPlayerIndex, state.gameOver, state.winner, user?.id]);

  useEffect(() => {
    if (!state.gameOver || state.winner === null || !challengeId) return;

    const outcomeKey = `${challengeId}-${state.winner}-${turnLimitTurnsUsed}-${dailyPuzzleStep}`;
    if (handledChallengeOutcomeRef.current === outcomeKey) return;
    handledChallengeOutcomeRef.current = outcomeKey;

    if (challengeId === "daily-puzzle" && state.winner === 0) {
      const rewarded = rewardDailyPuzzle(user?.id);
      showSystemNotice(rewarded ? "Correct! Puzzle solved. +500 coins." : "Correct! Today's reward is already claimed.");
      return;
    }

    if (challengeId === "bot-survival") {
      if (state.winner === 0) {
        const result = handleBotSurvivalWin(user?.id);
        if (result.completed) {
          showSystemNotice("All stages cleared. Exclusive card back unlocked.");
        } else {
          showSystemNotice(`Stage cleared. ${result.nextStage} bot unlocked.`);
        }
      } else {
        resetBotSurvival(user?.id);
        showSystemNotice("You lost. Survival restarts from easy.");
      }
      return;
    }

    if (challengeId === "turn-limit" && state.winner === 0 && turnLimitTurnsUsed <= 25) {
      rewardTurnLimitChallenge(user?.id);
      showSystemNotice("Turn challenge cleared. Merchant avatar unlocked.");
    }
  }, [
    challengeId,
    dailyPuzzleStep,
    showSystemNotice,
    state.gameOver,
    state.winner,
    turnLimitTurnsUsed,
    user?.id,
  ]);

  // Check if current player is local player (for online games)
  const isCurrentPlayerMe = useCallback(() => {
    if (gameMode !== "online") return true; // In local/AI modes, always allow

    // In online mode, check if this is my turn based on my player index
    if (props.playerIndex !== undefined) {
      return state.currentPlayerIndex === props.playerIndex;
    }

    // Fallback: assume player 0 if no playerIndex provided
    return state.currentPlayerIndex === 0;
  }, [gameMode, state.currentPlayerIndex, props.playerIndex]);

  useEffect(() => {
    if (gameMode === "online") return;
    if (challengeId !== "turn-limit") return;
    if (state.gameOver) return;

    const previousPlayerIndex = previousPlayerIndexRef.current;
    previousPlayerIndexRef.current = state.currentPlayerIndex;

    if (previousPlayerIndex !== 0 || state.currentPlayerIndex === 0) return;

    setTurnLimitTurnsUsed((currentTurns) => currentTurns + 1);
  }, [challengeId, gameMode, state.currentPlayerIndex, state.gameOver]);

  useEffect(() => {
    if (gameMode === "online") return;
    if (challengeId !== "turn-limit") return;
    if (state.gameOver) return;
    if (turnLimitTurnsUsed < 25) return;
    if (state.currentPlayerIndex !== 0) return;

    const fallbackWinner = state.players.find((player) => player.id !== 0)?.id ?? 1;
    applyLocalChallengeState({
      ...state,
      gameOver: true,
      winner: fallbackWinner,
      currentPlayerIndex: 0,
    });
    showSystemNotice("Turn limit reached. Start over.");
  }, [
    applyLocalChallengeState,
    challengeId,
    gameMode,
    showSystemNotice,
    state,
    turnLimitTurnsUsed,
  ]);

  // Sync online game state only when local player performs an action
  const lastSyncedStateRef = useRef<GameState | null>(null);
  const syncOnlineState = useCallback(
    (nextState: GameState) => {
      if (gameMode !== "online" || !props.onGameStateChange) return;
      const nextStr = JSON.stringify(nextState);
      const lastStr = JSON.stringify(lastSyncedStateRef.current);
      if (nextStr === lastStr) return;
      lastSyncedStateRef.current = nextState;
      setDisplayState(nextState);
      props.onGameStateChange(nextState);
    },
    [gameMode, props.onGameStateChange],
  );

  useEffect(() => {
    if (gameMode !== "online" || !props.socket) return;

    const handleGameStateUpdate = (newGameState: GameState) => {
      console.log("📡 Received game state update from server");
      // The display state is already updated via props.serverGameState by the parent
      // No need to do anything here - just acknowledge receipt
    };

    props.socket.on("game-state-updated", handleGameStateUpdate);

    return () => {
      props.socket?.off("game-state-updated", handleGameStateUpdate);
    };
  }, [gameMode, props.socket]);

  useEffect(() => {
    if (gameMode !== "online" || !props.socket) return;

    const handlePlayerRemoved = (data: any) => {
      const index =
        typeof data?.playerIndex === "number" ? data.playerIndex + 1 : null;
      const name = data?.playerName || (index ? `${t("player")} ${index}` : "");
      const base = name ? `${t("playerRemoved")} ${name}` : t("playerRemoved");
      const message =
        data?.reason === "afk" ? `${base} - ${t("playerRemovedAfk")}` : base;
      setSystemNotice(message);
      setTimeout(() => setSystemNotice(""), 4000);
    };

    props.socket.on("player-removed", handlePlayerRemoved);

    return () => {
      props.socket?.off("player-removed", handlePlayerRemoved);
    };
  }, [gameMode, props.socket, t]);

  useEffect(() => {
    if (gameMode !== "online" || !props.socket) return;

    const onTurnTimer = (data: any) => {
      const endsAt = Number(data?.endsAt);
      if (!Number.isFinite(endsAt)) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTurnSecondsLeft(Math.min(turnDurationSeconds, remaining));
    };

    const onRematchRequested = () => {
      setShowRematchRequest(true);
      setWaitingForRematch(false);
    };

    const onRematchResult = (data: any) => {
      setShowRematchRequest(false);
      setWaitingForRematch(false);
      if (!data?.accepted) {
        navigate(menuPath);
      }
    };

    props.socket.on("turn-timer-updated", onTurnTimer);
    props.socket.on("rematch-requested", onRematchRequested);
    props.socket.on("rematch-result", onRematchResult);

    return () => {
      props.socket?.off("turn-timer-updated", onTurnTimer);
      props.socket?.off("rematch-requested", onRematchRequested);
      props.socket?.off("rematch-result", onRematchResult);
    };
  }, [gameMode, menuPath, navigate, props.socket, turnDurationSeconds]);

  useEffect(() => {
    setTurnSecondsLeft(turnDurationSeconds);
    const interval = window.setInterval(() => {
      setTurnSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.currentPlayerIndex, turnDurationSeconds]);

  // Phase sync: when all gems deselected, go back to idle
  useEffect(() => {
    if (selectedGems.length === 0 && phase === "selectingTokens")
      setPhase("idle");
    if (selectedGems.length > 0 && phase === "idle")
      setPhase("selectingTokens");
  }, [selectedGems.length, phase]);

  useEffect(() => {
    if (state.gameOver) return;
    const total = getTotalTokens(state.players[state.currentPlayerIndex]);
    if (total > 10 && phase !== "mustReturnTokens") {
      setPhase("mustReturnTokens");
    }
  }, [phase, state]);

  // Return tokens phase: auto-end when total <= 10
  useEffect(() => {
    if (gameMode === "online") return;
    if (
      phase === "mustReturnTokens" &&
      getTotalTokens(state.players[state.currentPlayerIndex]) <= 10
    ) {
      endTurn();
      setPhase("idle");
    }
  }, [state, phase, endTurn, gameMode]);

  // Automatic token return when a timeout happens or when bots exceed the limit.
  useEffect(() => {
    if (state.gameOver) return;
    if (phase !== "mustReturnTokens") return;
    if (!isAIPlayer(state.currentPlayerIndex) && turnSecondsLeft > 0) return;

    const p = state.players[state.currentPlayerIndex];
    const total = getTotalTokens(p);
    if (total <= 10) return;

    const best = getTimeoutReturnTokenForPlayer(state.currentPlayerIndex);
    if (!best) return;

    const timer = setTimeout(() => {
      returnToken(state.currentPlayerIndex, best);
    }, 60);

    return () => clearTimeout(timer);
  }, [getTimeoutReturnTokenForPlayer, isAIPlayer, phase, returnToken, state, turnSecondsLeft]);

  useEffect(() => {
    if (gameMode === "online") return;
    if (state.gameOver) return;
    if (turnSecondsLeft > 0) return;
    if (phase === "mustReturnTokens") return;

    setSelectedGems([]);
    setSelectedCard(null);
    setTurnWarning("");
    endTurn();
    setPhase("idle");
  }, [
    endTurn,
    gameMode,
    phase,
    state.currentPlayerIndex,
    state.gameOver,
    turnSecondsLeft,
  ]);

  // AI turn - automatic execution with proper state tracking
  useEffect(() => {
    if (state.gameOver) return;
    if (phase !== "idle") return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;

    let isMounted = true;

    const executeAI = async () => {
      await new Promise((resolve) => setTimeout(resolve, getAiDelay(aiDifficulty)));

      if (!isMounted) return;

      setPhase("aiThinking");
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isMounted) return;

      const previewAction = (candidate: AIAction) => {
        if (candidate.type === "purchaseCard") {
          return performPurchaseCard(state, candidate.cardId);
        }
        if (candidate.type === "takeTokens") {
          return performTakeTokens(state, candidate.gems);
        }
        if (candidate.type === "reserveCard") {
          return performReserveCard(state, candidate.cardId);
        }
        return performReserveCard(state, 0, candidate.level);
      };

      const legalCandidates = getAIActionCandidates(state, aiDifficulty).filter((candidate) => previewAction(candidate) !== state);
      const action = legalCandidates[0];
      if (!action) {
        const fallbackTake = GEM_TYPES.filter((gem) => state.tokenPool[gem] > 0);
        if (fallbackTake.length > 0) {
          const gems = fallbackTake.slice(0, Math.min(3, fallbackTake.length));
          const afterTake = performTakeTokens(state, gems);
          takeTokens(gems);
          if (isMounted) {
            const total = getTotalTokens(afterTake.players[afterTake.currentPlayerIndex]);
            if (total > 10) {
              setPhase("mustReturnTokens");
            } else {
              endTurn();
              setPhase("idle");
            }
          }
          return;
        }
        if (state.players[state.currentPlayerIndex].reservedCards.length < 3) {
          const visibleCard = ([3, 2, 1] as const)
            .flatMap((level) => state.visibleCards[level])
            .find(Boolean);
          if (visibleCard) {
            const afterReserve = performReserveCard(state, (visibleCard as Card).id);
            reserveCard((visibleCard as Card).id);
            if (isMounted) {
              const total = getTotalTokens(afterReserve.players[afterReserve.currentPlayerIndex]);
              if (total > 10) {
                setPhase("mustReturnTokens");
              } else {
                endTurn();
                setPhase("idle");
              }
            }
            return;
          }
          const afterReserve = performReserveCard(state, 0, 1);
          reserveCard(0, 1);
          if (isMounted) {
            const total = getTotalTokens(afterReserve.players[afterReserve.currentPlayerIndex]);
            if (total > 10) {
              setPhase("mustReturnTokens");
            } else {
              endTurn();
              setPhase("idle");
            }
          }
          return;
        }
        if (isMounted) {
          setPhase("idle");
        }
        return;
      }
      const mayIncreaseTokens =
        action.type === "takeTokens" ||
        action.type === "reserveCard" ||
        action.type === "reserveDeck";

      if (action.type === "purchaseCard") {
        purchaseCard(action.cardId);
      } else if (action.type === "takeTokens") {
        takeTokens(action.gems);
      } else if (action.type === "reserveCard") {
        reserveCard(action.cardId);
      } else if (action.type === "reserveDeck") {
        reserveCard(0, action.level);
      }

      if (isMounted) {
        // If AI might have increased tokens, go to mustReturnTokens and let the return-token effect decide.
        if (mayIncreaseTokens) {
          setPhase("mustReturnTokens");
        } else {
          endTurn();
          setPhase("idle");
        }
      }
    };

    executeAI();

    return () => {
      isMounted = false;
    };
  }, [
    state.currentPlayerIndex,
    state.gameOver,
    isAIPlayer,
    state,
    aiDifficulty,
    purchaseCard,
    takeTokens,
    reserveCard,
    endTurn,
  ]);

  const handleGemClick = useCallback(
    (gem: GemType) => {
      // Check if it's current player's turn (for online games)
      if (gameMode === "online" && !isCurrentPlayerMe()) {
        const currentPlayerName =
          props.playerNamesList?.[state.currentPlayerIndex] || getPlayerDisplayName(state.currentPlayerIndex);
        setTurnWarning(buildTurnWarningMessage(lang, currentPlayerName));
        setTimeout(() => setTurnWarning(""), 3000);
        return;
      }

      if (
        challengeId === "daily-puzzle" &&
        gameMode !== "online" &&
        expectedDailyPuzzleAction?.type !== "takeTokens"
      ) {
        showSystemNotice("Wrong move.");
        return;
      }

      if (phase !== "idle" && phase !== "selectingTokens") return;
      if (state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)) return;

      let newSelected: GemType[] = [];
      const count = selectedGems.filter((g) => g === gem).length;

      if (count === 0) {
        if (selectedGems.length === 2 && selectedGems[0] === selectedGems[1]) {
          newSelected = selectedGems;
        } else if (selectedGems.length >= 3) {
          newSelected = selectedGems;
        } else {
          newSelected = [...selectedGems, gem];
        }
      } else if (
        count === 1 &&
        selectedGems.length === 1 &&
        state.tokenPool[gem] >= 4
      ) {
        newSelected = [gem, gem];
      } else {
        newSelected = selectedGems.filter((g) => g !== gem);
      }

      setSelectedGems(newSelected);

      // Immediate visual update: show reduced token pool
      if (newSelected.length > 0) {
        const tempPool = { ...state.tokenPool };
        for (const g of newSelected) {
          tempPool[g] = Math.max(0, tempPool[g] - 1);
        }
        setTempPoolDisplay(tempPool);
      } else {
        setTempPoolDisplay(null);
      }
    },
    [
      phase,
      state.tokenPool,
      selectedGems,
      gameMode,
      isCurrentPlayerMe,
      state.currentPlayerIndex,
      props.playerNamesList,
      lang,
      challengeId,
      expectedDailyPuzzleAction,
      showSystemNotice,
    ],
  );

  const handleConfirmTokens = useCallback(() => {
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    if (
      challengeId === "daily-puzzle" &&
      gameMode !== "online" &&
      !isExpectedDailyPuzzleAction({ type: "takeTokens", gems: selectedGems })
    ) {
      showSystemNotice("Wrong move.");
      return;
    }

    audioManager.playSound("takeTokens");
    const gemsList = selectedGems.join(", ");
    console.log(
      `🪙 [TOKEN] Player ${state.currentPlayerIndex} taking ${selectedGems.length} tokens | سکه‌های انتخاب‌شده: ${gemsList}`,
    );

    if (gameMode === "online") {
      const afterTake = performTakeTokens(state, selectedGems);
      setSelectedGems([]);
      setTempPoolDisplay(null);

      if (afterTake === state) {
        setPhase("idle");
        return;
      }

      const total = getTotalTokens(
        afterTake.players[afterTake.currentPlayerIndex],
      );
      let nextState = afterTake;
      if (total > 10) {
        setPhase("mustReturnTokens");
      } else {
        nextState = advanceTurn(afterTake);
        setPhase("idle");
      }
      syncOnlineState(nextState);
      return;
    }

    const currentTotal = getTotalTokens(currentPlayer);
    const adding = selectedGems.length;
    takeTokens(selectedGems);
    setSelectedGems([]);
    setTempPoolDisplay(null);

    if (challengeId === "daily-puzzle" && gameMode !== "online") {
      setDailyPuzzleStep((current) => current + 1);
      setPhase("idle");
      showSystemNotice("Correct");
      return;
    }

    if (currentTotal + adding > 10) {
      setPhase("mustReturnTokens");
    } else {
      endTurn();
      setPhase("idle");
    }
  }, [
    selectedGems,
    currentPlayer,
    takeTokens,
    endTurn,
    gameMode,
    state.currentPlayerIndex,
    state,
    syncOnlineState,
    challengeId,
    isExpectedDailyPuzzleAction,
    showSystemNotice,
  ]);

  const handleCancelTokens = useCallback(() => {
    setSelectedGems([]);
    setTempPoolDisplay(null);
    setPhase("idle");
  }, []);

  const handleCardClick = useCallback(
    (card: Card) => {
      // Check if it's current player's turn (for online games)
      if (gameMode === "online" && !isCurrentPlayerMe()) {
        const currentPlayerName =
          props.playerNamesList?.[state.currentPlayerIndex] || getPlayerDisplayName(state.currentPlayerIndex);
        setTurnWarning(buildTurnWarningMessage(lang, currentPlayerName));
        setTimeout(() => setTurnWarning(""), 3000);
        return;
      }

      if (
        challengeId === "daily-puzzle" &&
        gameMode !== "online" &&
        !isExpectedDailyPuzzleAction({ type: "purchaseCard", cardId: card.id })
      ) {
        showSystemNotice("Wrong move.");
        return;
      }

      if (phase !== "idle") return;
      setSelectedCard(card);
      setPhase("cardAction");
    },
    [
      phase,
      gameMode,
      isCurrentPlayerMe,
      state.currentPlayerIndex,
      props.playerNamesList,
      lang,
      challengeId,
      isExpectedDailyPuzzleAction,
      showSystemNotice,
    ],
  );

  const handleBuyCard = useCallback(() => {
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    if (!selectedCard) return;
    if (
      challengeId === "daily-puzzle" &&
      gameMode !== "online" &&
      !isExpectedDailyPuzzleAction({ type: "purchaseCard", cardId: selectedCard.id })
    ) {
      showSystemNotice("Wrong move.");
      return;
    }
    audioManager.playSound("buyCard");
    console.log(
      `💳 [CARD] Player ${state.currentPlayerIndex} purchasing card ${selectedCard.id} | خرید کارت`,
    );
    if (gameMode === "online") {
      const afterPurchase = performPurchaseCard(state, selectedCard.id);
      setSelectedCard(null);
      setPhase("idle");
      if (afterPurchase === state) return;
      const nextState = advanceTurn(afterPurchase);
      syncOnlineState(nextState);
      return;
    }

    purchaseCard(selectedCard.id);
    const purchasedState = performPurchaseCard(state, selectedCard.id);
    setSelectedCard(null);

    if (challengeId === "daily-puzzle" && gameMode !== "online") {
      const scoreAfterPurchase = getPlayerScore(
        purchasedState.players[purchasedState.currentPlayerIndex],
      );
      setDailyPuzzleStep((current) => current + 1);
      showSystemNotice("Correct");

      if (scoreAfterPurchase >= 15) {
        applyLocalChallengeState({
          ...purchasedState,
          gameOver: true,
          winner: 0,
          currentPlayerIndex: 0,
        });
      }

      setPhase("idle");
      return;
    }

    endTurn();
    setPhase("idle");
  }, [
    applyLocalChallengeState,
    challengeId,
    gameMode,
    isExpectedDailyPuzzleAction,
    showSystemNotice,
    selectedCard,
    purchaseCard,
    endTurn,
    gameMode,
    state.currentPlayerIndex,
    state,
    syncOnlineState,
  ]);

  const handleReserveCard = useCallback(() => {
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    if (challengeId === "daily-puzzle" && gameMode !== "online") {
      showSystemNotice("Wrong move.");
      return;
    }
    if (!selectedCard) return;
    audioManager.playSound("reserveCard");
    console.log(
      `🔖 [CARD] Player ${state.currentPlayerIndex} reserving card ${selectedCard.id} | رزرو کارت`,
    );
    if (gameMode === "online") {
      const afterReserve = performReserveCard(state, selectedCard.id);
      setSelectedCard(null);
      if (afterReserve === state) {
        setPhase("idle");
        return;
      }
      const total = getTotalTokens(
        afterReserve.players[afterReserve.currentPlayerIndex],
      );
      let nextState = afterReserve;
      if (total > 10) {
        setPhase("mustReturnTokens");
      } else {
        nextState = advanceTurn(afterReserve);
        setPhase("idle");
      }
      syncOnlineState(nextState);
      return;
    }

    const currentTotal = getTotalTokens(currentPlayer);
    const getsGold = state.tokenPool.gold > 0;
    reserveCard(selectedCard.id);
    setSelectedCard(null);

    if (currentTotal + (getsGold ? 1 : 0) > 10) {
      setPhase("mustReturnTokens");
    } else {
      endTurn();
      setPhase("idle");
    }
  }, [
    selectedCard,
    currentPlayer,
    state.tokenPool.gold,
    reserveCard,
    endTurn,
    gameMode,
    state,
    syncOnlineState,
    challengeId,
    showSystemNotice,
  ]);

  const handleReserveDeck = useCallback(
    (level: 1 | 2 | 3) => {
      if (gameMode === "online" && !isCurrentPlayerMe()) return;
      if (challengeId === "daily-puzzle" && gameMode !== "online") {
        showSystemNotice("Wrong move.");
        return;
      }
      if (phase !== "idle") return;
      if (
        currentPlayer.reservedCards.length >= 3 ||
        state.decks[level].length === 0
      )
        return;
      if (gameMode === "online") {
        const afterReserve = performReserveCard(state, 0, level);
        if (afterReserve === state) {
          setPhase("idle");
          return;
        }
        const total = getTotalTokens(
          afterReserve.players[afterReserve.currentPlayerIndex],
        );
        let nextState = afterReserve;
        if (total > 10) {
          setPhase("mustReturnTokens");
        } else {
          nextState = advanceTurn(afterReserve);
          setPhase("idle");
        }
        syncOnlineState(nextState);
        return;
      }

      const currentTotal = getTotalTokens(currentPlayer);
      const getsGold = state.tokenPool.gold > 0;
      reserveCard(0, level);

      if (currentTotal + (getsGold ? 1 : 0) > 10) {
        setPhase("mustReturnTokens");
      } else {
        endTurn();
        setPhase("idle");
      }
    },
    [
      phase,
      currentPlayer,
      state,
      reserveCard,
      endTurn,
      gameMode,
      syncOnlineState,
      challengeId,
      showSystemNotice,
    ],
  );

  const handleReturnToken = useCallback(
    (tokenType: TokenType) => {
      if (gameMode === "online") {
        const afterReturn = performReturnToken(
          state,
          state.currentPlayerIndex,
          tokenType,
        );
        if (afterReturn === state) return;
        const total = getTotalTokens(
          afterReturn.players[afterReturn.currentPlayerIndex],
        );
        let nextState = afterReturn;
        if (total <= 10) {
          nextState = advanceTurn(afterReturn);
          setPhase("idle");
        }
        syncOnlineState(nextState);
        return;
      }

      returnToken(state.currentPlayerIndex, tokenType);
    },
    [
      state,
      state.currentPlayerIndex,
      returnToken,
      gameMode,
      syncOnlineState,
    ],
  );

  const handleCancel = useCallback(() => {
    setSelectedGems([]);
    setSelectedCard(null);
    setTempPoolDisplay(null);
    setPhase("idle");
  }, []);

  const isReserved = selectedCard
    ? currentPlayer.reservedCards.some((c) => c.id === selectedCard.id)
    : false;

  const sceneProps: SplendorGameSceneProps = {
    dir: "ltr",
    backgroundImage: splendorBackground,
    gameMode: gameMode as "local" | "ai" | "online",
    phase,
    lang,
    t,
    gameTitle: selectedGame.name,
    state,
    currentPlayer,
    humanPlayerCount,
    turnSecondsLeft,
    getPlayerDisplayName,
    isCurrentPlayerMe,
    isAIPlayer,
    onShowQuickRules: () => setShowQuickRules(true),
    onExit: () => {
      if (state.gameOver) {
        navigate(menuPath);
        return;
      }
      setShowExitConfirm(true);
    },
    socket: props.socket || null,
    roomId: props.roomId || "",
    playerId: props.playerId || "",
    playerName: props.playerName || user?.username || "",
    roomPlayers: props.roomPlayers || {},
    selectedCard: phase === "cardAction" ? selectedCard : null,
    isReserved,
    showQuickRules,
    showExitConfirm,
    showRematchRequest,
    waitingForRematch,
    turnWarning,
    systemNotice,
    onCloseQuickRules: () => setShowQuickRules(false),
    onCancelCardAction: handleCancel,
    onBuyCard: handleBuyCard,
    onReserveCard: handleReserveCard,
    onLeaveGame: handleLeaveGame,
    onCloseExitConfirm: setShowExitConfirm,
    onCloseRematchRequest: setShowRematchRequest,
    onCloseWaitingRematch: setWaitingForRematch,
    onDeclineRematch: () =>
      props.socket?.emit("respond-rematch", {
        roomId: props.roomId,
        playerId: props.playerId,
        accept: false,
      }),
    onAcceptRematch: () =>
      props.socket?.emit("respond-rematch", {
        roomId: props.roomId,
        playerId: props.playerId,
        accept: true,
      }),
    onPlayAgain: () => {
      if (isManualOnlineRoom && props.socket && props.roomId && props.playerId) {
        props.socket.emit("request-rematch", {
          roomId: props.roomId,
          playerId: props.playerId,
          initialGameState: initializeGame(playerCount),
        });
        setWaitingForRematch(true);
        return;
      }

      if (challengeId === "bot-survival") {
        const nextProgress = readSoloChallengeProgress(user?.id);
        if (state.winner === 0 && !nextProgress.botSurvivalCompleted) {
          navigate(
            `/game?players=2&mode=ai&challenge=bot-survival&difficulty=${nextProgress.botSurvivalStage}&step=${nextProgress.botSurvivalStage}`,
          );
          return;
        }

        if (state.winner !== 0) {
          navigate("/game?players=2&mode=ai&challenge=bot-survival&difficulty=easy&step=easy");
          return;
        }

        navigate("/events/solo/survival");
        return;
      }

      if (challengeId === "daily-puzzle") {
        resetGame(initialLocalState);
        setDailyPuzzleStep(0);
        return;
      }

      if (challengeId === "turn-limit") {
        resetGame();
        setTurnLimitTurnsUsed(0);
        return;
      }

      resetGame();
    },
    onMenu: () => navigate(menuPath),
    panelCount,
    tempPoolDisplay,
    selectedGems,
    boardSelectedCard: selectedCard,
    handleReturnToken,
    handleReserveDeck,
    handleCardClick,
    handleGemClick,
    handleConfirmTokens,
    handleCancel,
    backCardsByLevel,
  };

  return { sceneProps };
}
