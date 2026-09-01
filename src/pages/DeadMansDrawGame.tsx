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
  DeadMansDrawSummaryModal,
} from "./dead-mans-draw/DeadMansDrawOverlays";
import { PowerChoiceScreen } from "./dead-mans-draw/PowerChoiceScreen";
import { PowerTargetScreen } from "./dead-mans-draw/PowerTargetScreen";
import {
  DeadMansDrawGameOverView,
  DeadMansDrawBonusPreviewView,
} from "./dead-mans-draw/DeadMansDrawStatusViews";
import type { DeadMansDrawFlightAnimation, DeadMansDrawGameProps } from "./dead-mans-draw/types";

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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryStep, setSummaryStep] = useState(0);
  const [selectedTreasureHelpId, setSelectedTreasureHelpId] = useState<string | null>(null);
  const [bustPreview, setBustPreview] = useState<{ cards: DeadMansDrawCard[]; highlightIds: string[] } | null>(null);
  const bustPreviewTimerRef = useRef<number | null>(null);
  const transitionTimerRefs = useRef<number[]>([]);
  const [cardFlights, setCardFlights] = useState<DeadMansDrawFlightAnimation[]>([]);
  const [transitionLocked, setTransitionLocked] = useState(false);
  const currentState = gameMode === "online" && props.serverGameState ? (props.serverGameState as DeadMansDrawState) : localState;

  useEffect(() => {
    return () => {
      if (bustPreviewTimerRef.current !== null) {
        window.clearTimeout(bustPreviewTimerRef.current);
      }
      transitionTimerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
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

  const setManagedTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      transitionTimerRefs.current = transitionTimerRefs.current.filter((id) => id !== timerId);
      callback();
    }, delayMs);
    transitionTimerRefs.current.push(timerId);
    return timerId;
  }, []);

  const getElementCenter = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const getTreasureSlotCenter = useCallback((slotIndex: number) => {
    const grid = document.querySelector('[data-dead-draw-treasure-grid="true"]') as HTMLElement | null;
    if (!grid) return null;

    const gridRect = grid.getBoundingClientRect();
    const firstCard = grid.querySelector("[data-dead-draw-treasure-card]") as HTMLElement | null;
    const computedStyle = window.getComputedStyle(grid);
    const gap = Number.parseFloat(computedStyle.columnGap || computedStyle.gap || "8") || 8;
    const columns = 4;
    const fallbackWidth = (gridRect.width - gap * (columns - 1)) / columns;
    const fallbackHeight = 112;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? fallbackWidth;
    const cardHeight = firstCard?.getBoundingClientRect().height ?? fallbackHeight;
    const column = slotIndex % columns;
    const row = Math.floor(slotIndex / columns);

    return {
      x: gridRect.left + column * (cardWidth + gap) + cardWidth / 2,
      y: gridRect.top + row * (cardHeight + gap) + cardHeight / 2,
    };
  }, []);

  const spawnCardFlight = useCallback((flight: Omit<DeadMansDrawFlightAnimation, "id">) => {
    const id = `${flight.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCardFlights((current) => [...current, { ...flight, id }]);
    setManagedTimeout(() => {
      setCardFlights((current) => current.filter((item) => item.id !== id));
    }, flight.durationMs + 40);
  }, [setManagedTimeout]);

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
  const overlayLocked = Boolean(bonusPreview) || previewLocked || transitionLocked;
  const interactionLocked = overlayLocked || !isCurrentPlayerMe;
  const scoreBoard = currentState.players.map((player, index) => ({ index, score: getDeadMansDrawScore(player), cardCount: getPlayerCardCount(player) }));
  const highestScore = Math.max(...scoreBoard.map((entry) => entry.score));
  const tiedForScore = scoreBoard.filter((entry) => entry.score === highestScore);
  const topCardCount = tiedForScore.length ? Math.max(...tiedForScore.map((entry) => entry.cardCount)) : 0;
  const tiebreakWinner = tiedForScore.length > 1 ? tiedForScore.filter((entry) => entry.cardCount === topCardCount) : [];

  const getCollectedOwnerMap = useCallback((state: DeadMansDrawState) => {
    const collectedMap = new Map<string, { playerIndex: number; card: DeadMansDrawCard }>();
    state.players.forEach((player, playerIndex) => {
      Object.values(player.collected).flat().forEach((card) => {
        collectedMap.set(card.id, { playerIndex, card });
      });
    });
    return collectedMap;
  }, []);

  const animateCardsLeavingTreasure = useCallback((
    beforeState: DeadMansDrawState,
    afterState: DeadMansDrawState,
    cards: DeadMansDrawCard[],
  ) => {
    const nextCollectedOwners = getCollectedOwnerMap(afterState);
    cards.forEach((card) => {
      const start = getElementCenter(`[data-dead-draw-treasure-card="${card.id}"]`);
      const collectedOwner = nextCollectedOwners.get(card.id);
      const end = collectedOwner
        ? getElementCenter(`[data-dead-draw-player-slot="${collectedOwner.playerIndex}-${card.suit}"]`)
        : getElementCenter('[data-dead-draw-deck="discard"]');
      if (!start || !end) return;
      spawnCardFlight({
        card,
        kind: collectedOwner ? "collect" : "burn",
        start,
        end,
        durationMs: collectedOwner ? 520 : 500,
      });
    });

    const previousCollectedOwners = getCollectedOwnerMap(beforeState);
    const treasureIds = new Set(cards.map((card) => card.id));
    nextCollectedOwners.forEach(({ playerIndex, card }, cardId) => {
      if (treasureIds.has(cardId)) return;
      const previousOwner = previousCollectedOwners.get(cardId);
      const start = previousOwner
        ? getElementCenter(`[data-dead-draw-player-slot="${previousOwner.playerIndex}-${card.suit}"]`)
        : getElementCenter('[data-dead-draw-deck="discard"]');
      const end = getElementCenter(`[data-dead-draw-player-slot="${playerIndex}-${card.suit}"]`);
      if (!start || !end) return;
      if (previousOwner?.playerIndex === playerIndex) return;
      spawnCardFlight({
        card,
        kind: "collect",
        start,
        end,
        durationMs: 560,
      });
    });
  }, [getCollectedOwnerMap, getElementCenter, spawnCardFlight]);

  const runZoneTransferAnimation = useCallback((
    cards: DeadMansDrawCard[],
    action: () => DeadMansDrawState,
    options: {
      originSelector: string;
      destinationSelector: string;
      kind: "collect" | "burn";
      durationMs?: number;
    },
  ) => {
    if (!cards.length) {
      applyState(action());
      return;
    }

    const nextState = action();
    const start = getElementCenter(options.originSelector);
    const end = getElementCenter(options.destinationSelector);

    if (!start || !end) {
      applyState(nextState);
      return;
    }

    setTransitionLocked(true);
    cards.forEach((card, index) => {
      spawnCardFlight({
        card,
        kind: options.kind,
        start,
        end,
        durationMs: (options.durationMs ?? 520) + index * 45,
      });
    });

    setManagedTimeout(() => {
      applyState(nextState);
      setTransitionLocked(false);
    }, (options.durationMs ?? 520) + Math.max(0, cards.length - 1) * 45 + 40);
  }, [applyState, getElementCenter, setManagedTimeout, spawnCardFlight]);

  const runAction = useCallback((action: () => DeadMansDrawState) => {
    const nextState = action();
    applyState(nextState);
  }, [applyState]);

  const runActionWithPreview = useCallback((
    previewCard: DeadMansDrawCard | null,
    action: () => DeadMansDrawState,
    options?: {
      originSelector?: string;
    },
  ) => {
    const nextState = action();
    const duplicateCards = previewCard
      ? currentState.treasureArea.filter((card) => card.suit === previewCard.suit)
      : [];
    const targetCenter = previewCard ? getTreasureSlotCenter(currentState.treasureArea.length) : null;
    const startCenter = options?.originSelector ? getElementCenter(options.originSelector) : null;

    if (previewCard && startCenter && targetCenter) {
      spawnCardFlight({
        card: previewCard,
        kind: "reveal",
        start: startCenter,
        end: targetCenter,
        durationMs: 380,
      });
    }

    if (!previewCard || duplicateCards.length === 0) {
      if (startCenter && targetCenter) {
        setTransitionLocked(true);
        setManagedTimeout(() => {
          applyState(nextState);
          setTransitionLocked(false);
        }, 390);
        return;
      }
      applyState(nextState);
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

    setTransitionLocked(true);
    bustPreviewTimerRef.current = window.setTimeout(() => {
      animateCardsLeavingTreasure(currentState, nextState, previewStateCards);
      setManagedTimeout(() => {
        setBustPreview(null);
        applyState(nextState);
        setTransitionLocked(false);
      }, 520);
      bustPreviewTimerRef.current = null;
    }, 800);
  }, [
    animateCardsLeavingTreasure,
    applyState,
    currentState,
    getElementCenter,
    getTreasureSlotCenter,
    setManagedTimeout,
    spawnCardFlight,
  ]);

  const runCollectWithAnimation = useCallback((action: () => DeadMansDrawState) => {
    const nextState = action();
    if (nextState === currentState || !currentState.treasureArea.length) {
      applyState(nextState);
      return;
    }

    setTransitionLocked(true);
    animateCardsLeavingTreasure(currentState, nextState, currentState.treasureArea);
    setManagedTimeout(() => {
      applyState(nextState);
      setTransitionLocked(false);
    }, 560);
  }, [animateCardsLeavingTreasure, applyState, currentState, setManagedTimeout]);

  const handleReveal = useCallback(() => {
    if (interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)) return;
    const previewCard = currentState.drawPile[currentState.drawPile.length - 1] ?? null;
    runActionWithPreview(previewCard, () => revealCard(currentState), {
      originSelector: '[data-dead-draw-deck="draw"]',
    });
  }, [currentState, gameMode, interactionLocked, isCurrentPlayerMe, runActionWithPreview]);

  const handleCollect = useCallback(() => {
    if (interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)) return;
    runCollectWithAnimation(() => collectTreasure(currentState));
  }, [currentState, gameMode, interactionLocked, isCurrentPlayerMe, runCollectWithAnimation]);

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

  useEffect(() => {
    const handleAppBackRequest = () => {
      if (currentState.gameOver) {
        handleMenu();
        return;
      }
      setShowExitConfirm(true);
    };

    window.addEventListener("gemstone-app-back-request", handleAppBackRequest);
    return () => {
      window.removeEventListener("gemstone-app-back-request", handleAppBackRequest);
    };
  }, [currentState.gameOver, handleMenu]);

  const resetLocalGame = useCallback(() => {
    setBonusPreview(null);
    setBustPreview(null);
    setCardFlights([]);
    setTransitionLocked(false);
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
      if (action.kind === "reveal") {
        const previewCard = currentState.drawPile[currentState.drawPile.length - 1] ?? null;
        return runActionWithPreview(previewCard, () => revealCard(currentState), {
          originSelector: '[data-dead-draw-deck="draw"]',
        });
      }
      if (action.kind === "collect") return runCollectWithAnimation(() => collectTreasure(currentState));
      if (action.kind === "astrolabe") {
        const previewCard = action.revealPeekedCard ? currentState.drawPile[currentState.drawPile.length - 1] ?? null : null;
        if (!action.revealPeekedCard) {
          return runCollectWithAnimation(() => resolveAstrolabeChoice(currentState, false));
        }
        return runActionWithPreview(previewCard, () => resolveAstrolabeChoice(currentState, true), {
          originSelector: '[data-dead-draw-deck="draw"]',
        });
      }
      if (action.kind === "pistol") {
        const isGunnie = currentState.players[currentState.currentPlayerIndex]?.ring === "gunnie";
        const removedCards = isGunnie
          ? [...(currentState.players[action.targetPlayerIndex]?.collected[action.suit] ?? [])]
          : (currentState.players[action.targetPlayerIndex]?.collected[action.suit].slice(-1) ?? []);
        return runZoneTransferAnimation(removedCards, () => resolvePistolChoice(currentState, action.targetPlayerIndex, action.suit), {
          originSelector: `[data-dead-draw-player-slot="${action.targetPlayerIndex}-${action.suit}"]`,
          destinationSelector: '[data-dead-draw-deck="discard"]',
          kind: "burn",
          durationMs: 500,
        });
      }
      if (action.kind === "dagger") {
        const previewCard = currentState.players[action.targetPlayerIndex]?.collected[action.suit].slice(-1)[0] ?? null;
        return runActionWithPreview(previewCard, () => resolveDaggerChoice(currentState, action.targetPlayerIndex, action.suit), {
          originSelector: `[data-dead-draw-player-slot="${action.targetPlayerIndex}-${action.suit}"]`,
        });
      }
      if (action.kind === "horseshoe") {
        const previewCard = currentState.players[currentState.currentPlayerIndex]?.collected[action.suit].slice(-1)[0] ?? null;
        return runActionWithPreview(previewCard, () => resolveHorseshoeChoice(currentState, action.suit), {
          originSelector: `[data-dead-draw-player-slot="${currentState.currentPlayerIndex}-${action.suit}"]`,
        });
      }
      if (action.kind === "map") {
        const previewCard = currentState.pendingEffect?.kind === "map"
          ? currentState.pendingEffect.options.find((card) => card.id === action.cardId) ?? null
          : null;
        return runActionWithPreview(previewCard, () => resolveMapChoice(currentState, action.cardId), {
          originSelector: '[data-dead-draw-deck="discard"]',
        });
      }
      if (action.kind === "misfire") {
        const removedCard = currentState.players[currentState.currentPlayerIndex]?.collected[action.suit].slice(-1) ?? [];
        return runZoneTransferAnimation(removedCard, () => resolveMisfireChoice(currentState, action.suit), {
          originSelector: `[data-dead-draw-player-slot="${currentState.currentPlayerIndex}-${action.suit}"]`,
          destinationSelector: '[data-dead-draw-deck="discard"]',
          kind: "burn",
          durationMs: 500,
        });
      }
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [activePlayerIsAI, applyState, currentState, gameMode, overlayLocked, runCollectWithAnimation, runActionWithPreview, runZoneTransferAnimation]);

  const winnerNames = currentState.winnerIndices.map((index) => getPlayerDisplayName(index));
  const ringSelectionPlayer = currentState.ringSelectionIndex !== null ? currentState.players[currentState.ringSelectionIndex] : null;
  const visibleTreasureArea = bustPreview?.cards ?? currentState.treasureArea;
  const highlightedTreasureIds = new Set(bustPreview?.highlightIds ?? []);
  const allHighlightedIds = highlightedTreasureIds;

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
        cardFlights={cardFlights}
        visibleTreasureArea={visibleTreasureArea}
        highlightedTreasureIds={allHighlightedIds}
        selectedTreasureHelpId={selectedTreasureHelpId}
        onToggleTreasureHelp={(cardId) =>
          setSelectedTreasureHelpId((current) => current === cardId ? null : cardId)
        }
        getPlayerDisplayName={getPlayerDisplayName}
        activePlayerIndex={activePlayerIndex}
        pendingEffect={currentState.pendingEffect}
        decisionDisabled={interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)}
        onAstrolabeReveal={() => {
          const previewCard = currentState.drawPile[currentState.drawPile.length - 1] ?? null;
          runActionWithPreview(previewCard, () => resolveAstrolabeChoice(currentState, true), {
            originSelector: '[data-dead-draw-deck="draw"]',
          });
        }}
        onAstrolabeCollect={() => runCollectWithAnimation(() => resolveAstrolabeChoice(currentState, false))}
        onMapChoice={(cardId) => {
          const previewCard = currentState.pendingEffect?.kind === "map"
            ? currentState.pendingEffect.options.find((card) => card.id === cardId) ?? null
            : null;
          runActionWithPreview(previewCard, () => resolveMapChoice(currentState, cardId), {
            originSelector: '[data-dead-draw-deck="discard"]',
          });
        }}
        onMisfireChoice={(suit) => {
          const removedCard = currentState.players[currentState.currentPlayerIndex]?.collected[suit].slice(-1) ?? [];
          runZoneTransferAnimation(removedCard, () => resolveMisfireChoice(currentState, suit), {
            originSelector: `[data-dead-draw-player-slot="${currentState.currentPlayerIndex}-${suit}"]`,
            destinationSelector: '[data-dead-draw-deck="discard"]',
            kind: "burn",
            durationMs: 500,
          });
        }}
        targetSelectionDisabled={interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)}
        onPistolTarget={(targetPlayerIndex, suit) => {
          const isGunnie = currentState.players[currentState.currentPlayerIndex]?.ring === "gunnie";
          const removedCards = isGunnie
            ? [...(currentState.players[targetPlayerIndex]?.collected[suit] ?? [])]
            : (currentState.players[targetPlayerIndex]?.collected[suit].slice(-1) ?? []);
          runZoneTransferAnimation(removedCards, () => resolvePistolChoice(currentState, targetPlayerIndex, suit), {
            originSelector: `[data-dead-draw-player-slot="${targetPlayerIndex}-${suit}"]`,
            destinationSelector: '[data-dead-draw-deck="discard"]',
            kind: "burn",
            durationMs: 500,
          });
        }}
        onDaggerTarget={(targetPlayerIndex, suit) => {
          const previewCard = currentState.players[targetPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithPreview(previewCard, () => resolveDaggerChoice(currentState, targetPlayerIndex, suit), {
            originSelector: `[data-dead-draw-player-slot="${targetPlayerIndex}-${suit}"]`,
          });
        }}
        onHorseshoeTarget={(suit) => {
          const previewCard = currentState.players[currentState.currentPlayerIndex]?.collected[suit].slice(-1)[0] ?? null;
          runActionWithPreview(previewCard, () => resolveHorseshoeChoice(currentState, suit), {
            originSelector: `[data-dead-draw-player-slot="${currentState.currentPlayerIndex}-${suit}"]`,
          });
        }}
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenExit={() => setShowExitConfirm(true)}
      />
      <DeadMansDrawSummaryModal
        open={summaryOpen}
        dir={dir}
        t={t}
        tutorialSteps={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
        tutorialStep={summaryStep}
        onNext={() => setSummaryStep((current) => Math.min(10, current + 1))}
        onPrev={() => setSummaryStep((current) => Math.max(0, current - 1))}
        onClose={() => setSummaryOpen(false)}
      />
      <DeadMansDrawExitModal
        open={showExitConfirm}
        dir={dir}
        t={t}
        onClose={() => setShowExitConfirm(false)}
        onLeave={handleMenu}
      />
    </>
  );
}
