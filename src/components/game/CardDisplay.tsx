import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, GemType, GEM_TYPES } from '@/lib/gameData';
import { useLanguage, type TranslationKey } from '@/hooks/useLanguage';
import backcard1Img from '@/assets/backcard1.png';
import backcard2Img from '@/assets/backcard2.png';
import backcard3Img from '@/assets/backcard3.png';
import diamond1Img from '@/assets/diamond1.png';
import diamond21Img from '@/assets/diamond21.png';
import diamond22Img from '@/assets/diamond22.png';
import diamond44Img from '@/assets/diamond44.png';
import diamond53Img from '@/assets/diamond53.png';
import blue1Img from '@/assets/blue1.png';
import blue21Img from '@/assets/blue21.png';
import blue22Img from '@/assets/blue22.png';
import blue44Img from '@/assets/blue44.png';
import blue53Img from '@/assets/blue53.png';
import green1Img from '@/assets/green1.png';
import green21Img from '@/assets/green21.png';
import green22Img from '@/assets/green22.png';
import green44Img from '@/assets/green44.png';
import green53Img from '@/assets/green53.png';
import red1Img from '@/assets/red1.png';
import red21Img from '@/assets/red21.png';
import red22Img from '@/assets/red22.png';
import red44Img from '@/assets/red44.png';
import red53Img from '@/assets/red53.png';
import onyx1Img from '@/assets/onyx1.png';
import onyx21Img from '@/assets/onyx21.png';
import onyx22Img from '@/assets/onyx22.png';
import onyx44Img from '@/assets/onyx44.png';
import onyx53Img from '@/assets/onyx53.png';
import gemDiamondImg from '@/assets/gem-diamond.png';
import gemSapphireImg from '@/assets/gem-blue.png';
import gemEmeraldImg from '@/assets/gem-emerald.png';
import gemRubyImg from '@/assets/gem-red.png';
import gemOnyxImg from '@/assets/gem-onyx.png';

const gemNameMap: Record<GemType, TranslationKey> = {
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
  highlighted?: boolean;
  dimmed?: boolean;
  showBack?: boolean;
  emphasizeAffordableCosts?: boolean;
  costStatus?: Partial<Record<GemType, boolean>>;
  dataCardId?: string | number;
  animateIn?: boolean;
  staggerIndex?: number;
}

const backCardImages = [backcard1Img, backcard2Img, backcard3Img];
const gemImages: Record<GemType, string> = {
  diamond: gemDiamondImg,
  sapphire: gemSapphireImg,
  emerald: gemEmeraldImg,
  ruby: gemRubyImg,
  onyx: gemOnyxImg,
};
const cardFaceImages: Record<GemType, Record<string, string>> = {
  diamond: {
    level1: diamond1Img,
    level2a: diamond21Img,
    level2b: diamond22Img,
    level3a: diamond53Img,
    level3b: diamond44Img,
  },
  sapphire: {
    level1: blue1Img,
    level2a: blue21Img,
    level2b: blue22Img,
    level3a: blue53Img,
    level3b: blue44Img,
  },
  emerald: {
    level1: green1Img,
    level2a: green21Img,
    level2b: green22Img,
    level3a: green53Img,
    level3b: green44Img,
  },
  ruby: {
    level1: red1Img,
    level2a: red21Img,
    level2b: red22Img,
    level3a: red53Img,
    level3b: red44Img,
  },
  onyx: {
    level1: onyx1Img,
    level2a: onyx21Img,
    level2b: onyx22Img,
    level3a: onyx53Img,
    level3b: onyx44Img,
  },
};

function getCardSequence(card: Card) {
  if (typeof card.id !== 'string') return 0;
  const match = card.id.match(/-(\d{2})$/);
  return match ? Number(match[1]) : 0;
}

function getCardFaceImage(card: Card) {
  const artSet = cardFaceImages[card.gemBonus];
  if (card.level === 1) return artSet.level1;

  if (card.level === 2) {
    const sequence = getCardSequence(card);
    return sequence >= 4 ? artSet.level2b : artSet.level2a;
  }

  return card.points === 4 ? artSet.level3b : artSet.level3a;
}

export default function CardDisplay({
  card,
  onClick,
  affordable,
  compact,
  highlighted,
  dimmed,
  showBack,
  emphasizeAffordableCosts,
  costStatus,
  dataCardId,
  animateIn,
  staggerIndex = 0,
}: CardDisplayProps) {
  const { t } = useLanguage();
  const cardImagePath = getCardFaceImage(card);
  const backImagePath = backCardImages[Math.floor(Math.random() * 3)];
  const costEntries = GEM_TYPES.filter((gem) => card.cost[gem]);
  const costLayoutClass = costEntries.length > 2
    ? 'grid grid-cols-[auto_auto] grid-rows-2 gap-x-1 gap-y-0.5'
    : 'flex flex-col gap-0.5';

  return (
    <motion.div
      initial={animateIn ? { opacity: 0, rotateY: -90, scale: 0.85 } : undefined}
      animate={animateIn ? { opacity: 1, rotateY: 0, scale: 1 } : undefined}
      transition={animateIn ? { duration: 0.35, delay: staggerIndex * 0.06, ease: [0.34, 1.56, 0.64, 1] } : undefined}
      whileHover={onClick ? { y: -4, scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 relative overflow-hidden card-shine transition-all',
        'bg-card border-border',
        affordable && 'border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/40 scale-105',
        highlighted && 'ring-2 ring-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.55)]',
        dimmed && 'opacity-45 saturate-50',
        onClick && 'cursor-pointer',
        compact ? 'w-14 h-20' : 'w-[4.5rem] h-24 md:w-20 md:h-28',
      )}
      style={{
        backgroundImage: showBack ? `url('${backImagePath}')` : `url('${cardImagePath}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-card-id={String(dataCardId ?? card.id)}
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
    'flex items-center gap-0.2 rounded-md bg-black/55 px-0.5 py-[1px] font-bold text سفید ring-1',
                compact       ? 'text-[7px] px-1'
                              : 'text-[9px] md:text-[10px] px-0.5',
                                'min-w-[1.6rem]',
                (affordable && emphasizeAffordableCosts) || costStatus?.[gem]
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
