import GameBoard from "@/components/game/GameBoard";
import SplendorGameHUD from "@/pages/game/SplendorGameHUD";
import SplendorGameShell from "@/pages/game/SplendorGameShell";
import type { SplendorGameSceneProps } from "@/pages/game/splendorGameSceneTypes";

export default function SplendorGameScene(props: SplendorGameSceneProps) {
  return (
    <SplendorGameShell dir={props.dir} backgroundImage={props.backgroundImage}>
      <SplendorGameHUD {...props} />
      <GameBoard
        t={props.t}
        state={props.state}
        currentPlayer={props.currentPlayer}
        panelCount={props.panelCount}
        phase={props.phase}
        tempPoolDisplay={props.tempPoolDisplay}
        selectedGems={props.selectedGems}
        selectedCard={props.boardSelectedCard}
        isAIPlayer={props.isAIPlayer}
        getPlayerDisplayName={props.getPlayerDisplayName}
        handleReturnToken={props.handleReturnToken}
        handleReserveDeck={props.handleReserveDeck}
        handleCardClick={props.handleCardClick}
        handleGemClick={props.handleGemClick}
        handleConfirmTokens={props.handleConfirmTokens}
        handleCancel={props.handleCancel}
        backCardsByLevel={props.backCardsByLevel}
      />
    </SplendorGameShell>
  );
}
