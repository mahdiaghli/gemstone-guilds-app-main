import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  BeastyBarGameState,
  AnimalCard,
  AnimalType,
} from "./types";
import { AnimalCardComponent } from "./AnimalCard";
import { getAnimalEmoji } from "./types";
import { ArrowRight, RotateCcw, Crown, DoorOpen, Ban } from "lucide-react";

interface BeastyBarBoardProps {
  state: BeastyBarGameState;
  currentPlayerIndex: number;
  isCurrentPlayerTurn: boolean;
  onPlayCard: (cardId: string) => void;
  onResolveEffect: (choice: unknown) => void;
  onRestart?: () => void;
  onGoToMenu?: () => void;
  lang: "en" | "fa";
  t: (key: string) => string;
  aiThinking: boolean;
  aiThinkingText: string;
}

type QueueFlight = {
  id: string;
  card: AnimalCard;
  start: { x: number; y: number };
  end: { x: number; y: number };
  destination: "cafe" | "exile";
};

export function BeastyBarBoard({
  state,
  currentPlayerIndex,
  isCurrentPlayerTurn,
  onPlayCard,
  onResolveEffect,
  onRestart,
  onGoToMenu,
  lang,
  t,
  aiThinking,
  aiThinkingText,
}: BeastyBarBoardProps) {
  const { bumpingZone, players, pendingEffect, lastAction, gameOver, winnerIndices } = state;
  const [queueFlights, setQueueFlights] = useState<QueueFlight[]>([]);
  const queueCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousQueuePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const previousStateRef = useRef<BeastyBarGameState | null>(null);
  const flightTimersRef = useRef<number[]>([]);

  const currentPlayer = players[currentPlayerIndex];
  const direction = bumpingZone.heavenGateDirection;
  const gateLabel = useMemo(() => getGateLabel(), [direction, lang]);
  const exileLabel = useMemo(() => getExileLabel(), [direction, lang]);

  useEffect(() => {
    return () => {
      flightTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    const previousState = previousStateRef.current;
    if (!previousState) {
      previousStateRef.current = state;
      return;
    }

    const currentQueueIds = new Set(state.bumpingZone.animals.map((animal) => animal.id));
    const nextFlights: QueueFlight[] = [];

    previousState.bumpingZone.animals.forEach((animal) => {
      if (currentQueueIds.has(animal.id)) return;

      const start = previousQueuePositionsRef.current[animal.id];
      if (!start) return;

      const enteredCafe = state.players[animal.ownerIndex]?.wildCafe.some((card) => card.id === animal.id);
      const enteredExile = state.players[animal.ownerIndex]?.thatsIt.some((card) => card.id === animal.id);
      if (!enteredCafe && !enteredExile) return;

      const targetSelector = enteredCafe
        ? `[data-beasty-destination="cafe-${animal.ownerIndex}"]`
        : `[data-beasty-destination="exile-${animal.ownerIndex}"]`;
      const targetNode = document.querySelector(targetSelector) as HTMLElement | null;
      if (!targetNode) return;

      const rect = targetNode.getBoundingClientRect();
      nextFlights.push({
        id: `${animal.id}-${Date.now()}-${enteredCafe ? "cafe" : "exile"}`,
        card: animal,
        start,
        end: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
        destination: enteredCafe ? "cafe" : "exile",
      });
    });

    if (nextFlights.length) {
      setQueueFlights((current) => [...current, ...nextFlights]);
      nextFlights.forEach((flight) => {
        const timerId = window.setTimeout(() => {
          setQueueFlights((current) => current.filter((item) => item.id !== flight.id));
          flightTimersRef.current = flightTimersRef.current.filter((id) => id !== timerId);
        }, 680);
        flightTimersRef.current.push(timerId);
      });
    }

    previousStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const nextPositions: Record<string, { x: number; y: number }> = {};
    bumpingZone.animals.forEach((animal) => {
      const node = queueCardRefs.current[animal.id];
      if (!node) return;
      const rect = node.getBoundingClientRect();
      nextPositions[animal.id] = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
    previousQueuePositionsRef.current = nextPositions;
  }, [bumpingZone.animals]);

  function getDirectionIcon() {
    if (direction === "normal") {
      return <ArrowRight className="w-6 h-6" />;
    }
    return <RotateCcw className="w-6 h-6" />;
  }

  function getGateLabel() {
    if (direction === "normal") {
      return { icon: <DoorOpen className="w-5 h-5" />, text: lang === "fa" ? "درگاه بهشت" : "Heaven's Gate", color: "text-amber-400" };
    }
    // Reversed - swap labels
    return { icon: <Ban className="w-5 h-5" />, text: lang === "fa" ? "تبعید" : "Exile", color: "text-rose-400" };
  }

  function getExileLabel() {
    if (direction === "normal") {
      return { icon: <Ban className="w-5 h-5" />, text: lang === "fa" ? "تبعید" : "Exile", color: "text-rose-400" };
    }
    // Reversed - swap labels
    return { icon: <DoorOpen className="w-5 h-5" />, text: lang === "fa" ? "درگاه بهشت" : "Heaven's Gate", color: "text-amber-400" };
  }

  // Check if the current local player is the one who needs to resolve the effect
  const isCurrentPlayerEffect = pendingEffect?.playerIndex === currentPlayerIndex;

  // Get the player who needs to make the choice
  const choosingPlayer = pendingEffect ? players[pendingEffect.playerIndex] : null;

  // Render pending effect choice UI
  const renderPendingEffect = () => {
    if (!pendingEffect) return null;

    switch (pendingEffect.kind) {
      case "kangaroo": {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 max-w-sm">
              <h3 className="font-cinzel text-xl text-amber-100 mb-4">
                {lang === "fa" ? "کانگرو می‌پرد" : "Kangaroo Jump"}
              </h3>
              <p className="text-slate-300 mb-4">
                {isCurrentPlayerEffect
                  ? (lang === "fa" ? "چند حیوان را می‌خواهی بپری؟" : "How many animals to jump over?")
                  : (lang === "fa" ? `${choosingPlayer?.name} در حال انتخاب است...` : `${choosingPlayer?.name} is choosing...`)
                }
              </p>
              <div className="flex gap-3 justify-center">
                {pendingEffect.jumpOptions.map((count) => (
                  <Button
                    key={count}
                    onClick={() => isCurrentPlayerEffect && onResolveEffect(count)}
                    disabled={!isCurrentPlayerEffect}
                    className={cn(
                      "bg-amber-500",
                      isCurrentPlayerEffect && "hover:bg-amber-600 cursor-pointer",
                      !isCurrentPlayerEffect && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "chameleon": {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 max-w-lg">
              <h3 className="font-cinzel text-xl text-amber-100 mb-4 text-center">
                {lang === "fa" ? "آفتاب‌پرست تقلید می‌کند" : "Chameleon Copies"}
              </h3>
              <p className="text-slate-300 mb-4 text-center">
                {isCurrentPlayerEffect
                  ? (lang === "fa" ? "یک کارت را انتخاب کن تا توانایی‌اش را کپی کنی:" : "Choose a card to copy its ability:")
                  : (lang === "fa" ? `${choosingPlayer?.name} در حال انتخاب است...` : `${choosingPlayer?.name} is choosing...`)
                }
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {pendingEffect.targetOptions.map((card) => (
                  <Button
                    key={card.id}
                    onClick={() => isCurrentPlayerEffect && onResolveEffect(card.id)}
                    disabled={!isCurrentPlayerEffect}
                    className={cn(
                      "bg-emerald-600 p-3 flex flex-col items-center gap-1",
                      isCurrentPlayerEffect && "hover:bg-emerald-700 cursor-pointer",
                      !isCurrentPlayerEffect && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-2xl">{getAnimalEmoji(card.type)}</span>
                    <span className="text-xs capitalize">{card.type}</span>
                    <span className="text-xs">⚡{card.power}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "parrot": {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 max-w-lg">
              <h3 className="font-cinzel text-xl text-amber-100 mb-4 text-center">
                {lang === "fa" ? "طوطی انتخاب می‌کند" : "Parrot Chooses"}
              </h3>
              <p className="text-slate-300 mb-4 text-center">
                {isCurrentPlayerEffect
                  ? (lang === "fa" ? "یک گونه را برای حذف همه کارت‌هایش انتخاب کن:" : "Choose a species to eliminate ALL its cards:")
                  : (lang === "fa" ? `${choosingPlayer?.name} در حال انتخاب است...` : `${choosingPlayer?.name} is choosing...`)
                }
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {pendingEffect.targetOptions.map((speciesType: AnimalType) => (
                  <Button
                    key={speciesType}
                    onClick={() => isCurrentPlayerEffect && onResolveEffect(speciesType)}
                    disabled={!isCurrentPlayerEffect}
                    className={cn(
                      "bg-rose-600 p-3 flex flex-col items-center gap-1",
                      isCurrentPlayerEffect && "hover:bg-rose-700 cursor-pointer",
                      !isCurrentPlayerEffect && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-2xl">{getAnimalEmoji(speciesType)}</span>
                    <span className="text-xs capitalize">{speciesType}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Render game over screen
  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-8 max-w-md text-center">
          <Crown className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h2 className="font-cinzel text-3xl text-amber-100 mb-4">
            {lang === "fa" ? "بازی تمام شد!" : "Game Over!"}
          </h2>
          <div className="space-y-2 mb-6">
            {winnerIndices.length === 1 ? (
              <p className="text-xl text-white">
                {lang === "fa" ? "برنده: " : "Winner: "}
                <span className="text-amber-400 font-bold">
                  {players[winnerIndices[0]].name}
                </span>
              </p>
            ) : (
              <div>
                <p className="text-xl text-white mb-2">
                  {lang === "fa" ? "برندگان:" : "Winners:"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {winnerIndices.map((idx) => (
                    <span
                      key={idx}
                      className="text-amber-400 font-bold bg-amber-400/20 px-3 py-1 rounded-full"
                    >
                      {players[idx].name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2 mb-6">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-2"
              >
                <span className="text-white">{player.name}</span>
                <span className="text-amber-400 font-bold">
                  {player.wildCafe.length} 🏠
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {onGoToMenu && (
              <Button
                onClick={onGoToMenu}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {lang === "fa" ? "برو به منو" : "Go to Menu"}
              </Button>
            )}
            {onRestart && (
              <Button
                onClick={onRestart}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {lang === "fa" ? "بازی دوباره" : "Play Again"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-2", gateLabel.color)}>
              {gateLabel.icon}
              <span className="font-cinzel text-sm">
                {gateLabel.text}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {getDirectionIcon()}
            </div>
          </div>
          <div className={cn("flex items-center gap-2", exileLabel.color)}>
            {exileLabel.icon}
            <span className="font-cinzel text-sm">
              {exileLabel.text}
            </span>
          </div>
        </div>
      </div>

      {/* Bumping Zone */}
      <div className="max-w-4xl mx-auto mb-8">
        <div
          className={cn(
            "bg-slate-900 rounded-3xl p-6 border-2",
            bumpingZone.animals.length === 5
              ? "border-amber-400 animate-pulse shadow-lg shadow-amber-400/50"
              : "border-slate-800"
          )}
        >
          <h3 className="font-cinzel text-lg text-center text-slate-400 mb-4">
            {lang === "fa" ? "ناحیه برخورد" : "Bumping Zone"}
            <span className="ml-2 text-sm">
              ({bumpingZone.animals.length}/{bumpingZone.maxSize})
            </span>
          </h3>

          {bumpingZone.animals.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {lang === "fa"
                ? "ناحیه برخورد خالی است. اولین کارت را بازی کنید!"
                : "Bumping Zone is empty. Play the first card!"}
            </div>
          ) : (
            <>
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 180, damping: 20, mass: 0.7 }}
                className="flex items-center justify-center gap-2 flex-wrap"
              >
                {bumpingZone.animals.map((animal, index) => (
                  <motion.div
                    key={animal.id}
                    ref={(node) => {
                      queueCardRefs.current[animal.id] = node;
                    }}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18, mass: 0.75 }}
                    className="relative"
                  >
                    <AnimalCardComponent
                      card={animal}
                      ownerName={players[animal.ownerIndex].name}
                      showOwner={true}
                      lang={lang}
                    />
                    {/* Position indicator */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* 5-card resolution warning */}
              {bumpingZone.animals.length === 5 && (
                <div className="mt-4 text-center">
                  <p className="text-amber-400 font-cinzel font-bold animate-pulse">
                    {lang === "fa"
                      ? "⚡ درگاه بهشت در حال حل شدن... ⚡"
                      : "⚡ Heaven's Gate Resolving... ⚡"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Player Stats */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                "bg-slate-900 rounded-xl p-3 border-2",
                player.index === currentPlayerIndex
                  ? "border-amber-400"
                  : "border-slate-800"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-cinzel text-sm text-white truncate">
                  {player.name}
                </span>
                {player.index === currentPlayerIndex && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span
                  data-beasty-destination={`cafe-${player.index}`}
                  className="text-slate-400"
                >
                  🏠 {player.wildCafe.length}
                </span>
                <span
                  data-beasty-destination={`exile-${player.index}`}
                  className="text-rose-400"
                >
                  ✕ {player.thatsIt.length}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {lang === "fa" ? "کارت‌ها:" : "Cards:"} {player.hand.length} |
                {" "}
                {lang === "fa" ? "پشته:" : "Stack:"} {player.drawStack.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Player Hand */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-slate-900 rounded-3xl p-6 border-2 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cinzel text-lg text-amber-100">
              {currentPlayer.name}
              {lang === "fa" ? " - دست شما" : "'s Hand"}
            </h3>
            {!isCurrentPlayerTurn && !aiThinking && (
              <span className="text-slate-500">
                {lang === "fa" ? "نوبت شما نیست" : "Not your turn"}
              </span>
            )}
          </div>

          {aiThinking ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mb-2" />
              <p className="text-slate-400">{aiThinkingText}</p>
            </div>
          ) : currentPlayer.hand.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {lang === "fa" ? "کارت باقی نمانده است" : "No cards remaining"}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {currentPlayer.hand.map((card) => (
                <AnimalCardComponent
                  key={card.id}
                  card={card}
                  onClick={() => isCurrentPlayerTurn && onPlayCard(card.id)}
                  disabled={!isCurrentPlayerTurn || pendingEffect !== null}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Last Action */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-slate-300 text-sm">{lastAction}</p>
        </div>
      </div>

      {/* Pending Effect Modal */}
      {renderPendingEffect()}

      <AnimatePresence>
        {queueFlights.map((flight) => (
          <motion.div
            key={flight.id}
            className="pointer-events-none fixed z-[80]"
            style={{
              left: flight.start.x - 44,
              top: flight.start.y - 56,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: flight.end.x - flight.start.x,
              y: flight.end.y - flight.start.y,
              scale: [1, 1.04, 0.9],
              opacity: [1, 0.96, 0.15],
              rotate: flight.destination === "exile" ? [0, 4, 12] : [0, -3, -8],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimalCardComponent
              card={flight.card}
              ownerName={players[flight.card.ownerIndex].name}
              showOwner={true}
              lang={lang}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
