import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, GemType, GEM_TYPES } from '@/lib/gameData';
import { useLanguage } from '@/hooks/useLanguage';
import level1Img from '@/assets/level1.png';
import level2Img from '@/assets/level2.png';
import level3Img from '@/assets/level3.png';
import backcard1Img from '@/assets/backcard1.png';
import backcard2Img from '@/assets/backcard2.png';
import backcard3Img from '@/assets/backcard3.png';
import gemDiamondImg from '@/assets/gem-diamond.png';
import gemSapphireImg from '@/assets/gem-blue.png';
import gemEmeraldImg from '@/assets/gem-emerald.png';
import gemRubyImg from '@/assets/gem-red.png';
import gemOnyxImg from '@/assets/gem-onyx.png';

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
  emphasizeAffordableCosts?: boolean;
}

const levelImages = { 1: level1Img, 2: level2Img, 3: level3Img };
const backCardImages = [backcard1Img, backcard2Img, backcard3Img];
const gemImages: Record<GemType, string> = {
  diamond: gemDiamondImg,
  sapphire: gemSapphireImg,
  emerald: gemEmeraldImg,
  ruby: gemRubyImg,
  onyx: gemOnyxImg,
};

export default function CardDisplay({
  card,
  onClick,
  affordable,
  compact,
  showBack,
  emphasizeAffordableCosts,
}: CardDisplayProps) {
  const { t } = useLanguage();
  const cardImagePath = levelImages[card.level as 1 | 2 | 3];
  const backImagePath = backCardImages[Math.floor(Math.random() * 3)];
  const costEntries = GEM_TYPES.filter((gem) => card.cost[gem]);
  const costLayoutClass = costEntries.length > 2
    ? 'grid grid-cols-[auto_auto] grid-rows-2 gap-x-1 gap-y-0.5'
    : 'flex flex-col gap-0.5';

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
      {!showBack ? (
        <>
          <div className="absolute inset-x-0 top-0 h-[30%] bg-[linear-gradient(180deg,rgba(247,244,236,0.45),rgba(226,221,211,0.28))]" />
        </>
      ) : null}

      {/* Points + Gem bonus overlay */}
      <div className="absolute inset-0 flex flex-col items-start justify-between p-1 md:p-1.5">
        <div className="flex justify-between items-start w-full gap-1">
          {card.points > 0 ? (
            <span
              className={cn(
                'font-cinzel font-bold text-white',
                'flex items-center justify-center',
                'rounded-full bg-black/85 saturate-25',
                compact
                  ? 'w-4 h-4 text-[9px]'
                  : 'w-5 h-5 md:w-6 md:h-6 text-xs md:text-sm'
              )}
            >
              {card.points}
            </span>
          ) : <span />}

          <img
            src={gemImages[card.gemBonus]}
            alt={t(gemNameMap[card.gemBonus])}
            className={cn(
              'drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]',
              compact ? 'h-5 w-5' : 'h-6 w-6 md:h-7 md:w-7',
            )}
          />
        </div>
      </div>
      <div className={cn(
        'absolute bottom-0.5 left-0.5 max-w-[85%] rounded bg-black/42 p-0.5',
        costLayoutClass,
      )}>
        {costEntries.map((gem, index) => {
          const cost = card.cost[gem];
          if (!cost) return null;

          const gridPlacement = costEntries.length > 2
            ? index === 2
              ? 'col-start-2 row-start-1'
              : index === 3
                ? 'col-start-2 row-start-2'
                : index === 1
                  ? 'col-start-1 row-start-2'
                  : 'col-start-1 row-start-1'
            : '';

          return (
            <div
              key={gem}
              className={cn(
                'flex items-center gap-0.5 rounded-md bg-black/55 px-0.5 py-[1px] font-bold text-white ring-1',
                compact ? 'text-[7px]' : 'text-[9px] md:text-[10px]',
                affordable && emphasizeAffordableCosts
                  ? 'ring-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.55)]'
                  : 'ring-transparent',
                gridPlacement,
              )}
              title={`${cost}x ${t(gemNameMap[gem])}`}
            >
              <img
                src={gemImages[gem]}
                alt={t(gemNameMap[gem])}
                className={compact ? 'h-3 w-3' : 'h-4 w-4 md:h-[1.05rem] md:w-[1.05rem]'}
              />
              <span>{cost}</span>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
}
