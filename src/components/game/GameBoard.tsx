import { AnimatePresence, motion } from "framer-motion";

import CardDisplay from "@/components/game/CardDisplay";
import GemToken from "@/components/game/GemToken";
import NobleDisplay from "@/components/game/NobleDisplay";
import PlayerPanel from "@/components/game/PlayerPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  GEM_TYPES,
  GameState,
  GemType,
  LEVEL_COLORS,
  TOKEN_TYPES,
  TokenType,
} from "@/lib/gameData";
import { canPlayerAffordCard, getPlayerBonuses } from "@/lib/gameLogic";

type GameBoardProps = {
  t: (key: string, values?: Record<string, string | number>) => string;
  state: GameState;
  currentPlayer: GameState["players"][number];
  panelCount: number;
  phase: "idle" | "selectingTokens" | "mustReturnTokens" | "cardAction" | "aiThinking";
  tempPoolDisplay: Record<TokenType, number> | null;
  selectedGems: GemType[];
  selectedCard: Card | null;
  isAIPlayer: (index: number) => boolean;
  getPlayerDisplayName: (index: number) => string;
  handleReturnToken: (token: TokenType) => void;
  handleReserveDeck: (level: 1 | 2 | 3) => void;
  handleCardClick: (card: Card) => void;
  handleGemClick: (gem: GemType) => void;
  handleConfirmTokens: () => void;
  actionSubmitting?: boolean;
  handleCancel: () => void;
  backCardsByLevel: Record<1 | 2 | 3, string>;
  tutorialFocus?: "tokens" | "card" | "cards" | "nobles" | "panel";
};

export default function GameBoard({
  t,
  state,
  currentPlayer,
  panelCount,
  phase,
  tempPoolDisplay,
  selectedGems,
  selectedCard,
  isAIPlayer,
  getPlayerDisplayName,
  handleReturnToken,
  handleReserveDeck,
  handleCardClick,
  handleGemClick,
  handleConfirmTokens,
  actionSubmitting,
  handleCancel,
  backCardsByLevel,
  tutorialFocus,
}: GameBoardProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn("mb-3 flex gap-2 overflow-x-auto pb-1 rounded-xl transition-all", tutorialFocus === "nobles" && "ring-4 ring-amber-300 bg-amber-500/15 p-2 shadow-[0_0_28px_rgba(251,191,36,0.45)]")}
      >
        <span className="mr-1 self-center font-cinzel text-[12px] tracking-wider text-muted-foreground">
          {t("nobles")}
        </span>
        {state.nobles.map((noble) => (
          <NobleDisplay key={noble.id} noble={noble} />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className={cn("mb-3 space-y-2 rounded-xl transition-all", (tutorialFocus === "cards" || tutorialFocus === "card") && "ring-4 ring-amber-300 bg-amber-500/15 p-2 shadow-[0_0_28px_rgba(251,191,36,0.45)]")}
      >
        {([3, 2, 1] as const).map((level) => (
          <div key={level} className="flex items-center gap-1.5 md:gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReserveDeck(level)}
              className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors hover:border-primary/40 md:h-32 md:w-24"
              style={{ borderColor: `${LEVEL_COLORS[level]}60` }}
              data-deck-level={level}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url('${backCardsByLevel[level]}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center p-2">
                <span className="mt-14 text-[12px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] md:mt-[4.25rem]">
                  {state.decks[level].length}
                </span>
              </div>
            </motion.button>

            {state.visibleCards[level].map((card, index) =>
              card ? (
                <CardDisplay
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  affordable={canPlayerAffordCard(currentPlayer, card)}
                  dataCardId={card.id}
                  animateIn
                  staggerIndex={(3 - level) * 4 + index}
                />
              ) : (
                <div
                  key={`e-${level}-${index}`}
                  className="h-28 w-20 rounded-lg border border-dashed border-border/30 md:h-32 md:w-24"
                />
              ),
            )}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className={cn("mb-3 rounded-xl border border-border/30 bg-card/50 p-3 transition-all", tutorialFocus === "tokens" && "ring-4 ring-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.45)]")}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {GEM_TYPES.map((gem) => {
            const displayCount = tempPoolDisplay ? tempPoolDisplay[gem] : state.tokenPool[gem];
            return (
              <GemToken
                key={gem}
                type={gem}
                count={displayCount}
                onClick={() => handleGemClick(gem)}
                selected={selectedGems.includes(gem)}
                disabled={state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)}
                size="md"
                dataTokenPool={gem}
              />
            );
          })}
          <div className="mx-1 h-8 w-px bg-border/50" />
          <GemToken type="gold" count={state.tokenPool.gold} size="md" dataTokenPool="gold" />
        </div>

        <AnimatePresence>
          {phase === "selectingTokens" && selectedGems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex justify-center gap-2"
            >
              <Button variant="game" size="sm" onClick={handleConfirmTokens} disabled={actionSubmitting}>
                {t("take")} {selectedGems.length === 2 && selectedGems[0] === selectedGems[1] ? t("takeSame") : selectedGems.length}
              </Button>
              <Button variant="game-secondary" size="sm" onClick={handleCancel} disabled={actionSubmitting}>
                {t("cancel")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn(
          "grid gap-2",
          panelCount <= 2
            ? "grid-cols-2"
            : panelCount === 3
              ? "grid-cols-2"
              : "grid-cols-2 md:grid-cols-4",
          tutorialFocus === "panel" && "rounded-xl ring-4 ring-amber-300 bg-amber-500/15 p-2 shadow-[0_0_28px_rgba(251,191,36,0.45)]",
        )}
      >
        {state.players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 + index * 0.08 }}
            className={
              panelCount === 3 && index === 2
                ? "col-span-2 w-full md:mx-auto md:w-[calc(50%-0.25rem)]"
                : ""
            }
          >
            <PlayerPanel
              player={player}
              playerName={getPlayerDisplayName(player.id)}
              isActive={player.id === state.currentPlayerIndex}
              isAI={isAIPlayer(player.id)}
              onReservedCardClick={
                player.id === state.currentPlayerIndex && !isAIPlayer(player.id)
                  ? handleCardClick
                  : undefined
              }
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
