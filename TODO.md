# TODO

## Step 0: (Completed) Plan created + started verification command
- Repo explored.

## Step 1: Deadman’s Draw - remove power overlays for reveal/choice kinds
- (Done)




- File: `src/pages/dead-mans-draw/DeadMansDrawBoardView.tsx`
- Do not render decision overlay when `pendingEffect.kind` is:
  - `astrolabe` (oracle)
  - `map`
- Do not render any overlays when `pendingEffect.kind` is:
  - `horseshoe` (hook)
  - `pistol` (canon)
  - `dagger` (sword)

## Step 2: Deadman’s Draw - update interactive walkthrough
- File: `src/pages/DeadMansDrawGame.tsx`
- Replace current `interactiveTutorialSteps` with the requested similar interactive walkthrough behavior (Not started)


## Step 3: Splendor - tutorial step sequence + hard move gating
- File: `src/pages/game/useSplendorGameController.ts`
- Update `interactiveTutorialSteps` to requested sequence.
- Ensure only tutorial-allowed actions can be taken during interactive tutorial.

## Step 4: Splendor - stop timer during interactive tutorial
- File: `src/pages/game/useSplendorGameController.ts`
- Pause `turnSecondsLeft` decrement interval when interactive tutorial is open.

## Step 5: Splendor - “player’s turn” label in timer tutorial step
- File: `src/pages/game/SplendorGameScene.tsx` or pass info via controller.

## Step 6: Splendor - truncate player names to 10 chars + “...”
- Files:
  - `src/components/game/GameHeader.tsx`
  - `src/components/game/PlayerPanel.tsx`

## Step 7: Deadman’s Draw - similar interactive tutorial hard gating
- Mirror move gating logic used in Splendor.

## Step 8: Verification
- Run `npm run lint` and `npm run build`
- Manual UI verification.

