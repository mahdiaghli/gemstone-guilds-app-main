import { cn } from '@/lib/utils';
import { Noble, GEM_TYPES, GEM_INFO } from '@/lib/gameData';
import { useLanguage } from '@/hooks/useLanguage';
import noble1Img from '@/assets/noble1.png';

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

export default function NobleDisplay({ noble, compact }: NobleDisplayProps) {
  const { t } = useLanguage();
  
  return (
    <div 
      className={cn(
        'rounded-lg bg-card border border-primary/20 flex flex-col relative overflow-hidden',
        compact ? 'w-12 h-12 p-1' : 'w-14 h-14 md:w-16 md:h-16 p-2',
      )}
      style={{
        backgroundImage: `url('${noble1Img}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Crown / Points - top - MORE PROMINENT */}
      <span className={cn(
        'font-cinzel font-bold text-primary drop-shadow-lg bg-black/40 px-1.5 py-0.5 rounded',
        compact ? 'text-xs' : 'text-sm md:text-base',
      )}>
        👑 {noble.points}
      </span>

      {/* Requirements - bottom */}
      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex flex-wrap gap-0.5">
        {GEM_TYPES.map(gem => {
          const req = noble.requirements[gem];
          if (!req) return null;
          return (
            <div
              key={gem}
              className={cn(
                'rounded-full flex items-center justify-center font-bold ring-1 ring-white/60 bg-opacity-90',
                compact ? 'w-3 h-3 text-[6px]' : 'w-3.5 h-3.5 text-[7px] md:text-[8px]',
              )}
              style={{
                backgroundColor: GEM_INFO[gem].darkColor,
                color: '#fff',
              }}
              title={`${req}x ${t(gemNameMap[gem] as any)}`}
            >
              {req}
            </div>
          );
        })}
      </div>
    </div>
  );
}
