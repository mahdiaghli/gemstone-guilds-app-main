import { cn } from '@/lib/utils';
import { Noble, GEM_TYPES, GEM_INFO } from '@/lib/gameData';

interface NobleDisplayProps {
  noble: Noble;
  compact?: boolean;
}

export default function NobleDisplay({ noble, compact }: NobleDisplayProps) {
  return (
    <div className={cn(
      'rounded-lg bg-card border border-primary/20 flex flex-col relative overflow-hidden',
      compact ? 'w-12 h-12 p-1' : 'w-14 h-14 md:w-16 md:h-16 p-1.5',
    )}>
      {/* Crown / Points */}
      <span className={cn(
        'font-cinzel font-bold text-primary',
        compact ? 'text-[10px]' : 'text-xs',
      )}>
        👑 {noble.points}
      </span>

      {/* Requirements */}
      <div className="flex flex-wrap gap-0.5 mt-auto">
        {GEM_TYPES.map(gem => {
          const req = noble.requirements[gem];
          if (!req) return null;
          return (
            <div
              key={gem}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: GEM_INFO[gem].darkColor,
                color: '#fff',
              }}
            >
              {req}
            </div>
          );
        })}
      </div>
    </div>
  );
}
