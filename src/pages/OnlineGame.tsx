import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOnlineGame } from '@/hooks/useOnlineGame_v2';
import { useGame } from '@/hooks/useGame';
import { useLanguage } from '@/hooks/useLanguage';
import { GameState } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import { LogPanel, useLogPanel } from '@/components/LogPanel';
import Game from './Game';

export default function OnlineGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerId = searchParams.get('player') || '';
  const { t, lang } = useLanguage();

  // Log Panel
  const { logs, clearLogs } = useLogPanel();

  const [playerName, setPlayerName] = useState('');
  const [tempName, setTempName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);

  const {
    gameState,
    roomPlayers,
    roomStatus,
    loading,
    error,
    socket,
    syncGameState,
    joinRoom,
    leaveRoom,
    startGame,
    finishGame,
  } = useOnlineGame(roomId || '', playerId, playerName);

  const { state: localGameState, ...gameActions } = useGame(2);

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

  const [useServerGameState, setUseServerGameState] = useState(false);

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
    } else {
      // If not host (guest joining), show name dialog
      if (!isHost) {
        setShowNameDialog(true);
      }
    }
  }, []);

  // Handle setting player name from dialog
  const handleSetPlayerName = () => {
    if (!tempName.trim()) {
      setErrorMsg(lang === 'fa' ? 'نام بازیکن نمی‌تواند خالی باشد' : 'Player name cannot be empty');
      return;
    }
    setPlayerName(tempName.trim());
    setShowNameDialog(false);
    setErrorMsg('');
  };

  // Join room when player name is available
  useEffect(() => {
    if (playerName && roomId && !gameStarted) {
      if (isHost) {
        joinRoom(playerCount);
      } else {
        joinRoom();
      }
    }
  }, [playerName, roomId, isHost, playerCount, gameStarted, joinRoom]);

  // Start game if room status changes
  useEffect(() => {
    if (roomStatus === 'playing' && !gameStarted) {
      setGameStarted(true);
    }
  }, [roomStatus, gameStarted]);

  // Clean up when leaving
  useEffect(() => {
    return () => {
      if (gameStarted && roomStatus === 'playing') {
        finishGame();
      }
    };
  }, [gameStarted, roomStatus, finishGame]);

  const handleStartGame = async () => {
    if (!isHost) {
      setErrorMsg('Only the room host can start the game');
      return;
    }
    const playerCount = Object.keys(roomPlayers).length;
    if (playerCount < 2) {
      setErrorMsg('Need at least 2 players to start');
      return;
    }
    startGame(localGameState);
  };

  const handleLeaveRoom = async () => {
    leaveRoom();
    navigate('/');
  };

  if (loading && !showNameDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="text-4xl">🎮</div>
        </motion.div>
        {/* Log Panel */}
        <LogPanel logs={logs} onClear={clearLogs} />
      </div>
    );
  }

  // Show name dialog for guests
  if (showNameDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-primary rounded-xl p-6 max-w-sm w-full text-center"
        >
          <h2 className="text-2xl font-cinzel font-bold mb-4 text-primary">
            {lang === 'fa' ? '👤 نام خود را وارد کنید' : '👤 Enter Your Name'}
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            {lang === 'fa' ? 'نام خود را برای اتاق وارد کنید' : 'Enter your name to join this room'}
          </p>
          <input
            type="text"
            placeholder={lang === 'fa' ? 'نام بازیکن...' : 'Player name...'}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetPlayerName()}
            className="w-full px-4 py-2 rounded-lg bg-background border border-primary/30 text-foreground mb-4 focus:outline-none focus:border-primary"
            autoFocus
          />
          {errorMsg && (
            <p className="text-destructive text-sm mb-4">{errorMsg}</p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={handleSetPlayerName}
              variant="game"
              className="flex-1"
            >
              {lang === 'fa' ? '✅ تأیید' : '✅ Confirm'}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex-1"
            >
              {lang === 'fa' ? '❌ بازگشت' : '❌ Back'}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-destructive rounded-xl p-6 text-center max-w-sm"
        >
          <p className="text-destructive font-cinzel mb-4">{error || errorMsg}</p>
          <Button onClick={() => navigate('/')}>{t('menu')}</Button>
        </motion.div>
      </div>
    );
  }

  // Game hasn't started yet - show lobby
  if (!gameStarted && roomStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Room: {roomId}</h1>
            <p className="text-muted-foreground">Waiting for players...</p>
          </div>

          {/* Players List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 border border-primary/20 rounded-xl p-6"
          >
            <h2 className="font-cinzel text-lg text-primary mb-4">Players ({Object.keys(roomPlayers).length}/4)</h2>
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
                    {player.id === playerId && <span className="text-xs text-primary">(You)</span>}
                    {player.id !== playerId && isHost && <span className="text-xs text-muted-foreground">(Guest)</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex gap-3">
            {isHost && Object.keys(roomPlayers).length >= 2 && (
              <Button onClick={handleStartGame} variant="game" className="flex-1">
                🎮 Start Game
              </Button>
            )}
            <Button onClick={handleLeaveRoom} variant="ghost" className="flex-1">
              Leave
            </Button>
          </div>

          {isHost && Object.keys(roomPlayers).length < 2 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center text-amber-500 text-sm"
            >
              Waiting for {2 - Object.keys(roomPlayers).length} more player(s)...
            </motion.div>
          )}
        </motion.div>

        {/* Log Panel */}
        <LogPanel logs={logs} onClear={clearLogs} />
      </div>
    );
  }

  // Game is in progress
  // Build array of player names in the order they appear in roomPlayers
  const playerNamesList = Object.values(roomPlayers).map(p => p.name);
  
  // Find this player's index in the game
  const playerIndex = Object.values(roomPlayers).findIndex(p => p.id === playerId);

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
      onGameEnd={finishGame}
    />
  );
}
