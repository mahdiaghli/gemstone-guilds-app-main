import type { DeadMansDrawCard } from "@/lib/deadMansDraw";
import { cn } from "@/lib/utils";

import { SUIT_IMAGES } from "./shared";

export function CardChip({
  card,
  compact = false,
  highlighted = false,
  onClick,
  className,
}: {
  card: DeadMansDrawCard;
  compact?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const suitImage = SUIT_IMAGES[card.suit];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/80 shadow-[0_10px_30px_rgba(2,6,23,0.35)]",
        compact ? "h-[112px] w-[82px]" : "h-[160px] w-[116px]",
        onClick && "cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
        highlighted && "border-rose-400 shadow-[0_0_0_2px_rgba(248,113,113,0.55),0_10px_30px_rgba(2,6,23,0.35)]",
        className,
      )}
    >
      <img src={suitImage} alt={card.suit} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" />
      {highlighted ? <div className="absolute inset-0 bg-rose-500/10" /> : null}
      <div className={cn("absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 font-cinzel text-white shadow-lg", compact ? "text-sm" : "text-lg")}>{card.value}</div>
    </button>
  );
}
