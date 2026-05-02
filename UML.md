# Gemstone Guilds - UML Class & Sequence Diagrams

**Last Updated:** May 2, 2026  
**Project:** Gemstone Guilds Multiplayer Card Game Platform

---

## 1. Core Domain Model - UML Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEMSTONE GUILDS DOMAIN MODEL                        │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │    GameState     │
                            ├──────────────────┤
                            │ - players[]      │
                            │ - currentPlayer  │
                            │ - tokenPool      │
                            │ - visibleCards   │
                            │ - nobles[]       │
                            │ - decks[]        │
                            │ - gameOver       │
                            │ - winner         │
                            │ - isLastRound    │
                            │ + getWinner()    │
                            │ + getBoard()     │
                            └──────────────────┘
                                   △
                                   │
                    ┌──────────────┼──────────────┬─────────────┐
                    │              │              │             │
                    ▽              ▽              ▽             ▼
            ┌──────────────┐ ┌────────────┐ ┌───────┐ ┌──────────────┐
            │   Player     │ │   Card     │ │Noble  │ │  GameConfig  │
            ├──────────────┤ ├────────────┤ ├───────┤ ├──────────────┤
            │ - id         │ │ - id       │ │ - id  │ │ - maxPlayers │
            │ - tokens     │ │ - level    │ │ - pts │ │ - minPlayers │
            │ - cards[]    │ │ - cost[]   │ │ - req │ │ - winScore   │
            │ - nobles[]   │ │ - bonus    │ │       │ │ - tokenCounts
            │ - reserved[] │ │ - points   │ │       │ │              │
            │ - score      │ │            │ │       │ │              │
            │ + score()    │ │            │ │       │ │              │
            │ + afford()   │ │            │ │       │ │              │
            │ + canReserve()
            └──────────────┘ └────────────┘ └───────┘ └──────────────┘
                    △                            △
                    │                            │
                    │ owns                       │ uses
                    │                            │
            ┌──────────────────────┐      ┌──────────────┐
            │  PlayerAccount       │      │  TokenPool   │
            ├──────────────────────┤      ├──────────────┤
            │ - userId             │      │ - diamond    │
            │ - coins              │      │ - sapphire   │
            │ - gems               │      │ - emerald    │
            │ - rankPoints         │      │ - ruby       │
            │ - level              │      │ - onyx       │
            │ - achievements[]     │      │ - gold       │
            │ - ownedCosmetics[]   │      │              │
            │ - stats{}            │      │ + have()     │
            │ + addCoins()         │      │ + take()     │
            │ + unlock()           │      │ + return()   │
            │ + getLevel()         │      │              │
            └──────────────────────┘      └──────────────┘


                    ┌──────────────────────────────────┐
                    │     AI Strategy Pattern          │
                    ├──────────────────────────────────┤
                    │ <<interface>>                    │
                    │ AIPlayer                         │
                    ├──────────────────────────────────┤
                    │ + evaluate()                     │
                    │ + selectAction()                 │
                    │ + scoreCard()                    │
                    │ + scoreToken()                   │
                    └──────────────────────────────────┘
                                △
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
            ┌────────────┐ ┌─────────┐ ┌─────────┐
            │ EasyAI     │ │MediumAI │ │ HardAI  │
            ├────────────┤ ├─────────┤ ├─────────┤
            │ - rnd:0.8  │ │ - rnd:5 │ │ - rnd:2 │
            │ - depth:1  │ │ - d:2   │ │ - d:3   │
            │            │ │         │ │         │
            │ +select()  │ │ +select │ │ +select │
            └────────────┘ └─────────┘ └─────────┘
```

---

## 2. Full UML Specification (Text Format)

### 2.1 Game Module Classes

```
CLASS GameState
  ATTRIBUTES
    - players: Player[]
    - currentPlayerIndex: number
    - tokenPool: TokenPool
    - visibleCards: { 1: Card[], 2: Card[], 3: Card[] }
    - decks: { 1: Card[], 2: Card[], 3: Card[] }
    - nobles: Noble[]
    - gameOver: boolean
    - winner: Player | null
    - isLastRound: boolean
    - lastRoundTriggerIndex: number | null
  
  METHODS
    + getWinner(): Player | null
    + getCurrentPlayer(): Player
    + getGamePhase(): 'setup' | 'playing' | 'endgame' | 'finished'
    + getValidActions(playerIdx: number): Action[]
    + serialize(): JSON
    + deserialize(json: JSON): GameState

