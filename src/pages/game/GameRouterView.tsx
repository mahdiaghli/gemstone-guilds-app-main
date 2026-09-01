import DeadMansDrawGame from "@/pages/DeadMansDrawGame";
import SplendorGame from "@/pages/SplendorGame";
import BeastyBarGame from "@/pages/BeastyBarGame";
import JungleSpeedGame from "@/pages/JungleSpeedGame";
import { getGameById } from "@/lib/gameCatalog";
import type { GameProps } from "@/pages/game/gamePageUtils";

type GameRouterViewProps = GameProps & {
  gameId?: string | null;
};

export default function GameRouterView({ gameId, ...props }: GameRouterViewProps) {
  const selectedGame = getGameById(gameId);

  if (!selectedGame.playable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-amber-100">
        Coming soon
      </div>
    );
  }

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

  if (selectedGame.id === "beasty-bar") {
    return <BeastyBarGame />;
  }

  if (selectedGame.id === "totem") {
    return <JungleSpeedGame {...props} />;
  }

  return <SplendorGame {...props} />;
}
