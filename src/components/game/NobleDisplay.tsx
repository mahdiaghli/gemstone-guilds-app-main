import { cn } from '@/lib/utils';
import { Noble, GEM_TYPES, GemType } from '@/lib/gameData';
import { useLanguage } from '@/hooks/useLanguage';
import noble1Img from '@/assets/noble1.png';
import noble10Img from '@/assets/noble10.png';
import noble2Img from '@/assets/noble2.png';
import noble3Img from '@/assets/noble3.png';
import noble4Img from '@/assets/noble4.png';
import noble5Img from '@/assets/noble5.png';
import noble6Img from '@/assets/noble6.png';
import noble7Img from '@/assets/noble7.png';
import noble8Img from '@/assets/noble8.png';
import noble9Img from '@/assets/noble9.png';
import gemDiamondImg from '@/assets/gem-diamond.png';
import gemSapphireImg from '@/assets/gem-blue.png';
import gemEmeraldImg from '@/assets/gem-emerald.png';
import gemRubyImg from '@/assets/gem-red.png';
import gemOnyxImg from '@/assets/gem-onyx.png';

interface NobleDisplayProps {
  noble: Noble;
  compact?: boolean;
}

const gemNameMap: Record<string, string> = {
  diamond: 'diamond',
  sapphire: 'sapphire',
  emerald: 'emerald',
  ruby: 'ruby',
  onyx: 'onyx',
};

export const nobleImages = [
  noble1Img,
  noble2Img,
  noble3Img,
  noble4Img,
  noble5Img,
  noble6Img,
  noble7Img,
  noble8Img,
  noble9Img,
  noble10Img,
];
const gemImages: Record<GemType, string> = {
  diamond: gemDiamondImg,
  sapphire: gemSapphireImg,
  emerald: gemEmeraldImg,
  ruby: gemRubyImg,
  onyx: gemOnyxImg,
};

export default function NobleDisplay({ noble, compact }: NobleDisplayProps) {
  const { t } = useLanguage();
  const nobleIndex = typeof noble.id === 'number' ? noble.id : Number(noble.id);
  const nobleImage = nobleImages[(Math.max(1, nobleIndex) - 1) % nobleImages.length];
  const requirementEntries = GEM_TYPES.filter((gem) => noble.requirements[gem]);
  
  return (
    <div 
      className={cn(
        'rounded-lg bg-card border border-primary/20 flex flex-col relative overflow-hidden',
        compact ? 'w-12 h-12 p-1' : 'w-14 h-14 md:w-16 md:h-16 p-2',
      )}
      style={{
        backgroundImage: `url('${nobleImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-noble-id={String(noble.id)}
    >
      {/* <div className="absolute inset-x-0 top-0 h-[32%] bg-[linear-gradient(180deg,rgba(247,244,236,0.55),rgba(226,221,211,0.25))]" />
      <div className="absolute inset-x-0 top-[32%] h-px bg-black/10" /> */}

{/* Points - top right corner - white text with faint black circle behind */}
<div className="absolute top-0.5 right-0.5">
  <div
    className={cn(
      'flex items-center justify-center rounded-full',
      'bg-black/35 ring-1 ring-black/20 backdrop-blur-[1px]',
      compact ? 'h-2 w-2' : 'h-3 w-3 md:h-7 md:w-7',
    )}
  >
    <span
      className={cn(
        'font-cinzel font-bold text-white leading-none',
        'drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]',
        compact ? 'text-[10px]' : 'text-xs md:text-sm',
      )}
    >
      {noble.points}
    </span>
  </div>
</div>


      {/* Requirements - left side */}
      <div className="absolute bottom-0.5 left-0.5 top-0.5 flex flex-col justify-end gap-0.5 rounded bg-black/42 p-0.5">
        {requirementEntries.map(gem => {
          const req = noble.requirements[gem];
          if (!req) return null;
          return (
            <div
              key={gem}
              className={cn(
                'flex items-center gap-0.5 rounded-md font-bold text-white',
                compact ? 'text-[6px]' : 'text-[7px] md:text-[8px]',
              )}
              title={`${req}x ${t(gemNameMap[gem] as any)}`}
            >
              <img src={gemImages[gem]} alt={t(gemNameMap[gem] as any)} className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              <span>{req}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
