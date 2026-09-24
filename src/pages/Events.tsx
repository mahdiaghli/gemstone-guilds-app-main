import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Clock, Gem, Gift, Puzzle, Swords, Target, Timer, Trophy, Zap } from "lucide-react";

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
  timeKey?: TranslationKey;
  liveEvent?: "blitz" | "marathon";
};

// Live events and solo challenges intentionally share one list so players have one destination.
const CHALLENGES: ChallengeCard[] = [
  { id: "blitz", icon: Timer, color: "text-yellow-400", bg: "bg-yellow-400/10", titleKey: "eventBlitz", descKey: "eventBlitzDesc", rewardKey: "rewardCoins", timeKey: "endsIn2Days", liveEvent: "blitz" },
  { id: "marathon", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10", titleKey: "eventMarathon", descKey: "eventMarathonDesc", rewardKey: "rewardCardBack", timeKey: "endsIn5Days", liveEvent: "marathon" },
  { id: "rich", icon: Gem, color: "text-purple-400", bg: "bg-purple-400/10", titleKey: "eventRichStart", descKey: "eventRichStartDesc", rewardKey: "rewardCoins", timeKey: "endsIn12Hours" },
  { id: "knockout", icon: Swords, color: "text-red-400", bg: "bg-red-400/10", titleKey: "eventKnockout", descKey: "eventKnockoutDesc", rewardKey: "rewardCardBack", timeKey: "startsIn2Hours" },
  { id: "puzzle", icon: Puzzle, color: "text-indigo-400", bg: "bg-indigo-400/10", titleKey: "soloPuzzle", descKey: "soloPuzzleDesc", rewardKey: "rewardCoins" },
  { id: "survival", icon: Bot, color: "text-teal-400", bg: "bg-teal-400/10", titleKey: "soloSurvival", descKey: "soloSurvivalDesc", rewardKey: "rewardCardBack" },
  { id: "turnlimit", icon: Zap, color: "text-lime-400", bg: "bg-lime-400/10", titleKey: "soloTurnLimit", descKey: "soloTurnLimitDesc", rewardKey: "rewardBorder" },
];

export default function Events() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const handleChallengeClick = (challenge: ChallengeCard) => {
    if (challenge.liveEvent === "blitz") {
      sessionStorage.setItem("matchmaking-players", "2");
      sessionStorage.setItem("matchmaking-turnTime", "15");
      sessionStorage.setItem("matchmaking-game", "splendor");
      sessionStorage.removeItem("matchmaking-targetScore");
      navigate("/online-matchmaking?game=splendor&event=blitz");
      return;
    }

    if (challenge.liveEvent === "marathon") {
      sessionStorage.setItem("matchmaking-players", "2");
      sessionStorage.setItem("matchmaking-turnTime", "15");
      sessionStorage.setItem("matchmaking-targetScore", "9");
      sessionStorage.setItem("matchmaking-game", "splendor");
      navigate("/online-matchmaking?game=splendor&event=marathon");
      return;
    }

    navigate(`/events/solo/${challenge.id}`);
  };

  return (
    <AppPageShell currentPath="/events" backgroundImage={shellBackgrounds.events}>
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-20 pt-4" dir={dir}>
        <div className={`flex items-center gap-3 px-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="rounded-2xl bg-primary/20 p-3 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Trophy className="h-7 w-7" />
          </div>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="font-cinzel text-3xl font-bold text-primary">{t("eventsTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("eventsDesc")}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CHALLENGES.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <motion.button
                key={challenge.id}
                type="button"
                onClick={() => handleChallengeClick(challenge)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative flex w-full flex-col gap-4 overflow-hidden rounded-[26px] border border-white/10 bg-background/60 p-5 text-inherit shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 ${isRtl ? "text-right" : "text-left"}`}
              >
                <div className={`flex w-full items-start justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className={`rounded-[20px] p-4 ${challenge.bg} ${challenge.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  {challenge.timeKey && (
                    <span className="rounded-full bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                      {t(challenge.timeKey)}
                    </span>
                  )}
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
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppPageShell>
  );
}