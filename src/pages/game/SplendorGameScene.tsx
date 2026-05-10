import { motion } from "framer-motion";

import GameBoard from "@/components/game/GameBoard";
import SplendorGameHUD from "@/pages/game/SplendorGameHUD";
import SplendorGameShell from "@/pages/game/SplendorGameShell";
import type { SplendorGameSceneProps } from "@/pages/game/splendorGameSceneTypes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SplendorGameScene(props: SplendorGameSceneProps) {
  const tutorialHasVisualFocus = ["tokens", "card", "cards", "nobles", "panel", "timer"].includes(
    props.interactiveTutorial.focus,
  );
  const tutorialAtBottom = ["nobles", "cards", "card", "timer"].includes(props.interactiveTutorial.focus);

  return (
    <SplendorGameShell dir={props.dir} backgroundImage={props.backgroundImage}>
      <div className="relative">
        <SplendorGameHUD {...props} />
        <GameBoard
          t={props.t}
          state={props.state}
          currentPlayer={props.currentPlayer}
          panelCount={props.panelCount}
          phase={props.phase}
          tempPoolDisplay={props.tempPoolDisplay}
          selectedGems={props.selectedGems}
          selectedCard={props.boardSelectedCard}
          isAIPlayer={props.isAIPlayer}
          getPlayerDisplayName={props.getPlayerDisplayName}
          handleReturnToken={props.handleReturnToken}
          handleReserveDeck={props.handleReserveDeck}
          handleCardClick={props.handleCardClick}
          handleGemClick={props.handleGemClick}
          handleConfirmTokens={props.handleConfirmTokens}
          actionSubmitting={props.actionSubmitting}
          handleCancel={props.handleCancel}
          backCardsByLevel={props.backCardsByLevel}
          tutorialFocus={
            props.interactiveTutorial.enabled
              && ["tokens", "card", "cards", "nobles", "panel"].includes(props.interactiveTutorial.focus)
              ? (props.interactiveTutorial.focus as "tokens" | "card" | "cards" | "nobles" | "panel")
              : undefined
          }
        />

        {props.interactiveTutorial.enabled && (
          <div className="pointer-events-none absolute inset-0 z-30 bg-black/25">
            <motion.div
              key={props.interactiveTutorial.step}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "pointer-events-auto z-40 mx-auto w-[min(92vw,560px)] rounded-2xl border border-amber-300/70 bg-slate-950/95 p-4 shadow-[0_0_40px_rgba(251,191,36,0.25)] backdrop-blur",
                tutorialAtBottom ? "fixed inset-x-0 bottom-4" : "sticky top-3",
              )}
            >
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all"
                  style={{ width: `${((props.interactiveTutorial.step + 1) / props.interactiveTutorial.totalSteps) * 100}%` }}
                />
              </div>
              <p className="text-xs uppercase tracking-wider text-amber-300">
                Walkthrough {props.interactiveTutorial.step + 1} / {props.interactiveTutorial.totalSteps}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-amber-100">{props.interactiveTutorial.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{props.interactiveTutorial.description}</p>
              {tutorialHasVisualFocus && (
                <p className="mt-2 text-xs text-amber-200/90">
                  The glowing area shows the place being explained.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={props.onPrevTutorialStep}>
                  Back
                </Button>
                <Button size="sm" onClick={props.onNextTutorialStep}>
                  {props.interactiveTutorial.step === props.interactiveTutorial.totalSteps - 1 ? "Finish tutorial" : "Next"}
                </Button>
                <Button size="sm" variant="ghost" onClick={props.onCloseTutorial}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Robot Turn Popup
        {props.showRobotTurnPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-3xl border-2 border-amber-400/50 bg-slate-900/95 p-8 shadow-[0_0_60px_rgba(251,191,36,0.4)]"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20">
                  <span className="text-3xl">🤖</span>
                </div>
                <h2 className="font-cinzel text-2xl font-bold text-amber-100">
                  {props.lang === "fa" ? "نوبت ربات" : "Robot's Turn"}
                </h2>
                <p className="text-center text-slate-300">
                  {props.lang === "fa"
                    ? "ربات در حال فکر کردن است..."
                    : "The robot is thinking..."}
                </p>
                <div className="mt-2 flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    className="h-2 w-2 rounded-full bg-amber-400"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="h-2 w-2 rounded-full bg-amber-400"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    className="h-2 w-2 rounded-full bg-amber-400"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )} */}
      </div>
      {props.flightAnimations.map((flight) => (
        <motion.div
          key={flight.id}
          className={cn(
            "pointer-events-none fixed z-[60] flex items-center justify-center overflow-hidden border border-white/40 font-bold text-white shadow-xl",
            flight.kind === "card"
              ? "h-28 w-20 rounded-lg text-xl md:h-32 md:w-24"
              : flight.kind === "noble"
                ? "h-14 w-14 rounded-lg text-sm md:h-16 md:w-16"
                : "h-8 w-8 rounded-full text-[12px]",
          )}
          style={{
            left: flight.start.x - (flight.kind === "card" ? 40 : flight.kind === "noble" ? 28 : 16),
            top: flight.start.y - (flight.kind === "card" ? 56 : flight.kind === "noble" ? 28 : 16),
            backgroundColor: flight.imageUrl ? "transparent" : flight.color || "#94a3b8",
            backgroundImage: flight.imageUrl ? `url('${flight.imageUrl}')` : undefined,
            backgroundSize: flight.kind === "token" ? "contain" : "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          initial={{
            x: 0,
            y: 0,
            scale: flight.kind === "card" ? 0.98 : 0.9,
            opacity: 0.95,
            rotateY: flight.kind === "card" ? -8 : 0,
          }}
          animate={{
            x: flight.end.x - flight.start.x,
            y: flight.end.y - flight.start.y,
            scale: flight.kind === "card" ? [0.98, 1.08, 0.72] : [0.9, 1.12, 0.9],
            opacity: [0.95, 1, 0.85],
            rotateY: flight.kind === "card" ? [-8, 110, 0] : 0,
          }}
          transition={{ duration: flight.durationMs / 1000, ease: "easeInOut" }}
        >
          {!flight.imageUrl && (flight.label || "•")}
        </motion.div>
      ))}
    </SplendorGameShell>
  );
}
