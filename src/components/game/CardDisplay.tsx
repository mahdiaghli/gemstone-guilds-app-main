import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, GemType, GEM_TYPES, GEM_INFO } from '@/lib/gameData';
import { useLanguage } from '@/hooks/useLanguage';
import level1Img from '@/assets/level1.png';
import level2Img from '@/assets/level2.png';
import level3Img from '@/assets/level3.png';
import backcard1Img from '@/assets/backcard1.png';
import backcard2Img from '@/assets/backcard2.png';
import backcard3Img from '@/assets/backcard3.png';

const gemNameMap: Record<GemType, string> = {
  diamond: 'diamond',
  sapphire: 'sapphire',
  emerald: 'emerald',
  ruby: 'ruby',
  onyx: 'onyx',
};

interface CardDisplayProps {
  card: Card;
  onClick?: () => void;
  affordable?: boolean;
  compact?: boolean;
  showBack?: boolean;
}

const levelImages = { 1: level1Img, 2: level2Img, 3: level3Img };
const backCardImages = [backcard1Img, backcard2Img, backcard3Img];

export default function CardDisplay({ card, onClick, affordable, compact, showBack }: CardDisplayProps) {
  const { t } = useLanguage();
  const gemInfo = GEM_INFO[card.gemBonus];
  const cardImagePath = levelImages[card.level as 1 | 2 | 3];
  const backImagePath = backCardImages[Math.floor(Math.random() * 3)];

  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 relative overflow-hidden card-shine transition-all',
        'bg-card border-border',
        affordable && 'border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/40 scale-105',
        onClick && 'cursor-pointer',
        compact ? 'w-14 h-20' : 'w-[4.5rem] h-24 md:w-20 md:h-28',
      )}
      style={{
        backgroundImage: showBack ? `url('${backImagePath}')` : `url('${cardImagePath}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Points + Gem bonus overlay */}
      <div className="absolute inset-0 flex flex-col items-start justify-between p-1 md:p-1.5">
        <div className="flex justify-between items-start w-full gap-1">
          {card.points > 0 ? (
            <span className={cn(
              'font-cinzel font-bold text-foreground drop-shadow-lg bg-black/40 px-1.5 rounded-md',
              compact ? 'text-xs' : 'text-sm md:text-base',
            )}>
              {card.points}
            </span>
          ) : <span />}
          {/* Enlarged Gem Bonus Icon */}
          <div
            className={cn(
              'rounded-full ring-3 ring-white/70 shadow-lg drop-shadow-lg',
              compact ? 'w-5 h-5' : 'w-6 h-6 md:w-7 md:h-7',
            )}
            style={{
              backgroundColor: gemInfo.color,
              boxShadow: `0 0 12px ${gemInfo.color}, inset 0 0 6px rgba(255,255,255,0.5)`,
            }}
          />
        </div>
      </div>

      {/* Cost gems - bottom left */}
      <div className={cn(
        'absolute bottom-0.5 left-0.5 flex flex-col bg-black/40 p-0.5 rounded',
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
                'rounded-full flex items-center justify-center font-bold ring-1',
                compact ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[9px] md:w-[1.1rem] md:h-[1.1rem] md:text-[10px]',
              )}
              style={{
                backgroundColor: gi.darkColor,
                color: '#fff',
                boxShadow: `0 0 3px ${gi.color}`,
              }}
              title={`${cost}x ${t(gemNameMap[gem])}`}
            >
              {cost}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
