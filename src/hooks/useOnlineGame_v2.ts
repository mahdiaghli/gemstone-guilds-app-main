import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/lib/gameData';

// 🌐 Server URL - Use laptop IP for mobile connection
// Environment variable takes priority, fallback to localhost for laptop testing
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.254.3:3001';

// 🎯 Create unique player ID for this browser tab (sessionStorage)
// هر تب از مرورگر یک ID منحصربه فرد دارد | Each browser tab gets unique ID
function createTabPlayerId(): string {
  const key = 'splendor_tab_player_id';
  let id = sessionStorage.getItem(key);
  
  if (!id) {
    // Fallback: Date.now() + random (no uuid needed)
    id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    sessionStorage.setItem(key, id);
    console.log(`✅ [TAB-ID] New tab ID created | ID تب جدید ایجاد شد: ${id}`);
  } else {
    console.log(`✅ [TAB-ID] Using existing tab ID | استفاده از ID تب موجود: ${id}`);
  }
  
  return id;
}

interface OnlinePlayer {
  id: string;
  name: string;
  socketId: string;
  connected: boolean;
  joinedAt: number;
}

export function useOnlineGame(roomId: string, playerId: string, playerName: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Record<string, OnlinePlayer>>({});
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerIndexMap, setPlayerIndexMap] = useState<Record<string, number>>({}); // Socket ID to game index
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  const tabPlayerIdRef = useRef<string>('');
  const lastGameStateRef = useRef<string>(''); // Track last state to prevent duplicate updates

  // Initialize socket connection
  // Allow connection even without playerName initially - will prompt for name
  useEffect(() => {
    if (!roomId || !playerId || joinedRef.current) return;

    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔌 [INIT] Starting Socket.IO Connection...`);
      console.log(`📍 Server URL: ${SOCKET_SERVER_URL}`);
      console.log(`📱 Browser: ${navigator.userAgent.substring(0, 50)}`);
      console.log(`🆔 Room: ${roomId} | Player: ${playerId}`);
      console.log(`${'='.repeat(60)}\n`);

      // Get or create unique tab player ID
      const tabPlayerId = createTabPlayerId();
      tabPlayerIdRef.current = tabPlayerId;

      // Connect to socket server
      const socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 20,
        transports: ['websocket', 'polling'],
        randomizationFactor: 0.5,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log(`\n✅ [CONNECTED] Socket successfully connected!`);
        console.log(`🔌 Socket ID: ${socket.id}`);
        console.log(`📡 Transport: ${socket.io.engine.transport.name}`);
        console.log(`⏰ Time: ${new Date().toLocaleTimeString()}\n`);
        setError(null);
        // Only set loading to false after connection AND we have a player name
        if (playerName) {
          setLoading(false);
        }
      });

      socket.on('connect_error', (err: any) => {
        console.error(`\n❌ [CONNECTION ERROR]`);
        console.error(`📍 Server: ${SOCKET_SERVER_URL}`);
        console.error(`❌ Error: ${err.message || err}`);
        console.error(`📱 Type: ${err?.type || 'unknown'}`);
        console.error(`📡 Data: ${err?.data ? JSON.stringify(err.data) : 'none'}`);
        console.error(`⏰ Time: ${new Date().toLocaleTimeString()}\n`);
        setError('Failed to connect to server. Check if server is running.');
      });

      socket.on('error', (err) => {
        console.error(`\n🔥 [SOCKET ERROR]`);
        console.error(`❌ Error: ${err}\n`);
      });

      socket.on('players-updated', (data) => {
        const { players, roomStatus } = data;
        console.log(`👥 [PLAYERS] Updated in room ${roomId} | بازیکنان بروزرسانی: ${players.length}`);
        // Convert array to object keyed by player ID
        const playersObj = players.reduce(
          (acc: Record<string, OnlinePlayer>, p: OnlinePlayer) => {
            acc[p.id] = p;
            return acc;
          },
          {}
        );
        setRoomPlayers(playersObj);
        setRoomStatus(roomStatus || 'waiting');
        setError(null);
        // Set loading to false when players are updated
        setLoading(false);
      });

      socket.on('game-started', (data) => {
        const { gameState, playerIndexMap } = data;
        console.log(`🎮 [GAME] Started in room ${roomId} | بازی شروع شد`);
        lastGameStateRef.current = JSON.stringify(gameState);
        if (playerIndexMap) {
          setPlayerIndexMap(playerIndexMap);
          console.log(`📊 [INDEX-MAP] Player index map: ${JSON.stringify(playerIndexMap)}`);
        }
        setGameState(gameState);
        setRoomStatus('playing');
      });

      socket.on('game-state-updated', (data) => {
        const newStateStr = JSON.stringify(data);
        // Only update if state actually changed to prevent infinite loops
        if (newStateStr !== lastGameStateRef.current) {
          lastGameStateRef.current = newStateStr;
          console.log(`📡 [SYNC] Game state updated from server | وضعیت بازی بروزرسانی شد`);
          setGameState(data);
        }
      });

      socket.on('game-ended', () => {
        console.log(`🏁 [GAME] Ended in room ${roomId} | بازی پایان یافت`);
        lastGameStateRef.current = '';
        setRoomStatus('waiting');
        setGameState(null);
      });

      socket.on('disconnect', (reason: string) => {
        console.log(`\n⚠️  [DISCONNECTED] Socket connection lost`);
        console.log(`📍 Reason: ${reason || 'unknown'}`);
        console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
        console.log(`🔄 Attempting to reconnect...\n`);
        setError('Disconnected from server. Reconnecting...');
      });

      socket.on('reconnect', () => {
        console.log(`\n✅ [RECONNECTED] Successfully reconnected!`);
        console.log(`🔌 New Socket ID: ${socket.id}`);
        console.log(`📍 Server: ${SOCKET_SERVER_URL}\n`);
        setError(null);
      });

      socket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 [RECONNECT-ATTEMPT] Attempt ${attempt} to reconnect...`);
      });

      socket.on('reconnect_error', (error) => {
        console.error(`⚠️  [RECONNECT-ERROR] Failed to reconnect`);
        console.error(`❌ Error: ${error.message || error}\n`);
      });

      return () => {
        if (socket) {
          console.log(`\n🧹 [CLEANUP] Disconnecting socket...`);
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`🔥 [FATAL ERROR] Socket initialization failed`);
      console.error(`📍 Server URL: ${SOCKET_SERVER_URL}`);
      console.error(`❌ Error: ${err}`);
      console.error(`${'='.repeat(60)}\n`);
      setError('Failed to initialize connection');
      setLoading(false);
    }
  }, [roomId, playerId, playerName]);

  // Join room
  const joinRoom = useCallback(
    (playerCount: number = 4) => {
      if (!socketRef.current || !playerName || joinedRef.current) return;

      try {
        const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
        
        console.log(`➡️  [JOIN-ROOM] Emitting join event | درخواست پیوستن به اتاق`);
        console.log(`   Room: ${roomId}, Tab-ID: ${tabPlayerId}, Player: ${playerId}, Name: ${playerName}`);
        
        socketRef.current.emit('join-room', {
          roomId,
          playerId: tabPlayerId, // 🎯 Use tab-specific ID
          playerName,
          playerCount,
          isHost: false,
        });

        joinedRef.current = true;
        console.log(`✅ [JOIN-ROOM] Successfully emitted | با موفقیت ارسال شد`);
      } catch (err) {
        console.error(`❌ [ERROR] Failed to join room | خرابی در پیوستن: ${err}`);
        setError('Failed to join room');
      }
    },
    [roomId, playerId, playerName]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;

    const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
    console.log(`⬅️  [LEAVE-ROOM] Leaving room ${roomId} | ترک اتاق`);
    
    socketRef.current.emit('leave-room', {
      roomId,
      playerId: tabPlayerId,
    });

    joinedRef.current = false;
  }, [roomId]);

  // Start game
  const startGame = useCallback(
    (initialGameState: GameState) => {
      if (!socketRef.current) return;

      console.log(`🚀 [START-GAME] Starting game in room ${roomId} | شروع بازی`);
      socketRef.current.emit('start-game', {
        roomId,
        gameState: initialGameState,
      });
    },
    [roomId]
  );

  // Sync game state with full server-side validation
  const syncGameState = useCallback(
    (newState: GameState) => {
      if (!socketRef.current) return;

      const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
      console.log(`📤 [SYNC] Syncing game state | بروزرسانی وضعیت بازی`);
      
      // Update local state immediately for responsiveness
      setGameState(newState);
      
      // Broadcast to all players in the room
      socketRef.current.emit('game-action', {
        roomId,
        playerId: tabPlayerId,
        gameState: newState,
        timestamp: Date.now(),
      });
    },
    [roomId]
  );

  // Broadcast card purchase to all players
  const broadcastCardPurchase = useCallback(
    (cardId: number, playerIndex: number) => {
      if (!socketRef.current) return;
      const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
      console.log(`💳 [CARD] Player ${playerIndex} purchasing card ${cardId} | خریداری کارت`);
      socketRef.current.emit('card-purchased', { roomId, cardId, playerIndex, playerId: tabPlayerId });
    },
    [roomId]
  );

  // Broadcast token action to all players
  const broadcastTokenAction = useCallback(
    (gems: string[], playerIndex: number) => {
      if (!socketRef.current) return;
      const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
      console.log(`🪙 [TOKEN] Player ${playerIndex} taking ${gems.length} tokens | گرفتن سکه‌ها`);
      socketRef.current.emit('tokens-taken', { roomId, gems, playerIndex, playerId: tabPlayerId });
    },
    [roomId]
  );

  // Finish game
  const finishGame = useCallback(() => {
    if (!socketRef.current) return;

    console.log(`🏁 [FINISH] Ending game in room ${roomId} | پایان بازی`);
    socketRef.current.emit('end-game', {
      roomId,
    });
  }, [roomId]);

  return {
    gameState,
    roomPlayers,
    roomStatus,
    loading,
    error,
    playerIndexMap,
    socket: socketRef.current,
    syncGameState,
    broadcastCardPurchase,
    broadcastTokenAction,
    joinRoom,
    leaveRoom,
    startGame,
    finishGame,
  };
}
