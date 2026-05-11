import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { BeastyBarBoard, useBeastyBarGame } from "./beasty-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AIDifficulty } from "@/lib/aiPlayer";

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
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("back")}
          </Button>
          <h1 className="font-cinzel text-2xl text-amber-100">Beasty Bar</h1>
          <div className="text-slate-400">
            {lang === "fa" ? "نوبت" : "Turn"}: {turn}
          </div>
        </div>
      </div>

      {/* Game Board */}
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
  );
}