CLASS Player
  ATTRIBUTES
    - id: number (0-3)
    - tokens: TokenPool
    - cards: Card[] (owned)
    - reservedCards: Card[] (max 3)
    - nobles: Noble[] (visited)
    - tokenOverflow: TokenPool (when taking too many)
  
  METHODS
    + getTotalTokens(): number
    + getScore(): number
    + getCardBonuses(): Map<GemType, number>
    + canAfford(card: Card): boolean
    + canReserve(): boolean
    + addTokens(tokens: Partial<TokenPool>): void
    + removeTokens(tokens: Partial<TokenPool>): void
    + addCard(card: Card): void
    + removeCard(cardId: string): void
    + addNoble(noble: Noble): void

CLASS Card
  ATTRIBUTES
    - id: string
    - level: 1 | 2 | 3
    - cost: { diamond, sapphire, emerald, ruby, onyx: number }
    - gemBonus: GemType
    - victoryPoints: number (0-5)
    - rarity: 'common' | 'rare' | 'epic'
  
  METHODS
    + isAffordable(player: Player): boolean
    + isSame(card: Card): boolean
    + toString(): string

CLASS Noble
  ATTRIBUTES
    - id: string
    - victoryPoints: number (fixed = 3)
    - requirements: Map<GemType, number>
  
  METHODS
    + visitsPlayer(player: Player): boolean
    + toString(): string

CLASS TokenPool
  ATTRIBUTES
    - diamond: number
    - sapphire: number
    - emerald: number
    - ruby: number
    - onyx: number
    - gold: number (wildcard)
  
  METHODS
    + total(): number
    + getAmount(gemType: GemType): number
    + hasEnough(tokens: Partial<TokenPool>): boolean
    + add(tokens: Partial<TokenPool>): TokenPool
    + subtract(tokens: Partial<TokenPool>): TokenPool
    + isEmpty(): boolean
```

### 2.2 Game Logic Classes

```
CLASS GameLogic
  STATIC METHODS
    + initializeGame(playerCount: 2 | 3 | 4): GameState
    + validateAction(state: GameState, action: Action): boolean
    + performAction(state: GameState, action: Action): GameState | Error
    + performTakeTokens(state: GameState, gems: GemType[]): GameState
    + performPurchaseCard(state: GameState, cardId: string): GameState
    + performReserveCard(state: GameState, cardId: string): GameState
    + checkNobleVisits(state: GameState, playerIdx: number): Noble[]
    + checkGameWon(state: GameState, playerIdx: number): boolean
    + advanceTurn(state: GameState): GameState
    + endGame(state: GameState, winnerIdx: number): GameState

CLASS GameValidator
  STATIC METHODS
    + canTakeTokens(state: GameState, gems: GemType[]): boolean
    + canPurchaseCard(state: GameState, cardId: string): boolean
    + canReserveCard(state: GameState, cardId: string): boolean
    + validateTokenCount(state: GameState, playerIdx: number): boolean
    + validateReservedCount(player: Player): boolean

CLASS GameConstants
  CONSTANTS
    GEM_TYPES: ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx']
    TARGET_SCORE: 15
    MAX_RESERVED_CARDS: 3
    TOKEN_COSTS: { 2: 4, 3: 5, 4: 7 }  (by player count)
    CARDS_PER_LEVEL: { 1: 40, 2: 30, 3: 20 }
    VISIBLE_CARDS_COUNT: 4
```

### 2.3 AI Player Classes

```
CLASS AIPlayer (Abstract)
  ATTRIBUTES
    - difficulty: 'easy' | 'medium' | 'hard'
    - randomness: number (0-10, higher = more random)
    - lookahead: number (depth of decision tree)
  
  METHODS
    + selectAction(state: GameState, playerIdx: number): Action
    + evaluateAction(state: GameState, action: Action, playerIdx: number): number
    + scoreCard(card: Card, state: GameState, playerIdx: number): number
    + scoreTokens(gems: GemType[], state: GameState): number
    + getRandomAction(candidates: Action[]): Action
    + #evaluateTowardVictory(): number
    + #evaluateNobleProgress(): number
    + #evaluateTokenSituation(): number

