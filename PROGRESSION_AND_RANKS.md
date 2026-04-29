# Progression, Rewards, Ranks, Coins, Gems, and Levels

This file explains how player progression currently works in the project, where each reward comes from, and which files you should edit if you want to rebalance it.

## 1. Main progression files

Use these files when you want to change progression values:

- `src/lib/progression.ts`
  - Main source for coins, XP, score points, entry fee, level thresholds, win rewards, matchmaking rewards, and rank point gain/loss.
- `src/lib/playerExtras.ts`
  - Stores extra player data such as gems, owned avatars, stickers, selected avatar, and daily reward tracking.
- `src/lib/shop.ts`
  - Shop coin packs, gem packs, weekly rewards, sticker/avatar rewards, and free/ad-style purchases.
- `src/lib/social.ts`
  - Group ranking and player ranking lists are built here from stored player progress.
- `src/pages/Groups.tsx` and `src/components/groups/GroupsViews.tsx`
  - Group UI that shows ranked groups and ranked players.
- `src/pages/Game.tsx`
  - Calls progression reward functions after a game ends.

## 2. Coins

Coins are part of `PlayerProgress` in `src/lib/progression.ts`.

### Default coins
New players start with:

- `DEFAULT_PROGRESS.coins = 1000`

### Coins gained
Players gain coins from:

- Winning a standard game:
  - `WIN_REWARD_COINS = 10`
- Winning a matchmaking online game:
  - `MATCHMAKING_WIN_REWARD_COINS = 20`
- Shop purchases or free offers:
  - handled in `src/lib/shop.ts`
- Weekly rewards that give coins:
  - handled in `src/lib/shop.ts`

### Coins spent
Players spend coins through:

- Online entry fee:
  - `GAME_ENTRY_FEE = 5`
  - charged by `payGameEntryFee()` in `src/lib/progression.ts`
  - called from `src/pages/ModeSetup.tsx` before online play starts

### Where to change coin values
Edit:

- `src/lib/progression.ts`
- `src/lib/shop.ts`

## 3. Gems / diamonds

The game UI often calls them gems or diamonds, but the stored player extra currency is `gems` in `src/lib/playerExtras.ts`.

### Default gems
New players start with:

- `DEFAULT_EXTRAS.gems = 150`

### Gems gained
Players get gems from:

- Shop diamond offers in `src/lib/shop.ts`
- Weekly rewards in `src/lib/shop.ts`

### Gems spent
Currently the major gem sink is group creation:

- Creating a group costs `100` gems
- This is enforced in `src/pages/Groups.tsx`

### Where to change gem values
Edit:

- `src/lib/playerExtras.ts` for starting gem amount
- `src/lib/shop.ts` for gem rewards and gem shop packs
- `src/pages/Groups.tsx` if you want to change the group creation cost

## 4. Score / rank points

The app uses `points` inside `PlayerProgress` as the main rank score.

### Default score
New players start with:

- `DEFAULT_PROGRESS.points = 0`

### Score gained
When a player wins, `awardWinProgress()` in `src/lib/progression.ts` adds:

- `WIN_SCORE_GAIN = 12`
- plus the game's earned prestige points
- in matchmaking mode, earned prestige points are doubled before that extra win bonus is added

Current formula:

- Standard win:
  - `current.points + earnedPoints + WIN_SCORE_GAIN`
- Matchmaking win:
  - `current.points + (earnedPoints * 2) + WIN_SCORE_GAIN`

### Score lost
When a player loses, `awardLossProgress()` subtracts:

- `LOSS_SCORE_PENALTY = 4`
- score never goes below zero

### Where score is used
- Player ranking uses `progress.points`
- Group ranking uses the sum of all members' `progress.points`

### Where to change score values
Edit:

- `src/lib/progression.ts`
- `src/lib/social.ts` if you want to change how groups or players are sorted

## 5. XP and levels

XP is also part of `PlayerProgress` in `src/lib/progression.ts`.

### Default XP
New players start with:

- `DEFAULT_PROGRESS.xp = 0`

### XP gained
Winning gives XP through `awardWinProgress()`:

- Standard win base XP:
  - `WIN_REWARD_XP = 25`
- Matchmaking win base XP:
  - `MATCHMAKING_WIN_REWARD_XP = 50`
- Extra XP is also added from the winner's in-game prestige points:
  - Standard: `earnedPoints * 8`
  - Matchmaking: `earnedPoints * 12`

