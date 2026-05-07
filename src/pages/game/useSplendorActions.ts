import { useCallback } from "react";
import { GemType, GEM_INFO, type GameState } from "@/lib/gameData";
import { performTakeTokens, performPurchaseCard, performReserveCard, getTotalTokens, advanceTurn } from "@/lib/gameLogic";
import { audioManager } from "@/lib/audioManager";
import { buildTurnWarningMessage } from "@/pages/game/gamePageUtils";

interface SplendorActionsProps {
  state: GameState;
  phase: string;
  gameMode: string;
  selectedGems: GemType[];
  actionSubmitting: boolean;
  challengeId?: string;
  expectedDailyPuzzleAction?: any;
  currentPlayerIndex: number;
  targetScore: number;
  currentPlayer: any;
  dailyPuzzleStep: number;
  lang: "fa" | "en";
  isCurrentPlayerMe: () => boolean;
  playerNamesList?: string[];
  getPlayerDisplayName: (index: number) => string;
  onTurnWarning: (message: string) => void;
  onSystemNotice: (message: string) => void;
  isTutorialActionAllowed: (actionType: string, actionData?: any) => boolean;
  lockActionUntilTurnChanges: () => void;
  setSelectedGems: (gems: GemType[]) => void;
  setTempPoolDisplay: (pool: any) => void;
  takeTokens: (gems: GemType[]) => void;
  purchaseCard: (cardId: number) => void;
  reserveCard: (cardId: number, level?: number) => void;
  endTurn: (targetScore?: number) => void;
  setPhase: (phase: any) => void;
  syncOnlineState: (state: GameState) => void;
  setDailyPuzzleStep: (step: number) => void;
  spawnFlight: (flight: any) => void;
  getCenterBySelector: (selector: string) => any;
  gemTokenImages: Record<string, string>;
  isExpectedDailyPuzzleAction: (action: any) => boolean;
}