CLASS EasyAI EXTENDS AIPlayer
  CONSTRUCTOR
    difficulty = 'easy'
    randomness = 8 (very random)
    lookahead = 1 (only current move)
  
  METHODS
    + selectAction(state, playerIdx): Action
      - Return mostly random action with slight bias toward good moves

CLASS MediumAI EXTENDS AIPlayer
  CONSTRUCTOR
    difficulty = 'medium'
    randomness = 5
    lookahead = 2
  
  METHODS
    + selectAction(state, playerIdx): Action
      - Evaluate options, bias toward card progress
      - Consider noble visits

CLASS HardAI EXTENDS AIPlayer
  CONSTRUCTOR
    difficulty = 'hard'
    randomness = 2 (mostly optimal)
    lookahead = 3
  
  METHODS
    + selectAction(state, playerIdx): Action
      - Deep evaluation of all options
      - Complex blocking and advancement strategies
```

### 2.4 User Management Classes

```
CLASS User
  ATTRIBUTES
    - id: string (UUID)
    - username: string (unique)
    - email: string (unique)
    - passwordHash: string
    - createdAt: DateTime
    - updatedAt: DateTime
    - isActive: boolean
    - preferences: UserPreferences
  
  METHODS
    + authenticate(password: string): boolean
    + updatePassword(newPassword: string): boolean
    + deactivate(): void
    + reactivate(): void

CLASS UserPreferences
  ATTRIBUTES
    - language: 'en' | 'fa'
    - audioEnabled: boolean
    - audioVolume: number (0-100)
    - notificationsEnabled: boolean
    - theme: 'light' | 'dark'
    - region: string

CLASS PlayerAccount
  ATTRIBUTES
    - userId: string (FK → User)
    - coins: number (in-game currency)
    - gems: number (premium currency)
    - rankPoints: number
    - level: number (0+)
    - totalGamesPlayed: number
    - achievements: Achievement[]
    - ownedCosmetics: string[] (cosmetic IDs)
    - stats: PlayerStats
  
  METHODS
    + addCoins(amount: number): void
    + addGems(amount: number): void
    + spendCoins(amount: number): boolean
    + spendGems(amount: number): boolean
    + addRankPoints(points: number): void
    + updateLevel(): void
    + unlockCosmeticItem(itemId: string): void
    + getChecksum(): string (for anti-cheat)

CLASS PlayerStats
  ATTRIBUTES
    - gamesPlayed: number
    - gamesWon: number
    - gamesLost: number
    - totalPlaytime: number (seconds)
    - avgGameDuration: number
    - highScore: number
    - winRate: number (calculated)
    - lastPlayedAt: DateTime
    - favoriteGame: string
  
  METHODS
    + recordWin(gameDuration: number, score: number): void
    + recordLoss(gameDuration: number, score: number): void
    + calculateWinRate(): number
    + calculatePlaytime(): number (total hours)
```

### 2.5 Social Classes

```
CLASS Friend
  ATTRIBUTES
    - userId1: string (FK → User)
    - userId2: string (FK → User)
    - createdAt: DateTime
    - status: 'pending' | 'accepted' | 'blocked'
    - friendedBy: string (who initiated)
  
  METHODS
    + accept(): void
    + reject(): void
    + block(): void
    + unblock(): void

CLASS Guild
  ATTRIBUTES
    - id: string (UUID)
    - name: string
    - leaderId: string (FK → User)
    - memberLimit: number (10-100)
    - members: string[] (User IDs)
    - createdAt: DateTime
    - description: string
    - ranking: number (in guild leaderboard)
    - treasury: number (shared coins)
  
  METHODS
    + addMember(userId: string): boolean
    + removeMember(userId: string): void
    + transferLeadership(newLeaderId: string): void
    + depositTreasury(amount: number): void
    + withdrawTreasury(amount: number, by: string): void
    + getMembers(): User[]
    + getRank(userId: string): number

