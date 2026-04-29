import type { DeadMansDrawPlayer, DeadMansDrawPowerTargetSelection } from "@/lib/deadMansDraw";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import type { Translate } from "./helpers";
import { POWER_VISUALS } from "./shared";

export function PowerTargetScreen({
  selection,
  players,
  getPlayerDisplayName,
  onSelect,
  locked,
  t,
}: {
  selection: DeadMansDrawPowerTargetSelection;
  players: DeadMansDrawPlayer[];
  getPlayerDisplayName: (index: number) => string;
  onSelect: (targetPlayerIndex: number) => void;
  locked: boolean;
  t: Translate;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center overflow-hidden px-4 pb-8 pt-24">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${zirkhakiBackground})` }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0.28),rgba(2,6,23,0.58))]" />
      <div className="relative z-10 w-full rounded-[34px] border border-rose-300/30 bg-slate-950/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.7)]">
        <p className="font-cinzel text-xs uppercase tracking-[0.38em] text-rose-100/70">{t("deadMansDrawChooseTargetLabel")}</p>
        <h1 className="mt-3 font-cinzel text-2xl text-white sm:text-4xl">{t("deadMansDrawChooseTargetTitle", { player: getPlayerDisplayName(selection.playerIndex) })}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/80">{t("deadMansDrawChooseTargetBody")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {selection.options.map((playerIndex) => {
            const player = players[playerIndex];
            const powerVisual = player?.ring ? POWER_VISUALS[player.ring] : null;

            return (
              <button
                key={playerIndex}
                type="button"
                onClick={() => onSelect(playerIndex)}
                disabled={locked}
                className="rounded-[26px] border border-white/10 bg-black/20 p-4 text-left transition hover:border-rose-200/60 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {powerVisual ? <img src={powerVisual.character} alt={powerVisual.label} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" /> : null}
                    <div>
                      <p className="font-cinzel text-lg text-white">{getPlayerDisplayName(playerIndex)}</p>
                      <p className="mt-1 text-xs text-white/65">{player?.ring ? t(`deadMansDrawPowerLabel${player.ring}`) : t("deadMansDrawPowerPending")}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-lg text-rose-100">◎</span>
                </div>
                <p className="mt-3 text-sm text-white/65">{t("deadMansDrawChooseTargetCta")}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
