import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import Chat from "@/components/game/Chat";
import VoiceChatControl from "@/components/game/VoiceChatControl";
import { cn } from "@/lib/utils";

type GameHeaderProps = {
  gameMode: "local" | "ai" | "online";
  phase: "idle" | "selectingTokens" | "mustReturnTokens" | "cardAction" | "aiThinking";
  lang: string;
  t: (key: string) => string;
  gameTitle: string;
  stateCurrentPlayerIndex: number;
  humanPlayerCount: number;
  turnSecondsLeft: number;
  getPlayerDisplayName: (index: number) => string;
  isCurrentPlayerMe: () => boolean;
  isAIPlayer: (index: number) => boolean;
  onShowQuickRules: () => void;
  onExit: () => void;
  socket: any;
  roomId: string;
  playerId: string;
  playerName: string;
  roomPlayers: Record<string, any>;
  highlightTimer?: boolean;
};

export default function GameHeader({
  gameMode,
  phase,
  lang,
  t,
  gameTitle,
  stateCurrentPlayerIndex,
  humanPlayerCount,
  turnSecondsLeft,
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
  const truncatedPlayerName = currentPlayerName.length > 10 
    ? currentPlayerName.substring(0, 10) 
    : currentPlayerName;
  
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <p className="truncate font-cinzel text-xs uppercase text-primary/75">
            {gameTitle}
          </p>
          {/* <h1 className="font-cinzel text-lg tracking-widest text-primary md:text-xl">
          {lang === "fa"
            ? `نوبت ${getPlayerDisplayName(stateCurrentPlayerIndex)}`
            : `It's ${getPlayerDisplayName(stateCurrentPlayerIndex)}'s turn`}
          </h1> */}
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="font-body text-sm text-muted-foreground">
          {phase === "aiThinking" ? (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {`${t("botTurn")} ${stateCurrentPlayerIndex - humanPlayerCount + 1}`}
            </motion.span>
          ) : gameMode === "online" ? (
            <>
              <span
                className={
                  isCurrentPlayerMe() ? "font-bold text-green-500" : "text-amber-500"
                }
              >
                {isCurrentPlayerMe() ? t("yourTurn") : t("waiting")}
              </span>
              {" | "}
              {truncatedPlayerName}
            </>
          ) : (
            <>
              {truncatedPlayerName}
              {isAIPlayer(stateCurrentPlayerIndex) ? " 🤖" : ""}
            </>
          )}
        </span>
        <span className={cn("text-xs text-muted-foreground rounded-md px-2 py-1", highlightTimer && "ring-2 ring-amber-400/80 bg-amber-500/10")}>
          {truncatedPlayerName} - {t("turnTimeLeft")}: {turnSecondsLeft} {t("secondsShort")}
        </span>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {gameMode === "online" && (
            <VoiceChatControl
              socket={socket}
              roomId={roomId}
              playerId={playerId}
              roomPlayers={roomPlayers}
              disabled={!socket}
            />
          )}
          <Button variant="outline" size="sm" onClick={onShowQuickRules} title={t("tutorial")}>
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