CLASS GameSession
  ATTRIBUTES
    - id: string (UUID)
    - players: Player[]
    - gameState: GameState
    - startedAt: DateTime
    - endedAt: DateTime | null
    - gameMode: 'solo' | 'online' | 'challenge'
    - moves: GameMove[]
    - replay: GameReplay
    - winner: Player | null
  
  METHODS
    + recordMove(move: GameMove): void
    + endSession(winner: Player): void
    + generateReplay(): GameReplay
    + export(): JSON
```

### 2.6 Shop Classes

```
CLASS CosmeticItem
  ATTRIBUTES
    - id: string
    - name: string
    - type: 'avatar' | 'card-back' | 'board-theme' | 'particle-effect'
    - rarity: 'common' | 'rare' | 'epic' | 'legendary'
    - priceCoins: number
    - priceGems: number
    - image: string (URL)
    - description: string
    - isLimited: boolean
    - availableUntil: DateTime | null
    - createdAt: DateTime
  
  METHODS
    + isAffordable(player: PlayerAccount): boolean
    + isPurchasable(player: PlayerAccount): boolean
    + purchase(by: PlayerAccount): boolean

CLASS ShopBundle
  ATTRIBUTES
    - id: string
    - name: string
    - items: CosmeticItem[]
    - priceCoin: number
    - priceGem: number
    - savings: number (discount percentage)
    - isLimited: boolean
    - availableUntil: DateTime | null
  
  METHODS
    + calculateTotal(): number
    + purchase(by: PlayerAccount): boolean

CLASS PurchaseRecord
  ATTRIBUTES
    - id: string
    - userId: string
    - itemId: string
    - itemType: string
    - pricePaid: number
    - currency: 'coins' | 'gems'
    - purchasedAt: DateTime
    - platform: 'ios' | 'android' | 'web'
  
  METHODS
    + getReceipt(): Receipt
    + refund(reason: string): void
```

---

## 3. Component Hierarchy Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    <App />                                   │
│          Main Router & Context Providers                     │
├──────────────────────────────────────────────────────────────┤
│ - AuthProvider                                               │
│ - LanguageProvider                                           │
│ - ThemeProvider                                              │
└──────────────────────────────────────────────────────────────┘
            │
            ├────────────────────┬────────────────┬──────────────┐
            │                    │                │              │
            ▼                    ▼                ▼              ▼
        <Routes/>          <NavMenu/>        <Footer/>      <Modal/>
            │
    ┌───────┼──────────────────────┬─────────────┬────────────┐
    │       │                      │             │            │
    ▼       ▼                      ▼             ▼            ▼
  Login  SignUp                  Game         Shop          Settings
    │       │                      │             │            │
    │       │                  ┌───┴────┐        │            │
    │       │                  │        │        │            │
    ▼       ▼                  ▼        ▼        ▼            ▼
 <AuthForm> <RegForm>    <SoloGame> <OnlineGame> <ShopUI>  <SettingsUI>
     │          │             │          │          │
     └─┬────────┘             │          │          │
       │                      ▼          ▼          ▼
       │                  <GameBoard> <MatchUI> <ItemsList>
       │                      │          │          │
       ▼                      ▼          ▼          ▼
  Backend                 <Viewport> <Chat>    <ItemCard>
   Validation              <Player>   <Sync>
                           <Cards>    <Network>


  <GameBoard /> Component Tree:
  ┌───────────────────────────┐
  │      <GameBoard />        │
  ├───────────────────────────┤
  │ Props:                    │
  │ - gameState               │
  │ - playerIndex             │
  │ - onAction                │
  │ - gameMode                │
  │                           │
  │ Children:                 │
  │ - <Viewport/>             │
  │ - <CardGrid/>             │
  │ - <TokenDisplay/>         │
  │ - <ActionPanel/>          │
  │ - <PlayerStatus/>         │
  │ - <NobleTracker/>         │
  └───────────────────────────┘
         │
    ┌────┼────┬───────┬─────────┬──────────────┬───────────┐
    │    │    │       │         │              │           │
    ▼    ▼    ▼       ▼         ▼              ▼           ▼
 <Viewport> <CardGrid> <TokenPool> <Action> <PlayerPanel> <Toast>
           │                    │                  │
           │                    │                  │
   ┌───────▼────────┐   ┌──────▼──────┐   ┌──────▼────┐
   │  <Card />      │   │  <Token />   │   │ <Status/> │
   │  <Card />      │   │  <Token />   │   │ <Coins/>  │
   │  <Card />      │   │  <Token />   │   │ <Gems/>   │
   │  <Card />      │   │              │   │ <Rank/>   │
   └────────────────┘   └──────────────┘   └───────────┘
```

