import type {
  DeadMansDrawCard,
  DeadMansDrawPendingEffect,
  DeadMansDrawPlayer,
  DeadMansDrawPowerTargetSelection,
  DeadMansDrawRing,
  DeadMansDrawState,
} from "@/lib/deadMansDraw";
import type { DeadMansDrawInteractiveTutorialStep } from "./shared";

export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type DeadMansDrawGameProps = {
  mode?: "local" | "ai" | "online";
  roomId?: string;
  playerId?: string;
  playerName?: string;
  playerIndex?: number;
  roomPlayers?: Record<string, any>;
  playerNamesList?: string[];
  socket?: any;
  serverGameState?: DeadMansDrawState | null;
  onGameStateChange?: (state: DeadMansDrawState) => void;
  onGameEnd?: () => void;
};

export type DeadMansDrawScoreEntry = {
  index: number;
  score: number;
  cardCount: number;
};

export type BonusPreviewState = {
  playerIndex: number;
  cards: DeadMansDrawCard[];
};

export type BustPreviewState = {
  cards: DeadMansDrawCard[];
  highlightIds: string[];
};

export type DeadMansDrawFlightAnimation = {
  id: string;
  card: DeadMansDrawCard;
  kind: "reveal" | "collect" | "burn";
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
  durationMs: number;
};

export type DeadMansDrawGameOverViewProps = {
  dir: "ltr" | "rtl";
  t: Translate;
  winnerNames: string[];
  highestScore: number;
  tiedForScoreCount: number;
  winnerCount: number;
  tiebreakWinnerCount: number;
  topCardCount: number;
  scoreBoard: DeadMansDrawScoreEntry[];
  getPlayerDisplayName: (index: number) => string;
  onPlayAgain: () => void;
  onMenu: () => void;
  playAgainDisabled: boolean;
};

export type DeadMansDrawBonusPreviewViewProps = {
  dir: "ltr" | "rtl";
  t: Translate;
  preview: BonusPreviewState;
  getPlayerDisplayName: (index: number) => string;
  onConfirm: () => void;
};

export type DeadMansDrawBoardViewProps = {
  dir: "ltr" | "rtl";
  t: Translate;
  currentState: DeadMansDrawState;
  canReveal: boolean;
  canCollect: boolean;
  glowingDeck?: boolean;
  glowingCollect?: boolean;
  onReveal: () => void;
  onCollect: () => void;
  cardFlights: DeadMansDrawFlightAnimation[];
  visibleTreasureArea: DeadMansDrawCard[];
  highlightedTreasureIds: Set<string>;
  selectedTreasureHelpId: string | null;
  onToggleTreasureHelp: (cardId: string) => void;
  getPlayerDisplayName: (index: number) => string;
  activePlayerIndex: number;
  pendingEffect: DeadMansDrawPendingEffect | null;
  decisionDisabled: boolean;
  onAstrolabeReveal: () => void;
  onAstrolabeCollect: () => void;
  onMapChoice: (cardId: string) => void;
  onMisfireChoice: (suit: any) => void;
  onPistolTarget: (targetPlayerIndex: number, suit: any) => void;
  onDaggerTarget: (targetPlayerIndex: number, suit: any) => void;
  onHorseshoeTarget: (suit: any) => void;
  targetSelectionDisabled: boolean;
  onOpenSummary?: () => void;
  onOpenExit: () => void;
  showExitButton?: boolean;
  showTutorialCloseButton?: boolean;
  tutorialStep?: number;
  tutorialSteps?: DeadMansDrawInteractiveTutorialStep[];
  onNextTutorial?: () => void;
  onPrevTutorial?: () => void;
  onCloseTutorial?: () => void;
};

export type DeadMansDrawSummaryModalProps = {
  open: boolean;
  dir: "ltr" | "rtl";
  t: Translate;
  tutorialSteps: number[];
  tutorialStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
};

export type DeadMansDrawExitModalProps = {
  open: boolean;
  dir: "ltr" | "rtl";
  t: Translate;
  onClose: () => void;
  onLeave: () => void;
};

export type DeadMansDrawPendingDrawerProps = {
  pendingEffect: DeadMansDrawPendingEffect | null;
  t: Translate;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  disabled: boolean;
  onAstrolabe: (revealPeekedCard: boolean) => void;
  onPistol: (targetPlayerIndex: number, suit: any) => void;
  onDagger: (targetPlayerIndex: number, suit: any) => void;
  onHorseshoe: (suit: any) => void;
  onMap: (cardId: string) => void;
  onMisfire: (suit: any) => void;
  top?: boolean;
};

export type DeadMansDrawPowerTargetViewProps = {
  dir: "ltr" | "rtl";
  selection: DeadMansDrawPowerTargetSelection;
  players: DeadMansDrawPlayer[];
  getPlayerDisplayName: (index: number) => string;
  onSelect: (targetPlayerIndex: number) => void;
  locked: boolean;
  t: Translate;
};

export type DeadMansDrawPowerChoiceViewProps = {
  dir: "ltr" | "rtl";
  playerName: string;
  playerIndex: number;
  options: DeadMansDrawRing[];
  onSelect: (ring: DeadMansDrawRing) => void;
  locked: boolean;
  t: Translate;
};
