import backCardZirkhaki from "@/assets/backCard-zirkhaki.png";
import { cn } from "@/lib/utils";

export function DeckCounter({
  label,
  count,
  onClick,
  disabled = false,
  deckId,
}: {
  label: string;
  count: number;
  onClick?: () => void;
  disabled?: boolean;
  deckId?: string;
}) {
  const content = (
    <>
      <img src={backCardZirkhaki} alt={label} className="h-[110px] w-[82px] rounded-[18px] object-cover shadow-[0_12px_28px_rgba(2,6,23,0.4)]" />
      <div className="absolute inset-0 rounded-[18px] bg-black/10" />
      <div className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2.5 py-1 font-cinzel text-lg text-amber-200 shadow-lg">{count}</div>
    </>
  );

  return (
    <div className="">
      <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/45">{label}</p>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-dead-draw-deck={deckId}
          className={cn(
            "relative mx-auto block w-fit rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80",
            !disabled && "cursor-pointer transition-transform hover:-translate-y-1",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {content}
        </button>
      ) : (
        <div className="relative mx-auto block w-fit rounded-[18px]" data-dead-draw-deck={deckId}>
          {content}
        </div>
      )}
    </div>
  );
}
