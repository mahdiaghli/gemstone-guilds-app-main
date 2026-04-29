import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GameState } from "@/lib/gameData";
import { SOCKET_SERVER_URL } from "@/lib/socketConfig";

function createTabPlayerId(): string {
  const key = "splendor_tab_player_id";
  let id = sessionStorage.getItem(key);

  if (!id) {
    id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    sessionStorage.setItem(key, id);
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

export function useOnlineGame(
  roomId: string,
  playerId: string,
  playerName: string,
) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Record<string, OnlinePlayer>>(
    {},
  );
  const [roomStatus, setRoomStatus] = useState<
    "waiting" | "playing" | "finished"
  >("waiting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerIndexMap, setPlayerIndexMap] = useState<Record<string, number>>(
    {},
  );
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  const fallbackPlayerIdRef = useRef<string>("");
  const lastGameStateRef = useRef<string>("");

  if (!fallbackPlayerIdRef.current) {
    fallbackPlayerIdRef.current = createTabPlayerId();
  }

  const effectivePlayerId = playerId || fallbackPlayerIdRef.current;

  useEffect(() => {
    if (!roomId || !effectivePlayerId || joinedRef.current) return;

    try {
      const socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        reconnectionAttempts: 8,
        transports: ["websocket"],
        upgrade: false,
        rememberUpgrade: true,
        randomizationFactor: 0.2,
        timeout: 4000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setError(null);
        if (playerName) {
          setLoading(false);
        }
      });

      socket.on("connect_error", (err: any) => {
        console.error(err);
        setError("Failed to connect to server. Check if server is running.");
      });

      socket.on("players-updated", (data) => {
        const { players, roomStatus } = data;
        const playersObj = players.reduce(
          (acc: Record<string, OnlinePlayer>, p: OnlinePlayer) => {
            acc[p.id] = p;
            return acc;
          },
          {},
        );
        setRoomPlayers(playersObj);
        setRoomStatus(roomStatus || "waiting");
        setError(null);
        setLoading(false);
      });

      socket.on("join-room-error", (data) => {
        setError(data?.message || "Unable to join room.");
        setLoading(false);
        joinedRef.current = false;
      });

      socket.on("game-started", (data) => {
        const { gameState, playerIndexMap } = data;
        lastGameStateRef.current = JSON.stringify(gameState);
        if (playerIndexMap) {
          setPlayerIndexMap(playerIndexMap);
        }
        setGameState(gameState);
        setRoomStatus("playing");
      });

      socket.on("player-index-map-updated", (data) => {
        if (data?.playerIndexMap) {
          setPlayerIndexMap(data.playerIndexMap);
        }
        if (data?.gameState) {
          lastGameStateRef.current = JSON.stringify(data.gameState);
          setGameState(data.gameState);
        }
      });

      socket.on("game-state-updated", (data) => {
        const newStateStr = JSON.stringify(data);
        if (newStateStr !== lastGameStateRef.current) {
          lastGameStateRef.current = newStateStr;
          setGameState(data);
        }
      });

      socket.on("player-removed", (data) => {
        if (data?.gameState) {
          lastGameStateRef.current = JSON.stringify(data.gameState);
          setGameState(data.gameState);
        }
        if (data?.playerIndexMap) {
          setPlayerIndexMap(data.playerIndexMap);
        }
      });

      socket.on("game-ended", () => {
        lastGameStateRef.current = "";
        setRoomStatus("waiting");
        setGameState(null);
      });

      socket.on("disconnect", () => {
        setError("Disconnected from server. Reconnecting...");
      });

      socket.on("reconnect", () => {
        setError(null);
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.error(err);
      setError("Failed to initialize connection");
      setLoading(false);
    }
  }, [roomId, effectivePlayerId, playerName]);

  const joinRoom = useCallback(
    (playerCount: number = 4, turnTime: number = 45, isHost: boolean = false, gameId?: string) => {
      if (!socketRef.current || !playerName || joinedRef.current) return;

      socketRef.current.emit("join-room", {
        roomId,
        playerId: effectivePlayerId,
        playerName,
        playerCount,
        turnTime,
        isHost,
        gameId,
      });

      joinedRef.current = true;
    },
    [roomId, effectivePlayerId, playerName],
  );

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("leave-room", {
      roomId,
      playerId: effectivePlayerId,
    });

    joinedRef.current = false;
  }, [roomId, effectivePlayerId]);

  const startGame = useCallback(
    (initialGameState: GameState, turnTime: number = 45) => {
      if (!socketRef.current) return;

      socketRef.current.emit("start-game", {
        roomId,
        gameState: initialGameState,
        turnTime,
      });
    },
    [roomId],
  );

  const syncGameState = useCallback(
    (newState: GameState) => {
      if (!socketRef.current) return;

      setGameState(newState);
      socketRef.current.emit("game-action", {
        roomId,
        playerId: effectivePlayerId,
        gameState: newState,
        timestamp: Date.now(),
      });
    },
    [roomId, effectivePlayerId],
  );

  const broadcastCardPurchase = useCallback(
    (cardId: number, playerIndex: number) => {
      if (!socketRef.current) return;

      socketRef.current.emit("card-purchased", {
        roomId,
        cardId,
        playerIndex,
        playerId: effectivePlayerId,
      });
    },
    [roomId, effectivePlayerId],
  );

  const broadcastTokenAction = useCallback(
    (gems: string[], playerIndex: number) => {
      if (!socketRef.current) return;

      socketRef.current.emit("tokens-taken", {
        roomId,
        gems,
        playerIndex,
        playerId: effectivePlayerId,
      });
    },
    [roomId, effectivePlayerId],
  );

  const finishGame = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("end-game", {
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
