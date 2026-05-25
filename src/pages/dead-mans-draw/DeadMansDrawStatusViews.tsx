import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import overlayBackground from "@/assets/background.png";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import { CardChip } from "./CardChip";
import type {
  DeadMansDrawBonusPreviewViewProps,
  DeadMansDrawGameOverViewProps,
} from "./types";

export function DeadMansDrawBonusPreviewView({
  dir,
  t,
  preview,
  getPlayerDisplayName,
  onConfirm,
}: DeadMansDrawBonusPreviewViewProps) {
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
          <div className="mb-8 text-center">
            <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-sky-200/65">
              {dir === "rtl" ? "صندوق و کلید" : "Chest & Key"}
            </p>
            <p className="mt-2 text-sm leading-6 text-sky-50/90">
              {dir === "rtl"
                ? `${getPlayerDisplayName(preview.playerIndex)} این گنج‌ها را از پشته سوخته بازیابی کرد`
                : `${getPlayerDisplayName(preview.playerIndex)} recovered these treasures from the burn pile`}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {preview.cards.map((card) => <CardChip key={card.id} card={card} compact />)}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="game" onClick={onConfirm}>
              {t("deadMansDrawBonusPreviewConfirm")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export function DeadMansDrawGameOverView({
  dir,
  t,
  winnerNames,
  highestScore,
  tiedForScoreCount,
  winnerCount,
  tiebreakWinnerCount,
  topCardCount,
  scoreBoard,
  getPlayerDisplayName,
  onPlayAgain,
  onMenu,
  playAgainDisabled,
}: DeadMansDrawGameOverViewProps) {
  const isRTL = dir === "rtl";

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
      {/* پس‌زمینه اصلی */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${zirkhakiBackground})` }}
      />
      {/* گرادیان‌های نور بالایی/پایینی */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.16),_transparent_40%),linear-gradient(180deg,rgba(18,11,2,0.82),rgba(2,6,23,0.9)_68%)]" />
      {/* هاله‌ی تاریک برای تمرکز روی کارت */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/60" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
              damping: 18,
              stiffness: 160,
            },
          }}
          className="w-full rounded-[34px] border border-amber-300/35 bg-slate-950/90 p-6 shadow-[0_32px_90px_rgba(15,23,42,0.9)] sm:p-8"
        >
          {/* هدر بالا + امتیاز برنده */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-cinzel text-[11px] uppercase tracking-[0.38em] text-amber-100/70">
              {t("deadMansDrawGameOver")}
            </p>
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/40 px-3 py-[6px] text-[11px] text-amber-100/85">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-semibold text-amber-100">
                ★
              </span>
              {isRTL
                ? `امتیاز برنده: ${highestScore}`
                : `Winning score: ${highestScore}`}
            </div> */}
          </div>

          {/* خط برنده‌ها */}
          <h1 className="mt-4 font-cinzel text-3xl sm:text-4xl text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.4)]">
            {t("deadMansDrawWinnerLine", { winners: winnerNames.join(", ") })}
          </h1>

          {/* توضیح کوتاه بدنه (اختیاری، فعلا مختصر و ثابت) */}
          {/* <p className="mt-3 max-w-3xl text-xs sm:text-sm leading-6 text-amber-50/80">
            {isRTL
              ? "باد دریا آرام شده و گنج‌ها شمرده می‌شوند؛ این دور به پایان رسید."
              : "The sea falls quiet as the treasures are tallied; this voyage has come to an end."}
          </p> */}

          {/* پیام تساوی و تیبریک */}
          {tiedForScoreCount > winnerCount && tiebreakWinnerCount === winnerCount ? (
            <div className="mt-5 flex items-start gap-3 rounded-3xl border border-sky-300/25 bg-gradient-to-r from-sky-500/15 via-sky-400/10 to-cyan-300/15 p-4 text-sm leading-6 text-sky-50/90">
              <div className="mt-[2px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-300/70 bg-sky-900/70 text-[11px] font-semibold">
                !
              </div>
              <p className="text-xs sm:text-sm">
                {t("deadMansDrawTiebreakBody", {
                  score: highestScore,
                  winners: winnerNames.join(", "),
                  cards: topCardCount,
                })}
              </p>
            </div>
          ) : null}

          {/* لیست امتیازها */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {scoreBoard.map((entry, index) => {
              const playerName = getPlayerDisplayName(entry.index);
              const isWinnerCard = winnerNames.includes(playerName);

              return (
                <motion.div
                  key={entry.index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.15 + index * 0.06,
                      type: "spring",
                      damping: 18,
                      stiffness: 200,
                    },
                  }}
                  className={[
                    "relative overflow-hidden rounded-[26px] border p-4 transition-transform duration-200 hover:-translate-y-[3px]",
                    isWinnerCard
                      ? "border-amber-300/70 bg-gradient-to-br from-amber-500/18 via-yellow-400/10 to-amber-200/14"
                      : "border-white/10 bg-black/25",
                  ].join(" ")}
                >
                  {/* نشان رتبه و برنده در گوشه کارت */}
                  <div
                    className={[
                      "absolute top-3 flex items-center gap-1 text-[11px] text-white/65",
                      isRTL ? "left-3 flex-row-reverse" : "right-3",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[11px] font-semibold text-amber-100">
                      #{index + 1}
                    </span>
                    {isWinnerCard && (
                      <span className="rounded-full bg-amber-500/25 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-amber-50">
                        {isRTL ? "برنده" : "Winner"}
                      </span>
                    )}
                  </div>

                  <p className="font-cinzel text-xl text-white">{playerName}</p>

                  <p className="mt-2 text-sm text-white/70">
                    {t("deadMansDrawScoreLine", {
                      score: entry.score,
                      cards: entry.cardCount,
                    })}
                  </p>

                  {/* خط کارت‌های جمع‌آوری‌شده */}
                  {/* <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px]">
                      🃏
                    </span>
                    <span>
                      {isRTL
                        ? `${entry.cardCount} کارت جمع‌آوری‌شده`
                        : `${entry.cardCount} collected cards`}
                    </span>
                  </div> */}
                </motion.div>
              );
            })}
          </div>

          {/* دکمه‌ها */}
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
            >
              <Button
                variant="game"
                onClick={onPlayAgain}
                disabled={playAgainDisabled}
                className="relative overflow-hidden px-6"
              >
                <span className="relative z-10">
                  {t("deadMansDrawPlayAgain")}
                </span>
                {/* گِلوی نوری روی دکمه */}
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.35),_transparent_60%)] opacity-80" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            >
              <Button
                variant="outline"
                onClick={onMenu}
                className="border-slate-400/60 bg-black/40 text-slate-100 hover:bg-black/70"
              >
                {t("deadMansDrawBackToMenu")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
