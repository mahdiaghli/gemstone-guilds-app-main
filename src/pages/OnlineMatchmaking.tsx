import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { SOCKET_SERVER_URL } from '@/lib/socketConfig';
import PageTopBar from '@/components/game/PageTopBar';
import { getGameById, getGameMenuPath } from '@/lib/gameCatalog';
import { refundPendingEntryFee } from '@/lib/onlineEntryFee';
import { getPageBackground } from '@/lib/pageBackgrounds';

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
  const selectedGame = getGameById(sessionStorage.getItem("matchmaking-game"));
  const menuPath = getGameMenuPath(sessionStorage.getItem("matchmaking-game"));
  const pageBackground = getPageBackground(selectedGame.id, "find-match");
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const playerName = user?.username || '';
  const [playerCount, setPlayerCount] = useState(() => {
    const savedCount = sessionStorage.getItem('matchmaking-players');
    return savedCount ? parseInt(savedCount) : 2;
  });
  const [searching, setSearching] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [playerId] = useState(() => generateUUID());
  const [error, setError] = useState<string | null>(null);
  const [turnTime] = useState(() => {
    const savedTurnTime = sessionStorage.getItem('matchmaking-turnTime');
    const parsed = savedTurnTime ? parseInt(savedTurnTime, 10) : 15;
    return parsed === 15 || parsed === 30 || parsed === 45 || parsed === 60 ? parsed : 15;
  });
  const targetScore = (() => {
    const parsed = Number(sessionStorage.getItem("matchmaking-targetScore"));
    return parsed > 0 ? parsed : undefined;
  })();
  const autoStartRef = useRef(false); // Prevent duplicate starts
  const playerNameRef = useRef(playerName);
  const playerCountRef = useRef(playerCount);
  const searchingRef = useRef(searching);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    playerCountRef.current = playerCount;
  }, [playerCount]);

  useEffect(() => {
    searchingRef.current = searching;
  }, [searching]);

  const startSearch = () => {
    if (autoStartRef.current) return;
    autoStartRef.current = true;
    handleStartSearchInternal();
  };

  // Initialize socket connection
  useEffect(() => {
    try {
      logToPanel('log', `🔌 [INIT] Connecting to socket server...`, {
        serverUrl: SOCKET_SERVER_URL,
        timestamp: new Date().toLocaleTimeString(),
      });

      const socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        reconnectionAttempts: 8,
        transports: ['websocket'],
        upgrade: false,
        rememberUpgrade: true,
        timeout: 4000,
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
        // Auto-start immediately once connected (no button press)
        if (playerNameRef.current.trim() && !searchingRef.current) {
          startSearch();
        }
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
        setSearching(true);
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
          turnTime,
          targetScore,
          gameId: selectedGame.id,
        }));

        // Navigate to game
        navigate(`/online-game/${roomId}?player=${playerId}&game=${selectedGame.id}`);
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

  // If username becomes available after mount, start search if connected.
  useEffect(() => {
    if (playerName.trim() && socketRef.current?.connected && !searching) {
      startSearch();
    }
  }, [playerName, searching]);

  const handleStartSearchInternal = () => {
    const currentName = playerNameRef.current.trim();
    const currentCount = playerCountRef.current;

    if (!currentName) {
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
    
    const msg = `🔍 [MATCHMAKING] Starting search`;
    console.log(msg, { playerName: currentName, playerCount: currentCount, playerId, turnTime });
    logToPanel('log', msg, {
      playerName: currentName,
      playerCount: currentCount,
      playerId,
      turnTime,
      socketId: socketRef.current.id,
      timestamp: new Date().toLocaleTimeString(),
    });
    
    socketRef.current.emit('find-match', {
      playerCount: currentCount,
      playerName: currentName,
      playerId,
      turnTime,
      gameId: selectedGame.id,
    });

    logToPanel('log', `📤 [EMIT] Sent find-match event to server`, {
      playerCount: currentCount,
      playerName: currentName,
      turnTime,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleCancel = () => {
    if (socketRef.current && searching) {
      const msg = `❌ [CANCEL] Player cancelled search`;
      console.log(msg);
      logToPanel('log', msg, { playerCount: playerCountRef.current, playerId });
      
      socketRef.current.emit('cancel-match', {
        playerCount: playerCountRef.current,
        playerId,
      });
    }
    setSearching(false);
    setWaitingCount(0);
    refundPendingEntryFee(user?.id);
    navigate(menuPath);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden p-4 pt-24"
      dir={dir}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pageBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#05040A]/84 via-[#14111F]/80 to-[#05040A]/88" />
      <PageTopBar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">
            {selectedGame.name}
          </h1>
          <p className="text-primary/70 text-xs font-cinzel uppercase tracking-[0.35em]">
            {t("findMatchTitle")}
          </p>
          <p className="text-muted-foreground">
            {playerCount}-Player {t('onlinePlay')}
          </p>
        </div>

        {!searching ? (
          <>
            {/* Auto-start notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="bg-card/50 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">{t("searchingAs")}</p>
                <div className="text-2xl font-cinzel text-primary">{playerName}</div>
                <p className="text-xs text-muted-foreground mt-2">{t("matchmakingStarts")}</p>
              </div>
            </motion.div>

            {/* Player Count Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 border border-primary/20 rounded-xl p-4 text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">{t("playersSelected")}</p>
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
                <h2 className="text-2xl font-cinzel text-primary">{t("searchingLabel")}</h2>
                <p className="text-muted-foreground text-sm">
                  {t("waitingForMorePlayers")} {playerCount - 1} {t("morePlayerSuffix")}
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
                <p className="text-xs text-muted-foreground mb-1">{t("playersWaiting")}</p>
                <div className="text-2xl font-cinzel text-primary">{waitingCount}</div>
              </motion.div>

              {/* Player Name Display */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card/30 border border-primary/10 rounded-lg p-3 w-full text-center text-sm"
              >
                <p className="text-muted-foreground">{t("searchingAs")}</p>
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
                {t("cancelSearch")}
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Log Panel */}
    </div>
  );
}
