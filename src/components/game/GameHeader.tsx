import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import Chat from "@/components/game/Chat";
import VoiceChatControl from "@/components/game/VoiceChatControl";
import { cn } from "@/lib/utils";
import type { Socket } from "socket.io-client";
import type { VoiceRoomPlayer } from "@/hooks/useVoiceChat";

type GameHeaderProps = {
  gameMode: "local" | "ai" | "online";
  phase: "idle" | "selectingTokens" | "mustReturnTokens" | "cardAction" | "aiThinking";
  lang: string;
  t: (key: string) => string;
  gameTitle: string;
  stateCurrentPlayerIndex: number;
  humanPlayerCount: number;
  turnSecondsLeft: number;
  turnDurationSeconds: number;
  getPlayerDisplayName: (index: number) => string;
  isCurrentPlayerMe: () => boolean;
  isAIPlayer: (index: number) => boolean;
  onShowQuickRules: () => void;
  onExit: () => void;
  socket: Socket | null;
  roomId: string;
  playerId: string;
  playerName: string;
  roomPlayers: Record<string, VoiceRoomPlayer>;
  highlightTimer?: boolean;
};

export default function GameHeader({
  gameMode,
  phase,
  t,
  gameTitle,
  stateCurrentPlayerIndex,
  humanPlayerCount,
  turnSecondsLeft,
  turnDurationSeconds,
  getPlayerDisplayName,
  isCurrentPlayerMe,
  isAIPlayer,
  onShowQuickRules,
  onExit,
  socket,
  roomId,
  playerId,
  playerName,
  roomPlayers,
  highlightTimer,
}: GameHeaderProps) {
  const currentPlayerName = getPlayerDisplayName(stateCurrentPlayerIndex);
  const truncatedPlayerName =
    currentPlayerName.length > 10
      ? currentPlayerName.substring(0, 10)
      : currentPlayerName;
  const timerSize = 52;
  const timerRadius = 21;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = Math.max(
    0,
    Math.min(1, turnSecondsLeft / Math.max(1, turnDurationSeconds)),
  );
  const timerIsCritical = turnSecondsLeft <= 5;

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {gameTitle ? (
          <p className="max-w-28 truncate font-cinzel text-xs uppercase text-primary/75">
            {gameTitle}
          </p>
        ) : null}

        <span className="font-body text-sm text-muted-foreground">
          {phase === "aiThinking" ? (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {`${t("botTurn")} ${stateCurrentPlayerIndex - humanPlayerCount + 1}`}
            </motion.span>
          ) : gameMode === "online" ? (
            <span
              className={
                isCurrentPlayerMe()
                  ? "font-bold text-green-500"
                  : "text-amber-500"
              }
            >
              {isCurrentPlayerMe() ? t("yourTurn") : t("waiting")}
            </span>
          ) : (
            <>
              {truncatedPlayerName}
              {isAIPlayer(stateCurrentPlayerIndex) ? " 🤖" : ""}
            </>
          )}
        </span>

        <div
          role="timer"
          aria-label={`${t("turnTimeLeft")}: ${turnSecondsLeft} ${t("secondsShort")}`}
          className={cn(
            "relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-slate-950/65 shadow-lg",
            highlightTimer && "ring-2 ring-amber-400/80",
          )}
        >
          <svg
            width={timerSize}
            height={timerSize}
            viewBox={`0 0 ${timerSize} ${timerSize}`}
            className="absolute inset-0 -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx={timerSize / 2}
              cy={timerSize / 2}
              r={timerRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-white/15"
            />
            <circle
              cx={timerSize / 2}
              cy={timerSize / 2}
              r={timerRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={timerCircumference}
              strokeDashoffset={timerCircumference * (1 - timerProgress)}
              className={cn(
                "transition-[stroke-dashoffset,color] duration-300",
                timerIsCritical ? "text-red-500" : "text-emerald-500",
              )}
            />
          </svg>
          <span
            className={cn(
              "relative text-base font-bold tabular-nums",
              timerIsCritical ? "text-red-300" : "text-emerald-200",
            )}
          >
            {turnSecondsLeft}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {gameMode === "online" && (
            <VoiceChatControl
              socket={socket}
              roomId={roomId}
              playerId={playerId}
              roomPlayers={roomPlayers}
              disabled={!socket?.connected}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onShowQuickRules}
            title={t("tutorial")}
          >
            📖
          </Button>
          <Button variant="ghost" size="sm" onClick={onExit}>
            ✕
          </Button>
        </div>
        {gameMode === "online" && (
          <Chat
            socket={socket}
            roomId={roomId}
            playerId={playerId}
            playerName={playerName}
            placement="inline"
            align="right"
          />
        )}
      </div>
    </div>
  );
}
