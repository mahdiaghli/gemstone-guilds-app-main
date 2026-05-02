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
          <p className="font-cinzel text-xs uppercase tracking-[0.38em] text-sky-100/65">Chest + Key</p>
          <h1 className="mt-3 font-cinzel text-4xl text-white">
            {t("deadMansDrawBonusPreviewTitle", {
              player: getPlayerDisplayName(preview.playerIndex),
            })}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300/80">{t("deadMansDrawBonusPreviewBody")}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            {preview.cards.map((card) => <CardChip key={card.id} card={card} />)}
          </div>
          <div className="mt-8">
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
  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${zirkhakiBackground})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(180deg,rgba(18,11,2,0.74),rgba(2,6,23,0.8)_68%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-[34px] border border-amber-300/30 bg-slate-950/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.72)]">
          <p className="font-cinzel text-xs uppercase tracking-[0.38em] text-amber-100/65">{t("deadMansDrawGameOver")}</p>
          <h1 className="mt-3 font-cinzel text-4xl text-amber-200">
            {t("deadMansDrawWinnerLine", { winners: winnerNames.join(", ") })}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-50/75">{t("deadMansDrawGameOverBody")}</p>
          {tiedForScoreCount > winnerCount && tiebreakWinnerCount === winnerCount ? (
            <div className="mt-5 rounded-3xl border border-sky-300/25 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50/85">
              {t("deadMansDrawTiebreakBody", {
                score: highestScore,
                winners: winnerNames.join(", "),
                cards: topCardCount,
              })}
            </div>
          ) : null}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {scoreBoard.map((entry) => (
              <div key={entry.index} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                <p className="font-cinzel text-xl text-white">{getPlayerDisplayName(entry.index)}</p>
                <p className="mt-2 text-sm text-white/65">
                  {t("deadMansDrawScoreLine", { score: entry.score, cards: entry.cardCount })}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {t("deadMansDrawCollectedCardsLine", { count: entry.cardCount })}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="game" onClick={onPlayAgain} disabled={playAgainDisabled}>
              {t("deadMansDrawPlayAgain")}
            </Button>
            <Button variant="outline" onClick={onMenu}>
              {t("deadMansDrawBackToMenu")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
