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

  // با توجه به اینکه عنوان دکمه یا متن ترجمه شده حاوی نویسه‌های فارسی است، جهت را به صورت پویا تشخیص می‌دهیم.
  const sampleText = t("deadMansDrawChoosePower", { player: playerName });
  const isRtl = /[\u0600-\u06FF]/.test(sampleText);
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div 
      className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center overflow-hidden px-4 pb-4 pt-20"
      dir={dir}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${zirkhakiBackground})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0.28),rgba(2,6,23,0.58))]" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main card */}
      <div className="relative z-10 flex w-full flex-1 flex-col rounded-[34px] border-2 border-amber-400/60 bg-gradient-to-br from-amber-900/30 to-amber-950/50 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.7),0_0_40px_rgba(251,191,36,0.3)] backdrop-blur sm:p-6">
        {/* Header */}
        <header className={`mb-6 text-center ${isRtl ? "font-persian" : ""}`}>
          <p className="font-cinzel text-[10px] uppercase tracking-[0.38em] text-amber-200/90">
            ADVANCED POWERS
          </p>

          <h1 className="mt-3 font-cinzel text-2xl text-white sm:text-4xl">
            {sampleText}
          </h1>

          {/* <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/85 mx-auto">
            {t("deadMansDrawChoosePowerBody", {
              player: playerName,
              playerNumber,
            })}
          </p> */}
        </header>

        {/* Cards */}
        <div className="mt-1 grid flex-1 gap-4 md:grid-cols-2">
          {options.map((ringId) => {
            const ringVisual = POWER_VISUALS[ringId];
            if (!ringVisual) return null;

            return (
              <button
                key={ringId}
                type="button"
                onClick={() => onSelect(ringId)}
                disabled={locked}
                className={[
                  "group relative flex h-full rounded-[28px] border-2 bg-gradient-to-br p-4 transition-all",
                  isRtl ? "text-right flex-row-reverse" : "text-left flex-row",
                  "from-amber-800/25 to-amber-950/40",
                  "border-amber-300/40 hover:border-amber-300/80",
                  "hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
                ].join(" ")}
              >
                {/* Power gem / ring badge */}
                <div className={`absolute -top-4 rounded-full border-2 border-amber-300/70 bg-black/90 p-2 shadow-[0_0_25px_rgba(251,191,36,0.8)] ${isRtl ? "-left-4" : "-right-4"}`}>
                  <img
                    src={ringVisual.power}
                    alt={`${ringVisual.label} power`}
                    className="h-12 w-12 rounded-full object-contain"
                  />
                </div>

                {/* Character art */}
                <div className={`shrink-0 w-32 sm:w-36 md:w-40 ${isRtl ? "ml-4" : "mr-4"}`}>
                  <img
                    src={ringVisual.character}
                    alt={ringVisual.label}
                    className="h-40 w-full rounded-[24px] border-2 border-amber-300/30 bg-black/40 object-cover shadow-[0_8px_24px_rgba(2,6,23,0.5)] sm:h-44"
                  />
                </div>

                {/* Text column */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className={`font-cinzel text-base font-bold text-amber-100 ${isRtl ? "font-persian" : ""}`}>
                    {t(`deadMansDrawPowerLabel${ringId}`)}
                  </p>

                  <p className={`mt-2 text-sm leading-6 text-slate-200/90 ${isRtl ? "font-persian" : ""}`}>
                    {t(getPowerAbilityKey(ringId))}
                  </p>
                </div>

                {/* Hover overlay hint */}
                {!locked && (
                  <span className="pointer-events-none absolute inset-0 rounded-[26px] border border-amber-200/0 transition-opacity group-hover:border-amber-200/40 group-hover:opacity-100" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint (optional) */}
        {locked}
      </div>
    </div>
  );
}
