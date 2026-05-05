import { motion } from "framer-motion";
import { BookOpenText, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CardChip } from "./CardChip";
import { DeckCounter } from "./DeckCounter";
import { PlayerStack } from "./PlayerStack";
import { SUIT_DESCRIPTION_KEYS, SUIT_TRANSLATION_KEYS } from "./shared";
import type { DeadMansDrawBoardViewProps } from "./types";
import backgroundImage from "@/assets/background-game-splendor.png";

export function DeadMansDrawBoardView({
  dir,
  t,
  currentState,
  canReveal,
  canCollect,
  onReveal,
  onCollect,
  visibleTreasureArea,
  highlightedTreasureIds,
  selectedTreasureHelpId,
  onToggleTreasureHelp,
  getPlayerDisplayName,
  activePlayerIndex,
  pendingEffect,
  onPistolTarget,
  onDaggerTarget,
  onHorseshoeTarget,
  targetSelectionDisabled,
  onOpenSummary,
  onOpenExit,
}: DeadMansDrawBoardViewProps) {
  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.10),_transparent_30%),linear-gradient(180deg,rgba(7,17,28,0.22),rgba(2,6,23,0.52)_60%)]" />

      <div className="relative z-10 mx-auto max-w-md rounded-[28px] bg-slate-950/16 px-3 py-4 backdrop-blur-[1px] sm:max-w-lg sm:px-4">
        <div className="space-y-4 pb-8">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSummary}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-300/10 text-teal-50 transition hover:bg-teal-300/20"
                aria-label={t("gameSummary")}
                title={t("gameSummary")}
              >
                <BookOpenText className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onOpenExit}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-300/10 text-rose-50 transition hover:bg-rose-300/20"
                aria-label={t("deadMansDrawBackToMenu")}
                title={t("deadMansDrawBackToMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {currentState.players[1] ? (
            <PlayerStack
              player={currentState.players[1]}
              isActive={activePlayerIndex === 1}
              displayName={getPlayerDisplayName(1)}
              t={t}
              markedOpponentName={currentState.players[1].markedOpponentIndex !== null ? getPlayerDisplayName(currentState.players[1].markedOpponentIndex) : null}
              targetEffect={pendingEffect?.kind === "pistol" || pendingEffect?.kind === "dagger" ? pendingEffect : null}
              ownChoiceEffect={pendingEffect?.kind === "horseshoe" ? pendingEffect : null}
              playerIndex={1}
              activePlayerIndex={activePlayerIndex}
              targetSelectionDisabled={targetSelectionDisabled}
              onTargetCard={(targetPlayerIndex, suit) => {
                if (pendingEffect?.kind === "pistol") onPistolTarget(targetPlayerIndex, suit);
                if (pendingEffect?.kind === "dagger") onDaggerTarget(targetPlayerIndex, suit);
              }}
              onOwnChoiceCard={onHorseshoeTarget}
            />
          ) : null}

          <div className="">
            <div className="grid grid-cols-3 gap-3">
              <DeckCounter label={t("deadMansDrawDrawDeck")} count={currentState.drawPile.length} onClick={canReveal ? onReveal : undefined} disabled={!canReveal} />
              <div className="flex items-center justify-center">
                <Button variant="ghost" onClick={onCollect} disabled={!canCollect} className="w-full min-h-[46px] rounded-2xl">
                  {t("deadMansDrawCollect")}
                </Button>
              </div>
              <DeckCounter label={t("deadMansDrawBurnPile")} count={currentState.discardPile.length} />
            </div>
          </div>

          <div className="rounded-[30px] bg-slate-950/48 p-4 shadow-[0_18px_55px_rgba(2,6,23,0.35)]">
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
                    onClick={() => onToggleTreasureHelp(card.id)}
                    className={selectedTreasureHelpId === card.id ? "border-amber-300/70 shadow-[0_0_0_2px_rgba(252,211,77,0.35),0_10px_30px_rgba(2,6,23,0.35)]" : undefined}
                  />
                </div>
              )) : (
                <div className="col-span-3 rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">
                  {t("deadMansDrawRevealHint")}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {currentState.players.map((player, index) => index === 1 ? null : (
              <PlayerStack
                key={player.id}
                player={player}
                isActive={index === activePlayerIndex}
                displayName={getPlayerDisplayName(index)}
                t={t}
                markedOpponentName={player.markedOpponentIndex !== null ? getPlayerDisplayName(player.markedOpponentIndex) : null}
                targetEffect={pendingEffect?.kind === "pistol" || pendingEffect?.kind === "dagger" ? pendingEffect : null}
                ownChoiceEffect={pendingEffect?.kind === "horseshoe" ? pendingEffect : null}
                playerIndex={index}
                activePlayerIndex={activePlayerIndex}
                targetSelectionDisabled={targetSelectionDisabled}
                onTargetCard={(targetPlayerIndex, suit) => {
                  if (pendingEffect?.kind === "pistol") onPistolTarget(targetPlayerIndex, suit);
                  if (pendingEffect?.kind === "dagger") onDaggerTarget(targetPlayerIndex, suit);
                }}
                onOwnChoiceCard={onHorseshoeTarget}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
