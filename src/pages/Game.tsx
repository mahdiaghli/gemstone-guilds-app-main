import { useSearchParams } from "react-router-dom";

import GameRouterView from "@/pages/game/GameRouterView";
import type { GameProps } from "@/pages/game/gamePageUtils";

export default function Game(props: GameProps = {}) {
  const [searchParams] = useSearchParams();
  return <GameRouterView gameId={searchParams.get("game")} {...props} />;
}
