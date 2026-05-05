import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setGlobalMusicTrack } from "@/hooks/useBackgroundMusic";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import {
  cloneDeadMansDrawState,
  collectTreasure,
  getDeadMansDrawActionState,
  getDeadMansDrawScore,
  getPlayerCardCount,
  initializeDeadMansDrawGame,
  revealCard,
  resolveAstrolabeChoice,
  resolveDaggerChoice,
  resolveHorseshoeChoice,
  resolveMapChoice,
  resolveMisfireChoice,
  resolvePistolChoice,
  selectDeadMansDrawPowerTarget,
  selectDeadMansDrawRing,
  type DeadMansDrawCard,
  type DeadMansDrawRing,
  type DeadMansDrawState,
} from "@/lib/deadMansDraw";
import { chooseDeadMansDrawAIAction } from "@/lib/deadMansDrawAI";
import { getGameMenuPath } from "@/lib/gameCatalog";
import { recordFinishedGame } from "@/lib/playerAnalytics";

import { DeadMansDrawBoardView } from "./dead-mans-draw/DeadMansDrawBoardView";
import {
  DeadMansDrawExitModal,
  DeadMansDrawPendingDrawer,
  DeadMansDrawSummaryModal,
} from "./dead-mans-draw/DeadMansDrawOverlays";
import { PowerChoiceScreen } from "./dead-mans-draw/PowerChoiceScreen";
import { PowerTargetScreen } from "./dead-mans-draw/PowerTargetScreen";
import { DEAD_MANS_DRAW_TUTORIAL_STEPS } from "./dead-mans-draw/shared";
import {
  DeadMansDrawGameOverView,
  DeadMansDrawBonusPreviewView,
} from "./dead-mans-draw/DeadMansDrawStatusViews";
import type { DeadMansDrawGameProps } from "./dead-mans-draw/types";

