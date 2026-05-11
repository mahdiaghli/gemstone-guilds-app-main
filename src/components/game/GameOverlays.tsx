import { AnimatePresence, motion } from "framer-motion";

import CardDisplay from "@/components/game/CardDisplay";
import GemToken from "@/components/game/GemToken";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, GameState, TOKEN_TYPES, TokenType } from "@/lib/gameData";
import { canPlayerAffordCard, getPlayerBonuses, getPlayerScore, getTotalTokens } from "@/lib/gameLogic";
import overlayBackground from "@/assets/background.png";
import type { GemType } from "@/lib/gameData";
import type {
  PostGameActionButton,
  PostGameNoticeDialog,
} from "@/pages/game/gamePageUtils";

type GameOverlaysProps = {
  t: (key: string, values?: Record<string, string | number>) => string;
  state: GameState;
  currentPlayer: GameState["players"][number];
  phase: "idle" | "selectingTokens" | "mustReturnTokens" | "cardAction" | "aiThinking";
  gameMode: "local" | "ai" | "online";
  selectedCard: Card | null;
  isReserved: boolean;
  showQuickRules: boolean;
  showExitConfirm: boolean;
  showRematchRequest: boolean;
  waitingForRematch: boolean;
  turnWarning: string;
  systemNotice: string;
  stateCurrentPlayerIndex: number;
  getPlayerDisplayName: (index: number) => string;
  isCurrentPlayerMe: () => boolean;
  handleReturnToken: (token: TokenType) => void;
  onCloseQuickRules: () => void;
  onCancelCardAction: () => void;
  onBuyCard: () => void;
  onReserveCard: () => void;
  actionSubmitting: boolean;
  onLeaveGame: () => void;
  onCloseExitConfirm: (open: boolean) => void;
  onCloseRematchRequest: (open: boolean) => void;
  onCloseWaitingRematch: (open: boolean) => void;
  onDeclineRematch: () => void;
  onAcceptRematch: () => void;
  onPlayAgain: () => void;
  onMenu: () => void;
  gameOverActions?: PostGameActionButton[];
  postGameNoticeDialog?: PostGameNoticeDialog | null;
};

