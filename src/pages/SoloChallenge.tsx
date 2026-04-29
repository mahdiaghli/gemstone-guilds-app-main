import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, CheckCircle2, Gift, Puzzle, RotateCcw, Zap } from "lucide-react";

import AppPageShell from "@/components/game/AppPageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  readSoloChallengeProgress,
  type BotSurvivalStage,
} from "@/lib/challenges";

const SURVIVAL_STEPS: BotSurvivalStage[] = ["easy", "medium", "hard"];

export default function SoloChallenge() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [progress, setProgress] = useState(() =>
    readSoloChallengeProgress(user?.id),
  );

  useEffect(() => {
    const sync = () => setProgress(readSoloChallengeProgress(user?.id));
    window.addEventListener("splendor-solo-challenges-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("splendor-solo-challenges-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [user?.id]);

  const config = useMemo(() => {
    if (challengeId === "puzzle") {
      return {
        icon: Puzzle,
        title: t("soloPuzzle"),
        description: t("soloPuzzleDesc"),
        reward: t("rewardCoins"),
        start: () => navigate("/game?players=2&mode=local&challenge=daily-puzzle"),
      };
    }

    if (challengeId === "survival") {
      const currentStage = progress.botSurvivalCompleted
        ? "hard"
        : progress.botSurvivalStage;
      return {
        icon: Bot,
        title: t("soloSurvival"),
        description: t("soloSurvivalDesc"),
        reward: t("rewardCardBack"),
        start: () =>
          navigate(
            `/game?players=2&mode=ai&challenge=bot-survival&difficulty=${currentStage}&step=${currentStage}`,
          ),
      };
    }

    return {
      icon: Zap,
      title: t("soloTurnLimit"),
      description: t("soloTurnLimitDesc"),
      reward: t("avatarName1"),
      start: () =>
        navigate("/game?players=2&mode=ai&difficulty=medium&challenge=turn-limit"),
    };
  }, [challengeId, navigate, progress.botSurvivalCompleted, progress.botSurvivalStage, t]);

  const Icon = config.icon;
  const isRtl = dir === "rtl";

  return (
    <AppPageShell currentPath="/events">
      <div className="mx-auto w-full max-w-3xl space-y-6 pb-20 pt-4">
        <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="font-cinzel text-3xl font-bold text-primary">
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-primary/20 bg-background/60 p-6 shadow-xl backdrop-blur-sm">
          <div className={`flex items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Reward
              </p>
              <p className="mt-2 text-lg font-semibold text-primary">
                {config.reward}
              </p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>

          {challengeId === "survival" && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {SURVIVAL_STEPS.map((step, index) => {
                const currentStageIndex = SURVIVAL_STEPS.indexOf(progress.botSurvivalStage);
                const stepReached =
                  progress.botSurvivalCompleted || currentStageIndex > index;
                const isCurrent =
                  !progress.botSurvivalCompleted &&
                  progress.botSurvivalStage === step;
                return (
                  <div
                    key={step}
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? "border-primary bg-primary/10"
                        : stepReached
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border/60 bg-background/50"
                    }`}
                  >
                    <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                      <p className="font-semibold">{t(step)}</p>
                      {stepReached ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <RotateCcw className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {progress.botSurvivalCompleted
                        ? "Completed"
                        : isCurrent
                        ? "Play now"
                        : stepReached
                        ? "Cleared"
                        : "Locked"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {challengeId === "puzzle" && (
            <p className="mt-6 text-sm text-muted-foreground">
              {progress.dailyPuzzleSolvedOn
                ? "Today's puzzle reward has been claimed."
                : "Solve the exact sequence to claim 500 coins."}
            </p>
          )}

          {challengeId === "turn-limit" && (
            <p className="mt-6 text-sm text-muted-foreground">
              Win the match in 25 turns or fewer to unlock the Merchant avatar.
            </p>
          )}

          <Button
            variant="game"
            className="mt-6 h-12 w-full"
            onClick={config.start}
          >
            {t("startGame")}
          </Button>
        </div>
      </div>
    </AppPageShell>
  );
}
