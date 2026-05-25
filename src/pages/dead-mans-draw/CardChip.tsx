import type { DeadMansDrawCard } from "@/lib/deadMansDraw";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { SUIT_IMAGES, SUIT_TRANSLATION_KEYS } from "./shared";
import { useLanguage } from "@/hooks/useLanguage";

export function CardChip({
  card,
  compact = false,
  highlighted = false,
  onClick,
  className,
  isBusting = false,
}: {
  card: DeadMansDrawCard;
  compact?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
  isBusting?: boolean;
}) {
  const suitImage = SUIT_IMAGES[card.suit];
  const { t, dir } = useLanguage();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={isBusting ? {
        x: [0, -5, 5, -5, 5, -3, 3, 0],
        rotate: [0, -5, 5, -5, 5, -3, 3, 0],
      } : {}}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/80 shadow-[0_8px_24px_rgba(2,6,23,0.4),0_0_0_1px_rgba(255,255,255,0.05)]",
        compact ? "h-[112px] w-[82px]" : "h-[160px] w-[116px]",
        onClick && "cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
        highlighted && "border-rose-400 shadow-[0_0_0_2px_rgba(248,113,113,0.55),0_8px_24px_rgba(2,6,23,0.4),0_0_0_1px_rgba(255,255,255,0.05)]",
        isBusting && "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]",
        className,
      )}
    >
      <img src={suitImage} alt={card.suit} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" />
      {highlighted ? <div className="absolute inset-0 bg-rose-500/10" /> : null}
      {isBusting ? <div className="absolute inset-0 bg-red-500/30 animate-pulse" /> : null}
      <div className={cn("absolute right-2 top-2 rounded-full bg-black/75 px-2.5 py-1.5 font-cinzel font-bold text-white shadow-lg", compact ? "text-base" : "text-xl")}>
        {card.value}
      </div>

      {/* Card name at bottom */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-[18px] bg-black/60 py-1.5 px-2",
      )}>
        <p className={cn(
          "truncate text-center text-xs font-medium text-white/90",
          dir === "rtl" ? "font-persian text-sm" : "font-cinzel",
          compact ? "text-[10px]" : "text-sm",
        )}>
          {t(SUIT_TRANSLATION_KEYS[card.suit])}
        </p>
      </div>
    </motion.button>
  );
}
