import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SplendorSocketProps {
  socket: any;
  gameMode: string;
  menuPath: string;
  turnDurationSeconds: number;
  t: (key: string) => string;
  onGameStateUpdate?: (data: any) => void;
  onPlayerRemoved?: (data: any) => void;
  onTurnTimerUpdated?: (data: any) => void;
  onRematchRequested?: () => void;
  onRematchResult?: (data: any) => void;
}

export function useSplendorSocket(props: SplendorSocketProps) {
  const navigate = useNavigate();

  // Game state updates
  useEffect(() => {
    if (props.gameMode !== "online" || !props.socket) return;

    const handleGameStateUpdate = (data: any) => {
      console.log("📡 Received game state update from server");
      if (props.onGameStateUpdate) {
        props.onGameStateUpdate(data);
      }
    };

    props.socket.on("game-state-updated", handleGameStateUpdate);

    return () => {
      props.socket?.off("game-state-updated", handleGameStateUpdate);
    };
  }, [props.gameMode, props.socket, props.onGameStateUpdate]);

  // Player removed
  useEffect(() => {
    if (props.gameMode !== "online" || !props.socket) return;

    const handlePlayerRemoved = (data: any) => {
      if (props.onPlayerRemoved) {
        props.onPlayerRemoved(data);
      }
    };

    props.socket.on("player-removed", handlePlayerRemoved);

    return () => {
      props.socket?.off("player-removed", handlePlayerRemoved);
    };
  }, [props.gameMode, props.socket, props.onPlayerRemoved]);

  // Turn timer and rematch events
  useEffect(() => {
    if (props.gameMode !== "online" || !props.socket) return;

    const onTurnTimer = (data: any) => {
      if (props.onTurnTimerUpdated) {
        props.onTurnTimerUpdated(data);
      }
    };

    const onRematchRequested = () => {
      if (props.onRematchRequested) {
        props.onRematchRequested();
      }
    };

    const onRematchResult = (data: any) => {
      if (props.onRematchResult) {
        props.onRematchResult(data);
      }
      if (data?.accepted) {
        navigate(props.menuPath);
      }
    };

    props.socket.on("turn-timer-updated", onTurnTimer);
    props.socket.on("rematch-requested", onRematchRequested);
    props.socket.on("rematch-result", onRematchResult);

    return () => {
      props.socket?.off("turn-timer-updated", onTurnTimer);
      props.socket?.off("rematch-requested", onRematchRequested);
      props.socket?.off("rematch-result", onRematchResult);
    };
  }, [props.gameMode, props.menuPath, navigate, props.socket, props.onTurnTimerUpdated, props.onRematchRequested, props.onRematchResult]);
}