export default function GameOverlays({
  t,
  state,
  currentPlayer,
  phase,
  gameMode,
  selectedCard,
  isReserved,
  showQuickRules,
  showExitConfirm,
  showRematchRequest,
  waitingForRematch,
  turnWarning,
  systemNotice,
  stateCurrentPlayerIndex,
  getPlayerDisplayName,
  isCurrentPlayerMe,
  handleReturnToken,
  onCloseQuickRules,
  onCancelCardAction,
  onBuyCard,
  onReserveCard,
  actionSubmitting,
  onLeaveGame,
  onCloseExitConfirm,
  onCloseRematchRequest,
  onCloseWaitingRematch,
  onDeclineRematch,
  onAcceptRematch,
  onPlayAgain,
  onMenu,
  gameOverActions,
  postGameNoticeDialog,
}: GameOverlaysProps) {
  const currentPlayerBonuses = getPlayerBonuses(currentPlayer);
  const selectedCardCostStatus: Partial<Record<GemType, boolean>> | undefined = selectedCard
    ? Object.fromEntries(
        Object.entries(selectedCard.cost).map(([gem, cost]) => [
          gem,
          (currentPlayer.tokens[gem as GemType] ?? 0) + currentPlayerBonuses[gem as GemType] >= (cost ?? 0),
        ]),
      ) as Partial<Record<GemType, boolean>>
    : undefined;

  const modalBackgroundStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.84)), url(${overlayBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } as const;

  const showReturnDrawer = phase === "mustReturnTokens" && !state.gameOver;
  const showWaitingDrawer =
    !showReturnDrawer &&
    !state.gameOver &&
    gameMode === "online" &&
    !isCurrentPlayerMe();
  const resolvedGameOverActions = gameOverActions ?? [
    { key: "play-again", label: t("playAgain"), onClick: onPlayAgain, variant: "game" as const },
    { key: "menu", label: t("menu"), onClick: onMenu, variant: "ghost" as const },
  ];

  return (
    <>
      <AnimatePresence>
        {(showReturnDrawer || showWaitingDrawer) && (
          <motion.div
            initial={{ opacity: 0, y: -120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -120 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-20"
          >
            <div
              className={`w-full max-w-3xl rounded-b-[28px] border px-5 py-4 shadow-2xl backdrop-blur-md ${
                showReturnDrawer
                  ? "border-red-400/40 bg-[linear-gradient(180deg,rgba(127,29,29,0.96),rgba(69,10,10,0.94))]"
                  : "border-amber-300/40 bg-[linear-gradient(180deg,rgba(120,53,15,0.95),rgba(67,20,7,0.93))]"
              }`}
            >
              {showReturnDrawer ? (
                <>
                  <div className="text-center">
                    <p className="font-cinzel text-lg tracking-[0.18em] text-red-100">Return Tokens</p>
                    <p className="mt-1 text-sm text-red-50/85">
                      {t("tooManyTokens")} ({getTotalTokens(currentPlayer)} / 10)
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                </>
              ) : (
                <div className="text-center">
                  <p className="font-cinzel text-lg tracking-[0.18em] text-amber-100">Wait For Your Turn</p>
                  <p className="mt-1 text-sm text-amber-50/85">
                    {getPlayerDisplayName(stateCurrentPlayerIndex)} is playing right now.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {turnWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-400/20 p-3 text-center"
          >
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">{turnWarning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {systemNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mb-3 rounded-lg border border-blue-500/40 bg-blue-400/20 p-3 text-center"
          >
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{systemNotice}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/55 p-4 backdrop-blur-sm"
            onClick={onCloseQuickRules}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 18 }}
              className="w-full max-w-lg rounded-2xl border border-primary/30 p-6 shadow-2xl"
              style={modalBackgroundStyle}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="mb-2 font-cinzel text-2xl tracking-wider text-primary">{t("quickRulesTitle")}</h2>
              <p className="mb-4 font-body text-sm text-muted-foreground">{t("quickRulesSubtitle")}</p>
              <ul className="space-y-2 font-body text-sm text-foreground/90">
                <li>• {t("quickRulesObjective")}</li>
                <li>• {t("quickRulesTurn")}</li>
                <li>• {t("quickRulesTokens")}</li>
                <li>• {t("quickRulesReserve")}</li>
                <li>• {t("quickRulesNobles")}</li>
                <li>• {t("quickRulesWin")}</li>
              </ul>
              <div className="mt-6 flex justify-end">
                <Button variant="game" onClick={onCloseQuickRules}>
                  {t("quickRulesClose")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
            onClick={onCancelCardAction}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl border-2 border-primary/30 p-8 shadow-2xl"
              style={modalBackgroundStyle}
              onClick={(event) => event.stopPropagation()}
            >
              <motion.div className="mb-6 flex justify-center px-4 py-5" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                <div className="origin-top scale-[190%] transform p-2">
                  <CardDisplay
                    card={selectedCard}
                    affordable={canPlayerAffordCard(currentPlayer, selectedCard)}
                    emphasizeAffordableCosts
                    costStatus={selectedCardCostStatus}
                    dataCardId={`modal-${selectedCard.id}`}
                  />
                </div>
              </motion.div>

              <motion.div
                className="mb-6 space-y-2 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1">
                  <span className="font-cinzel text-sm tracking-wider text-primary">
                    {selectedCard.points > 0 ? `${selectedCard.points} ${t("pts")}` : t("noPoints")}
                  </span>
                </div>
              </motion.div>
              <motion.div
                className="flex flex-col gap-2 space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {canPlayerAffordCard(currentPlayer, selectedCard) && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="game" onClick={onBuyCard} disabled={actionSubmitting} className="w-full font-cinzel">
                      ✨ {t("purchase")}
                    </Button>
                  </motion.div>
                )}
                {!isReserved && currentPlayer.reservedCards.length < 3 && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="game-secondary" onClick={onReserveCard} disabled={actionSubmitting} className="w-full font-cinzel">
                      📌 {t("reserve")}
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="ghost" onClick={onCancelCardAction} className="w-full font-cinzel text-muted-foreground">
                    ✕ {t("cancel")}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="mx-4 max-w-sm rounded-2xl border border-primary/30 p-8 text-center shadow-2xl"
              style={modalBackgroundStyle}
            >
              <span className="mb-4 block text-4xl">👑</span>
              <h2 className="mb-2 font-cinzel text-2xl tracking-wider text-primary">
                {getPlayerDisplayName(state.winner ?? 0)} {t("wins")}
              </h2>
              <p className="mb-6 font-body text-lg text-muted-foreground">
                {t("score")}: {getPlayerScore(state.players[state.winner ?? 0])}
              </p>
              <div className="space-y-2">
                {state.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <div className="text-left">
                      <span className="text-muted-foreground">
                        {getPlayerDisplayName(player.id)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {t("splendorBoughtCardsLine", { count: player.cards.length })}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">
                      {getPlayerScore(player)} {t("pts")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {resolvedGameOverActions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant ?? "game"}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex-1"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showExitConfirm} onOpenChange={onCloseExitConfirm}>
        <AlertDialogContent className="bg-cover bg-center" style={modalBackgroundStyle}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveGameTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveGameDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("stay")}</AlertDialogCancel>
            <AlertDialogAction onClick={onLeaveGame}>{t("leaveGameAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRematchRequest} onOpenChange={onCloseRematchRequest}>
        <AlertDialogContent className="bg-cover bg-center" style={modalBackgroundStyle}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rematchRequestTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("rematchRequestMessage")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onDeclineRematch}>{t("decline")}</AlertDialogCancel>
            <AlertDialogAction onClick={onAcceptRematch}>{t("accept")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={waitingForRematch} onOpenChange={onCloseWaitingRematch}>
        <AlertDialogContent className="bg-cover bg-center" style={modalBackgroundStyle}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rematchRequestTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("waitingRematchVotes")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("stay")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(postGameNoticeDialog?.open)}
        onOpenChange={(open) => {
          if (!open) {
            postGameNoticeDialog?.onConfirm();
          }
        }}
      >
        <AlertDialogContent className="bg-cover bg-center" style={modalBackgroundStyle}>
          <AlertDialogHeader>
            <AlertDialogTitle>{postGameNoticeDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{postGameNoticeDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={postGameNoticeDialog?.onConfirm}>
              {postGameNoticeDialog?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
