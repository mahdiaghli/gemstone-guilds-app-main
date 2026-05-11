import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Player, Card, GEM_TYPES, TOKEN_TYPES, GEM_INFO } from '@/lib/gameData';
import { getPlayerBonuses, getPlayerScore, canPlayerAffordCard } from '@/lib/gameLogic';
import { useLanguage } from '@/hooks/useLanguage';
import CardDisplay from './CardDisplay';
import NobleDisplay from './NobleDisplay';
import panelBackground from '@/assets/background.png';

interface PlayerPanelProps {
  player: Player;
  playerName?: string; // Optional: custom name from online game
  isActive: boolean;
  isAI?: boolean;
  onReservedCardClick?: (card: Card) => void;
  highlightedTokenTypes?: TokenType[];
  highlightReservedArea?: boolean;
  highlightedReservedCardIds?: Array<string | number>;
}

export default function PlayerPanel({
  player,
  playerName,
  isActive,
  isAI,
  onReservedCardClick,
  highlightedTokenTypes = [],
  highlightReservedArea,
  highlightedReservedCardIds = [],
}: PlayerPanelProps) {
  const bonuses = getPlayerBonuses(player);
  const score = getPlayerScore(player);
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
      'rounded-lg border bg-cover bg-center p-2 transition-all min-w-0',
      isActive
        ? 'border-primary/60 ring-1 ring-primary/20 shadow-md shadow-primary/10'
        : 'border-border/50 opacity-70',
    )}
    style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.90), rgba(0, 0, 0, 0.90)), url(${panelBackground})`,
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <span className={cn(
          'font-cinzel text-xs tracking-wider',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}>
          {isAI ? '🤖 ' : ''}{playerName || player.name || `${t('player')} ${player.id + 1}`}
        </span>
        <span className="font-cinzel text-sm font-bold text-primary">{score}</span>
      </div>

      {/* Tokens */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {TOKEN_TYPES.map(type => {
          const hasToken = player.tokens[type] > 0;
          const highlighted = highlightedTokenTypes.includes(type);
          return (
            <div
              key={type}
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1 py-0.5 transition-all",
                highlighted && "shadow-[0_0_16px_rgba(251,191,36,0.38)] ring-1 ring-amber-300/70",
              )}
              data-player-token-slot={`${player.id}-${type}`}
            >
              <div
                className={cn("w-3 h-3 rounded-full transition-opacity", hasToken ? "opacity-100" : "opacity-25")}
                style={{ backgroundColor: GEM_INFO[type].color }}
              />
              <span className={cn("text-[10px] font-bold transition-opacity", hasToken ? "text-foreground opacity-100" : "text-foreground/25 opacity-100")}>{player.tokens[type]}</span>
            </div>
          );
        })}
      </div>

      {/* Card Bonuses - stacked icons */}
      <div className="flex gap-1.5 mb-1">
        {GEM_TYPES.map(gem => {
          const count = bonuses[gem];
          return (
            <div key={gem} className="flex items-center gap-0.5 relative" data-player-bonus-slot={`${player.id}-${gem}`}>
              {/* Stacked card icons */}
              <div className="relative" style={{ width: 10 + Math.max(0, count - 1) * 3, height: 14 }}>
                {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-3.5 rounded-[2px] border"
                    style={{
                      backgroundColor: GEM_INFO[gem].bgColor,
                      borderColor: count > 0 ? GEM_INFO[gem].color + '80' : GEM_INFO[gem].darkColor + '40',
                      left: i * 3,
                      zIndex: i,
                    }}
                  />
                ))}
                {count === 0 && (
                  <div
                    className="absolute w-2.5 h-3.5 rounded-[2px] border"
                    style={{
                      backgroundColor: GEM_INFO[gem].darkColor + '10',
                      borderColor: GEM_INFO[gem].darkColor + '20',
                    }}
                  />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-bold ml-0.5',
                count > 0 ? 'text-foreground' : 'text-muted-foreground/40',
              )}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reserved cards */}
      <div
        className={cn(
          "mt-1.5 border-t border-border/30 pt-1.5 transition-all",
          highlightReservedArea && "rounded-lg bg-amber-400/10 ring-2 ring-amber-300/80 shadow-[0_0_20px_rgba(251,191,36,0.25)]",
        )}
        data-player-reserved-slot={String(player.id)}
      >
        {player.reservedCards.length > 0 && isActive && (
          <div className="flex gap-1 overflow-x-auto px-1 py-1">
            {player.reservedCards.map(card => (
              <CardDisplay
                key={card.id}
                card={card}
                dataCardId={card.id}
                compact
                highlighted={highlightedReservedCardIds.includes(card.id)}
                onClick={isAI ? undefined : () => onReservedCardClick?.(card)}
                affordable={canPlayerAffordCard(player, card)}
              />
            ))}
          </div>
        )}
        {player.reservedCards.length > 0 && !isActive && (
          <span className="text-[10px] text-muted-foreground">
            {player.reservedCards.length} {t('reserved')}
          </span>
        )}
      </div>

      {/* Nobles */}
      <div className="flex gap-1 mt-1 min-h-3" data-player-nobles-slot={String(player.id)}>
        {player.nobles.length > 0 ? (
          player.nobles.map(n => (
            <div key={n.id} data-player-noble-slot={`${player.id}-${n.id}`}>
              <NobleDisplay noble={n} compact />
            </div>
          ))
        ) : null}
      </div>
    </motion.div>
  );
}
