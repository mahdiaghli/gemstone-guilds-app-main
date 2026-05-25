import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { BeastyBarBoard, useBeastyBarGame } from "./beasty-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AIDifficulty } from "@/lib/aiPlayer";
import beastyBarBackground from "@/assets/background.png";

export default function BeastyBarGame() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const gameMode = useMemo(() => {
    const mode = searchParams.get("mode");
    if (mode === "ai" || mode === "local" || mode === "online") return mode;
    return "local" as const;
  }, [searchParams]);

  const playerCount = useMemo(() => {
    const count = parseInt(searchParams.get("players") || "2", 10);
    return Math.max(2, Math.min(4, count));
  }, [searchParams]);

  const humanPlayerCount = useMemo(() => {
    if (gameMode === "ai") return 1;
    if (gameMode === "local") {
      const humans = parseInt(searchParams.get("humans") || "2", 10);
      return Math.max(1, Math.min(playerCount, humans));
    }
    return playerCount;
  }, [gameMode, playerCount, searchParams]);

  const aiDifficulty = useMemo(() => {
    const diff = searchParams.get("difficulty");
    if (diff === "easy" || diff === "medium" || diff === "hard") return diff;
    return "medium" as AIDifficulty;
  }, [searchParams]);

  const playerNames = useMemo(() => {
    const names: string[] = [];
    for (let i = 0; i < playerCount; i++) {
      if (i < humanPlayerCount) {
        names.push(i === 0 ? (lang === "fa" ? "شما" : "You") : `${lang === "fa" ? "بازیکن" : "Player"} ${i + 1}`);
      } else {
        names.push(`${lang === "fa" ? "ربات" : "Robot"} ${i - humanPlayerCount + 1}`);
      }
    }
    return names;
  }, [playerCount, humanPlayerCount, lang]);

  const {
    state,
    currentPlayer,
    isCurrentPlayerTurn,
    playCard,
    resolveEffect,
    restart,
    isGameOver,
    winnerIndices,
    lastAction,
    pendingEffect,
    turn,
    aiThinking,
    aiThinkingText,
  } = useBeastyBarGame({
    playerCount,
    humanPlayerCount,
    playerNames,
    gameMode,
    aiDifficulty,
  });

  const handleRestart = useCallback(() => {
    restart();
  }, [restart]);

  const handleGoToMenu = useCallback(() => {
    navigate("/menu/beasty-bar");
  }, [navigate]);

  const handleBack = () => {
    navigate("/menu/beasty-bar");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${beastyBarBackground})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(34,197,94,0.16),_transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0.95))]" />
      <div className="absolute -left-20 top-16 h-60 w-60 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="rounded-full border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("back")}
          </Button>
          <div className="text-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "fa" ? "ورود حیوانات" : "Wild Entrance"}
            </div>
            <h1 className="font-cinzel text-2xl text-amber-100 sm:text-3xl">Beasty Bar</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
            <span className="mr-2 inline-flex items-center gap-1 text-amber-200">
              <Crown className="h-4 w-4" />
              {lang === "fa" ? "نوبت" : "Turn"}
            </span>
            {turn}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mx-auto max-w-6xl px-4 py-6"
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.4)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">{lang === "fa" ? "صف" : "Queue"}</p>
            <p className="mt-2 font-cinzel text-xl text-white">{state.bumpingZone.animals.length}/5</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.4)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">{lang === "fa" ? "آخرین حرکت" : "Last Action"}</p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-100/90">{state.lastAction}</p>
          </div>
          <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.4)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/70">{lang === "fa" ? "حالت" : "Mode"}</p>
            <p className="mt-2 text-sm text-emerald-50">{gameMode.toUpperCase()}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/30 shadow-[0_32px_90px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
          <BeastyBarBoard
            state={state}
            currentPlayerIndex={state.currentPlayerIndex}
            isCurrentPlayerTurn={isCurrentPlayerTurn}
            onPlayCard={playCard}
            onResolveEffect={resolveEffect}
            onRestart={handleRestart}
            onGoToMenu={handleGoToMenu}
            lang={lang}
            t={t}
            aiThinking={aiThinking}
            aiThinkingText={aiThinkingText}
          />
        </div>
      </motion.div>
    </div>
  );
}
