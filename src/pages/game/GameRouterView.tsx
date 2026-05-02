import DeadMansDrawGame from "@/pages/DeadMansDrawGame";
import SplendorGame from "@/pages/SplendorGame";
import { getGameById } from "@/lib/gameCatalog";
import type { GameProps } from "@/pages/game/gamePageUtils";

type GameRouterViewProps = GameProps & {
  gameId?: string | null;
};

export default function GameRouterView({ gameId, ...props }: GameRouterViewProps) {
  const selectedGame = getGameById(gameId);

  if (selectedGame.id === "dead-mans-draw") {
    return (
      <DeadMansDrawGame
        mode={props.mode}
        roomId={props.roomId}
        playerId={props.playerId}
        playerName={props.playerName}
        playerIndex={props.playerIndex}
        roomPlayers={props.roomPlayers}
        playerNamesList={props.playerNamesList}
        socket={props.socket}
        onGameEnd={props.onGameEnd}
      />
    );
  }

  return <SplendorGame {...props} />;
}
