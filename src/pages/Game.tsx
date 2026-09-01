import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import GameRouterView from "@/pages/game/GameRouterView";
import type { GameProps } from "@/pages/game/gamePageUtils";
import { getGameMenuPath } from "@/lib/gameCatalog";

export default function Game(props: GameProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game");

  useEffect(() => {
    if (gameId === "splendor" || gameId === "dead-mans-draw") return;

    const handleAppBackRequest = () => {
      navigate(getGameMenuPath(gameId));
    };

    window.addEventListener("gemstone-app-back-request", handleAppBackRequest);
    return () => {
      window.removeEventListener("gemstone-app-back-request", handleAppBackRequest);
    };
  }, [gameId, navigate]);

  return <GameRouterView gameId={gameId} {...props} />;
}
