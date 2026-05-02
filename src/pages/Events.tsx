import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Target,
  Gem,
  Crown,
  Timer,
  Clock,
  Swords,
  Puzzle,
  Bot,
  Shield,
  Gift
} from "lucide-react";

import AppPageShell from "@/components/game/AppPageShell";
import { useLanguage, type TranslationKey } from "@/hooks/useLanguage";
import { shellBackgrounds } from "@/lib/pageBackgrounds";

// --- Data Constants (Translation Keys) ---

const LEAGUE_TIERS: Array<{
  id: string;
  icon: typeof Shield;
  color: string;
  bg: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}> = [
  { id: "onyx", icon: Shield, color: "text-slate-400 dark:text-slate-500", bg: "bg-slate-400/10", titleKey: "tierOnyx", descKey: "tierOnyxDesc" },
  { id: "emerald", icon: Gem, color: "text-emerald-400", bg: "bg-emerald-400/10", titleKey: "tierEmerald", descKey: "tierEmeraldDesc" },
  { id: "sapphire", icon: Gem, color: "text-blue-400", bg: "bg-blue-400/10", titleKey: "tierSapphire", descKey: "tierSapphireDesc" },
  { id: "ruby", icon: Gem, color: "text-rose-500", bg: "bg-rose-500/10", titleKey: "tierRuby", descKey: "tierRubyDesc" },
  { id: "diamond", icon: Gem, color: "text-cyan-300", bg: "bg-cyan-300/10", titleKey: "tierDiamond", descKey: "tierDiamondDesc" },
  { id: "noble", icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", titleKey: "tierNoble", descKey: "tierNobleDesc" },
];

const ACTIVE_EVENTS: Array<{
  id: string;
  icon: typeof Timer;
  color: string;
  bg: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  timeKey: TranslationKey;
}> = [
  { id: "blitz", icon: Timer, color: "text-yellow-400", bg: "bg-yellow-400/10", titleKey: "eventBlitz", descKey: "eventBlitzDesc", timeKey: "endsIn2Days" },
  { id: "marathon", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10", titleKey: "eventMarathon", descKey: "eventMarathonDesc", timeKey: "endsIn5Days" },
  { id: "rich", icon: Gem, color: "text-purple-400", bg: "bg-purple-400/10", titleKey: "eventRichStart", descKey: "eventRichStartDesc", timeKey: "endsIn12Hours" },
  { id: "knockout", icon: Swords, color: "text-red-400", bg: "bg-red-400/10", titleKey: "eventKnockout", descKey: "eventKnockoutDesc", timeKey: "startsIn2Hours" },
];

const SOLO_CHALLENGES: Array<{
  id: string;
  icon: typeof Puzzle;
  color: string;
  bg: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  rewardKey: TranslationKey;
}> = [
  { id: "puzzle", icon: Puzzle, color: "text-indigo-400", bg: "bg-indigo-400/10", titleKey: "soloPuzzle", descKey: "soloPuzzleDesc", rewardKey: "rewardCoins" },
  { id: "survival", icon: Bot, color: "text-teal-400", bg: "bg-teal-400/10", titleKey: "soloSurvival", descKey: "soloSurvivalDesc", rewardKey: "rewardCardBack" },
  { id: "turnlimit", icon: Zap, color: "text-lime-400", bg: "bg-lime-400/10", titleKey: "soloTurnLimit", descKey: "soloTurnLimitDesc", rewardKey: "avatarName1" },
];

type EventsTabId = "events" | "solo";

export default function Events() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<EventsTabId>("events");

  const TABS = [
    { id: "events", label: t("tabEvents"), icon: Zap },
    { id: "solo", label: t("tabSolo"), icon: Target },
  ] as const;

  const isRtl = dir === "rtl";

  return (
    <AppPageShell currentPath="/events" backgroundImage={shellBackgrounds.events}>
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-20 pt-4">
        <div className={`flex items-center gap-3 px-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="rounded-2xl bg-primary/20 p-3 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className={`font-cinzel text-3xl font-bold text-primary ${isRtl ? "text-right" : "text-left"}`}>
            {t("leaguesAndEventsTitle")}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-wrap gap-2 rounded-3xl bg-background/40 p-2 backdrop-blur-md ${isRtl ? "flex-row-reverse" : ""}`}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isRtl ? "flex-row-reverse" : ""
                } ${isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. ACTIVE EVENTS (رویدادهای فعال) */}
            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {ACTIVE_EVENTS.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="group relative overflow-hidden rounded-[30px] border border-primary/20 bg-[linear-gradient(145deg,rgba(17,33,40,0.95),rgba(19,27,48,0.88))] p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-primary/20"
                    >
                      <div className={`flex items-start justify-between gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <div className={`rounded-2xl p-3 ${event.bg} ${event.color}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className={`rounded-full bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground ${isRtl ? "mr-auto" : "ml-auto"}`}>
                          {t(event.timeKey)}
                        </div>
                      </div>
                      <div className={`mt-4 space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
                        <h3 className={`font-cinzel text-lg font-bold ${event.color}`}>{t(event.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground">{t(event.descKey)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {activeTab === "events" &&
                LEAGUE_TIERS.map((tier, index) => {
                  const Icon = tier.icon;
                  return (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.24 + index * 0.05 }}
                      className="flex items-center rounded-[24px] border border-white/5 bg-background/40 p-4 backdrop-blur-sm transition-all hover:bg-background/60"
                    >
                      <div className={`flex w-full items-center gap-4 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
                        <div className={`rounded-full p-4 ${tier.bg} ${tier.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{t(tier.titleKey)}</h3>
                          <p className="text-xs text-muted-foreground">{t(tier.descKey)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* 2. SOLO CHALLENGES (چالش‌های تک‌نفره) */}
            {activeTab === "solo" && (
              <motion.div
                key="solo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {SOLO_CHALLENGES.map((challenge, index) => {
                  const Icon = challenge.icon;
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-background/60 p-5 shadow-lg backdrop-blur-md"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/events/solo/${challenge.id}`)}
                        className={`flex w-full flex-col items-center gap-5 text-inherit transition-transform hover:scale-[1.01] sm:flex-row ${isRtl ? "sm:flex-row-reverse text-right" : "text-left"}`}
                      >
                        <div className={`flex-shrink-0 rounded-[20px] p-4 ${challenge.bg} ${challenge.color}`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{t(challenge.titleKey)}</h3>
                          <p className="text-sm text-muted-foreground">{t(challenge.descKey)}</p>
                        </div>

                        <div className={`flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 border border-primary/20 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <Gift className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">{t(challenge.rewardKey)}</span>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AppPageShell>
  );
}
