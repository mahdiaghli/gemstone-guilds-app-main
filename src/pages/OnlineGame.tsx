import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { useGame } from '@/hooks/useGame';
import { useLanguage } from '@/hooks/useLanguage';
import { GameState } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import Game from './Game';
import DeadMansDrawGame from './DeadMansDrawGame';
import { useAuth } from '@/hooks/useAuth';
import PageTopBar from '@/components/game/PageTopBar';
import { getGameById, getGameMenuPath } from '@/lib/gameCatalog';
import { markPendingEntryFeeConsumed, refundPendingEntryFee } from '@/lib/onlineEntryFee';
import { initializeDeadMansDrawGame } from '@/lib/deadMansDraw';

export default function OnlineGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerId = searchParams.get('player') || '';
  const { t } = useLanguage();
  const selectedGame = getGameById(searchParams.get('game'));
  const menuPath = getGameMenuPath(searchParams.get('game'));
  const { user } = useAuth();

  // Log Panel

  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [turnTime, setTurnTime] = useState(45);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    gameState,
    roomPlayers,
    roomStatus,
    loading,
    error,
    playerIndexMap,
    socket,
    joinRoom,
    leaveRoom,
    startGame,
  } = useOnlineGame(roomId || '', playerId, playerName);

  // Initialize game with correct player count
  // Count room players to determine actual player count
  const actualPlayerCount = Object.keys(roomPlayers).length || playerCount;
  const { state: localGameState } = useGame(actualPlayerCount);
  const initialOnlineState = selectedGame.id === 'dead-mans-draw'
    ? initializeDeadMansDrawGame(actualPlayerCount, true)
    : localGameState;

  // Track last synced state to prevent infinite loops
  const lastSyncedGameStateRef = useCallback((newState: GameState) => {
    if (!socket) return;
    
    // Emit to server to broadcast to other players
    socket.emit('sync-game-state', {
      roomId,
      gameState: newState,
      playerId,
      timestamp: Date.now(),
    });
    console.log('\ud83d\udce4 [SYNC] Syncing game state to server | بروزرسانی وضعیت بازی به سرور');
  }, [socket, roomId, playerId]);

  // Load player info from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('splendor-online-room');
    if (saved) {
      const data = JSON.parse(saved);
      setPlayerName(data.playerName);
      setIsHost(data.isHost);
      if (data.playerCount) {
        setPlayerCount(data.playerCount);
      }
      if ([15, 30, 45, 60].includes(data.turnTime)) {
        setTurnTime(data.turnTime);
      }
    } else {
      // Fallback: use logged-in username
      if (user?.username) {
        setPlayerName(user.username);
      }
    }
  }, [user?.username]);

  // Join room when player name is available
  useEffect(() => {
    if (playerName && roomId && !gameStarted) {
      joinRoom(playerCount, turnTime, isHost, selectedGame.id);
    }
  }, [playerName, roomId, isHost, playerCount, turnTime, gameStarted, joinRoom, selectedGame.id]);

  // Start game if room status changes to playing
  useEffect(() => {
    if (roomStatus === 'playing' && !gameStarted) {
      markPendingEntryFeeConsumed();
      setGameStarted(true);
    }
  }, [roomStatus, gameStarted]);

  // Auto-start game for players joining an already-playing room
  useEffect(() => {
    if (roomStatus === 'playing' && playerName && !gameStarted) {
      markPendingEntryFeeConsumed();
      setGameStarted(true);
    }
  }, [roomStatus, playerName, gameStarted]);

  useEffect(() => {
    if (error || errorMsg) {
      refundPendingEntryFee(user?.id);
    }
  }, [error, errorMsg, user?.id]);

  useEffect(() => {
    if (!roomId?.startsWith("MM-")) return;
    if (gameStarted || roomStatus !== "waiting") return;
    if (Object.keys(roomPlayers).length !== playerCount) return;
    const socketIds = Object.values(roomPlayers)
      .map((player: any) => player.socketId)
      .filter(Boolean)
      .sort();
    if (!socket?.id || socketIds[0] !== socket.id) return;
    startGame(initialOnlineState as any, turnTime);
  }, [actualPlayerCount, gameStarted, initialOnlineState, playerCount, roomId, roomPlayers, roomStatus, socket?.id, startGame, turnTime]);

  const handleStartGame = async () => {
    if (!isHost) {
      setErrorMsg(t('onlyHostStart'));
      return;
    }
    const playerCount = Object.keys(roomPlayers).length;
    if (playerCount < 2) {
      setErrorMsg(t('needAtLeastTwo'));
      return;
    }
    startGame(initialOnlineState as any, turnTime);
  };

  const handleLeaveRoom = async () => {
    if (!gameStarted) {
      refundPendingEntryFee(user?.id);
    }
    leaveRoom();
    navigate(menuPath);
  };

  const playerNamesList = useMemo(() => {
    const playersArray = Object.values(roomPlayers);
    if (playerIndexMap && socket) {
      const names: string[] = [];
      playersArray.forEach((player: any) => {
        const idx = playerIndexMap[player.socketId];
        if (typeof idx === 'number') {
          names[idx] = player.name;
        }
      });
      return names;
    }
    return playersArray.map((p: any) => p.name);
  }, [roomPlayers, playerIndexMap, socket]);

  const playerIndex = playerIndexMap && socket
    ? (playerIndexMap[socket.id] ?? Object.values(roomPlayers).findIndex((p: any) => p.id === playerId))
    : Object.values(roomPlayers).findIndex((p: any) => p.id === playerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageTopBar />
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="text-4xl">🎮</div>
        </motion.div>
        {/* Log Panel */}
        </div>
    );
  }

  if (error || errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageTopBar />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-destructive rounded-xl p-6 text-center max-w-sm"
        >
          <p className="text-destructive font-cinzel mb-4">{error || errorMsg}</p>
          <Button onClick={() => navigate(menuPath)}>{t('menu')}</Button>
        </motion.div>
      </div>
    );
  }

  // Game hasn't started yet - show lobby
  if (!gameStarted && roomStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4 pt-24">
        <PageTopBar />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">{selectedGame.name}</h1>
            <p className="text-primary/70 text-xs font-cinzel uppercase tracking-[0.35em] mb-2">{t("roomPrefix")}: {roomId}</p>
            <p className="text-muted-foreground">{t("waitingForPlayers")}</p>
          </div>

          {/* Players List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 border border-primary/20 rounded-xl p-6"
          >
            <h2 className="font-cinzel text-lg text-primary mb-4">{t("players")} ({Object.keys(roomPlayers).length}/{playerCount})</h2>
            <div className="space-y-3">
              {Object.values(roomPlayers).map((player: any) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-card/30 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player.connected ? '#22c55e' : '#ef4444' }}
                    />
                    <span className="font-medium">{player.name}</span>
                    {player.id === playerId && <span className="text-xs text-primary">({t("you")})</span>}
                    {player.id !== playerId && isHost && <span className="text-xs text-muted-foreground">({t("guest")})</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex gap-3">
            {isHost && Object.keys(roomPlayers).length >= 2 && (
              <Button onClick={handleStartGame} variant="game" className="flex-1">
                {t("startGame")}
              </Button>
            )}
            <Button onClick={handleLeaveRoom} variant="ghost" className="flex-1">
              {t("leaveRoom")}
            </Button>
          </div>

          {isHost && Object.keys(roomPlayers).length < 2 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center text-amber-500 text-sm"
            >
              {t("waitingForMorePlayers")} {Math.max(0, playerCount - Object.keys(roomPlayers).length)} {t("morePlayerSuffix")}
            </motion.div>
          )}
        </motion.div>

        {/* Log Panel */}
        </div>
    );
  }

  if (selectedGame.id === "dead-mans-draw") {
    return (
      <DeadMansDrawGame
        mode="online"
        roomId={roomId}
        playerId={playerId}
        playerName={playerName}
        playerIndex={playerIndex}
        roomPlayers={roomPlayers}
        playerNamesList={playerNamesList}
        socket={socket}
        serverGameState={gameState as any}
        onGameStateChange={lastSyncedGameStateRef as any}
        onGameEnd={leaveRoom}
      />
    );
  }

  return (
    <Game
      mode="online"
      roomId={roomId}
      playerId={playerId}
      playerName={playerName}
      playerIndex={playerIndex}
      roomPlayers={roomPlayers}
      playerNamesList={playerNamesList}
      socket={socket}
      serverGameState={gameState}
      onGameStateChange={lastSyncedGameStateRef}
      onGameEnd={leaveRoom}
    />
  );
}