export default function DeadMansDrawGame(props: DeadMansDrawGameProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dir, t } = useLanguage();
  const { user } = useAuth();
  const menuPath = getGameMenuPath(searchParams.get("game"));

  const playerCount = Math.min(4, Math.max(2, parseInt(searchParams.get("players") || "2", 10)));
  const gameMode = (props.mode || searchParams.get("mode") || "local") as "local" | "ai" | "online";
  const humanPlayerCount = Math.min(playerCount, Math.max(1, parseInt(searchParams.get("humans") || (gameMode === "ai" ? "1" : String(playerCount)), 10)));

  const initialState = useMemo(() => initializeDeadMansDrawGame(playerCount, true), [playerCount]);
  const [localState, setLocalState] = useState<DeadMansDrawState>(initialState);
  const [choicesCollapsed, setChoicesCollapsed] = useState(false);
  const [showTutorialSummary, setShowTutorialSummary] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedTreasureHelpId, setSelectedTreasureHelpId] = useState<string | null>(null);
  const [bustPreview, setBustPreview] = useState<{ cards: DeadMansDrawCard[]; highlightIds: string[] } | null>(null);
  const bustPreviewTimerRef = useRef<number | null>(null);

  const currentState = gameMode === "online" && props.serverGameState ? (props.serverGameState as DeadMansDrawState) : localState;

  useEffect(() => {
    return () => {
      if (bustPreviewTimerRef.current !== null) {
        window.clearTimeout(bustPreviewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameMode !== "online") {
      setLocalState(initialState);
    }
  }, [gameMode, initialState]);

  useEffect(() => {
    if (gameMode === "online" && props.serverGameState) {
      setLocalState(props.serverGameState as DeadMansDrawState);
    }
  }, [gameMode, props.serverGameState]);

  const applyState = useCallback((nextState: DeadMansDrawState) => {
    if (gameMode === "online") {
      props.onGameStateChange?.(cloneDeadMansDrawState(nextState));
    }
    setLocalState(cloneDeadMansDrawState(nextState));
  }, [gameMode, props]);

  const getPlayerDisplayName = useCallback((index: number) => {
    if (gameMode === "online") {
      return props.playerNamesList?.[index] || t("deadMansDrawPlayerName", { number: index + 1 });
    }
    if (gameMode === "ai" && index !== 0) {
      return t("deadMansDrawRivalAI", { number: index });
    }
    if (index === 0 && user?.username) {
      return user.username;
    }
    return t("deadMansDrawPlayerName", { number: index + 1 });
  }, [gameMode, props.playerNamesList, t, user?.username]);

  const [bonusPreview, setBonusPreview] = useState<{ playerIndex: number; cards: DeadMansDrawCard[] } | null>(null);
  const previousStateRef = useRef<DeadMansDrawState | null>(null);
  const recordedAnalyticsRef = useRef<string | null>(null);

  const localPlayerIndex = gameMode === "online" ? (props.playerIndex ?? 0) : (currentState.ringSelectionIndex ?? currentState.currentPlayerIndex);
  const activePlayerIndex = currentState.ringSelectionIndex ?? currentState.powerTargetSelection?.playerIndex ?? currentState.currentPlayerIndex;
  const isAIPlayer = useCallback((index: number) => {
    if (gameMode === "ai") return index !== 0;
    if (gameMode === "local") return index >= humanPlayerCount;
    return false;
  }, [gameMode, humanPlayerCount]);
  const activePlayerIsAI = isAIPlayer(activePlayerIndex);
  const isCurrentPlayerMe = gameMode === "online" ? activePlayerIndex === localPlayerIndex : !activePlayerIsAI;
  const tutorialSteps = DEAD_MANS_DRAW_TUTORIAL_STEPS;

  useEffect(() => {
    if (!currentState.pendingEffect) {
      setChoicesCollapsed(false);
    }
  }, [currentState.pendingEffect]);

  useEffect(() => {
    setGlobalMusicTrack("game");
    return () => {
      setGlobalMusicTrack("lobby");
    };
  }, []);

  useEffect(() => {
    const previousState = previousStateRef.current;
    if (previousState) {
      const currentPlayer = previousState.players[previousState.currentPlayerIndex];
      const nowPlayer = currentState.players[previousState.currentPlayerIndex];
      const newlyCollectedBonus = currentPlayer
        && nowPlayer
        && getPlayerCardCount(nowPlayer) > getPlayerCardCount(currentPlayer)
        && previousState.treasureArea.some((card) => card.suit === "chest")
        && previousState.treasureArea.some((card) => card.suit === "key");

      if (newlyCollectedBonus) {
        const previousIds = new Set(Object.values(currentPlayer.collected).flat().map((card) => card.id));
        const gainedCards = Object.values(nowPlayer.collected).flat().filter((card) => !previousIds.has(card.id));
        const bonusCards = gainedCards.filter((card) => !previousState.treasureArea.some((treasure) => treasure.id === card.id));
        if (bonusCards.length) {
          setBonusPreview({ playerIndex: previousState.currentPlayerIndex, cards: bonusCards });
        }
      }
    }
    previousStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    if (!currentState.gameOver) {
      recordedAnalyticsRef.current = null;
      return;
    }

    const won = currentState.winnerIndices.includes(localPlayerIndex);
    const analyticsKey = `dead-mans-draw-${gameMode}-${localPlayerIndex}-${currentState.winnerIndices.join(",")}`;
    if (recordedAnalyticsRef.current === analyticsKey) return;
    recordedAnalyticsRef.current = analyticsKey;
    recordFinishedGame(user?.id, "dead-mans-draw", gameMode, won);
  }, [currentState.gameOver, currentState.winnerIndices, gameMode, localPlayerIndex, user?.id]);

  const actionState = getDeadMansDrawActionState(currentState);
  const previewLocked = Boolean(bustPreview);
  const overlayLocked = Boolean(bonusPreview) || previewLocked;
  const interactionLocked = overlayLocked || !isCurrentPlayerMe;
  const scoreBoard = currentState.players.map((player, index) => ({ index, score: getDeadMansDrawScore(player), cardCount: getPlayerCardCount(player) }));
  const highestScore = Math.max(...scoreBoard.map((entry) => entry.score));
  const tiedForScore = scoreBoard.filter((entry) => entry.score === highestScore);
  const topCardCount = tiedForScore.length ? Math.max(...tiedForScore.map((entry) => entry.cardCount)) : 0;
  const tiebreakWinner = tiedForScore.length > 1 ? tiedForScore.filter((entry) => entry.cardCount === topCardCount) : [];

  const runAction = useCallback((action: () => DeadMansDrawState) => {
    const nextState = action();
    applyState(nextState);
  }, [applyState]);

  const runActionWithBustPreview = useCallback((previewCard: DeadMansDrawCard | null, action: () => DeadMansDrawState) => {
    const duplicateCards = previewCard
      ? currentState.treasureArea.filter((card) => card.suit === previewCard.suit)
      : [];

    if (!previewCard || duplicateCards.length === 0) {
      runAction(action);
      return;
    }

    const previewStateCards = [...currentState.treasureArea, previewCard];
    setBustPreview({
      cards: previewStateCards,
      highlightIds: [...duplicateCards.map((card) => card.id), previewCard.id],
    });

    if (bustPreviewTimerRef.current !== null) {
      window.clearTimeout(bustPreviewTimerRef.current);
    }

    bustPreviewTimerRef.current = window.setTimeout(() => {
      setBustPreview(null);
      runAction(action);
      bustPreviewTimerRef.current = null;
    }, 800);
  }, [currentState.treasureArea, runAction]);

  const handleReveal = useCallback(() => {
    if (interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)) return;
    const previewCard = currentState.drawPile[currentState.drawPile.length - 1] ?? null;
    runActionWithBustPreview(previewCard, () => revealCard(currentState));
  }, [currentState, gameMode, interactionLocked, isCurrentPlayerMe, runActionWithBustPreview]);

  const handleCollect = useCallback(() => {
    if (interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)) return;
    runAction(() => collectTreasure(currentState));
  }, [currentState, gameMode, interactionLocked, isCurrentPlayerMe, runAction]);

  const handlePowerSelect = useCallback((ring: DeadMansDrawRing) => {
    if (interactionLocked) return;
    runAction(() => selectDeadMansDrawRing(currentState, ring));
  }, [currentState, interactionLocked, runAction]);

  const handlePowerTarget = useCallback((targetPlayerIndex: number) => {
    if (interactionLocked) return;
    runAction(() => selectDeadMansDrawPowerTarget(currentState, targetPlayerIndex));
  }, [currentState, interactionLocked, runAction]);

  const handleMenu = useCallback(() => {
    setGlobalMusicTrack("lobby");
    if (gameMode === "online") props.onGameEnd?.();
    navigate(menuPath);
  }, [gameMode, menuPath, navigate, props]);

  const resetLocalGame = useCallback(() => {
    setBonusPreview(null);
    setBustPreview(null);
    setSelectedTreasureHelpId(null);
    previousStateRef.current = null;
    applyState(initializeDeadMansDrawGame(playerCount, true));
  }, [applyState, playerCount]);

  useEffect(() => {
    if (currentState.gameOver || gameMode === "online" || overlayLocked) return;
    if (!activePlayerIsAI) return;

    const timer = window.setTimeout(() => {
      if (currentState.powerTargetSelection) {
        const action = chooseDeadMansDrawAIAction(currentState);
        if (action.kind === "power-target") {
          applyState(selectDeadMansDrawPowerTarget(currentState, action.targetPlayerIndex));
        }
        return;
      }
      if (currentState.ringSelectionIndex !== null) {
        const ringOptions = currentState.players[currentState.ringSelectionIndex]?.ringOptions ?? [];
        if (ringOptions[0]) {
          applyState(selectDeadMansDrawRing(currentState, ringOptions[0]));
        }
        return;
      }
      const action = chooseDeadMansDrawAIAction(currentState);
      if (action.kind === "reveal") return applyState(revealCard(currentState));
      if (action.kind === "collect") return applyState(collectTreasure(currentState));
      if (action.kind === "astrolabe") return applyState(resolveAstrolabeChoice(currentState, action.revealPeekedCard));
      if (action.kind === "pistol") return applyState(resolvePistolChoice(currentState, action.targetPlayerIndex, action.suit));
      if (action.kind === "dagger") return applyState(resolveDaggerChoice(currentState, action.targetPlayerIndex, action.suit));
      if (action.kind === "horseshoe") return applyState(resolveHorseshoeChoice(currentState, action.suit));
      if (action.kind === "map") return applyState(resolveMapChoice(currentState, action.cardId));
      if (action.kind === "misfire") return applyState(resolveMisfireChoice(currentState, action.suit));
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [activePlayerIsAI, applyState, currentState, gameMode, overlayLocked]);

  const winnerNames = currentState.winnerIndices.map((index) => getPlayerDisplayName(index));
  const ringSelectionPlayer = currentState.ringSelectionIndex !== null ? currentState.players[currentState.ringSelectionIndex] : null;
  const visibleTreasureArea = bustPreview?.cards ?? currentState.treasureArea;
  const highlightedTreasureIds = new Set(bustPreview?.highlightIds ?? []);
  useEffect(() => {
    if (selectedTreasureHelpId && !visibleTreasureArea.some((card) => card.id === selectedTreasureHelpId)) {
      setSelectedTreasureHelpId(null);
    }
  }, [selectedTreasureHelpId, visibleTreasureArea]);

  if (bonusPreview) {
    return (
      <DeadMansDrawBonusPreviewView
        dir={dir}
        t={t}
        preview={bonusPreview}
        getPlayerDisplayName={getPlayerDisplayName}
        onConfirm={() => setBonusPreview(null)}
      />
    );
  }

  if (currentState.gameOver) {
    return (
      <DeadMansDrawGameOverView
        dir={dir}
        t={t}
        winnerNames={winnerNames}
        highestScore={highestScore}
        tiedForScoreCount={tiedForScore.length}
        winnerCount={currentState.winnerIndices.length}
        tiebreakWinnerCount={tiebreakWinner.length}
        topCardCount={topCardCount}
        scoreBoard={scoreBoard}
        getPlayerDisplayName={getPlayerDisplayName}
        onPlayAgain={resetLocalGame}
        onMenu={handleMenu}
        playAgainDisabled={gameMode === "online"}
      />
    );
  }

  if (currentState.powerTargetSelection) {
    return (
      <div dir={dir} className="min-h-screen overflow-hidden text-white">
        <PowerTargetScreen selection={currentState.powerTargetSelection} players={currentState.players} getPlayerDisplayName={getPlayerDisplayName} onSelect={handlePowerTarget} locked={interactionLocked} t={t} />
      </div>
    );
  }

  if (ringSelectionPlayer) {
    return (
      <div dir={dir} className="min-h-screen overflow-hidden text-white">
        <PowerChoiceScreen playerName={getPlayerDisplayName(currentState.ringSelectionIndex ?? 0)} playerIndex={currentState.ringSelectionIndex ?? 0} options={ringSelectionPlayer.ringOptions} onSelect={handlePowerSelect} locked={interactionLocked} t={t} />
      </div>
    );
  }

  const drawerOpen = Boolean(currentState.pendingEffect);
  const canReveal = actionState.canReveal && !interactionLocked && !(gameMode === "online" && !isCurrentPlayerMe);
  const canCollect = actionState.canCollect && !interactionLocked && !(gameMode === "online" && !isCurrentPlayerMe);

  return (
    <>
      <DeadMansDrawBoardView
        dir={dir}
        t={t}
        currentState={currentState}
        canReveal={canReveal}
        canCollect={canCollect}
        onReveal={handleReveal}
        onCollect={handleCollect}
        visibleTreasureArea={visibleTreasureArea}
        highlightedTreasureIds={highlightedTreasureIds}
        selectedTreasureHelpId={selectedTreasureHelpId}
        onToggleTreasureHelp={(cardId) =>
          setSelectedTreasureHelpId((current) => current === cardId ? null : cardId)
        }
        getPlayerDisplayName={getPlayerDisplayName}
        activePlayerIndex={activePlayerIndex}
        pendingEffect={currentState.pendingEffect}
        targetSelectionDisabled={interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)}
        onPistolTarget={(targetPlayerIndex, suit) => runAction(() => resolvePistolChoice(currentState, targetPlayerIndex, suit))}
        onDaggerTarget={(targetPlayerIndex, suit) => {
          const previewCard = currentState.players[targetPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithBustPreview(previewCard, () => resolveDaggerChoice(currentState, targetPlayerIndex, suit));
        }}
        onHorseshoeTarget={(suit) => {
          const previewCard = currentState.players[currentState.currentPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithBustPreview(previewCard, () => resolveHorseshoeChoice(currentState, suit));
        }}
        onOpenSummary={() => setShowTutorialSummary(true)}
        onOpenExit={() => setShowExitConfirm(true)}
      />
      {drawerOpen && !["pistol", "dagger", "horseshoe"].includes(currentState.pendingEffect?.kind ?? "") ? <div className={choicesCollapsed ? "h-20" : "h-80"} aria-hidden="true" /> : null}
      <DeadMansDrawSummaryModal
        open={showTutorialSummary}
        t={t}
        tutorialSteps={tutorialSteps}
        tutorialStep={tutorialStep}
        onNext={() => setTutorialStep((step) => Math.min(tutorialSteps.length - 1, step + 1))}
        onPrev={() => setTutorialStep((step) => Math.max(0, step - 1))}
        onClose={() => setShowTutorialSummary(false)}
      />
      <DeadMansDrawExitModal
        open={showExitConfirm}
        t={t}
        onClose={() => setShowExitConfirm(false)}
        onLeave={handleMenu}
      />
      <DeadMansDrawPendingDrawer
        pendingEffect={currentState.pendingEffect}
        t={t}
        collapsed={choicesCollapsed}
        onToggleCollapsed={() => setChoicesCollapsed((value) => !value)}
        disabled={interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)}
        onAstrolabe={(revealPeekedCard) => {
          const previewCard = revealPeekedCard ? currentState.drawPile[currentState.drawPile.length - 1] ?? null : null;
          runActionWithBustPreview(previewCard, () => resolveAstrolabeChoice(currentState, revealPeekedCard));
        }}
        onPistol={(targetPlayerIndex, suit) => runAction(() => resolvePistolChoice(currentState, targetPlayerIndex, suit))}
        onDagger={(targetPlayerIndex, suit) => {
          const previewCard = currentState.players[targetPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithBustPreview(previewCard, () => resolveDaggerChoice(currentState, targetPlayerIndex, suit));
        }}
        onHorseshoe={(suit) => {
          const previewCard = currentState.players[currentState.currentPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithBustPreview(previewCard, () => resolveHorseshoeChoice(currentState, suit));
        }}
        onMap={(cardId) => {
          const previewCard = currentState.pendingEffect?.kind === "map"
            ? currentState.pendingEffect.options.find((card) => card.id === cardId) ?? null
            : null;
          runActionWithBustPreview(previewCard, () => resolveMapChoice(currentState, cardId));
        }}
        onMisfire={(suit) => runAction(() => resolveMisfireChoice(currentState, suit))}
        top={currentState.pendingEffect?.kind === "astrolabe" || currentState.pendingEffect?.kind === "map"}
      />
    </>
  );
}
