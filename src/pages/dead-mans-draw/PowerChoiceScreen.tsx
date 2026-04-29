import type { DeadMansDrawRing } from "@/lib/deadMansDraw";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import type { Translate } from "./helpers";
import { getPowerAbilityKey, POWER_VISUALS } from "./shared";

export function PowerChoiceScreen({
  playerName,
  playerIndex,
  options,
  onSelect,
  locked,
  t,
}: {
  playerName: string;
  playerIndex: number;
  options: DeadMansDrawRing[];
  onSelect: (ring: DeadMansDrawRing) => void;
  locked?: boolean;
  t: Translate;
}) {
  const playerNumber = playerIndex + 1;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center overflow-hidden px-4 pb-4 pt-20">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${zirkhakiBackground})` }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0.28),rgba(2,6,23,0.58))]" />
      {/* کارت اصلی صفحه */}
      <div className="relative z-10 flex w-full flex-1 flex-col rounded-[34px] border border-teal-300/30 bg-slate-950/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
        {/* Header مطابق تصویر */}
        <header className="mb-5">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.38em] text-teal-200/70">
            ADVANCED POWERS
          </p>

          <h1 className="mt-3 font-cinzel text-2xl text-white sm:text-4xl">
            {`Player ${playerNumber}, choose 1 power`}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/80">
            {`Player ${playerNumber} reviews 2 face-up powers, keeps 1 for the full game, and discards the other.`}
          </p>
        </header>

        {/* لیست افقی کارت‌ها */}
        <div className="mt-1 grid flex-1 gap-3 md:grid-cols-2">
          {options.map((ringId) => {
            const ringVisual = POWER_VISUALS[ringId];
            if (!ringVisual) return null;

            return (
              <button
                key={ringId}
                type="button"
                onClick={() => onSelect(ringId)}
                disabled={locked}
                className="group relative flex h-full rounded-[28px] border border-teal-300/25 bg-teal-400/10 p-3 text-left transition hover:border-teal-200/80 hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* سنگ قدرت: بیرون کادر تصویر فرد، گوشه بالا راست کارت */}
                <div className="absolute -top-3 -right-3 rounded-full border border-teal-200/60 bg-black/90 p-1.5 shadow-[0_0_20px_rgba(56,189,248,0.7)]">
                  <img
                    src={ringVisual.power}
                    alt={`${ringVisual.label} power`}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                </div>

                {/* ستون تصویر فرد (بزرگ‌تر) */}
                <div className="mr-3 w-32 shrink-0 sm:w-36">
                  <img
                    src={ringVisual.character}
                    alt={ringVisual.label}
                    className="h-36 w-full rounded-[22px] border border-white/10 bg-black/30 object-cover sm:h-40"
                  />
                </div>

                {/* ستون متن */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="font-cinzel text-sm text-amber-200">
                    {t(`deadMansDrawPowerLabel${ringId}`)}
                  </p>
                  <p className="mt-1 line-clamp-4 text-xs leading-5 text-slate-300/85">
                    {t(getPowerAbilityKey(ringId))}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* دکمه شروع بازی حذف شد */}
    </div>
  );
}
