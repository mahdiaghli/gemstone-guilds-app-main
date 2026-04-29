import { useState } from "react";

import { getDeadMansDrawScore, getPlayerCardCount, type DeadMansDrawPlayer, type DeadMansDrawSuit } from "@/lib/deadMansDraw";
import { cn } from "@/lib/utils";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import type { Translate } from "./helpers";
import { getPowerAbilityKey, POWER_VISUALS, SUIT_IMAGES } from "./shared";

export function PlayerStack({
  player,
  isActive,
  displayName,
  t,
  markedOpponentName,
}: {
  player: DeadMansDrawPlayer;
  isActive: boolean;
  displayName: string;
  t: Translate;
  markedOpponentName?: string | null;
}) {
  const ringVisual = player.ring ? POWER_VISUALS[player.ring] : null;
  const [showPowerHelp, setShowPowerHelp] = useState(false);

  return (
    <div
      className={cn("rounded-[26px] border bg-cover bg-center p-4 backdrop-blur-sm", isActive ? "border-amber-300/70" : "border-white/10")}
      style={{
        backgroundImage: `${isActive ? "linear-gradient(rgba(15,23,42,0.76), rgba(15,23,42,0.82))" : "linear-gradient(rgba(2,6,23,0.68), rgba(2,6,23,0.74))"}, url(${zirkhakiBackground})`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {ringVisual ? (
              <button
                type="button"
                onClick={() => setShowPowerHelp((value) => !value)}
                className="shrink-0 rounded-2xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
              >
                <img src={ringVisual.character} alt={ringVisual.label} className="h-16 w-16 rounded-2xl object-cover" />
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-cinzel text-base text-white sm:text-lg">{displayName}</p>
              {player.ring ? <p className="mt-1 text-xs leading-5 text-teal-100/75">{t(`deadMansDrawPowerLabel${player.ring}`)}</p> : null}
              {player.ring === "madam-margot" && markedOpponentName ? <p className="text-xs leading-5 text-rose-100/80">{t("deadMansDrawMarkedOpponent", { player: markedOpponentName })}</p> : null}
            </div>
          </div>
          {player.ring && showPowerHelp ? (
            <div className="mt-3 rounded-2xl border border-teal-300/25 bg-teal-400/8 p-3 text-xs leading-6 text-slate-200/85">
              {t(getPowerAbilityKey(player.ring))}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-cinzel text-xl text-amber-300 sm:text-2xl">{getDeadMansDrawScore(player)}</p>
          <p className="text-[11px] text-white/45">{t("deadMansDrawCardCount", { count: getPlayerCardCount(player) })}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {Object.entries(player.collected).map(([suit, cards]) => {
          const topCard = cards[cards.length - 1];
          if (!topCard) {
            return (
              <div key={suit} className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-1">
                <img src={SUIT_IMAGES[suit as DeadMansDrawSuit]} alt={suit} className="h-11 w-full rounded-xl object-cover opacity-25" />
              </div>
            );
          }

          return (
            <div key={suit} className="rounded-2xl border border-white/10 bg-black/15 p-1.5">
              <div className="relative h-14">
                <div className="relative h-12 w-10">
                  {cards.slice(Math.max(0, cards.length - 3)).map((stackCard, stackIndex) => (
                    <img
                      key={stackCard.id}
                      src={SUIT_IMAGES[suit as DeadMansDrawSuit]}
                      alt={suit}
                      className="absolute h-12 w-10 rounded-xl border border-white/10 object-cover shadow-[0_8px_18px_rgba(2,6,23,0.35)]"
                      style={{ left: `${stackIndex * 4}px`, top: `${stackIndex * 2}px`, zIndex: stackIndex + 1 }}
                    />
                  ))}
                </div>
                <span className="absolute right-0 top-0 rounded-full bg-black/70 px-1.5 py-0.5 font-cinzel text-xs text-white">{topCard.value}</span>
              </div>
              <p className="mt-1 text-[10px] leading-3 text-amber-100/85">{cards.map((card) => card.value).join(", ")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