Current formula:

- Standard win:
  - `WIN_REWARD_XP + earnedPoints * 8`
- Matchmaking win:
  - `MATCHMAKING_WIN_REWARD_XP + earnedPoints * 12`

### Level formula
Levels come from `getLevelFromXp()` in `src/lib/progression.ts`.

Current rule:

- `XP_PER_LEVEL = 100`
- Level 1 = `0` to `99` XP
- Level 2 = `100` to `199` XP
- Level 3 = `200` to `299` XP
- and so on

### Where to change level speed
Edit:

- `XP_PER_LEVEL` in `src/lib/progression.ts`

## 6. How rewards work by game type

### AI game
Flow:

- Game is started from `src/pages/ModeSetup.tsx` with `mode=ai`
- The actual match runs in `src/pages/Game.tsx`
- At the end of the game:
  - if the local player wins, `awardWinProgress()` runs with `rewardMode = "standard"`
  - if the local player loses, `awardLossProgress()` runs

Result:

- Winner gets coins, XP, and rank score points
- Loser loses rank score points only

### Local game
Flow:

- Game is started from `src/pages/ModeSetup.tsx` with `mode=local`
- Match runs in `src/pages/Game.tsx`
- At game end, the local player profile is updated the same way as standard mode

Result:

- Winner gets standard rewards
- Losing local profile gets the loss penalty

### Online manual room game
Flow:

- Player pays online entry fee in `src/pages/ModeSetup.tsx`
- Game starts through `src/pages/OnlineLobby.tsx` / `src/pages/OnlineGame.tsx`
- Match ends in `src/pages/Game.tsx`
- Rewards are treated as `standard` rewards, not matchmaking rewards

Result:

- Entry fee may be deducted before the game
- Winner gets standard coins / XP / score gain
- Loser gets score penalty

### Online matchmaking game
Flow:

- Player pays online entry fee in `src/pages/ModeSetup.tsx`
- Match is created from `src/pages/OnlineMatchmaking.tsx`
- Match ends in `src/pages/Game.tsx`
- Winner is rewarded with `rewardMode = "matchmaking"`

Result:

- Winner gets bigger coin rewards
- Winner gets bigger XP rewards
- Winner gets stronger score gain because earned prestige points are doubled before the win bonus is added
- Loser still receives the normal score penalty

## 7. How ranks are earned

### Player ranks
The ranked player list is built in `getRankedPlayers()` in `src/lib/social.ts`.

Sorting order is:

- higher `score` first (`progress.points`)
- if tied, higher `level` first
- if still tied, alphabetical username order

That means the fastest way to rise in player rank is:

- win games
- especially win matchmaking games
- keep building XP and level when score ties happen

### Group ranks
The ranked group list is built in `getRankedGroups()` and `getGroupScore()` in `src/lib/social.ts`.

Current group rank rule:

- a group's score = the total of all member `progress.points`
- groups are sorted from highest total to lowest total

That means a group climbs the leaderboard when its members keep winning and gaining rank points.

## 8. In-game prestige points vs stored rank points

These are two different systems:

- In-game prestige points:
  - earned during a Splendor match from cards and nobles
  - handled by game logic in `src/lib/gameLogic.ts`
  - used to decide the winner of the match
- Stored rank points:
  - saved in `progress.points`
  - handled by `src/lib/progression.ts`
  - used for player rank and group rank outside the match

If you want to change how many prestige points cards or nobles give during the actual board game, edit:

- `src/lib/gameData.ts`
- `src/lib/gameLogic.ts`

If you want to change long-term account progression, edit:

- `src/lib/progression.ts`

## 9. Quick rebalance checklist

Use this section as a shortcut:

- Change starting coins:
  - `src/lib/progression.ts`
- Change starting gems:
  - `src/lib/playerExtras.ts`
- Change online entry fee:
  - `src/lib/progression.ts`
- Change win/loss rank score:
  - `src/lib/progression.ts`
- Change XP per win or matchmaking reward scale:
  - `src/lib/progression.ts`
- Change level speed:
  - `src/lib/progression.ts`
- Change gem shop packs or weekly rewards:
  - `src/lib/shop.ts`
- Change group creation gem cost:
  - `src/pages/Groups.tsx`
- Change group ranking formula:
  - `src/lib/social.ts`
- Change player ranking tie-breakers:
  - `src/lib/social.ts`
