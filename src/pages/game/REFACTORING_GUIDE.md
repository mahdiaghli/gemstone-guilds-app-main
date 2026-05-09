# Refactoring Guide: Splitting useSplendorGameController.ts

## Overview
The `useSplendorGameController.ts` file is currently **2000+ lines**, which makes it difficult to maintain and debug. This guide explains how to split it into multiple focused modules while maintaining all functionality.

## Current Structure Issues
- **Single responsibility violation**: One file handles state management, game logic, animations, AI, and UI events
- **Difficult debugging**: Finding specific functionality requires scrolling through thousands of lines
- **Poor test coverage**: Large hooks are harder to test independently
- **Code reusability**: Logic is tightly coupled, making it hard to reuse in other components

## Proposed Refactored Structure

```
src/pages/game/
├── useSplendorGameController.ts (Main export, orchestrates all modules)
├── hooks/
│   ├── useGameState.ts (Game state initialization and management)
│   ├── useGamePhase.ts (Phase management: idle, selectingTokens, etc.)
│   ├── useGameTimers.ts (Turn timer and time-based logic)
│   ├── useGameActions.ts (Token taking, card purchasing, reserving)
│   ├── useAITurns.ts (AI player logic)
│   ├── useTutorial.ts (Tutorial state and validation)
│   ├── useOnlineSync.ts (Online game synchronization)
│   ├── useAnalytics.ts (Analytics and challenge logic)
│   ├── useAnimations.ts (Card flight animations and transitions)
│   └── useOverlays.ts (Modal overlays and notifications)
├── utils/
│   ├── gameValidation.ts (Action validation logic)
│   ├── animationHelpers.ts (Animation utilities)
│   └── aiHelpers.ts (AI decision helpers)
└── types/
    └── gameController.ts (Type definitions)
```

## Step-by-Step Migration Plan

### Step 1: Create Type Definitions
**File**: `gameController.ts`

Extract all types and interfaces:
```typescript
// Action handlers
export type ActionHandler<T> = (args: T) => void;
export type TokenActionData = { gems: GemType[] };
export type CardActionData = { card: Card };
export type ReserveActionData = { level: 1 | 2 | 3 };

// State
export type GamePhase = "idle" | "selectingTokens" | "mustReturnTokens" | "cardAction" | "aiThinking";
export type UIPhase = {
  showQuickRules: boolean;
  showExitConfirm: boolean;
  showRematchRequest: boolean;
  waitingForRematch: boolean;
};
```

### Step 2: Extract State Management
**File**: `hooks/useGameState.ts`

```typescript
export function useGameState(playerCount: number, initialState: GameState) {
  const [localGameState, setLocalGameState] = useState(initialState);
  const [displayState, setDisplayState] = useState(localGameState);
  const [selectedGems, setSelectedGems] = useState<GemType[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  return {
    localGameState,
    setLocalGameState,
    displayState,
    setDisplayState,
    selectedGems,
    setSelectedGems,
    selectedCard,
    setSelectedCard,
  };
}
```

### Step 3: Extract Phase Management
**File**: `hooks/useGamePhase.ts`

```typescript
export function useGamePhase() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  
  // Phase-specific logic
  useEffect(() => {
    if (selectedGems.length === 0 && phase === "selectingTokens")
      setPhase("idle");
    if (selectedGems.length > 0 && phase === "idle")
      setPhase("selectingTokens");
  }, [selectedGems.length, phase]);
  
  return { phase, setPhase };
}
```

### Step 4: Extract Timer Logic
**File**: `hooks/useGameTimers.ts`

```typescript
export function useGameTimers(
  turnDurationSeconds: number,
  interactiveTutorialEnabled: boolean,
  onTimeExpired: () => void
) {
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(turnDurationSeconds);
  
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (interactiveTutorialEnabled) return; // Pause during tutorial
      setTurnSecondsLeft((prev) => {
        if (prev <= 1) onTimeExpired();
        return Math.max(0, prev - 1);
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [turnDurationSeconds, interactiveTutorialEnabled]);
  
  return { turnSecondsLeft, setTurnSecondsLeft };
}
```

### Step 5: Extract Action Handlers
**File**: `hooks/useGameActions.ts`

```typescript
export function useGameActions(
  state: GameState,
  selectedGems: GemType[],
  selectedCard: Card | null,
  gameMode: "local" | "ai" | "online",
  onPhaseChange: (phase: GamePhase) => void
) {
  const handleGemClick = useCallback((gem: GemType) => {
    // Gem click logic
  }, [state, selectedGems, gameMode]);
  
  const handleConfirmTokens = useCallback(() => {
    // Token confirmation logic
  }, [state, selectedGems, gameMode]);
  
  const handleCardClick = useCallback((card: Card) => {
    // Card selection logic
  }, [state, gameMode]);
  
  const handleBuyCard = useCallback(() => {
    // Card purchase logic
  }, [state, selectedCard, gameMode]);
  
  return {
    handleGemClick,
    handleConfirmTokens,
    handleCardClick,
    handleBuyCard,
    // ... other handlers
  };
}
```

### Step 6: Extract AI Logic
**File**: `hooks/useAITurns.ts`

```typescript
export function useAITurns(
  state: GameState,
  gameMode: "local" | "ai" | "online",
  isAIPlayer: (index: number) => boolean,
  onActionExecuted: (nextState: GameState) => void
) {
  useEffect(() => {
    if (state.gameOver) return;
    if (gameMode === "online") return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;
    
    // AI logic here
    
  }, [state, gameMode, isAIPlayer]);
}
```

### Step 7: Extract Tutorial Logic
**File**: `hooks/useTutorial.ts`