export function useSplendorActions(props: SplendorActionsProps) {
  const {
    state,
    phase,
    gameMode,
    selectedGems,
    actionSubmitting,
    challengeId,
    expectedDailyPuzzleAction,
    currentPlayerIndex,
    targetScore,
    currentPlayer,
    dailyPuzzleStep,
    lang,
    isCurrentPlayerMe,
    playerNamesList,
    getPlayerDisplayName,
    onTurnWarning,
    onSystemNotice,
    isTutorialActionAllowed,
    lockActionUntilTurnChanges,
    setSelectedGems,
    setTempPoolDisplay,
    takeTokens,
    purchaseCard,
    reserveCard,
    endTurn,
    setPhase,
    syncOnlineState,
    setDailyPuzzleStep,
    spawnFlight,
    getCenterBySelector,
    gemTokenImages,
    isExpectedDailyPuzzleAction: checkExpectedAction,
  } = props;

  const handleGemClick = useCallback(
    (gem: GemType) => {
      // Check if it's current player's turn (for online games)
      if (gameMode === "online" && !isCurrentPlayerMe()) {
        const currentPlayerName =
          playerNamesList?.[state.currentPlayerIndex] || getPlayerDisplayName(state.currentPlayerIndex);
        onTurnWarning(buildTurnWarningMessage(lang, currentPlayerName));
        setTimeout(() => onTurnWarning(""), 3000);
        return;
      }

      if (
        challengeId === "daily-puzzle" &&
        gameMode !== "online" &&
        expectedDailyPuzzleAction?.type !== "takeTokens"
      ) {
        onSystemNotice("Wrong move.");
        return;
      }

      // Tutorial validation for action type
      if (!isTutorialActionAllowed("takeTokens", { gems: [gem] })) {
        onSystemNotice(lang === "fa" ? "در حال حاضر در این قدم، این عمل مجاز نیست." : "This action is not allowed at this tutorial step.");
        return;
      }

      if (phase !== "idle" && phase !== "selectingTokens") return;
      if (state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)) return;

      let newSelected: GemType[] = [];
      const count = selectedGems.filter((g) => g === gem).length;

      if (count === 0) {
        if (selectedGems.length === 2 && selectedGems[0] === selectedGems[1]) {
          newSelected = selectedGems;
        } else if (selectedGems.length >= 3) {
          newSelected = selectedGems;
        } else {
          newSelected = [...selectedGems, gem];
        }
      } else if (
        count === 1 &&
        selectedGems.length === 1 &&
        state.tokenPool[gem] >= 4
      ) {
        newSelected = [gem, gem];
      } else {
        newSelected = selectedGems.filter((g) => g !== gem);
      }

      setSelectedGems(newSelected);

      // Immediate visual update: show reduced token pool
      if (newSelected.length > 0) {
        const tempPool = { ...state.tokenPool };
        for (const g of newSelected) {
          tempPool[g] = Math.max(0, tempPool[g] - 1);
        }
        setTempPoolDisplay(tempPool);
      } else {
        setTempPoolDisplay(null);
      }
    },
    [
      phase,
      state,
      state.tokenPool,
      selectedGems,
      gameMode,
      isCurrentPlayerMe,
      state.currentPlayerIndex,
      playerNamesList,
      lang,
      challengeId,
      expectedDailyPuzzleAction,
      onSystemNotice,
      onTurnWarning,
      isTutorialActionAllowed,
      setSelectedGems,
      setTempPoolDisplay,
    ],
  );

  const handleConfirmTokens = useCallback(() => {
    if (actionSubmitting) return;
    if (gameMode === "online" && !isCurrentPlayerMe()) return;
    if (
      challengeId === "daily-puzzle" &&
      gameMode !== "online" &&
      !checkExpectedAction({ type: "takeTokens", gems: selectedGems })
    ) {
      onSystemNotice("Wrong move.");
      return;
    }

    // Tutorial validation for final gem selection
    if (!isTutorialActionAllowed("takeTokens", { gems: selectedGems })) {
      onSystemNotice(lang === "fa" ? "انتخاب جواهرات نادرست است. به دستورات آموزش توجه کنید." : "Invalid gem selection for this tutorial step. Follow the tutorial instructions.");
      return;
    }

    lockActionUntilTurnChanges();
    audioManager.playSound("takeTokens");
    const gemsList = selectedGems.join(", ");
    console.log(
      `🪙 [TOKEN] Player ${state.currentPlayerIndex} taking ${selectedGems.length} tokens | سکه‌های انتخاب‌شده: ${gemsList}`,
    );

    if (gameMode === "online") {
      selectedGems.forEach((gem, index) => {
        const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
        const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
        if (!start || !end) return;
        spawnFlight({
          kind: "token",
          color: GEM_INFO[gem].color,
          imageUrl: gemTokenImages[gem],
          start,
          end,
          durationMs: 420 + index * 70,
        });
      });
      const afterTake = performTakeTokens(state, selectedGems);
      setSelectedGems([]);
      setTempPoolDisplay(null);

      if (afterTake === state) {
        setPhase("idle");
        return;
      }

      const total = getTotalTokens(
        afterTake.players[afterTake.currentPlayerIndex],
      );
      let nextState = afterTake;
      if (total > 10) {
        setPhase("mustReturnTokens");
      } else {
        nextState = advanceTurn(afterTake, targetScore);
        setPhase("idle");
      }
      syncOnlineState(nextState);
      return;
    }

    const currentTotal = getTotalTokens(currentPlayer);
    const adding = selectedGems.length;
    selectedGems.forEach((gem, index) => {
      const start = getCenterBySelector(`[data-token-pool="${gem}"]`);
      const end = getCenterBySelector(`[data-player-token-slot="${state.currentPlayerIndex}-${gem}"]`);
      if (!start || !end) return;
      spawnFlight({
        kind: "token",
        color: GEM_INFO[gem].color,
        imageUrl: gemTokenImages[gem],
        start,
        end,
        durationMs: 420 + index * 70,
      });
    });
    takeTokens(selectedGems);
    setSelectedGems([]);
    setTempPoolDisplay(null);

    if (challengeId === "daily-puzzle" && gameMode !== "online") {
      setDailyPuzzleStep(dailyPuzzleStep + 1);
      setPhase("idle");
      onSystemNotice("Correct");
      return;
    }

    if (currentTotal + adding > 10) {
      setPhase("mustReturnTokens");
    } else {
      endTurn(targetScore);
      setPhase("idle");
    }
  }, [
    actionSubmitting,
    gameMode,
    isCurrentPlayerMe,
    challengeId,
    selectedGems,
    checkExpectedAction,
    isTutorialActionAllowed,
    lang,
    onSystemNotice,
    lockActionUntilTurnChanges,
    state,
    state.currentPlayerIndex,
    targetScore,
    dailyPuzzleStep,
    getCenterBySelector,
    spawnFlight,
    gemTokenImages,
    setSelectedGems,
    setTempPoolDisplay,
    setPhase,
    syncOnlineState,
    currentPlayer,
    takeTokens,
    setDailyPuzzleStep,
    endTurn,
  ]);

  const handleCancel = useCallback(() => {
    setSelectedGems([]);
    setTempPoolDisplay(null);
    setPhase("idle");
  }, [setSelectedGems, setTempPoolDisplay, setPhase]);

  return {
    handleGemClick,
    handleConfirmTokens,
    handleCancel,
  };
}
