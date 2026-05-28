import { useState } from "react";

import { getDeadMansDrawScore, getPlayerCardCount, type DeadMansDrawPendingEffect, type DeadMansDrawPlayer, type DeadMansDrawSuit } from "@/lib/deadMansDraw";
import { cn } from "@/lib/utils";
import zirkhakiBackground from "@/assets/background-zirkhaki.webp";
import canonIcon from "@/assets/canon-icon.webp";
import coinIcon from "@/assets/coin-icon.webp";
import hookIcon from "@/assets/hook-svg.png";
import carpetIcon from "@/assets/map-icon.webp";
import ancorIcon from "@/assets/ancor-icon.webp";
import chestIcon from "@/assets/chest-icon.webp";
import keyIcon from "@/assets/key-icon.webp";
import krakenIcon from "@/assets/kraken-icon.webp";
import oracleIcon from "@/assets/oracle-icon.webp";
import swordIcon from "@/assets/sword-icon.webp";

import type { Translate } from "./helpers";
import { getPowerAbilityKey, POWER_VISUALS } from "./shared";

const PLAYER_PANEL_SUIT_ICONS: Record<DeadMansDrawSuit, string> = {
  astrolabe: oracleIcon,
  pistol: canonIcon,
  dagger: swordIcon,
  carpet: ancorIcon,
  snake: krakenIcon,
  coin: coinIcon,
  horseshoe: hookIcon,
  map: carpetIcon,
  chest: chestIcon,
  key: keyIcon,
};