```typescript
export function useTutorial(
  gameMode: "local" | "ai" | "online",
  initiallyEnabled: boolean
) {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [interactiveTutorialEnabled, setInteractiveTutorialEnabled] = useState(initiallyEnabled);
  
  const isTutorialActionAllowed = useCallback(
    (actionType: "takeTokens" | "buyCard" | "reserveCard", actionData?: any): boolean => {
      // Tutorial validation logic
    },
    [tutorialStep, interactiveTutorialEnabled]
  );
  
  return {
    tutorialStep,
    setTutorialStep,
    interactiveTutorialEnabled,
    setInteractiveTutorialEnabled,
    isTutorialActionAllowed,
  };
}
```

### Step 8: Extract Online Synchronization
**File**: `hooks/useOnlineSync.ts`

```typescript
export function useOnlineSync(
  gameMode: "local" | "ai" | "online",
  localState: GameState,
  onGameStateChange?: (state: GameState) => void
) {
  const lastSyncedStateRef = useRef<GameState | null>(null);
  
  const syncOnlineState = useCallback(
    (nextState: GameState) => {
      if (gameMode !== "online" || !onGameStateChange) return;
      const nextStr = JSON.stringify(nextState);
      const lastStr = JSON.stringify(lastSyncedStateRef.current);
      if (nextStr === lastStr) return;
      lastSyncedStateRef.current = nextState;
      onGameStateChange(nextState);
    },
    [gameMode, onGameStateChange]
  );
  
  return { syncOnlineState };
}
```

### Step 9: Extract Analytics
**File**: `hooks/useAnalytics.ts`

```typescript
export function useAnalytics(
  gameMode: "local" | "ai" | "online",
  state: GameState,
  localPlayerIndex: number,
  userId?: string
) {
  const awardedWinnerRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!state.gameOver || state.winner === null) return;
    
    const rewardKey = buildWinnerRewardKey(state);
    if (awardedWinnerRef.current === rewardKey) return;
    awardedWinnerRef.current = rewardKey;
    
    recordFinishedGame(userId, "splendor", gameMode, state.winner === localPlayerIndex);
  }, [state.gameOver, state.winner, gameMode, localPlayerIndex, userId]);
}
```

### Step 10: Extract Animations
**File**: `hooks/useAnimations.ts`

```typescript
export function useAnimations() {
  const [flightAnimations, setFlightAnimations] = useState<FlightAnimation[]>([]);
  const transitionTimerRefs = useRef<number[]>([]);
  
  const spawnFlight = useCallback((flight: Omit<FlightAnimation, "id">) => {
    const id = `${flight.kind}-${Date.now()}`;
    setFlightAnimations((current) => [...current, { ...flight, id }]);
    // Cleanup logic
  }, []);
  
  return { flightAnimations, spawnFlight };
}
```

## Migration Checklist

- [ ] Create `gameController.ts` types file
- [ ] Extract `useGameState` hook
- [ ] Extract `useGamePhase` hook
- [ ] Extract `useGameTimers` hook
- [ ] Extract `useGameActions` hook
- [ ] Extract `useAITurns` hook
- [ ] Extract `useTutorial` hook
- [ ] Extract `useOnlineSync` hook
- [ ] Extract `useAnalytics` hook
- [ ] Extract `useAnimations` hook
- [ ] Update `useSplendorGameController.ts` to orchestrate all hooks
- [ ] Run tests to ensure all functionality works
- [ ] Update component imports if necessary
- [ ] Delete backup of original file after verification

## Benefits of This Refactoring

✅ **Improved Maintainability**: Each hook has a single responsibility
✅ **Better Testing**: Hooks can be tested independently
✅ **Easier Debugging**: Smaller, focused files are easier to understand
✅ **Code Reusability**: Logic can be reused in other components
✅ **Better Performance**: Granular dependencies prevent unnecessary re-renders
✅ **Team Collaboration**: Multiple developers can work on different hooks simultaneously

## Implementation Example

The main controller would look like:

```typescript
export default function useSplendorGameController(props: GameProps = {}) {
  const { gameState, setGameState, selectedGems, setSelectedGems, selectedCard, setSelectedCard } = useGameState(playerCount, initialState);
  
  const { phase, setPhase } = useGamePhase();
  
  const { turnSecondsLeft, setTurnSecondsLeft } = useGameTimers(turnDurationSeconds, interactiveTutorialEnabled, handleTimeExpired);
  
  const { handleGemClick, handleConfirmTokens, handleCardClick, handleBuyCard } = useGameActions(gameState, selectedGems, selectedCard, gameMode, setPhase);
  
  useAITurns(gameState, gameMode, isAIPlayer, applyState);
  
  const { tutorialStep, isTutorialActionAllowed } = useTutorial(gameMode, interactiveTutorialEnabled);
  
  const { syncOnlineState } = useOnlineSync(gameMode, gameState, onGameStateChange);
  
  useAnalytics(gameMode, gameState, localPlayerIndex, userId);
  
  const { flightAnimations, spawnFlight } = useAnimations();
  
  // Return orchestrated props
  return {
    sceneProps: {
      state: gameState,
      phase,
      selectedGems,
      selectedCard,
      turnSecondsLeft,
      flightAnimations,
      handleGemClick,
      handleCardClick,
      handleBuyCard,
      // ... other props
    }
  };
}
```

## Timeline Estimates

- **Small features**: 2-3 hours per hook
- **Full refactoring**: 2-3 days for experienced developer
- **Testing & verification**: 1-2 days

## Notes

- Use TypeScript strict mode to catch errors early
- Keep the old file as backup until full testing is complete
- Consider writing tests for each hook during extraction
- Document any breaking changes in commit messages
