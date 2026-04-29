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
import { canPlayerAffordCard, getPlayerBonuses, getTotalTokens } from "@/lib/gameLogic";

type GameBoardProps = {
  t: (key: string) => string;
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
  handleCancel: () => void;
  backCardsByLevel: Record<1 | 2 | 3, string>;
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
  handleCancel,
  backCardsByLevel,
}: GameBoardProps) {
  return (
    <>
      <AnimatePresence>
        {phase === "mustReturnTokens" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center"
          >
            <p className="font-body text-sm text-foreground">
              {t("tooManyTokens")} ({getTotalTokens(currentPlayer)} → 10)
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {TOKEN_TYPES.map(
                (type) =>
                  currentPlayer.tokens[type] > 0 && (
                    <GemToken
                      key={type}
                      type={type}
                      count={currentPlayer.tokens[type]}
                      size="sm"
                      onClick={() => handleReturnToken(type)}
                    />
                  ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <span className="mr-1 self-center font-cinzel text-[10px] tracking-wider text-muted-foreground">
          {t("nobles")}
        </span>
        {state.nobles.map((noble) => (
          <NobleDisplay key={noble.id} noble={noble} />
        ))}
      </div>

      <div className="mb-3 space-y-2">
        {([3, 2, 1] as const).map((level) => (
          <div key={level} className="flex items-center gap-1.5 md:gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReserveDeck(level)}
              className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border-2 transition-colors hover:border-primary/40 md:h-28 md:w-20"
              style={{ borderColor: `${LEVEL_COLORS[level]}60` }}
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
                <span className="mt-14 text-[10px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] md:mt-[4.25rem]">
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
                />
              ) : (
                <div
                  key={`e-${level}-${index}`}
                  className="h-24 w-[4.5rem] rounded-lg border border-dashed border-border/30 md:h-28 md:w-20"
                />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-xl border border-border/30 bg-card/50 p-3">
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
              />
            );
          })}
          <div className="mx-1 h-8 w-px bg-border/50" />
          <GemToken type="gold" count={state.tokenPool.gold} size="md" />
        </div>

        <AnimatePresence>
          {phase === "selectingTokens" && selectedGems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 flex justify-center gap-2"
            >
              <Button variant="game" size="sm" onClick={handleConfirmTokens}>
                {t("take")} {selectedGems.length === 2 && selectedGems[0] === selectedGems[1] ? t("takeSame") : selectedGems.length}
              </Button>
              <Button variant="game-secondary" size="sm" onClick={handleCancel}>
                {t("cancel")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "grid gap-2",
          panelCount <= 2
            ? "grid-cols-2"
            : panelCount === 3
              ? "grid-cols-2"
              : "grid-cols-2 md:grid-cols-4",
        )}
      >
        {state.players.map((player, index) => (
          <div
            key={player.id}
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
          </div>
        ))}
      </div>
    </>
  );
}
