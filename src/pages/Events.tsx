import { motion } from "framer-motion";
import { Bot, Clock, Gem, Gift, Puzzle, Swords, Target, Timer, Zap } from "lucide-react";

import AppPageShell from "@/components/game/AppPageShell";
import { useLanguage, type TranslationKey } from "@/hooks/useLanguage";
import { shellBackgrounds } from "@/lib/pageBackgrounds";

type ChallengeCard = {
  id: string;
  icon: typeof Timer;
  color: string;
  bg: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  rewardKey: TranslationKey;
};

// Live events and solo challenges intentionally share one list so players have one destination.
const CHALLENGES: ChallengeCard[] = [
  { id: "blitz", icon: Timer, color: "text-yellow-400", bg: "bg-yellow-400/10", titleKey: "eventBlitz", descKey: "eventBlitzDesc", rewardKey: "rewardCoins" },
  { id: "marathon", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10", titleKey: "eventMarathon", descKey: "eventMarathonDesc", rewardKey: "rewardCardBack" },
  { id: "rich", icon: Gem, color: "text-purple-400", bg: "bg-purple-400/10", titleKey: "eventRichStart", descKey: "eventRichStartDesc", rewardKey: "rewardCoins" },
  { id: "knockout", icon: Swords, color: "text-red-400", bg: "bg-red-400/10", titleKey: "eventKnockout", descKey: "eventKnockoutDesc", rewardKey: "rewardCardBack" },
  { id: "puzzle", icon: Puzzle, color: "text-indigo-400", bg: "bg-indigo-400/10", titleKey: "soloPuzzle", descKey: "soloPuzzleDesc", rewardKey: "rewardCoins" },
  { id: "survival", icon: Bot, color: "text-teal-400", bg: "bg-teal-400/10", titleKey: "soloSurvival", descKey: "soloSurvivalDesc", rewardKey: "rewardCardBack" },
  { id: "turnlimit", icon: Zap, color: "text-lime-400", bg: "bg-lime-400/10", titleKey: "soloTurnLimit", descKey: "soloTurnLimitDesc", rewardKey: "rewardBorder" },
];

export default function Events() {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <AppPageShell currentPath="/events" backgroundImage={shellBackgrounds.events}>
      <div className="relative mx-auto w-full max-w-4xl pb-20 pt-4" dir={dir}>
        <div aria-hidden="true" className="pointer-events-none grid select-none gap-4 blur-[7px] sm:grid-cols-2">
          {CHALLENGES.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative flex w-full flex-col gap-4 overflow-hidden rounded-[26px] border border-white/10 bg-background/60 p-5 text-inherit shadow-lg ${isRtl ? "text-right" : "text-left"}`}
              >
                <div className={`flex w-full items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className={`rounded-[20px] p-4 ${challenge.bg} ${challenge.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className={`text-lg font-semibold ${challenge.color}`}>{t(challenge.titleKey)}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{t(challenge.descKey)}</p>
                </div>
                <div className={`mt-auto flex items-center gap-2 border-t border-white/10 pt-3 text-sm font-medium text-primary ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Gift className="h-4 w-4" />
                  <span>{t(challenge.rewardKey)}</span>
                  <Target className="ml-auto h-4 w-4 opacity-60" />
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="absolute inset-x-3 top-20 z-10 rounded-[28px] border border-primary/35 bg-background/85 px-5 py-8 text-center shadow-2xl backdrop-blur-xl sm:inset-x-16 sm:top-28">
          <p className={`text-xl font-bold text-primary sm:text-2xl ${isRtl ? "font-persian" : "font-cinzel"}`}>
            {t("eventsComingSoon")}
          </p>
        </div>
      </div>
    </AppPageShell>
  );
}
