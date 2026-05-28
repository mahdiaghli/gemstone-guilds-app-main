import backCardZirkhaki from "@/assets/backCard-zirkhaki.webp";
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
      {/* کارت کوچک‌تر */}
      <img
        src={backCardZirkhaki}
        alt={label}
        className="h-[90px] w-[68px] rounded-[14px] object-cover shadow-[0_10px_22px_rgba(2,6,23,0.4)]"
      />
      <div className="absolute inset-0 rounded-[14px] bg-black/10" />

      {/* دکمه/برچسب شمارنده کوچک‌تر */}
      <div className="absolute right-1.5 top-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 font-cinzel text-sm text-amber-200 shadow-lg">
        {count}
      </div>
    </>
  );

  return (
    <div>
      {/* اگر برچسب متنی لازم بود می‌توانی این را فعال کنی */}
      {/* <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-white/45">{label}</p> */}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-dead-draw-deck={deckId}
          className={cn(
            "relative mx-auto block w-fit rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80",
            !disabled && "cursor-pointer transition-transform hover:-translate-y-0.5",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {content}
        </button>
      ) : (
        <div
          className="relative mx-auto block w-fit rounded-[14px]"
          data-dead-draw-deck={deckId}
        >
          {content}
        </div>
      )}
    </div>
  );
}
