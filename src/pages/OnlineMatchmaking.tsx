import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogPanel, useLogPanel } from '@/components/LogPanel';
import { useLanguage } from '@/hooks/useLanguage';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.254.3:3001';

// Log helper function
const logToPanel = (level: 'log' | 'error' | 'warn', message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  const fullMsg = data ? `${message} ${JSON.stringify(data)}` : message;
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${fullMsg}`);
};

// Simple UUID v4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function OnlineMatchmaking() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { logs, clearLogs } = useLogPanel();
  const socketRef = useRef<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [searching, setSearching] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [playerId] = useState(() => generateUUID());
  const [error, setError] = useState<string | null>(null);
  const autoStartRef = useRef(false); // Prevent duplicate starts

  // Initialize socket connection
  useEffect(() => {
    try {
      logToPanel('log', `🔌 [INIT] Connecting to socket server...`, {
        serverUrl: SOCKET_SERVER_URL,
        timestamp: new Date().toLocaleTimeString(),
      });

      const socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 20,
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log(`✅ [CONNECTED] Matchmaking socket connected!`);
        logToPanel('log', `✅ [CONNECTED] Socket connected successfully!`, {
          socketId: socket.id,
          connected: socket.connected,
          transport: socket.io.engine.transport.name,
        });
        setError(null);
      });

      socket.on('connect_error', (err: any) => {
        const errorType = err?.type || 'Unknown';
        const errorMsg = err?.message || err?.toString() || 'Unknown error';
        console.error(`❌ [CONNECTION ERROR]`, err);
        logToPanel('error', `❌ [CONNECTION ERROR] ${errorType}`, {
          type: errorType,
          message: errorMsg,
          isTrusted: err?.description?.isTrusted,
          code: err?.code,
          cause: 'Server unreachable - Check if server is running and IP is correct',
        });
        const reason = errorType === 'TransportError' 
          ? 'Cannot reach server. Check if server is running and IP address is correct.' 
          : `Connection failed: ${errorMsg}`;
        setError(reason);
      });

      socket.on('reconnect_attempt', (attempt: number) => {
        console.log(`🔄 [RECONNECT-ATTEMPT] Attempt ${attempt}`);
        logToPanel('log', `🔄 [RECONNECT-ATTEMPT] Attempt ${attempt}`);
      });

      socket.on('reconnect', () => {
        console.log(`✅ [RECONNECTED] Successfully reconnected!`);
        logToPanel('log', `✅ [RECONNECTED] Successfully reconnected!`, {
          socketId: socket.id,
          timestamp: new Date().toLocaleTimeString(),
        });
        setError(null);
      });

      socket.on('reconnect_error', (error: any) => {
        console.error(`⚠️  [RECONNECT-ERROR]`, error);
        logToPanel('error', `⚠️  [RECONNECT-ERROR] Failed to reconnect`, {
          error: error?.message || error?.toString(),
        });
      });

      socket.on('players-waiting', (data) => {
        const { playerCount: count, currentPlayers } = data;
        console.log(`⏳ [WAITING] Searching for ${count}-player game. Current queue: ${currentPlayers}`);
        logToPanel('log', `⏳ [WAITING] Searching for ${count}-player game`, {
          currentPlayers,
          position: `${currentPlayers}/${count}`,
        });
        setWaitingCount(currentPlayers);
      });

      socket.on('match-found', (data) => {
        const { roomId, players } = data;
        console.log(`🎉 [MATCH FOUND] Room: ${roomId}, Players: ${players.length}`);
        logToPanel('log', `🎉 [MATCH FOUND] Transferring to game room!`, {
          roomId,
          players: players.length,
          playerNames: players.map((p: any) => p.name).join(', '),
        });
        
        // Store match info
        localStorage.setItem('splendor-online-room', JSON.stringify({
          roomId,
          playerId,
          playerName,
          isHost: false,
          playerCount,
        }));

        // Navigate to game
        navigate(`/online-game/${roomId}?player=${playerId}`);
      });

      socket.on('disconnect', (reason: string) => {
        console.log(`⚠️  [DISCONNECTED] Matchmaking socket disconnected`);
        logToPanel('log', `⚠️  [DISCONNECTED] Socket disconnected`, {
          reason,
          timestamp: new Date().toLocaleTimeString(),
        });
        setError('Disconnected from matchmaking server.');
      });

      return () => {
        if (socket) {
          logToPanel('log', `🧹 [CLEANUP] Disconnecting socket`, {
            socketId: socket.id,
          });
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error(`🔥 [ERROR] Failed to initialize matchmaking socket`, err);
      logToPanel('error', `🔥 [ERROR] Failed to initialize socket`, {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Failed to initialize connection.');
    }
  }, []);

  // Load player count from sessionStorage
  useEffect(() => {
    const savedCount = sessionStorage.getItem('matchmaking-players');
    if (savedCount) {
      setPlayerCount(parseInt(savedCount));
    }
    
    // Try to load saved player name
    const savedName = sessionStorage.getItem('splendor-player-name');
    if (savedName) {
      setPlayerName(savedName);
      logToPanel('log', `✅ [AUTO-LOAD] Player name loaded: ${savedName}`);
    }
  }, []);

  // Auto-start search if player name is loaded and we're ready
  useEffect(() => {
    if (!autoStartRef.current && playerName && socketRef.current?.connected && !searching) {
      autoStartRef.current = true;
      logToPanel('log', `🚀 [AUTO-START] Starting search automatically...`, {
        playerName,
        playerCount,
      });
      
      // Trigger search after a short delay
      setTimeout(() => {
        handleStartSearchInternal();
      }, 500);
    }
  }, [playerName, searching]);

  const handleStartSearchInternal = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      logToPanel('error', '❌ [ERROR] Player name is empty');
      return;
    }

    if (!socketRef.current) {
      setError('Not connected to matchmaking server');
      logToPanel('error', '❌ [ERROR] Socket not connected');
      return;
    }

    if (!socketRef.current.connected) {
      setError('Socket not ready - waiting for connection...');
      logToPanel('error', '❌ [ERROR] Socket exists but not connected', {
        connected: socketRef.current.connected,
        disconnected: socketRef.current.disconnected,
      });
      return;
    }

    setSearching(true);
    setError(null);
    
    // Save player name for auto-load
    sessionStorage.setItem('splendor-player-name', playerName);

    const msg = `🔍 [MATCHMAKING] Starting search`;
    console.log(msg, { playerName, playerCount, playerId });
    logToPanel('log', msg, {
      playerName,
      playerCount,
      playerId,
      socketId: socketRef.current.id,
      timestamp: new Date().toLocaleTimeString(),
    });
    
    socketRef.current.emit('find-match', {
      playerCount,
      playerName,
      playerId,
    });

    logToPanel('log', `📤 [EMIT] Sent find-match event to server`, {
      playerCount,
      playerName,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleStartSearch = async () => {
    handleStartSearchInternal();
  };

  const handleCancel = () => {
    if (socketRef.current && searching) {
      const msg = `❌ [CANCEL] Player cancelled search`;
      console.log(msg);
      logToPanel('log', msg, { playerCount, playerId });
      
      socketRef.current.emit('cancel-match', {
        playerCount,
        playerId,
      });
    }
    setSearching(false);
    setWaitingCount(0);
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4"
      dir={dir}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">
            🌐 Find Match
          </h1>
          <p className="text-muted-foreground">
            {playerCount}-Player {t('onlinePlay')}
          </p>
        </div>

        {!searching ? (
          <>
            {/* Player Name Input */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium">Player Name</label>
              <input
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-primary/20 bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </motion.div>

            {/* Player Count Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 border border-primary/20 rounded-xl p-4 text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">Players Selected</p>
              <div className="text-4xl font-cinzel text-primary">{playerCount}</div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleStartSearch}
                variant="hero"
                disabled={!playerName.trim()}
                className="w-full"
              >
                🔍 Search for Match
              </Button>
            </motion.div>

            {/* Back Button */}
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              ← {t('menu')}
            </Button>
          </>
        ) : (
          <>
            {/* Searching Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 py-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-cinzel text-primary">Searching...</h2>
                <p className="text-muted-foreground text-sm">
                  Waiting for {playerCount - 1} more player{playerCount === 3 ? 's' : ''}
                </p>
              </div>

              {/* Animated Dots */}
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>

              {/* Queue Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/50 border border-primary/20 rounded-lg p-4 w-full text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">Players Waiting</p>
                <div className="text-2xl font-cinzel text-primary">{waitingCount}</div>
              </motion.div>

              {/* Player Name Display */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card/30 border border-primary/10 rounded-lg p-3 w-full text-center text-sm"
              >
                <p className="text-muted-foreground">Searching as</p>
                <p className="font-cinzel text-primary">{playerName}</p>
              </motion.div>
            </motion.div>

            {/* Cancel Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full"
              >
                ✕ Cancel Search
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Log Panel */}
      <LogPanel logs={logs} onClear={clearLogs} />
    </div>
  );
}