export function PlayerStack({
  player,
  isActive,
  displayName,
  t,
  markedOpponentName,
  targetEffect,
  ownChoiceEffect,
  playerIndex,
  activePlayerIndex,
  targetSelectionDisabled,
  onTargetCard,
  onOwnChoiceCard,
}: {
  player: DeadMansDrawPlayer;
  isActive: boolean;
  displayName: string;
  t: Translate;
  markedOpponentName?: string | null;
  targetEffect?: Extract<DeadMansDrawPendingEffect, { kind: "pistol" | "dagger" }> | null;
  ownChoiceEffect?: Extract<DeadMansDrawPendingEffect, { kind: "horseshoe" }> | null;
  playerIndex?: number;
  activePlayerIndex?: number;
  targetSelectionDisabled?: boolean;
  onTargetCard?: (targetPlayerIndex: number, suit: DeadMansDrawSuit) => void;
  onOwnChoiceCard?: (suit: DeadMansDrawSuit) => void;
}) {
  const ringVisual = player.ring ? POWER_VISUALS[player.ring] : null;
  const [showPowerHelp, setShowPowerHelp] = useState(false);
  const targetOption = targetEffect?.options.find((option) => option.playerIndex === playerIndex);
  const targetableSuits = new Set(targetOption?.cards.map((card) => card.suit) ?? []);
  const ownChoiceSuits = new Set(
    playerIndex === activePlayerIndex ? ownChoiceEffect?.options.map((card) => card.suit) ?? [] : [],
  );
  const hasOverlayTarget = targetableSuits.size > 0 || ownChoiceSuits.size > 0;

  return (
    <div
      data-dead-draw-player-panel={typeof playerIndex === "number" ? String(playerIndex) : undefined}
      className={cn(
        "relative rounded-[20px] border bg-cover bg-center p-3 backdrop-blur-sm",
        isActive ? "border-amber-300/70" : "border-white/10",
        hasOverlayTarget && "z-[42]",
      )}
      style={{
        backgroundImage: `${isActive ? "linear-gradient(rgba(15,23,42,0.76), rgba(15,23,42,0.82))" : "linear-gradient(rgba(2,6,23,0.68), rgba(2,6,23,0.74))"}, url(${zirkhakiBackground})`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {ringVisual ? (
            <button
              type="button"
              onClick={() => setShowPowerHelp((value) => !value)}
              className="shrink-0 rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
            >
              <img src={ringVisual.character} alt={ringVisual.label} className="h-10 w-10 rounded-xl object-cover" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-cinzel text-sm text-white">{displayName}</p>
            {player.ring ? <p className="mt-0.5 text-[10px] leading-4 text-teal-100/75">{t(`deadMansDrawPowerLabel${player.ring}`)}</p> : null}
            {player.ring === "madam-margot" && markedOpponentName ? <p className="text-[10px] leading-4 text-rose-100/80">{t("deadMansDrawMarkedOpponent", { player: markedOpponentName })}</p> : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-cinzel text-lg text-amber-300">{getDeadMansDrawScore(player)}</p>
          <p className="text-[10px] text-white/45">{getPlayerCardCount(player)}</p>
        </div>
      </div>
      {player.ring && showPowerHelp ? (
        <div className="mt-2 rounded-xl border border-teal-300/25 bg-teal-400/8 p-2 text-[10px] leading-5 text-slate-200/85">
          {t(getPowerAbilityKey(player.ring))}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {Object.entries(player.collected).map(([suit, cards]) => {
          const topCard = cards[cards.length - 1];
          const highestValue = cards.length > 0 ? Math.max(...cards.map((c) => c.value)) : 0;
          const stackValues = cards.map((card) => card.value).join(" · ");

          if (!topCard) {
            return (
              <div
                key={suit}
                data-dead-draw-player-slot={typeof playerIndex === "number" ? `${playerIndex}-${suit}` : undefined}
                className="rounded-xl border border-dashed border-white/10 bg-black/10 p-1"
              >
                <img
                  src={PLAYER_PANEL_SUIT_ICONS[suit as DeadMansDrawSuit]}
                  alt={suit}
                  className="h-8 w-full rounded-lg object-contain p-1 opacity-35"
                />
              </div>
            );
          }

          const isTargetable = targetableSuits.has(suit as DeadMansDrawSuit);
          const isOwnChoice = ownChoiceSuits.has(suit as DeadMansDrawSuit);
          const content = (
            <>
              <div className="relative h-10">
                <img
                  src={PLAYER_PANEL_SUIT_ICONS[suit as DeadMansDrawSuit]}
                  alt={suit}
                  className="h-8 w-full rounded-lg bg-white/5 object-contain p-1 shadow-[0_4px_12px_rgba(2,6,23,0.35)]"
                />
                <span className="absolute right-0 top-0 rounded-full bg-black/70 px-1 py-0.5 font-cinzel text-[10px] text-white shadow-lg">{highestValue}</span>
              </div>
              <p
                className="mt-1 min-h-[1.1rem] text-center text-[8px] leading-3 text-amber-100/90"
                title={t("deadMansDrawStackBehindValues", { values: stackValues })}
              >
                {stackValues}
              </p>
            </>
          );

          if ((isTargetable || isOwnChoice) && typeof playerIndex === "number") {
            return (
              <button
                key={suit}
                type="button"
                disabled={targetSelectionDisabled}
                onClick={() => isOwnChoice ? onOwnChoiceCard?.(suit as DeadMansDrawSuit) : onTargetCard?.(playerIndex, suit as DeadMansDrawSuit)}
                data-dead-draw-player-slot={typeof playerIndex === "number" ? `${playerIndex}-${suit}` : undefined}
                className={cn(
                  "relative z-[45] rounded-xl p-1 text-left transition animate-pulse disabled:cursor-not-allowed disabled:opacity-60",
                  isOwnChoice
                    ? "border border-amber-300 bg-amber-400/12 shadow-[0_0_24px_rgba(251,191,36,0.42)] hover:bg-amber-400/20"
                    : "border border-red-400 bg-red-500/10 shadow-[0_0_18px_rgba(248,113,113,0.45)] hover:bg-red-500/20",
                )}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={suit}
              data-dead-draw-player-slot={typeof playerIndex === "number" ? `${playerIndex}-${suit}` : undefined}
              className="rounded-xl border border-white/10 bg-black/15 p-1"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
