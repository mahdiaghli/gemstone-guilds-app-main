import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpenText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import backgroundImage from "@/assets/background-game-splendor.png";
import overlayBackground from "@/assets/background.png";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import { CardChip } from "./dead-mans-draw/CardChip";
import { DeckCounter } from "./dead-mans-draw/DeckCounter";
import { PendingChoices } from "./dead-mans-draw/PendingChoices";
import { PlayerStack } from "./dead-mans-draw/PlayerStack";
import { PowerChoiceScreen } from "./dead-mans-draw/PowerChoiceScreen";
import { PowerTargetScreen } from "./dead-mans-draw/PowerTargetScreen";
import { SUIT_DESCRIPTION_KEYS, SUIT_TRANSLATION_KEYS } from "./dead-mans-draw/shared";

type DeadMansDrawGameProps = {
  mode?: "local" | "ai" | "online";
  roomId?: string;
  playerId?: string;
  playerName?: string;
  playerIndex?: number;
  roomPlayers?: Record<string, any>;
  playerNamesList?: string[];
  socket?: any;
  serverGameState?: DeadMansDrawState | null;
  onGameStateChange?: (state: DeadMansDrawState) => void;
  onGameEnd?: () => void;
};

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
    if (!currentState.pendingEffect) {
      setChoicesCollapsed(false);
    }
  }, [currentState.pendingEffect]);

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
      <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${zirkhakiBackground})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_32%),linear-gradient(180deg,rgba(6,16,27,0.74),rgba(2,6,23,0.78)_66%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <div
            className="w-full rounded-[34px] border border-sky-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(15,23,42,0.7)]"
            style={{
              backgroundImage: `linear-gradient(rgba(2,6,23,0.88), rgba(2,6,23,0.92)), url(${overlayBackground})`,
            }}
          >
            <p className="font-cinzel text-xs uppercase tracking-[0.38em] text-sky-100/65">Chest + Key</p>
            <h1 className="mt-3 font-cinzel text-4xl text-white">{t("deadMansDrawBonusPreviewTitle", { player: getPlayerDisplayName(bonusPreview.playerIndex) })}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300/80">{t("deadMansDrawBonusPreviewBody")}</p>
            <div className="mt-8 flex flex-wrap gap-4">{bonusPreview.cards.map((card) => <CardChip key={card.id} card={card} />)}</div>
            <div className="mt-8"><Button variant="game" onClick={() => setBonusPreview(null)}>{t("deadMansDrawBonusPreviewConfirm")}</Button></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentState.gameOver) {
    return (
      <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${zirkhakiBackground})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(180deg,rgba(18,11,2,0.74),rgba(2,6,23,0.8)_68%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-[34px] border border-amber-300/30 bg-slate-950/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.72)]">
            <p className="font-cinzel text-xs uppercase tracking-[0.38em] text-amber-100/65">{t("deadMansDrawGameOver")}</p>
            <h1 className="mt-3 font-cinzel text-4xl text-amber-200">{t("deadMansDrawWinnerLine", { winners: winnerNames.join(", ") })}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-50/75">{t("deadMansDrawGameOverBody")}</p>
            {tiedForScore.length > currentState.winnerIndices.length && tiebreakWinner.length === currentState.winnerIndices.length ? (
              <div className="mt-5 rounded-3xl border border-sky-300/25 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50/85">
                {t("deadMansDrawTiebreakBody", { score: highestScore, winners: winnerNames.join(", "), cards: topCardCount })}
              </div>
            ) : null}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {scoreBoard.map((entry) => (
                <div key={entry.index} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="font-cinzel text-xl text-white">{getPlayerDisplayName(entry.index)}</p>
                  <p className="mt-2 text-sm text-white/65">{t("deadMansDrawScoreLine", { score: entry.score, cards: entry.cardCount })}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="game" onClick={resetLocalGame} disabled={gameMode === "online"}>{t("deadMansDrawPlayAgain")}</Button>
              <Button variant="outline" onClick={handleMenu}>{t("deadMansDrawBackToMenu")}</Button>
            </div>
          </motion.div>
        </div>
      </div>
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
    <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.10),_transparent_30%),linear-gradient(180deg,rgba(7,17,28,0.22),rgba(2,6,23,0.52)_60%)]" />

      <div className="relative z-10 mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/16 px-3 py-4 backdrop-blur-[1px] sm:max-w-lg sm:px-4">
        <div className="space-y-4 pb-8">
          <div className="flex items-center justify-end gap-2 rounded-[28px] border border-white/10 bg-slate-950/46 px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.30)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTutorialSummary(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-teal-300/35 bg-teal-300/10 text-teal-50 transition hover:bg-teal-300/20"
                aria-label={t("gameSummary")}
                title={t("gameSummary")}
              >
                <BookOpenText className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/35 bg-rose-300/10 text-rose-50 transition hover:bg-rose-300/20"
                aria-label={t("deadMansDrawBackToMenu")}
                title={t("deadMansDrawBackToMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-amber-300/20 bg-slate-950/48 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.38)]">
            <div className="grid grid-cols-3 gap-3">
              <DeckCounter label={t("deadMansDrawDrawDeck")} count={currentState.drawPile.length} onClick={canReveal ? handleReveal : undefined} disabled={!canReveal} />
              <div className="flex items-center justify-center">
                <Button variant="ghost" onClick={handleCollect} disabled={!canCollect} className="w-full min-h-[46px] rounded-2xl">{t("deadMansDrawCollect")}</Button>
              </div>
              <DeckCounter label={t("deadMansDrawBurnPile")} count={currentState.discardPile.length} />
            </div>
          </div>

          <div className="rounded-[30px] border border-teal-300/20 bg-slate-950/48 p-4 shadow-[0_18px_55px_rgba(2,6,23,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-teal-100/45">{t("deadMansDrawTreasureArea")}</p>
              {currentState.pendingEffect ? <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-amber-100">{t(`deadMansDrawEffectBadge${currentState.pendingEffect.kind}`)}</span> : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {visibleTreasureArea.length ? visibleTreasureArea.map((card) => (
                <div key={card.id} className="relative flex justify-center">
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: selectedTreasureHelpId === card.id ? 1 : 0,
                      y: selectedTreasureHelpId === card.id ? 0 : 6,
                      scale: selectedTreasureHelpId === card.id ? 1 : 0.96,
                    }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center"
                  >
                    <div className="rounded-[18px] border border-white/15 bg-slate-950/90 px-2.5 py-2 text-center shadow-[0_16px_40px_rgba(2,6,23,0.55)] backdrop-blur-sm">
                      <p className="font-cinzel text-[10px] uppercase tracking-[0.24em] text-amber-100/65">
                        {t(SUIT_TRANSLATION_KEYS[card.suit])}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-100/90">
                        {t(SUIT_DESCRIPTION_KEYS[card.suit])}
                      </p>
                    </div>
                  </motion.div>
                  <CardChip
                    card={card}
                    compact
                    highlighted={highlightedTreasureIds.has(card.id)}
                    onClick={() => setSelectedTreasureHelpId((current) => current === card.id ? null : card.id)}
                    className={selectedTreasureHelpId === card.id ? "border-amber-300/70 shadow-[0_0_0_2px_rgba(252,211,77,0.35),0_10px_30px_rgba(2,6,23,0.35)]" : undefined}
                  />
                </div>
              )) : (
                <div className="col-span-3 rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">{t("deadMansDrawRevealHint")}</div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {currentState.players.map((player, index) => (
              <PlayerStack
                key={player.id}
                player={player}
                isActive={index === activePlayerIndex}
                displayName={getPlayerDisplayName(index)}
                t={t}
                markedOpponentName={player.markedOpponentIndex !== null ? getPlayerDisplayName(player.markedOpponentIndex) : null}
              />
            ))}
          </div>
        </div>
      </div>

      {drawerOpen ? <div className={choicesCollapsed ? "h-20" : "h-80"} aria-hidden="true" /> : null}

      {showTutorialSummary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setShowTutorialSummary(false)}>
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-lg rounded-[32px] border border-teal-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]"
            style={{
              backgroundImage: `linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.93)), url(${zirkhakiBackground})`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTutorialSummary(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label={t("cancel")}
            >
              <X className="h-5 w-5" />
            </button>
            <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-teal-100/55">{t("gameSummary")}</p>
            <h2 className="mt-2 font-cinzel text-3xl text-white">{t("deadMansDrawTutorialTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300/80">{t("deadMansDrawTutorialIntro")}</p>
            <div className="mt-6 space-y-3">
              {[1, 3, 4, 6].map((step) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="font-cinzel text-sm text-amber-100">{t(`deadMansDrawTutorialStep${step}Title`)}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200/85">{t(`deadMansDrawTutorialStep${step}Body`)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}

      {showExitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-md rounded-[32px] border border-rose-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]"
            style={{
              backgroundImage: `linear-gradient(rgba(40,10,14,0.9), rgba(20,8,12,0.93)), url(${zirkhakiBackground})`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label={t("cancel")}
            >
              <X className="h-5 w-5" />
            </button>
            <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-rose-100/55">{t("leaveGameTitle")}</p>
            <h2 className="mt-2 font-cinzel text-3xl text-white">{t("leaveGameTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200/80">{t("leaveGameDescription")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)}>{t("stay")}</Button>
              <Button variant="game" onClick={handleMenu}>{t("leaveGameAction")}</Button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {currentState.pendingEffect ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4">
          <motion.div
            layout
            className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-cover bg-center p-4 shadow-[0_-12px_40px_rgba(2,6,23,0.55)] backdrop-blur sm:max-w-lg"
            style={{
              backgroundImage: `linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.94)), url(${zirkhakiBackground})`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              {!choicesCollapsed ? (
                <div>
                  {/* <p className="font-cinzel text-xs uppercase tracking-[0.32em] text-white/40">{t("deadMansDrawResolveEffect")}</p> */}
                  <h2 className="mt-1 font-cinzel text-xl text-white">{t("deadMansDrawActiveChoices")}</h2>
                </div>
              ) : <span />}
              <button
                type="button"
                onClick={() => setChoicesCollapsed((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80 transition hover:bg-white/10"
              >
                <motion.span animate={{ rotate: choicesCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>⌄</motion.span>
              </button>
            </div>

            <motion.div
              initial={false}
              animate={{ height: choicesCollapsed ? 0 : "auto", opacity: choicesCollapsed ? 0 : 1, marginTop: choicesCollapsed ? 0 : 16 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <PendingChoices
                  pendingEffect={currentState.pendingEffect}
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
                    const previewCard = currentState.pendingEffect?.kind === "map" ? currentState.pendingEffect.options.find((card) => card.id === cardId) ?? null : null;
                    runActionWithBustPreview(previewCard, () => resolveMapChoice(currentState, cardId));
                  }}
                  onMisfire={(suit) => runAction(() => resolveMisfireChoice(currentState, suit))}
                  disabled={interactionLocked || (gameMode === "online" && !isCurrentPlayerMe)}
                  t={t}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
