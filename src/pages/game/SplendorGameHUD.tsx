import GameHeader from "@/components/game/GameHeader";
import GameOverlays from "@/components/game/GameOverlays";
import type { SplendorGameSceneProps } from "@/pages/game/splendorGameSceneTypes";

export default function SplendorGameHUD(props: Pick<
  SplendorGameSceneProps,
  | "gameMode"
  | "phase"
  | "lang"
  | "t"
  | "gameTitle"
  | "state"
  | "currentPlayer"
  | "humanPlayerCount"
  | "turnSecondsLeft"
  | "getPlayerDisplayName"
  | "isCurrentPlayerMe"
  | "isAIPlayer"
  | "onShowQuickRules"
  | "onExit"
  | "socket"
  | "roomId"
  | "playerId"
  | "playerName"
  | "roomPlayers"
  | "selectedCard"
  | "isReserved"
  | "showQuickRules"
  | "showExitConfirm"
  | "showRematchRequest"
  | "waitingForRematch"
  | "turnWarning"
  | "systemNotice"
  | "stateCurrentPlayerIndex"
  | "handleReturnToken"
  | "onCloseQuickRules"
  | "onCancelCardAction"
  | "onBuyCard"
  | "onReserveCard"
  | "actionSubmitting"
  | "onLeaveGame"
  | "onCloseExitConfirm"
  | "onCloseRematchRequest"
  | "onCloseWaitingRematch"
  | "onDeclineRematch"
  | "onAcceptRematch"
  | "onPlayAgain"
  | "onMenu"
  | "gameOverActions"
  | "postGameNoticeDialog"
  | "interactiveTutorial"
>) {
  return (
    <>
      <GameHeader
        gameMode={props.gameMode}
        phase={props.phase}
        lang={props.lang}
        t={props.t}
        gameTitle={props.gameTitle}
        stateCurrentPlayerIndex={props.state.currentPlayerIndex}
        humanPlayerCount={props.humanPlayerCount}
        turnSecondsLeft={props.turnSecondsLeft}
        getPlayerDisplayName={props.getPlayerDisplayName}
        isCurrentPlayerMe={props.isCurrentPlayerMe}
        isAIPlayer={props.isAIPlayer}
        onShowQuickRules={props.onShowQuickRules}
        onExit={props.onExit}
        socket={props.socket}
        roomId={props.roomId}
        playerId={props.playerId}
        playerName={props.playerName}
        roomPlayers={props.roomPlayers}
        highlightTimer={props.interactiveTutorial.enabled && props.interactiveTutorial.focus === "timer"}
      />

      <GameOverlays
        t={props.t}
        state={props.state}
        currentPlayer={props.currentPlayer}
        selectedCard={props.selectedCard}
        isReserved={props.isReserved}
        showQuickRules={props.showQuickRules}
        showExitConfirm={props.showExitConfirm}
        showRematchRequest={props.showRematchRequest}
        waitingForRematch={props.waitingForRematch}
        turnWarning={props.turnWarning}
        systemNotice={props.systemNotice}
        phase={props.phase}
        gameMode={props.gameMode}
        isCurrentPlayerMe={props.isCurrentPlayerMe}
        stateCurrentPlayerIndex={props.stateCurrentPlayerIndex}
        getPlayerDisplayName={props.getPlayerDisplayName}
        isAIPlayer={props.isAIPlayer}
        handleReturnToken={props.handleReturnToken}
        onCloseQuickRules={props.onCloseQuickRules}
        onCancelCardAction={props.onCancelCardAction}
        onBuyCard={props.onBuyCard}
        onReserveCard={props.onReserveCard}
        actionSubmitting={props.actionSubmitting}
        onLeaveGame={props.onLeaveGame}
        onCloseExitConfirm={props.onCloseExitConfirm}
        onCloseRematchRequest={props.onCloseRematchRequest}
        onCloseWaitingRematch={props.onCloseWaitingRematch}
        onDeclineRematch={props.onDeclineRematch}
        onAcceptRematch={props.onAcceptRematch}
        onPlayAgain={props.onPlayAgain}
        onMenu={props.onMenu}
        gameOverActions={props.gameOverActions}
        postGameNoticeDialog={props.postGameNoticeDialog}
      />
    </>
  );
}
