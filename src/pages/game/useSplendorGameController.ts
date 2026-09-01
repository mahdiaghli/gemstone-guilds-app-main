import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { setGlobalMusicTrack } from "@/hooks/useBackgroundMusic";
import { useLanguage } from "@/hooks/useLanguage";
import { useSplendorTutorial } from "./useSplendorTutorial";
import { useSplendorSocket } from "./useSplendorSocket";
import {
  GemType,
  TokenType,
  Card,
  GameState,
  GEM_TYPES,
  GEM_INFO,
  TOKEN_TYPES,
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
import { gemTokenImages } from "@/components/game/GemToken";
import { nobleImages } from "@/components/game/NobleDisplay";
// import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from "@/hooks/useAuth";
import { readPlayerExtras } from "@/lib/playerExtras";
import {
  awardWinProgress,
  awardLossProgress,
} from "@/lib/progression";
import { recordFinishedGame } from "@/lib/playerAnalytics";
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
  
  // Check if it's first time playing Splendor
  const hasPlayedSplendorBefore = useMemo(() => {
    try {
      return localStorage.getItem("splendor-tutorial-completed") === "true";
    } catch {
      return false;
    }
  }, []);
  
  const isFirstTimePlayer = !hasPlayedSplendorBefore && gameMode !== "online" && !challengeId;
  
  const interactiveTutorialEnabled = false;
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

    return 15;
  })();
  const targetScore = (() => {
    const paramValue = Number(searchParams.get("targetScore"));
    if (paramValue > 0) return paramValue;

    try {
      const storedRoom = JSON.parse(localStorage.getItem("splendor-online-room") || "{}");
      const storedValue = Number(storedRoom?.targetScore);
      if (storedValue > 0) return storedValue;
    } catch {}

    return 15;
  })();
  const navigate = useNavigate();
  const selectedGame = getGameById(searchParams.get("game"));
  const menuPath = getGameMenuPath(searchParams.get("game"));
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const awardedWinnerRef = useRef<string | null>(null);
  const awardedLossRef = useRef<string | null>(null);
  const handledChallengeOutcomeRef = useRef<string | null>(null);
  const recordedAnalyticsRef = useRef<string | null>(null);
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

  useEffect(() => {
    setActionSubmitting(false);
  }, [state.currentPlayerIndex]);

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
      let displayName: string;
      if (gameMode === "online") {
        displayName = props.playerNamesList?.[index] || `${t("player")} ${index + 1}`;
      } else {
        if (gameMode === "ai" && index !== 0) {
          displayName = t("deadMansDrawRivalAI", { number: index });
        } else if (index === 0 && user?.username) {
          displayName = user.username;
        } else {
          displayName = t("deadMansDrawPlayerName", { number: index + 1 });
        }
      }
      if (displayName.length > 15) {
        displayName = displayName.slice(0, 15);
      }
      return displayName;
    }, [gameMode, props.playerNamesList, t, user?.username]);

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
  const [tutorialStep, setTutorialStep] = useState(0);
  const [manualTutorialOpen, setManualTutorialOpen] = useState(false);
  const [flightAnimations, setFlightAnimations] = useState<SplendorGameSceneProps["flightAnimations"]>([]);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const previousPlayerIndexRef = useRef(0);
  const playerActionTakenRef = useRef(false);
  const [showRobotTurnPopup, setShowRobotTurnPopup] = useState(false);

  useEffect(() => {
    const handleAppBackRequest = () => {
      if (state.gameOver) {
        navigate(menuPath);
        return;
      }
      setShowExitConfirm(true);
    };

    window.addEventListener("gemstone-app-back-request", handleAppBackRequest);
    return () => {
      window.removeEventListener("gemstone-app-back-request", handleAppBackRequest);
    };
  }, [menuPath, navigate, state.gameOver]);

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

  const getCenterBySelector = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const getCardCenter = useCallback((cardId: string | number) => {
    return getCenterBySelector(`[data-card-id="${String(cardId)}"]`);
  }, [getCenterBySelector]);

  const spawnFlight = useCallback((flight: Omit<SplendorGameSceneProps["flightAnimations"][number], "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFlightAnimations((current) => [...current, { ...flight, id }]);
    window.setTimeout(() => {
      setFlightAnimations((current) => current.filter((item) => item.id !== id));
    }, flight.durationMs + 40);
  }, []);

  const lockActionUntilTurnChanges = useCallback(() => {
    setActionSubmitting(true);
  }, []);

  // Debounce ref to prevent rapid clicks
  const actionDebounceRef = useRef<number | null>(null);

  const { interactiveTutorialSteps, isTutorialActionAllowed, tutorialData } = useSplendorTutorial({
    lang,
    tutorialStep,
    interactiveTutorialEnabled,
    manualTutorialOpen,
    state,
  });

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
    setGlobalMusicTrack("lobby");
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
    setGlobalMusicTrack("game");
    return () => {
      setGlobalMusicTrack("lobby");
    };
  }, []);

  useEffect(() => {
    if (!state.gameOver) {
      awardedWinnerRef.current = null;
      awardedLossRef.current = null;
      handledChallengeOutcomeRef.current = null;
      recordedAnalyticsRef.current = null;
    }
  }, [state.gameOver]);

  useEffect(() => {
    if (!state.gameOver || state.winner === null) return;

    // Prevent game over handling during interactive tutorial
    if (interactiveTutorialEnabled || manualTutorialOpen) return;

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
    
    // Prevent game over handling during interactive tutorial
    if (interactiveTutorialEnabled || manualTutorialOpen) return;
    
    const lossKey = `${state.winner}-${localPlayerIndex}-${state.players.length}`;
    if (awardedLossRef.current === lossKey) return;
    awardedLossRef.current = lossKey;
    if (gameMode === "online" || gameMode === "local" || gameMode === "ai") {
      awardLossProgress(user?.id);
    }
  }, [gameMode, localPlayerIndex, state.gameOver, state.winner, user?.id]);

  useEffect(() => {
    if (!state.gameOver || state.winner === null) return;
    
    // Prevent game over handling during interactive tutorial
    if (interactiveTutorialEnabled || manualTutorialOpen) return;
    
    const analyticsKey = `${selectedGame.id}-${gameMode}-${state.winner}-${state.players.length}`;
    if (recordedAnalyticsRef.current === analyticsKey) return;
    recordedAnalyticsRef.current = analyticsKey;
    recordFinishedGame(
      user?.id,
      selectedGame.id,
      gameMode as "local" | "ai" | "online",
      state.winner === localPlayerIndex,
    );
  }, [gameMode, localPlayerIndex, selectedGame.id, state.gameOver, state.players.length, state.winner, user?.id]);

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

  const resetSplendorSession = useCallback((nextState: GameState) => {
    resetGame(nextState);
    setDisplayState(nextState);
    setSelectedGems([]);
    setSelectedCard(null);
    setTempPoolDisplay(null);
    setTurnWarning("");
    setSystemNotice("");
    setPhase("idle");
    setDailyPuzzleStep(0);
    setTurnLimitTurnsUsed(0);
    setTutorialStep(0);
    setShowQuickRules(false);
    setShowExitConfirm(false);
    setShowRematchRequest(false);
    setWaitingForRematch(false);
    setTurnSecondsLeft(turnDurationSeconds);
    previousPlayerIndexRef.current = nextState.currentPlayerIndex;
    handledChallengeOutcomeRef.current = null;
    awardedWinnerRef.current = null;
    awardedLossRef.current = null;
    recordedAnalyticsRef.current = null;
    lastServerStateRef.current = null;
    lastSyncedStateRef.current = null;
  }, [resetGame, turnDurationSeconds]);

  useEffect(() => {
    if (!interactiveTutorialEnabled && !manualTutorialOpen) {
      setTutorialStep(0);
    }
  }, [interactiveTutorialEnabled, manualTutorialOpen]);

  useSplendorSocket({
    socket: props.socket,
    gameMode,
    menuPath,
    turnDurationSeconds,
    t,
    onGameStateUpdate: (newGameState: GameState) => {
      console.log("📡 Received game state update from server");
    },
    onPlayerRemoved: (data: any) => {
      const index =
        typeof data?.playerIndex === "number" ? data.playerIndex + 1 : null;
      const name = data?.playerName || (index ? `${t("player")} ${index}` : "");
      const base = name ? `${t("playerRemoved")} ${name}` : t("playerRemoved");
      const message =
        data?.reason === "afk" ? `${base} - ${t("playerRemovedAfk")}` : base;
      setSystemNotice(message);
      setTimeout(() => setSystemNotice(""), 4000);
    },
    onTurnTimerUpdated: (data: any) => {
      const endsAt = Number(data?.endsAt);
      if (!Number.isFinite(endsAt)) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTurnSecondsLeft(Math.min(turnDurationSeconds, remaining));
    },
    onRematchRequested: () => {
      setShowRematchRequest(true);
      setWaitingForRematch(false);
    },
    onRematchResult: (data: any) => {
      setShowRematchRequest(false);
      setWaitingForRematch(false);
      if (!data?.accepted) {
        navigate(menuPath);
      }
    },
  });

  useEffect(() => {
    setTurnSecondsLeft(turnDurationSeconds);
    const interval = window.setInterval(() => {
      // Pause timer during interactive tutorial
      if (interactiveTutorialEnabled || manualTutorialOpen) {
        return;
      }
      setTurnSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.currentPlayerIndex, turnDurationSeconds, interactiveTutorialEnabled, manualTutorialOpen]);

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
      endTurn(targetScore);
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
    endTurn(targetScore);
    setPhase("idle");
    setTurnSecondsLeft(turnDurationSeconds);
  }, [
    endTurn,
    gameMode,
    phase,
    state.currentPlayerIndex,
    state.gameOver,
    turnSecondsLeft,
    isAIPlayer,
    state.players.length,
  ]);

  // AI turn - automatic execution with proper state tracking
  // Disable AI during interactive tutorial
  useEffect(() => {
    if (state.gameOver) return;
    if (phase !== "idle") return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;
    
    // Skip AI execution during interactive tutorial
    if (interactiveTutorialEnabled || manualTutorialOpen) return;

    let isMounted = true;

    const executeAI = async () => {
      // Show robot turn popup immediately
      if (isMounted) {
        setShowRobotTurnPopup(true);
      }
      
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

          // Add animations for AI taking tokens
          gems.forEach((gem, index) => {
            const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
            const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
            if (start && end) {
              spawnFlight({
                kind: "token",
                color: GEM_INFO[gem].color,
                imageUrl: gemTokenImages[gem],
                start,
                end,
                durationMs: 400 + index * 30,
              });
            }
          });

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

            // Add animation for AI reserving card
            const cardStart = getCardCenter((visibleCard as Card).id);
            const cardEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
            if (cardStart && cardEnd) {
              spawnFlight({
                kind: "card",
                color: "#cbd5e1",
                label: "R",
                start: cardStart,
                end: cardEnd,
                durationMs: 520,
              });
            }

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

          // Add animation for AI reserving from deck
          const deckStart = getCenterBySelector(`[data-deck-level="1"]`);
          const reservedEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
          if (deckStart && reservedEnd) {
            spawnFlight({
              kind: "card",
              color: "#1e293b",
              label: "1",
              start: deckStart,
              end: reservedEnd,
              durationMs: 560,
            });
          }

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
        const afterPurchase = performPurchaseCard(state, action.cardId);
        const card = state.visibleCards[3].find((c) => c?.id === action.cardId) ||
                     state.visibleCards[2].find((c) => c?.id === action.cardId) ||
                     state.visibleCards[1].find((c) => c?.id === action.cardId);

        if (card) {
          const cardStart = getCardCenter(card.id);
          const cardEnd = getCenterBySelector(`[data-player-bonus-slot="${state.currentPlayerIndex}-${card.gemBonus}"]`);
          if (cardStart && cardEnd) {
            spawnFlight({
              kind: "card",
              color: GEM_INFO[card.gemBonus].color,
              label: card.points ? String(card.points) : "+",
              start: cardStart,
              end: cardEnd,
              durationMs: 800,
            });
          }

          // Token payment animations
          TOKEN_TYPES.forEach((tokenType, tokenIndex) => {
            const paid = state.players[state.currentPlayerIndex].tokens[tokenType] - afterPurchase.players[afterPurchase.currentPlayerIndex].tokens[tokenType];
            if (paid <= 0) return;
            for (let i = 0; i < paid; i += 1) {
              const start = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${tokenType}"]`);
              const end = getCenterBySelector(`[data-token-pool="${tokenType}"]`);
              if (!start || !end) continue;
              spawnFlight({
                kind: "token",
                color: GEM_INFO[tokenType].color,
                imageUrl: gemTokenImages[tokenType],
                start,
                end,
                durationMs: 400 + tokenIndex * 30,
              });
            }
          });

          // Noble animation
          const beforeNobleIds = new Set(state.players[state.currentPlayerIndex].nobles.map((n) => String(n.id)));
          const newNoble = afterPurchase.players[afterPurchase.currentPlayerIndex].nobles.find((n) => !beforeNobleIds.has(String(n.id)));
          if (newNoble) {
            const start = getCenterBySelector(`[data-noble-id="${String(newNoble.id)}"]`);
            const end = getCenterBySelector(`[data-player-nobles-slot="${state.currentPlayerIndex}"]`);
            if (start && end) {
              spawnFlight({
                kind: "noble",
                color: "#f5d47a",
                imageUrl: nobleImages[(Math.max(1, Number(newNoble.id)) - 1) % nobleImages.length],
                start,
                end,
                durationMs: 900,
              });
            }
          }
        }

        purchaseCard(action.cardId);
      } else if (action.type === "takeTokens") {
        const afterTake = performTakeTokens(state, action.gems);

        // Add animations for AI taking tokens
        action.gems.forEach((gem, index) => {
          const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
          const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
          if (start && end) {
            spawnFlight({
              kind: "token",
              color: GEM_INFO[gem].color,
              imageUrl: gemTokenImages[gem],
              start,
              end,
              durationMs: 400 + index * 30,
            });
          }
        });

        takeTokens(action.gems);
      } else if (action.type === "reserveCard") {
        const afterReserve = performReserveCard(state, action.cardId);
        const card = state.visibleCards[3].find((c) => c?.id === action.cardId) ||
                     state.visibleCards[2].find((c) => c?.id === action.cardId) ||
                     state.visibleCards[1].find((c) => c?.id === action.cardId);

        if (card) {
          const cardStart = getCardCenter(card.id);
          const cardEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
          if (cardStart && cardEnd) {
            spawnFlight({
              kind: "card",
              color: "#cbd5e1",
              label: "R",
              start: cardStart,
              end: cardEnd,
              durationMs: 520,
            });
          }

          // Gold token animation
          if (state.tokenPool.gold > 0) {
            const goldStart = getCenterBySelector('[data-token-pool="gold"]');
            const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
            if (goldStart && goldEnd) {
              spawnFlight({
                kind: "token",
                color: GEM_INFO.gold.color,
                imageUrl: gemTokenImages.gold,
                start: goldStart,
                end: goldEnd,
                durationMs: 460,
              });
            }
          }
        }

        reserveCard(action.cardId);
      } else if (action.type === "reserveDeck") {
        const afterReserve = performReserveCard(state, 0, action.level);

        // Add animation for AI reserving from deck
        const deckStart = getCenterBySelector(`[data-deck-level="${action.level}"]`);
        const reservedEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
        if (deckStart && reservedEnd) {
          spawnFlight({
            kind: "card",
            color: "#1e293b",
            label: String(action.level),
            start: deckStart,
            end: reservedEnd,
            durationMs: 560,
          });
        }

        // Gold token animation
        if (state.tokenPool.gold > 0) {
          const goldStart = getCenterBySelector('[data-token-pool="gold"]');
          const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
          if (goldStart && goldEnd) {
            spawnFlight({
              kind: "token",
              color: GEM_INFO.gold.color,
              imageUrl: gemTokenImages.gold,
              start: goldStart,
              end: goldEnd,
              durationMs: 460,
            });
          }
        }

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
      // Hide robot turn popup when component unmounts or turn changes
      setShowRobotTurnPopup(false);
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

      // Check if it's AI's turn (for local/AI modes) - silently block without popup
      if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
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

      // Tutorial validation for action type
      if (!isTutorialActionAllowed("takeTokens", { gems: [gem] })) {
        showSystemNotice(lang === "fa" ? "در حال حاضر در این قدم، این عمل مجاز نیست." : "This action is not allowed at this tutorial step.");
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
      state,
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
      isTutorialActionAllowed,
    ],
  );

  const handleConfirmTokens = useCallback(() => {
    if (actionSubmitting) return;
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    
    // Check if it's AI's turn (for local/AI modes) - silently block without popup
    if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
      return;
    }
    
    if (
      challengeId === "daily-puzzle" &&
      gameMode !== "online" &&
      !isExpectedDailyPuzzleAction({ type: "takeTokens", gems: selectedGems })
    ) {
      showSystemNotice("Wrong move.");
      return;
    }

    // Tutorial validation for final gem selection
    if (!isTutorialActionAllowed("takeTokens", { gems: selectedGems })) {
      showSystemNotice(lang === "fa" ? "انتخاب جواهرات نادرست است. به دستورات آموزش توجه کنید." : "Invalid gem selection for this tutorial step. Follow the tutorial instructions.");
      return;
    }

    // Prevent rapid clicks - debounce
    if (actionDebounceRef.current !== null) {
      return;
    }
    actionDebounceRef.current = window.setTimeout(() => {
      actionDebounceRef.current = null;
    }, 500);

    lockActionUntilTurnChanges();
    audioManager.playSound("takeTokens");
    const gemsList = selectedGems.join(", ");
    console.log(
      `🪙 [TOKEN] Player ${state.currentPlayerIndex} taking ${selectedGems.length} tokens | سکه‌های انتخاب‌شده: ${gemsList}`,
    );

    if (gameMode === "online") {
      selectedGems.forEach((gem, index) => {
        const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
        const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
        if (!start || !end) return;
        spawnFlight({
          kind: "token",
          color: GEM_INFO[gem].color,
          imageUrl: gemTokenImages[gem],
          start,
          end,
          durationMs: 420 + index * 70,
        });
      });
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
        nextState = advanceTurn(afterTake, targetScore);
        setPhase("idle");
      }
      syncOnlineState(nextState);
      return;
    }

    const currentTotal = getTotalTokens(currentPlayer);
    const adding = selectedGems.length;
    selectedGems.forEach((gem, index) => {
      const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
      const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
      if (!start || !end) return;
      spawnFlight({
        kind: "token",
        color: GEM_INFO[gem].color,
        imageUrl: gemTokenImages[gem],
        start,
        end,
        durationMs: 420 + index * 70,
      });
    });
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
      endTurn(targetScore);
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
    getCenterBySelector,
    spawnFlight,
    actionSubmitting,
    lockActionUntilTurnChanges,
    targetScore,
    isTutorialActionAllowed,
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

      // Check if it's AI's turn (for local/AI modes) - silently block without popup
      if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
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

      // Tutorial validation: only allow buying level 1 cards at step 3
      if (tutorialStep === 3) {
        if (!isTutorialActionAllowed("buyCard", { card })) {
          showSystemNotice(lang === "fa" ? "در این قدم فقط کارت‌های سطح ۱ قابل خریداری هستند." : "At this step, only level 1 cards can be purchased.");
          return;
        }
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
      tutorialStep,
      isTutorialActionAllowed,
    ],
  );

  const handleBuyCard = useCallback(() => {
    if (actionSubmitting) return;
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    
    // Check if it's AI's turn (for local/AI modes) - silently block without popup
    if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
      return;
    }
    
    if (!selectedCard) return;
    if (
      challengeId === "daily-puzzle" &&
      gameMode !== "online" &&
      !isExpectedDailyPuzzleAction({ type: "purchaseCard", cardId: selectedCard.id })
    ) {
      showSystemNotice("Wrong move.");
      return;
    }

    // Tutorial validation
    if (!isTutorialActionAllowed("buyCard", { card: selectedCard })) {
      showSystemNotice(lang === "fa" ? "در این قدم این کارت قابل خریداری نیست. به دستورات آموزش توجه کنید." : "This card cannot be purchased at this tutorial step. Follow the tutorial instructions.");
      return;
    }

    // Prevent rapid clicks - debounce
    if (actionDebounceRef.current !== null) {
      return;
    }
    actionDebounceRef.current = window.setTimeout(() => {
      actionDebounceRef.current = null;
    }, 500);
    lockActionUntilTurnChanges();
    audioManager.playSound("buyCard");
    console.log(
      `💳 [CARD] Player ${state.currentPlayerIndex} purchasing card ${selectedCard.id} | خرید کارت`,
    );
    if (gameMode === "online") {
      const afterPurchase = performPurchaseCard(state, selectedCard.id);
      const cardStart = getCardCenter(selectedCard.id);
      const cardEnd = getCenterBySelector(`[data-player-bonus-slot="${state.currentPlayerIndex}-${selectedCard.gemBonus}"]`);
      if (cardStart && cardEnd) {
        spawnFlight({
          kind: "card",
          color: GEM_INFO[selectedCard.gemBonus].color,
          label: selectedCard.points ? String(selectedCard.points) : "+",
          start: cardStart,
          end: cardEnd,
          durationMs: 800,
        });
      }
      TOKEN_TYPES.forEach((tokenType, tokenIndex) => {
        const paid = state.players[state.currentPlayerIndex].tokens[tokenType] - afterPurchase.players[afterPurchase.currentPlayerIndex].tokens[tokenType];
        if (paid <= 0) return;
        for (let i = 0; i < paid; i += 1) {
          const start = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${tokenType}"]`);
          const end = getCenterBySelector(`[data-token-pool="${tokenType}"]`);
          if (!start || !end) continue;
          spawnFlight({
            kind: "token",
            color: GEM_INFO[tokenType].color,
            imageUrl: gemTokenImages[tokenType],
            start,
            end,
            durationMs: 400 + tokenIndex * 30,
          });
        }
      });
      const beforeNobleIds = new Set(state.players[state.currentPlayerIndex].nobles.map((n) => String(n.id)));
      const newNoble = afterPurchase.players[afterPurchase.currentPlayerIndex].nobles.find((n) => !beforeNobleIds.has(String(n.id)));
      if (newNoble) {
        const start = getCenterBySelector(`[data-noble-id="${String(newNoble.id)}"]`);
        const end = getCenterBySelector(`[data-player-nobles-slot="${state.currentPlayerIndex}"]`);
        if (start && end) {
          spawnFlight({
            kind: "noble",
            color: "#f5d47a",
            imageUrl: nobleImages[(Math.max(1, Number(newNoble.id)) - 1) % nobleImages.length],
            start,
            end,
            durationMs: 900,
          });
        }
      }
      setSelectedCard(null);
      setPhase("idle");
      if (afterPurchase === state) return;
      const nextState = advanceTurn(afterPurchase, targetScore);
      syncOnlineState(nextState);
      return;
    }

    const purchasedState = performPurchaseCard(state, selectedCard.id);
    const cardStart = getCardCenter(selectedCard.id);
    const cardEnd = getCenterBySelector(`[data-player-bonus-slot="${state.currentPlayerIndex}-${selectedCard.gemBonus}"]`);
    if (cardStart && cardEnd) {
      spawnFlight({
        kind: "card",
        color: GEM_INFO[selectedCard.gemBonus].color,
        label: selectedCard.points ? String(selectedCard.points) : "+",
        start: cardStart,
        end: cardEnd,
        durationMs: 800,
      });
    }
    TOKEN_TYPES.forEach((tokenType, tokenIndex) => {
      const paid = state.players[state.currentPlayerIndex].tokens[tokenType] - purchasedState.players[purchasedState.currentPlayerIndex].tokens[tokenType];
      if (paid <= 0) return;
      for (let i = 0; i < paid; i += 1) {
        const start = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${tokenType}"]`);
        const end = getCenterBySelector(`[data-token-pool="${tokenType}"]`);
        if (!start || !end) continue;
        spawnFlight({
          kind: "token",
          color: GEM_INFO[tokenType].color,
          imageUrl: gemTokenImages[tokenType],
          start,
          end,
          durationMs: 400 + tokenIndex * 30,
        });
      }
    });
    const beforeNobleIds = new Set(state.players[state.currentPlayerIndex].nobles.map((n) => String(n.id)));
    const newNoble = purchasedState.players[purchasedState.currentPlayerIndex].nobles.find((n) => !beforeNobleIds.has(String(n.id)));
    if (newNoble) {
      const start = getCenterBySelector(`[data-noble-id="${String(newNoble.id)}"]`);
      const end = getCenterBySelector(`[data-player-nobles-slot="${state.currentPlayerIndex}"]`);
      if (start && end) {
        spawnFlight({
          kind: "noble",
          color: "#f5d47a",
          imageUrl: nobleImages[(Math.max(1, Number(newNoble.id)) - 1) % nobleImages.length],
          start,
          end,
          durationMs: 900,
        });
      }
    }
    purchaseCard(selectedCard.id);
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
    state.currentPlayerIndex,
    state,
    syncOnlineState,
    getCenterBySelector,
    getCardCenter,
    spawnFlight,
    actionSubmitting,
    lockActionUntilTurnChanges,
    targetScore,
    isTutorialActionAllowed,
    lang,
  ]);

  const handleReserveCard = useCallback(() => {
    if (actionSubmitting) return;
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    
    // Check if it's AI's turn (for local/AI modes) - silently block without popup
    if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
      return;
    }
    
    if (challengeId === "daily-puzzle" && gameMode !== "online") {
      showSystemNotice("Wrong move.");
      return;
    }
    if (!selectedCard) return;

    // Tutorial validation - only allow reserve at step 5
    if ((interactiveTutorialEnabled || manualTutorialOpen) && tutorialStep === 5) {
      if (!isTutorialActionAllowed("reserveCard")) {
        showSystemNotice(lang === "fa" ? "در این قدم فقط رزرو کردن مجاز است." : "Only reserving is allowed at this tutorial step.");
        return;
      }
    } else if ((interactiveTutorialEnabled || manualTutorialOpen) && (tutorialStep < 5 || tutorialStep === 6)) {
      showSystemNotice(lang === "fa" ? "در این قدم رزرو کردن مجاز نیست." : "Reserving is not allowed at this tutorial step.");
      return;
    }

    // Prevent rapid clicks - debounce
    if (actionDebounceRef.current !== null) {
      return;
    }
    actionDebounceRef.current = window.setTimeout(() => {
      actionDebounceRef.current = null;
    }, 500);
    lockActionUntilTurnChanges();
    audioManager.playSound("reserveCard");
    console.log(
      `🔖 [CARD] Player ${state.currentPlayerIndex} reserving card ${selectedCard.id} | رزرو کارت`,
    );
    if (gameMode === "online") {
      const afterReserve = performReserveCard(state, selectedCard.id);
      const cardStart = getCardCenter(selectedCard.id);
      const cardEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
      if (cardStart && cardEnd) {
        spawnFlight({
          kind: "card",
          color: "#cbd5e1",
          label: "R",
          start: cardStart,
          end: cardEnd,
          durationMs: 520,
        });
      }
      if (state.tokenPool.gold > 0) {
        const goldStart = getCenterBySelector('[data-token-pool="gold"]');
        const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
        if (goldStart && goldEnd) {
          spawnFlight({
            kind: "token",
            color: GEM_INFO.gold.color,
            imageUrl: gemTokenImages.gold,
            start: goldStart,
            end: goldEnd,
            durationMs: 460,
          });
        }
      }
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
        nextState = advanceTurn(afterReserve, targetScore);
        setPhase("idle");
      }
      syncOnlineState(nextState);
      return;
    }

    const currentTotal = getTotalTokens(currentPlayer);
    const getsGold = state.tokenPool.gold > 0;
    const cardStart = getCardCenter(selectedCard.id);
    const cardEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
    if (cardStart && cardEnd) {
      spawnFlight({
        kind: "card",
        color: "#cbd5e1",
        label: "R",
        start: cardStart,
        end: cardEnd,
        durationMs: 520,
      });
    }
    if (getsGold) {
      const goldStart = getCenterBySelector('[data-token-pool="gold"]');
      const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
      if (goldStart && goldEnd) {
        spawnFlight({
          kind: "token",
          color: GEM_INFO.gold.color,
          imageUrl: gemTokenImages.gold,
          start: goldStart,
          end: goldEnd,
          durationMs: 460,
        });
      }
    }
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
    getCenterBySelector,
    getCardCenter,
    spawnFlight,
    actionSubmitting,
    lockActionUntilTurnChanges,
    targetScore,
  ]);

  const handleReserveDeck = useCallback(
    (level: 1 | 2 | 3) => {
      if (actionSubmitting) return;
      if (gameMode === "online" && !isCurrentPlayerMe()) return;
      
      // Check if it's AI's turn (for local/AI modes) - silently block without popup
      if (gameMode !== "online" && isAIPlayer(state.currentPlayerIndex)) {
        return;
      }
      
      if (challengeId === "daily-puzzle" && gameMode !== "online") {
        showSystemNotice("Wrong move.");
        return;
      }

      // Tutorial validation - only allow reserve at step 5
      if ((interactiveTutorialEnabled || manualTutorialOpen) && tutorialStep === 5) {
        if (!isTutorialActionAllowed("reserveCard")) {
          showSystemNotice(lang === "fa" ? "در این قدم فقط رزرو کردن مجاز است." : "Only reserving is allowed at this tutorial step.");
          return;
        }
      } else if ((interactiveTutorialEnabled || manualTutorialOpen) && (tutorialStep < 5 || tutorialStep === 6)) {
        showSystemNotice(lang === "fa" ? "در این قدم رزرو کردن مجاز نیست." : "Reserving is not allowed at this tutorial step.");
        return;
      }

      if (phase !== "idle") return;
      if (
        currentPlayer.reservedCards.length >= 3 ||
        state.decks[level].length === 0
      )
        return;

      // Prevent rapid clicks - debounce
      if (actionDebounceRef.current !== null) {
        return;
      }
      actionDebounceRef.current = window.setTimeout(() => {
        actionDebounceRef.current = null;
      }, 500);
      lockActionUntilTurnChanges();
      const deckStart = getCenterBySelector(`[data-deck-level="${level}"]`);
      const reservedEnd = getCenterBySelector(`[data-player-reserved-slot="${state.currentPlayerIndex}"]`);
      const getsGold = state.tokenPool.gold > 0;

      if (gameMode === "online") {
        const afterReserve = performReserveCard(state, 0, level);
        if (afterReserve === state) {
          setPhase("idle");
          return;
        }
        if (deckStart && reservedEnd) {
          spawnFlight({
            kind: "card",
            color: "#1e293b",
            label: String(level),
            start: deckStart,
            end: reservedEnd,
            durationMs: 560,
          });
        }
        if (getsGold) {
          const goldStart = getCenterBySelector('[data-token-pool="gold"]');
          const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
          if (goldStart && goldEnd) {
            spawnFlight({
              kind: "token",
              color: GEM_INFO.gold.color,
              imageUrl: gemTokenImages.gold,
              start: goldStart,
              end: goldEnd,
              durationMs: 460,
            });
          }
        }
        const total = getTotalTokens(
          afterReserve.players[afterReserve.currentPlayerIndex],
        );
        let nextState = afterReserve;
        if (total > 10) {
          setPhase("mustReturnTokens");
        } else {
          nextState = advanceTurn(afterReserve, targetScore);
          setPhase("idle");
        }
        syncOnlineState(nextState);
        return;
      }

      const currentTotal = getTotalTokens(currentPlayer);
      if (deckStart && reservedEnd) {
        spawnFlight({
          kind: "card",
          color: "#1e293b",
          label: String(level),
          start: deckStart,
          end: reservedEnd,
          durationMs: 560,
        });
      }
      if (getsGold) {
        const goldStart = getCenterBySelector('[data-token-pool="gold"]');
        const goldEnd = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-gold"]`);
        if (goldStart && goldEnd) {
          spawnFlight({
            kind: "token",
            color: GEM_INFO.gold.color,
            imageUrl: gemTokenImages.gold,
            start: goldStart,
            end: goldEnd,
            durationMs: 460,
          });
        }
      }
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
      getCenterBySelector,
      spawnFlight,
      actionSubmitting,
      lockActionUntilTurnChanges,
      targetScore,
      isTutorialActionAllowed,
      interactiveTutorialEnabled,
      manualTutorialOpen,
      tutorialStep,
      lang,
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
          nextState = advanceTurn(afterReturn, targetScore);
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
      targetScore,
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
    gameTitle: challengeId === "turn-limit" ? `${Math.max(0, 25 - turnLimitTurnsUsed)} turns left` : selectedGame.name,
    state,
    currentPlayer,
    humanPlayerCount,
    turnSecondsLeft,
    getPlayerDisplayName,
    isCurrentPlayerMe,
    isAIPlayer,
    onShowQuickRules: () => {
      setShowQuickRules(true);
    },
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
    stateCurrentPlayerIndex: state.currentPlayerIndex,
    onCloseQuickRules: () => setShowQuickRules(false),
    onCancelCardAction: handleCancel,
    onBuyCard: handleBuyCard,
    onReserveCard: handleReserveCard,
    actionSubmitting,
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
        resetSplendorSession(initialLocalState);
        return;
      }

      if (challengeId === "turn-limit") {
        resetSplendorSession(initialLocalState);
        return;
      }

      resetSplendorSession(initialLocalState);
    },
    onMenu: () => {
      setGlobalMusicTrack("lobby");
      navigate(menuPath);
    },
    gameOverActions: props.gameOverActions,
    postGameNoticeDialog: props.postGameNoticeDialog || null,
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
    flightAnimations,
    interactiveTutorial: {
      enabled: interactiveTutorialEnabled || manualTutorialOpen,
      step: tutorialStep,
      totalSteps: interactiveTutorialSteps.length,
      title: interactiveTutorialSteps[tutorialStep]?.title || interactiveTutorialSteps[0].title,
      description: interactiveTutorialSteps[tutorialStep]?.description || interactiveTutorialSteps[0].description,
      focus: interactiveTutorialSteps[tutorialStep]?.focus || "goal",
      dir: tutorialData.dir,
      isFirstTime: isFirstTimePlayer,
      isLastStep: tutorialStep === interactiveTutorialSteps.length - 1,
    },
    onNextTutorialStep: () => {
      setTutorialStep((prev) => Math.min(interactiveTutorialSteps.length - 1, prev + 1));
    },
    onPrevTutorialStep: () => {
      setTutorialStep((prev) => Math.max(0, prev - 1));
    },
    onCloseTutorial: () => {
      setManualTutorialOpen(false);
      // Mark tutorial as completed when closed
      try {
        localStorage.setItem("splendor-tutorial-completed", "true");
      } catch (e) {
        console.error("Failed to save tutorial completion:", e);
      }
    },
    showRobotTurnPopup,
  };

  return { sceneProps };
}
