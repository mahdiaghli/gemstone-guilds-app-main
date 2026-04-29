import SplendorGameScene from "@/pages/game/SplendorGameScene";
import useSplendorGameController from "@/pages/game/useSplendorGameController";
import type { GameProps } from "@/pages/game/gamePageUtils";

export default function SplendorGame(props: GameProps = {}) {
  const { sceneProps } = useSplendorGameController(props);
  return <SplendorGameScene {...sceneProps} />;
}