---

## 4. Sequence Diagrams

### 4.1 User Registration Sequence

```
User          UI            Backend        Database       Email
  │            │               │              │             │
  ├─Entry─────>│               │              │             │
  │ form data  │               │              │             │
  │            │               │              │             │
  │            ├──POST────────>│              │             │
  │            │ /auth/signup  │              │             │
  │            │ (email, pwd)  │              │             │
  │            │               │              │             │
  │            │               ├─Validate────>│             │
  │            │               │ email unique │             │
  │            │               │              │             │
  │            │               │<──Check OK──┤             │
  │            │               │              │             │
  │            │               ├─Hash Password            │
  │            │               │              │             │
  │            │               ├─Create User─>│             │
  │            │               │              │             │
  │            │               │<──Success───┤             │
  │            │               │              │             │
  │            │               ├──Send Email──────────────>│
  │            │               │ verification  │             │
  │            │               │              │             │
  │            │<───201────────┤              │             │
  │            │ JWT token     │              │             │
  │            │               │              │             │
  │<─Success──│               │              │             │
  │ (redirect) │               │              │             │
  │            │               │              │             │
```

### 4.2 Game Start Sequence

```
Player1       UI          Backend       GameDB      Player2
  │            │             │            │            │
  ├─Start──────>│             │            │            │
  │ game       │             │            │            │
  │ request    │             │            │            │
  │            │             │            │            │
  │            ├─POST────────>│            │            │
  │            │ /games       │            │            │
  │            │              │            │            │
  │            │              ├─Create────>│            │
  │            │              │ GameState  │            │
  │            │              │            │            │
  │            │              │<──ID──────┤            │
  │            │              │            │            │
  │            ├─GET gameID──>│            │            │
  │            │ (polling)    │            │            │
  │            │<─GameState──┤            │            │
  │            │ (waiting..) │            │            │
  │            │              │            │            │
  │            │              ├─Notify────────────────>│
  │            │              │ (WebSocket)            │
  │            │              │            │            │
  │            │<───GameStart─┤            │            │
  │            │ signal       │            │            │
  │            │              │            │            │
  │<─Game──────│              │            │            │
  │ UI Ready   │              │            │            │
  │            │              │            │            │
  │ ─────Render Game Board────────────────────────────┤
  │            │              │            │            │
  │            │              │            │            │
```

### 4.3 Card Purchase Sequence

```
Player         UI         GameLogic    Backend      Database
  │             │              │           │            │
  ├─Click──────>│              │           │            │
  │ purchase    │              │           │            │
  │             │              │           │            │
  │             ├─Validate────>│           │            │
  │             │ canAfford()  │           │            │
  │             │              │           │            │
  │             │<─OK──────────┤           │            │
  │             │ (local)      │           │            │
  │             │              │           │            │
  │             ├──POST───────────────────>│            │
  │             │ /games/:id/  │           │            │
  │             │ action       │           │            │
  │             │ {purchase}   │           │            │
  │             │              │           │            │
  │             │              ├─Perform──>│            │
  │             │              │ Purchase  │            │
  │             │              │           │            │
  │             │              │           ├─Save──────>│
  │             │              │           │ NewState   │
  │             │              │           │            │
  │             │              │           │<─OK───────┤
  │             │              │           │            │
  │             │<─NewState────────────────┤            │
  │             │ (card owned) │           │            │
  │             │              │           │            │
  │<─Update────│              │           │            │
  │ UI         │              │           │            │
  │ (show card)│              │           │            │
  │            │              │           │            │
  │            ├─Broadcast────────────────────────>   │
  │            │ (if online)  │           │            │
  │            │ new state    │           │            │
  │            │              │           │            │
```

### 4.4 Multiplayer Game Move Sequence

