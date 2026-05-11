import { cn } from "@/lib/utils";
import type { AnimalCard as AnimalCardType, AnimalType } from "./types";
import { getAnimalEmoji, ANIMAL_NAMES } from "./types";

interface AnimalCardProps {
  card: AnimalCardType;
  onClick?: () => void;
  disabled?: boolean;
  isHighlighted?: boolean;
  isSmall?: boolean;
  showOwner?: boolean;
  ownerName?: string;
  lang?: "en" | "fa";
}

const colorMap: Record<string, string> = {
  red: "from-rose-500 to-red-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-green-600",
  yellow: "from-amber-500 to-yellow-600",
};

export function AnimalCardComponent({
  card,
  onClick,
  disabled = false,
  isHighlighted = false,
  isSmall = false,
  showOwner = false,
  ownerName,
  lang = "en",
}: AnimalCardProps) {
  const emoji = getAnimalEmoji(card.type);
  const name = ANIMAL_NAMES[card.type][lang];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 shadow-lg transition-all duration-300",
        // Player 1: Blue, Player 2: Red, Player 3: Yellow, Player 4: Green
        colorMap[card.ownerIndex % 4 === 0 ? "blue" : card.ownerIndex % 4 === 1 ? "red" : card.ownerIndex % 4 === 2 ? "yellow" : "green"],
        isHighlighted && "ring-4 ring-amber-400 ring-offset-2",
        onClick && !disabled && "hover:scale-105 active:scale-95 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        isSmall ? "w-16 h-20 p-1" : "w-20 h-28 p-2"
      )}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl" />
      
      {/* Power badge */}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
        {card.power}
      </div>

      {/* Repeatable indicator */}
      {card.isRepeatable && (
        <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
          <span className="text-white text-xs">↻</span>
        </div>
      )}

      {/* Emoji */}
      <span className={cn("relative z-10", isSmall ? "text-2xl" : "text-4xl")}>
        {emoji}
      </span>

      {/* Name */}
      <span
        className={cn(
          "relative z-10 mt-1 text-center font-cinzel font-bold text-white leading-tight",
          isSmall ? "text-[8px]" : "text-[10px]"
        )}
      >
        {name}
      </span>

      {/* Owner name */}
      {showOwner && ownerName && (
        <span
          className={cn(
            "absolute bottom-1 text-center text-white/80",
            isSmall ? "text-[6px]" : "text-[8px]"
          )}
        >
          {ownerName}
        </span>
      )}

      {/* Chameleon copy indicator */}
      {card.copiedType && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-purple-500 border border-white flex items-center justify-center">
          <span className="text-white text-[8px]">?</span>
        </div>
      )}
    </button>
  );
}
