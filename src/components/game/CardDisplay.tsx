import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, GemType, GEM_TYPES, GEM_INFO } from '@/lib/gameData';

interface CardDisplayProps {
  card: Card;
  onClick?: () => void;
  affordable?: boolean;
  compact?: boolean;
}

export default function CardDisplay({ card, onClick, affordable, compact }: CardDisplayProps) {
  const gemInfo = GEM_INFO[card.gemBonus];

  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-lg border relative overflow-hidden card-shine',
        'bg-card border-border',
        affordable && 'border-primary/50 shadow-md shadow-primary/10',
        onClick && 'cursor-pointer',
        compact ? 'w-14 h-20' : 'w-[4.5rem] h-24 md:w-20 md:h-28',
      )}
      style={{
        background: `linear-gradient(180deg, ${gemInfo.bgColor} 0%, hsl(228 25% 11%) 50%)`,
      }}
    >
      {/* Points + Gem bonus */}
      <div className="flex justify-between items-start p-1 md:p-1.5">
        {card.points > 0 ? (
          <span className={cn(
            'font-cinzel font-bold text-foreground',
            compact ? 'text-xs' : 'text-sm md:text-base',
          )}>
            {card.points}
          </span>
        ) : <span />}
        <div
          className={cn(
            'rounded-full',
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5',
          )}
          style={{
            backgroundColor: gemInfo.color,
            boxShadow: `0 0 6px ${gemInfo.color}`,
          }}
        />
      </div>

      {/* Cost gems */}
      <div className={cn(
        'absolute bottom-0.5 left-0.5 flex flex-col',
        compact ? 'gap-0' : 'gap-0.5',
      )}>
        {GEM_TYPES.map(gem => {
          const cost = card.cost[gem];
          if (!cost) return null;
          const gi = GEM_INFO[gem];
          return (
            <div
              key={gem}
              className={cn(
                'rounded-full flex items-center justify-center font-bold',
                compact ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[9px] md:w-[1.1rem] md:h-[1.1rem] md:text-[10px]',
              )}
              style={{
                backgroundColor: gi.darkColor,
                color: '#fff',
                border: `1px solid ${gi.color}40`,
              }}
            >
              {cost}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