```
Player1         UI1        WebSocket        UI2        Player2
  │              │             │             │            │
  ├─Make───────>│             │             │            │
  │ move        │             │             │             │
  │             │             │             │            │
  │             ├─Emit───────>│             │            │
  │             │ action      │             │            │
  │             │             │             │            │
  │             │             ├─Validate───────────────>│
  │             │             │ & Process  │            │
  │             │             │             │            │
  │             │             │ (Backend)   │            │
  │             │             │             │            │
  │             │             ├─Broadcast──────────┐   │
  │             │             │ new state  │     │   │
  │             │             │            │     │   │
  │             │<────Update State────────┘     │   │
  │             │ (sync)      │             │    │   │
  │             │             │             │    │   │
  │<─Rendered──│             │             │    │   │
  │ new state  │             │             │    │   │
  │            │             │             │    │   │
  │            │             │             ├───Update──>│
  │            │             │             │ State     │
  │            │             │             │           │
  │            │             │             │<─Render──┤
  │            │             │             │ new board│
  │            │             │             │           │
  │            │             │             │<──Ready──│
  │            │             │<─────Ack───────────────│
  │            │             │ (move valid)│           │
  │            │             │             │           │
  │            │<─────Ack────┤             │           │
  │            │ (confirmed) │             │           │
  │            │             │             │           │
```

### 4.5 Payment Processing Sequence

```
Player        UI        Backend      Stripe       Bank
  │            │           │           │           │
  ├─Purchase──>│           │           │           │
  │ gems       │           │           │           │
  │            │           │           │           │
  │            ├─Show─────>│           │           │
  │            │ payment   │           │           │
  │            │ form      │           │           │
  │            │           │           │           │
  │<─Enter────│           │           │           │
  │ card      │           │           │           │
  │ details   │           │           │           │
  │            │           │           │           │
  │            ├─POST─────>│           │           │
  │            │ /payment  │           │           │
  │            │ (token)   │           │           │
  │            │           │           │           │
  │            │           ├─Charge──>│           │
  │            │           │ API call │           │
  │            │           │           │           │
  │            │           │           ├─Auth────>│
  │            │           │           │ transaction
  │            │           │           │           │
  │            │           │           │<─Success─│
  │            │           │           │           │
  │            │           │<─Success─┤           │
  │            │           │ (charge  │           │
  │            │           │  success)│           │
  │            │           │           │           │
  │            │           ├─Save─────────────────┐
  │            │           │ transaction  │   │   │
  │            │           │ to DB       │   │   │
  │            │           │             │   │   │
  │            │           ├─Add Gems───────────┐
  │            │           │ to account  │   │  │
  │            │           │             │   │  │
  │            │<─Receipt──┤             │   │  │
  │            │ (success) │             │   │  │
  │            │           │             │   │  │
  │<─Show────┤           │             │   │  │
  │ success  │           │             │   │  │
  │ screen   │           │             │   │  │
  │          │           │             │   │  │
```

---

## 5. State Machine Diagrams

### 5.1 Game State Machine

```
              ┌─────────────┐
              │   INITIAL   │
              └──────┬──────┘
                     │
                     │ initializeGame()
                     ▼
              ┌─────────────┐
       ┌─────>│   SETUP     │
       │      │ (deal cards)│
       │      └──────┬──────┘
       │             │
       │             │ all setup done
       │             ▼
       │      ┌─────────────┐
       │      │  PLAYING    │◄─────┐
       │      │ (take turns)│      │
       │      └──────┬──────┘      │
       │             │             │
       │             ├─Player wins ┤ next turn
       │             │  15 points  │
       │             ▼             │
       │      ┌─────────────┐      │
       │      │ LAST_ROUND  │──────┘
       │      │ (1 more?)   │
       │      └──────┬──────┘
       │             │
       │             ▼
       │      ┌─────────────┐
       │      │  FINISHED   │
       │      │ (end game)  │
       │      └──────┬──────┘
       │             │
       │             │ save & archive
       │             ▼
       │      ┌─────────────┐
       └─────→│  ARCHIVED   │
              └─────────────┘

Transitions:
INITIAL    → SETUP       : initializeGame()
SETUP      → PLAYING     : all players ready
PLAYING    → LAST_ROUND  : player reaches 15 VP
LAST_ROUND → FINISHED    : round completes
FINISHED   → ARCHIVED    : game saved
FINISHED   → PLAYING     : reset = restart
```

