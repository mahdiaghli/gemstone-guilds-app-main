import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SplendorGameScene from "@/pages/game/SplendorGameScene";
import useSplendorGameController from "@/pages/game/useSplendorGameController";
import { GameState, Card, GemType } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type TutorialStep =
  | "goal"
  | "actions"
  | "selectTokens"
  | "buyFirstCard"
  | "selectOnyxTokens"
  | "buySecondCard"
  | "buyReservedCard"
  | "nobles"
  | "complete";

export default function SplendorIntroTutorial() {
  const navigate = useNavigate();
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("goal");
  const [completedSteps, setCompletedSteps] = useState<TutorialStep[]>([]);
  const hasSelectedDiamondRef = useRef(false);
  const hasSelectedBlueRef = useRef(false);
  const hasSelectedGreenRef = useRef(false);
  const hasBoughtFirstCardRef = useRef(false);
  const hasSelectedOnyxRef = useRef(false);
  const hasBoughtSecondCardRef = useRef(false);
  const hasBoughtReservedCardRef = useRef(false);

  const { sceneProps } = useSplendorGameController({
    gameMode: "intro-tutorial",
  });

  // Override the game state to set up the specific card requirements
  const setupBoardForStep = useCallback(() => {
    if (sceneProps.state && tutorialStep === "selectTokens") {
      // Ensure bottom-right zone has a card requiring exactly: 1 diamond, 1 blue, 1 green
      // This will be set up in the initial game state
    }
  }, [tutorialStep, sceneProps.state]);

  const handleTokenSelection = useCallback(() => {
    if (tutorialStep === "selectTokens") {
      const { selectedGems } = sceneProps;
      const hasDiamond = selectedGems.includes("diamond");
      const hasBlue = selectedGems.includes("blue");
      const hasGreen = selectedGems.includes("green");

      if (hasDiamond) hasSelectedDiamondRef.current = true;
      if (hasBlue) hasSelectedBlueRef.current = true;
      if (hasGreen) hasSelectedGreenRef.current = true;

      if (hasDiamond && hasBlue && hasGreen && selectedGems.length === 3) {
        setCompletedSteps([...completedSteps, "selectTokens"]);
        setTutorialStep("buyFirstCard");
      }
    }
  }, [tutorialStep, completedSteps, sceneProps]);

  const handleCardPurchased = useCallback(() => {
    if (tutorialStep === "buyFirstCard" && !hasBoughtFirstCardRef.current) {
      hasBoughtFirstCardRef.current = true;
      setCompletedSteps([...completedSteps, "buyFirstCard"]);
      setTutorialStep("selectOnyxTokens");
    } else if (tutorialStep === "buySecondCard" && !hasBoughtSecondCardRef.current) {
      hasBoughtSecondCardRef.current = true;
      setCompletedSteps([...completedSteps, "buySecondCard"]);
      setTutorialStep("buyReservedCard");
    }
  }, [tutorialStep, completedSteps]);

  const handleOnyxSelection = useCallback(() => {
    if (tutorialStep === "selectOnyxTokens") {
      const { selectedGems } = sceneProps;
      const onyxCount = selectedGems.filter((g) => g === "onyx").length;

      if (onyxCount === 2 && selectedGems.length === 2) {
        hasSelectedOnyxRef.current = true;
        setCompletedSteps([...completedSteps, "selectOnyxTokens"]);
        setTutorialStep("buySecondCard");
      }
    }
  }, [tutorialStep, completedSteps, sceneProps]);

  const handleReservedCardPurchased = useCallback(() => {
    if (tutorialStep === "buyReservedCard" && !hasBoughtReservedCardRef.current) {
      hasBoughtReservedCardRef.current = true;
      setCompletedSteps([...completedSteps, "buyReservedCard"]);
      setTutorialStep("nobles");
    }
  }, [tutorialStep, completedSteps]);

  const handleNobleAttraction = useCallback(() => {
    if (tutorialStep === "nobles") {
      setCompletedSteps([...completedSteps, "nobles"]);
      setTutorialStep("complete");
    }
  }, [tutorialStep, completedSteps]);

  const getTutorialOverlay = () => {
    const overlayContent = {
      goal: {
        title: "Welcome to Splendor! 👑",
        description:
          "Your goal is to reach 15 prestige points (score) to win the game. Purchase cards and attract nobles to gain points!",
        focus: null,
      },
      actions: {
        title: "Four Actions Available",
        description:
          "On your turn, you can do ONE of these four things:\n1. Take 2-3 gem tokens\n2. Reserve a card from the display\n3. Buy a card you can afford\n4. Take up to 3 reserved cards",
        focus: null,
      },
      selectTokens: {
        title: "Take Gem Tokens",
        description: "Click and select exactly 3 different gems: one diamond, one blue, and one green. Then press confirm to take them.",
        focus: "tokens",
      },
      buyFirstCard: {
        title: "Purchase Your First Card",
        description:
          "The card at the bottom-right requires exactly the tokens you just collected. Click it, then click Purchase. You'll get a red bonus token!",
        focus: "card",
      },
      selectOnyxTokens: {
        title: "Take Matching Tokens",
        description: "Now take 2 matching onyx tokens. Click both onyx tokens and then confirm to take them.",
        focus: "tokens",
      },
      buySecondCard: {
        title: "Purchase Second Card",
        description:
          "The card at the bottom-right now requires 2 red and 2 onyx tokens. With your bonuses and tokens, you can afford it! Click it and purchase.",
        focus: "card",
      },
      buyReservedCard: {
        title: "Purchase with Golden Tokens",
        description:
          "Now use a reserved card. You can spend your actual tokens or use the golden wildcard tokens. Complete this purchase to proceed.",
        focus: "panel",
      },
      nobles: {
        title: "Noble Attraction",
        description:
          "When you have 3 white cards and 3 onyx cards, nobles are automatically attracted to you! They add bonus points. See how the noble at the top-right joins you automatically?",
        focus: "nobles",
      },
      complete: {
        title: "Tutorial Complete! 🎉",
        description:
          "Congratulations! You've learned the basics of Splendor. Now you're ready to play the full game. Reach 15 points to win!",
        focus: null,
      },
    };

    return overlayContent[tutorialStep] || null;
  };

  const content = getTutorialOverlay();
  const isCompleted = tutorialStep === "complete";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SplendorGameScene {...sceneProps} />

      {/* Tutorial Overlay - Semi-transparent background */}
      {!isCompleted && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-black/30" />
      )}

      {/* Tutorial Card */}
      <AnimatePresence>
        {!isCompleted && content && (
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto fixed left-1/2 top-1/2 z-40 w-[min(90vw,500px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_50px_rgba(251,191,36,0.3)] backdrop-blur-lg"
          >
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-slate-700">
              <motion.div
                className="h-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${(completedSteps.length / 8) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-amber-300">{content.title}</h2>
            <p className="mb-4 whitespace-pre-wrap text-sm text-slate-200">{content.description}</p>

            {content.focus && (
              <p className="mb-4 text-xs text-amber-200/80">
                ✨ The glowing area shows where you need to interact.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {tutorialStep !== "goal" && tutorialStep !== "actions" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const stepOrder: TutorialStep[] = [
                      "goal",
                      "actions",
                      "selectTokens",
                      "buyFirstCard",
                      "selectOnyxTokens",
                      "buySecondCard",
                      "buyReservedCard",
                      "nobles",
                      "complete",
                    ];
                    const currentIndex = stepOrder.indexOf(tutorialStep);
                    if (currentIndex > 0) {
                      setTutorialStep(stepOrder[currentIndex - 1]);
                    }
                  }}
                >
                  Back
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => {
                  if (tutorialStep === "goal") {
                    setTutorialStep("actions");
                  } else if (tutorialStep === "actions") {
                    setTutorialStep("selectTokens");
                  }
                }}
              >
                {tutorialStep === "goal" || tutorialStep === "actions" ? "Next" : "Continue"}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigate("/");
                }}
              >
                Exit
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Screen */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative w-[min(90vw,500px)] rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-[0_0_80px_rgba(251,191,36,0.4)]"
          >
            <h1 className="mb-2 text-4xl">🎉</h1>
            <h2 className="mb-3 text-3xl font-bold text-amber-300">Tutorial Complete!</h2>
            <p className="mb-6 text-slate-200">
              You've learned the basics of Splendor. Now you're ready to play the full game and reach 15 points to win!
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => {
                  navigate("/games");
                }}
                className="w-full"
              >
                Play Splendor Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  navigate("/");
                }}
              >
                Return to Menu
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
