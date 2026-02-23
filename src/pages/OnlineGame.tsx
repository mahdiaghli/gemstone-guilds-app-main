import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { useGame } from '@/hooks/useGame';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import Game from './Game';

export default function OnlineGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerId = searchParams.get('player') || '';
  const { t } = useLanguage();

  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    gameState,
    roomPlayers,
    roomStatus,
    loading,
    error,
    syncGameState,
    joinRoom,
    leaveRoom,
    startGame,
    finishGame,
  } = useOnlineGame(roomId || '', playerId, playerName);

  const { state: localGameState, ...gameActions } = useGame(2);

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
    }
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="text-4xl">🎮</div>
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
      </div>
    );
  }

  // Game is in progress
  return (
    <Game
      mode="online"
      roomId={roomId}
      playerId={playerId}
      onGameStateChange={syncGameState}
      onGameEnd={finishGame}
    />
  );
}