### 5.2 Player Turn State Machine

```
         ┌─────────────┐
         │  IDLE       │
         │ (not turn)  │
         └──────┬──────┘
                │
                │ player's turn
                ▼
         ┌─────────────┐
         │ WAIT_ACTION │◄─────────┐
         │ (select)    │          │
         └──────┬──────┘          │
                │                 │
       ┌────────┬───────┬─────────┘
       │        │       │
       ▼        ▼       ▼
   (TAKE)   (PURCH)  (RESERVE)
       │        │       │
       │        │       │
       ▼        ▼       ▼
   ACTION_    ACTION_    ACTION_
   PENDING    PENDING    PENDING
       │        │       │
       └────────┼────────┘
                │
                ▼
         ┌─────────────┐
         │  EXECUTING  │ (validate & apply)
         └──────┬──────┘
                │
                ├─ Error? ┐
                │         └─> Back to WAIT_ACTION
                │
                ├─ Success
                │
                ▼
         ┌─────────────┐
         │  COMMITTED  │ (update game state)
         └──────┬──────┘
                │
                ▼
         ┌─────────────┐
         │  ADVANCING  │ (check nobles, check win)
         └──────┬──────┘
                │
                ├─ Game won ──> FINISHED
                │
                ├─ Last round ──> LAST_ROUND
                │
                └─ Normal ──> Next player's IDLE
```

---

## 6. UML Package Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Gemstone Guilds                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │ Game Core Package  │  │ Server Package     │             │
│  ├────────────────────┤  ├────────────────────┤             │
│  │ - GameState        │  │ - Routes           │             │
│  │ - Player           │  │ - Controllers      │             │
│  │ - Card             │  │ - Middleware       │             │
│  │ - Noble            │  │ - WebSocket        │             │
│  │ - GameLogic        │  │ - Services         │             │
│  │ - AIPlayer         │  │ - Database         │             │
│  └────────┬───────────┘  └────────┬───────────┘             │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       │ imports                              │
│                       ▼                                      │
│  ┌──────────────────────────────────┐                       │
│  │      Client Package (React)      │                       │
│  ├──────────────────────────────────┤                       │
│  │ - Components                     │                       │
│  │ - Hooks (useGame, useAuth, etc)  │                       │
│  │ - Pages                          │                       │
│  │ - Context (Auth, Language)       │                       │
│  └──────────────────────────────────┘                       │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │ User Package       │  │ Shop Package       │             │
│  ├────────────────────┤  ├────────────────────┤             │
│  │ - User             │  │ - CosmeticItem     │             │
│  │ - Account          │  │ - ShopBundle       │             │
│  │ - Auth             │  │ - Purchase         │             │
│  │ - Friend           │  │ - Payment          │             │
│  │ - Guild            │  └────────────────────┘             │
│  └────────────────────┘                                     │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │ Analytics Package  │  │ Admin Package      │             │
│  ├────────────────────┤  ├────────────────────┤             │
│  │ - Events           │  │ - Monitoring       │             │
│  │ - Tracking         │  │ - Moderation       │             │
│  │ - Reporting        │  │ - Management       │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Dependency Graph

```
Frontend Dependencies:
React
  ├─ React Router DOM
  ├─ React Hook Form
  ├─ TailwindCSS
  ├─ shadcn/ui (Radix UI)
  ├─ Socket.IO Client
  ├─ Axios
  └─ Zod (validation)

Backend Dependencies:
Express.js
  ├─ Socket.IO
  ├─ MongoDB (mongoose)
  ├─ Redis
  ├─ JWT (jsonwebtoken)
  ├─ bcryptjs
  ├─ Zod (validation)
  └─ Winston (logging)

Development Tools:
TypeScript
  ├─ Vite
  ├─ ESLint
  ├─ Prettier
  └─ Vitest/Jest

  Cypress/Playwright (E2E)
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 2, 2026 | AI Assistant | Initial UML documentation |
| | | | |

---

*UML diagrams should be reviewed and updated as architecture evolves.*
