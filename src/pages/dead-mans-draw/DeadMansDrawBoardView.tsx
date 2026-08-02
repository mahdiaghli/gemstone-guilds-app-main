import { motion } from "framer-motion";
import { BookOpenText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CardChip } from "./CardChip";
import { DeckCounter } from "./DeckCounter";
import { PlayerStack } from "./PlayerStack";
import { translateActionLabel } from "./helpers";
import { SUIT_DESCRIPTION_KEYS, SUIT_IMAGES, SUIT_TRANSLATION_KEYS } from "./shared";
import type { DeadMansDrawBoardViewProps } from "./types";
import backgroundImage from "@/assets/background-game-splendor.png";

export function DeadMansDrawBoardView({
  dir,
  t,
  currentState,
  canReveal,
  canCollect,
  glowingDeck = false,
  glowingCollect = false,
  onReveal,
  onCollect,
  cardFlights,
  visibleTreasureArea,
  highlightedTreasureIds,
  selectedTreasureHelpId,
  onToggleTreasureHelp,
  getPlayerDisplayName,
  activePlayerIndex,
  pendingEffect,
  decisionDisabled,
  onAstrolabeReveal,
  onAstrolabeCollect,
  onMapChoice,
  onMisfireChoice,
  onPistolTarget,
  onDaggerTarget,
  onHorseshoeTarget,
  targetSelectionDisabled,
  onOpenSummary,
  onOpenExit,
  showExitButton = true,
  showTutorialCloseButton = true,
  tutorialStep,
  tutorialSteps,
  onNextTutorial,
  onPrevTutorial,
  onCloseTutorial,
}: DeadMansDrawBoardViewProps) {
  const tutorialOpen = typeof tutorialStep === "number" && tutorialStep >= 0;
  const currentTutorialStep = tutorialOpen ? tutorialSteps?.[tutorialStep] : null;
  const isLastTutorialStep =
    tutorialOpen && typeof tutorialStep === "number"
      ? tutorialStep >= (tutorialSteps?.length ?? 1) - 1
      : false;

  const getFocusElement = () => {
    if (!currentTutorialStep) return null;
    switch (currentTutorialStep.focus) {
      case "intro":
        return null;
      case "deck-section":
        return "deck-section";
      case "player-panel":
        return "player-panel";
      case "treasure-area":
        return "treasure-area";
      case "cards":
        return null;
      case "powers":
        return null;
      default:
        return null;
    }
  };

  const focusElement = getFocusElement();
  const activeEffectCard = pendingEffect
    ? visibleTreasureArea.find(
        (card) => card.id === pendingEffect.sourceCardId,
      ) ??
      visibleTreasureArea[visibleTreasureArea.length - 1] ??
      null
    : null;
  const decisionOverlayOpen = Boolean(pendingEffect);

  const guideCopy = (() => {
    if (!pendingEffect) return null;
    switch (pendingEffect.kind) {
      case "dagger":
        return {
          title: dir === "rtl" ? "قدرت شمشیر" : "Sword Power",
          body:
            dir === "rtl"
              ? "یک کارت درخشان از پنل حریف را لمس کن تا وارد ناحیه گنج شود."
              : "Tap a glowing opponent card to steal it into the treasure area.",
        };
      case "pistol":
        return {
          title: dir === "rtl" ? "قدرت توپ" : "Cannon Power",
          body:
            dir === "rtl"
              ? "یک کارت درخشان را انتخاب کن تا مستقیم به پشته سوخته برود."
              : "Choose a glowing card to blast straight into the burn pile.",
        };
      case "astrolabe":
        return {
          title: dir === "rtl" ? "قدرت اوراکل" : "Oracle Power",
          body:
            dir === "rtl"
              ? "کارت‌های بعدی را ببین و همین پایین تصمیم بگیر که ادامه بدهی یا همین حالا گنج را جمع کنی."
              : "Peek at the upcoming cards, then decide below whether to reveal the next one or collect now.",
        };
      case "map":
        return {
          title: dir === "rtl" ? "قدرت نقشه" : "Map Power",
          body:
            dir === "rtl"
              ? "یکی از کارت‌های سوخته را از پایین همین کارت انتخاب کن تا دوباره وارد ناحیه گنج شود."
              : "Pick one burned card below to bring it back into the treasure area.",
        };
      case "horseshoe":
        return {
          title: dir === "rtl" ? "قدرت قلاب" : "Hook Power",
          body:
            dir === "rtl"
              ? "یک کارت طلایی درخشان از پنل خودت را لمس کن تا دوباره روی میز بازی شود."
              : "Tap one glowing card from your own panel to play it back into the treasure area.",
        };
      case "misfire":
        return {
          title: dir === "rtl" ? "شلیک اشتباه" : "Misfire",
          body:
            dir === "rtl"
              ? "یکی از کارت‌های بالایی خودت را انتخاب کن تا به پشته سوخته برود."
              : "Choose one of your own top cards to send to the burn pile.",
        };
      default:
        return null;
    }
  })();

  const tutorialCardPositionClass =
    focusElement === "treasure-area"
      ? "top-4"
      : focusElement
        ? "bottom-4"
        : "top-4";
  const highlightedSectionClass = "relative z-[41]";
  const cardNameClass = cn(
    "mt-2 rounded-full border px-2 py-1 text-center text-[10px] leading-4 shadow-[0_8px_18px_rgba(2,6,23,0.28)] backdrop-blur-sm",
    dir === "rtl" ? "font-persian" : "font-cinzel",
  );

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.08),_transparent_30%),linear-gradient(180deg,rgba(139,90,43,0.15),rgba(60,40,20,0.25)_60%)]" />

      {currentTutorialStep ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0 z-30 bg-black/32 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "absolute inset-x-0 z-40 mx-auto w-[min(92vw,30rem)] rounded-[28px] border-2 border-amber-400/70 bg-[linear-gradient(180deg,rgba(120,53,15,0.94),rgba(45,18,8,0.95))] p-5 shadow-[0_0_44px_rgba(251,191,36,0.35),0_18px_60px_rgba(2,6,23,0.55)]",
              tutorialCardPositionClass,
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-amber-100">
                {t("tutorialStep", {
                  current: (tutorialStep ?? 0) + 1,
                  total: tutorialSteps?.length ?? 0,
                })}
              </span>
              {showTutorialCloseButton ? (
                <button
                  type="button"
                  onClick={onCloseTutorial}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </div>
            <h3 className="font-cinzel text-xl font-bold text-amber-100">
              {currentTutorialStep.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">
              {currentTutorialStep.description}
            </p>
            {focusElement ? (
              <p className="mt-3 text-xs leading-5 text-amber-100/80">
                {dir === "rtl"
                  ? "کادر طلایی روی همان بخش نشان می‌دهد الان دربارهٔ کدام قسمت صحبت می‌کنیم."
                  : "The glowing gold frame shows the exact section being explained right now."}
              </p>
            ) : null}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onPrevTutorial}
                disabled={(tutorialStep ?? 0) === 0}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("tutorialPrev")}
              </button>
              <button
                type="button"
                onClick={isLastTutorialStep ? onCloseTutorial : onNextTutorial}
                className="rounded-xl border-2 border-amber-300/70 bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/28"
              >
                {isLastTutorialStep
                  ? dir === "rtl"
                    ? "پایان آموزش"
                    : "Finish walkthrough"
                  : t("tutorialNext")}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 mx-auto max-w-md rounded-[28px] bg-slate-950/16 px-3 py-4 backdrop-blur-[1px] sm:max-w-lg sm:px-4"
      >
        <div className="space-y-3 pb-8">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {onOpenSummary ? (
                <button
                  type="button"
                  onClick={onOpenSummary}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-300/10 text-teal-50 transition hover:bg-teal-300/20"
                  aria-label={t("deadMansDrawTutorialLabel")}
                  title={t("deadMansDrawTutorialLabel")}
                >
                  <BookOpenText className="h-5 w-5" />
                </button>
              ) : null}
              {showExitButton ? (
                <button
                  type="button"
                  onClick={onOpenExit}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-300/10 text-rose-50 transition hover:bg-rose-300/20"
                  aria-label={t("deadMansDrawBackToMenu")}
                  title={t("deadMansDrawBackToMenu")}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>

          {currentState.players[1] ? (
            <motion.div
              data-dead-draw-section="player-panel-top"
              animate={
                focusElement === "player-panel"
                  ? {
                      borderColor: [
                        "rgba(251, 191, 36, 0.3)",
                        "rgba(251, 191, 36, 0.8)",
                        "rgba(251, 191, 36, 0.3)",
                      ],
                      boxShadow: [
                        "0 0 0 3px rgba(251, 191, 36, 0.1)",
                        "0 0 0 3px rgba(251, 191, 36, 0.4)",
                        "0 0 0 3px rgba(251, 191, 36, 0.1)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "rounded-2xl border-2 border-transparent",
                focusElement === "player-panel" && highlightedSectionClass,
              )}
            >
              <PlayerStack
                player={currentState.players[1]}
                isActive={activePlayerIndex === 1}
                displayName={getPlayerDisplayName(1)}
                t={t}
                markedOpponentName={
                  currentState.players[1].markedOpponentIndex !== null
                    ? getPlayerDisplayName(
                        currentState.players[1].markedOpponentIndex,
                      )
                    : null
                }
                targetEffect={
                  pendingEffect?.kind === "pistol" ||
                  pendingEffect?.kind === "dagger"
                    ? pendingEffect
                    : null
                }
                ownChoiceEffect={
                  pendingEffect?.kind === "horseshoe" ? pendingEffect : null
                }
                playerIndex={1}
                activePlayerIndex={activePlayerIndex}
                targetSelectionDisabled={targetSelectionDisabled}
                onTargetCard={(targetPlayerIndex, suit) => {
                  if (pendingEffect?.kind === "pistol") {
                    onPistolTarget(targetPlayerIndex, suit);
                  }
                  if (pendingEffect?.kind === "dagger") {
                    onDaggerTarget(targetPlayerIndex, suit);
                  }
                }}
                onOwnChoiceCard={onHorseshoeTarget}
              />
            </motion.div>
          ) : null}

          <motion.div
            data-dead-draw-section="deck-section"
            animate={
              focusElement === "deck-section"
                ? {
                    borderColor: [
                      "rgba(251, 191, 36, 0.3)",
                      "rgba(251, 191, 36, 0.8)",
                      "rgba(251, 191, 36, 0.3)",
                    ],
                    boxShadow: [
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                      "0 0 0 3px rgba(251, 191, 36, 0.4)",
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "relative rounded-2xl border-2 border-transparent",
              focusElement === "deck-section" && highlightedSectionClass,
              glowingDeck && "border-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.88)] animate-[gem-pulse_1.5s_ease-in-out_infinite]",
              glowingCollect && "border-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.88)] animate-[gem-pulse_1.5s_ease-in-out_infinite]",
            )}
          >
            <div className="absolute left-0 top-0">
              <DeckCounter
                label={t("deadMansDrawDrawDeck")}
                count={currentState.drawPile.length}
                onClick={canReveal ? onReveal : undefined}
                disabled={!canReveal}
                deckId="draw"
              />
            </div>
            <div className="absolute right-0 top-0">
              <DeckCounter
                label={t("deadMansDrawBurnPile")}
                count={currentState.discardPile.length}
                deckId="discard"
              />
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={onCollect}
                disabled={!canCollect}
                //////////////////////
                className={cn(
                  "h-10 w-40 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-lg font-bold text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.4),0_8px_24px_rgba(2,6,23,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.6),0_12px_32px_rgba(2,6,23,0.6)] disabled:opacity-50 disabled:hover:scale-100",
                  glowingCollect && "ring-2 ring-amber-300/80 shadow-[0_0_38px_rgba(251,191,36,0.95)] animate-[gem-pulse_1.5s_ease-in-out_infinite]",
                )}
              >
                <span className="">💰</span>
                <span className="">{t("deadMansDrawCollect")}</span>
              </Button>
            </div>
            <div className="mt-1 flex justify-center px-3">
              <div
                className={cn(
                  "w-[210px] rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-1 text-sm text-slate-100/85 shadow-[0_10px_24px_rgba(2,6,23,0.35)] break-words whitespace-normal",
                  dir === "rtl" ? "font-persian text-right" : "text-center",
                )}
              >
                {translateActionLabel(currentState.lastAction, t)}
              </div>
            </div>

          </motion.div>

          <motion.div
            data-dead-draw-section="treasure-area"
            animate={
              focusElement === "treasure-area"
                ? {
                    borderColor: [
                      "rgba(251, 191, 36, 0.3)",
                      "rgba(251, 191, 36, 0.8)",
                      "rgba(251, 191, 36, 0.3)",
                    ],
                    boxShadow: [
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                      "0 0 0 3px rgba(251, 191, 36, 0.4)",
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "rounded-[30px] border-2 border-transparent bg-slate-950/48 p-1 shadow-[0_18px_55px_rgba(2,6,23,0.35)]",
              focusElement === "treasure-area" && highlightedSectionClass,
              glowingCollect && "border-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.8)]",
            )}
          >
            {/* <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.3em] text-teal-100/45">
                {t("deadMansDrawTreasureArea")}
              </p>
              {currentState.pendingEffect ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-amber-100">
                  {t(
                    `deadMansDrawEffectBadge${currentState.pendingEffect.kind}`,
                  )}
                </span>
              ) : null}
            </div> */}

            <div
              className="mt-4 grid grid-cols-4 gap-2"
              dir="ltr"
              data-dead-draw-treasure-grid="true"
            >
              {visibleTreasureArea.length ? (
                visibleTreasureArea.map((card, index) => (
                  <div
                    key={card.id}
                    className="relative flex justify-center"
                    data-dead-draw-treasure-card={card.id}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        opacity:
                          selectedTreasureHelpId === card.id ? 1 : 0,
                        y: selectedTreasureHelpId === card.id ? 0 : 6,
                        scale:
                          selectedTreasureHelpId === card.id
                            ? 1
                            : 0.96,
                      }}
                      transition={{ duration: 0.18 }}
                      className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center"
                    >
                      <div className="rounded-[18px] border border-white/15 bg-slate-950/90 px-2.5 py-2 text-center shadow-[0_16px_40px_rgba(2,6,23,0.55)] backdrop-blur-sm">
                        {/* <p className="font-cinzel text-[10px] uppercase tracking-[0.24em] text-amber-100/65">
                          {t(SUIT_TRANSLATION_KEYS[card.suit])}
                        </p> */}
                        <p className="mt-1 text-[11px] leading-4 text-slate-100/90">
                          {t(SUIT_DESCRIPTION_KEYS[card.suit])}
                        </p>
                      </div>
                    </motion.div>
                    <motion.div
                      layout
                      initial={{
                        opacity: 0,
                        y: -50,
                        scale: 0.5,
                        x: -100,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        x: 0,
                      }}
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 210,
                          damping: 24,
                        },
                        duration: 0.5,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="w-full"
                    >
                      <div className="flex flex-col items-center">
                        <CardChip
                          card={card}
                          compact
                          highlighted={highlightedTreasureIds.has(
                            card.id,
                          )}
                          isBusting={highlightedTreasureIds.has(card.id)}
                          onClick={() =>
                            onToggleTreasureHelp(card.id)
                          }
                          className={
                            selectedTreasureHelpId === card.id
                              ? "border-amber-300/70 shadow-[0_0_0_2px_rgba(252,211,77,0.35),0_10px_30px_rgba(2,6,23,0.35)]"
                              : undefined
                          }
                        />
                        {/* <p className={cn(cardNameClass, "border-amber-300/20 bg-amber-400/10 text-amber-50/95")}>
                          {t(SUIT_TRANSLATION_KEYS[card.suit])}
                        </p> */}
                      </div>
                    </motion.div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">
                  {t("deadMansDrawRevealHint")}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            data-dead-draw-section="player-panel-bottom"
            animate={
              focusElement === "player-panel"
                ? {
                    borderColor: [
                      "rgba(251, 191, 36, 0.3)",
                      "rgba(251, 191, 36, 0.8)",
                      "rgba(251, 191, 36, 0.3)",
                    ],
                    boxShadow: [
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                      "0 0 0 3px rgba(251, 191, 36, 0.4)",
                      "0 0 0 3px rgba(251, 191, 36, 0.1)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "space-y-3 rounded-2xl border-2 border-transparent",
              focusElement === "player-panel" && highlightedSectionClass,
            )}
          >
            {currentState.players.map((player, index) =>
              index === 1 ? null : (
                <PlayerStack
                  key={player.id}
                  player={player}
                  isActive={index === activePlayerIndex}
                  displayName={getPlayerDisplayName(index)}
                  t={t}
                  markedOpponentName={
                    player.markedOpponentIndex !== null
                      ? getPlayerDisplayName(
                          player.markedOpponentIndex,
                        )
                      : null
                  }
                  targetEffect={
                    pendingEffect?.kind === "pistol" ||
                    pendingEffect?.kind === "dagger"
                      ? pendingEffect
                      : null
                  }
                  ownChoiceEffect={
                    pendingEffect?.kind === "horseshoe"
                      ? pendingEffect
                      : null
                  }
                  playerIndex={index}
                  activePlayerIndex={activePlayerIndex}
                  targetSelectionDisabled={targetSelectionDisabled}
                  onTargetCard={(targetPlayerIndex, suit) => {
                    if (pendingEffect?.kind === "pistol") {
                      onPistolTarget(targetPlayerIndex, suit);
                    }
                    if (pendingEffect?.kind === "dagger") {
                      onDaggerTarget(targetPlayerIndex, suit);
                    }
                  }}
                  onOwnChoiceCard={onHorseshoeTarget}
                />
              ),
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Decision overlay: only show for misfire */}
      {decisionOverlayOpen &&
      guideCopy &&
      pendingEffect.kind === "misfire" ? (
        <>
          <div className="pointer-events-none fixed inset-0 z-[34] bg-black/70" />
          <div className="pointer-events-none fixed inset-x-0 top-[11vh] z-[50] flex justify-center px-4">
            <div className="max-w-md rounded-[28px] border border-amber-300/40 bg-[linear-gradient(180deg,rgba(18,12,6,0.92),rgba(9,8,12,0.88))] px-5 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <p className="font-cinzel text-xs uppercase tracking-[0.32em] text-amber-200/85">
                {guideCopy.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                {guideCopy.body}
              </p>
            </div>
          </div>
          <div className="pointer-events-none fixed inset-x-0 top-[24vh] z-[51] flex justify-center px-4">
            <div className="rounded-[28px] border border-rose-300/50 bg-rose-950/55 px-6 py-5 shadow-[0_0_24px_rgba(248,113,113,0.35)]">
              <img
                src={SUIT_IMAGES.pistol}
                alt="Misfire"
                className="mx-auto h-16 w-16 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="fixed inset-x-0 top-[52vh] z-[52] flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-lg rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,16,28,0.92),rgba(5,8,18,0.94))] px-4 py-4 shadow-[0_24px_50px_rgba(2,6,23,0.55)] backdrop-blur-md">
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-3">
                  {pendingEffect.kind === "misfire" &&
                    pendingEffect.options.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => onMisfireChoice(card.suit)}
                        disabled={decisionDisabled}
                        className="rounded-[24px] border border-rose-200/30 bg-white/5 p-1 transition hover:-translate-y-1 hover:border-rose-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex flex-col items-center">
                          <CardChip card={card} compact />
                          <p className={cn(cardNameClass, "border-rose-200/25 bg-rose-400/10 text-rose-50/95")}>
                            {t(SUIT_TRANSLATION_KEYS[card.suit])}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Astrolabe and Map choices over deck section - no overlay background */}
      {decisionOverlayOpen &&
      (pendingEffect.kind === "astrolabe" ||
        pendingEffect.kind === "map") ? (
        <div
          className="fixed inset-x-0 z-[52] flex justify-center px-4"
          style={{ top: "28%" }}
        >
          <div className="pointer-events-auto w-full max-w-lg rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,16,28,0.92),rgba(5,8,18,0.94))] px-4 py-4 shadow-[0_24px_50px_rgba(2,6,23,0.55)] backdrop-blur-md">
            {pendingEffect.kind === "astrolabe" ? (
              <div className="space-y-4">
                <p className="text-center text-xs uppercase tracking-[0.24em] text-teal-100/70 font-cinzel">
                  {t("deadMansDrawVisibleCards")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {pendingEffect.peekCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="space-y-2 text-center"
                    >
                      <p className="text-[10px] uppercase tracking-[0.24em] text-teal-100/70">
                        {index === 0
                          ? t("deadMansDrawFirstCard")
                          : index === 1
                            ? t("deadMansDrawSecondCard")
                            : t("deadMansDrawThirdCard")}
                      </p>
                      <div className="mx-auto flex w-fit flex-col items-center">
                        <div className="rounded-[22px] border border-teal-200/25 bg-white/5 p-1 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
                          <CardChip card={card} compact />
                        </div>
                        <p className={cn(cardNameClass, "border-teal-200/25 bg-teal-400/10 text-teal-50/95")}>
                          {t(SUIT_TRANSLATION_KEYS[card.suit])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="game"
                    onClick={onAstrolabeReveal}
                    disabled={decisionDisabled}
                    className="w-full rounded-2xl border border-teal-200/35 bg-gradient-to-br from-teal-500/35 to-sky-500/30 shadow-[0_10px_24px_rgba(13,148,136,0.32)]"
                  >
                    {t("deadMansDrawRevealTopCard")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onAstrolabeCollect}
                    disabled={decisionDisabled}
                    className="w-full rounded-2xl border border-amber-300/35 bg-amber-400/12 text-amber-50 shadow-[0_10px_24px_rgba(245,158,11,0.18)] hover:bg-amber-400/18"
                  >
                    {t("deadMansDrawCollectNow")}
                  </Button>
                </div>
              </div>
            ) : null}

            {pendingEffect.kind === "map" ? (
              <div className="space-y-3">
                <p className="text-center text-xs uppercase tracking-[0.24em] text-amber-100/70 font-cinzel">
                  {t("deadMansDrawChooseBurnedCardTitle")}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {pendingEffect.options.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onMapChoice(card.id)}
                      disabled={decisionDisabled}
                      className="rounded-[24px] border border-amber-200/30 bg-white/5 p-1 transition hover:-translate-y-1 hover:border-amber-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex flex-col items-center">
                        <CardChip card={card} compact />
                        <p className={cn(cardNameClass, "border-amber-200/25 bg-amber-400/10 text-amber-50/95")}>
                          {t(SUIT_TRANSLATION_KEYS[card.suit])}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {cardFlights.map((flight) => (
        <motion.div
          key={flight.id}
          className="pointer-events-none fixed z-[70]"
          style={{
            left: flight.start.x - 41,
            top: flight.start.y - 56,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: flight.kind === "reveal" ? 0.86 : 1,
            opacity: 0.98,
            rotate: flight.kind === "burn" ? 0 : -4,
          }}
          animate={{
            x: flight.end.x - flight.start.x,
            y: flight.end.y - flight.start.y,
            scale:
              flight.kind === "burn"
                ? [1, 1.04, 0.84]
                : [
                    flight.kind === "reveal" ? 0.86 : 1,
                    1.03,
                    0.94,
                  ],
            opacity: [0.98, 1, 0.82],
            rotate:
              flight.kind === "burn"
                ? [0, 6, 18]
                : [-4, 0, 2],
          }}
          transition={{
            duration: flight.durationMs / 1000,
            ease: "easeInOut",
          }}
        >
          <CardChip
            card={flight.card}
            compact
            highlighted={flight.kind === "burn"}
            isBusting={flight.kind === "burn"}
          />
        </motion.div>
      ))}
    </div>
  );
}
