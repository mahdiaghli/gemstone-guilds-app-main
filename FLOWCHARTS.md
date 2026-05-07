# Gemstone Guilds - Process Flowcharts

**Last Updated:** May 2, 2026  
**Project:** Gemstone Guilds Multiplayer Card Game Platform

---

## 1. User Journey Flowchart

```
                         ┌─────────────┐
                         │   VISITOR   │
                         │  (Landing)  │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐    ┌─────────▼──────┐
            │  new player    │    │ existing player│
            │                │    │                │
            └───────┬────────┘    └────────┬───────┘
                    │                      │
                    │                      │
            ┌───────▼────────┐    ┌────────▼──────┐
            │ Sign Up Page   │    │  Login Page   │
            │ - Fill form    │    │ - Email/pwd   │
            │ - Continue     │    │ - Continue    │
            └───────┬────────┘    └────────┬──────┘
                    │                      │
                    │                      ├─[Failed]─┐
                    │                      │          │
                    │                      ▼          │
                    │              ┌────────────────┐ │
                    │              │ Error message  │─┘
                    │              │ (retry login)  │
                    │              └────────────────┘
                    │
            ┌───────┴────────┐
            │                │
            ▼                ▼
       [Success]        [Success]
            │                │
            └────────┬───────┘
                     │
            ┌────────▼──────────┐
            │   HOME/DASHBOARD  │
            │ - User profile    │
            │ - Game selection  │
            │ - Shop            │
            │ - Friends         │
            │ - Guild           │
            └────────┬──────────┘
                     │
         ┌───────────┼───────────┬────────────┐
         │           │           │            │
         ▼           ▼           ▼            ▼
    ┌─PLAY─┐   ┌─SHOP─┐   ┌─FRIENDS┐   ┌─SETTINGS┐
    │GAMES │   │ITEMS │   │SOCIAL  │   │OPTIONS  │
    └──────┘   └─────┘    └────────┘   └────────┘
         │           │           │            │
         └─────┬─────┴─────┬─────┴────────────┘
               │           │
               ▼           ▼
        ┌──────────────────────────┐
        │    LOGGED IN PLAYER      │
        │  (Active Engagement)     │
        └──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌─────┐  ┌──────┐  ┌─────────┐
│Daily│  │ Exit/│  │ Inactive│
│Loop │  │Logout│  │(7days)  │
└─────┘  └──────┘  └────┬────┘
    │          │        │
    └──────┬───┘        │
           │            ▼
           │      ┌──────────────┐
           │      │ Lapsed User  │
           │      │ (Send email) │
           │      └──────┬───────┘
           │             │
           ▼             ▼
      ┌──────────────────────────┐
      │     CHURN HANDLING       │
      │  (Re-engagement campaign)│
      └──────────────────────────┘
```

---

## 2. Splendor Game Flow

```
START
  │
  ▼
┌──────────────────────┐
│ GAME INITIALIZATION  │
│ - Shuffle cards      │
│ - Setup token pool   │
│ - Assign nobles      │
│ - Seed player state  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GAME LOOP            │
│ (repeat until win)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PLAYER TURN BEGIN    │
│ - Check noble visits │
│ - Get valid actions  │
│ - Display options    │
└──────────┬───────────┘
           │
        [Human or AI?]
        /            \
       /              \
   [Human]          [AI]
      │               │
      ▼               ▼
┌──────────┐  ┌──────────────┐
│  UI Wait │  │ AI Evaluate  │
│for input │  │ (difficulty) │
└─────┬────┘  └──────┬───────┘
      │              │
      └────┬─────────┘
           │
           ▼
┌──────────────────────┐
│ VALIDATE ACTION      │
│ - Check affordability│
│ - Check legality     │
└──────────┬───────────┘
           │
      [Valid?]
       /    \
      /      \
  [Yes]     [No]
     │        └─────────────┐
     │                      │
     ▼                      ▼
┌─────────────┐     ┌──────────────────┐
│ EXECUTE     │     │ Show Error       │
│ ACTION      │     │ Return to options│
│             │     └──────┬───────────┘
│ Options:    │            │
│ 1.TakeToken │            │
│ 2.Purchase  │            │
│ 3.Reserve   │            │
│             │            │
└──────┬──────┘            │
       │                   │
       ├──[TAKE TOKEN]─┐   │
       │               │   │
       │ ┌─────────────▼───┘
       │ │
       │ ▼
       │┌─────────────────────┐
       ││ 1. SELECT GEMS      │
       ││ 2. VALIDATE POOL    │
       ││ 3. UPDATE TOKENS    │
       │└────────┬────────────┘
       │         │
       │         ├──[PURCHASE]─┐
       │         │              │
       │         ▼    ┌─────────▼──────┐
       │    ┌───────┐ │ 1. SELECT CARD │
       │    │ TOKEN │ │ 2. VERIFY COST │
       │    │ TAKEN │ │ 3. REMOVE CARD │
       │    └─────┬─┘ │ 4. ADD TO OWN  │
       │          │   │ 5. REFILL SLOT │
       │          │   └────────┬───────┘
       │          │            │
       │          │            ├──[RESERVE]──┐
       │          │            │              │
       │          │            ▼  ┌───────────▼────┐
       │          │       ┌──────┐ │ 1. SELECT CARD │
       │          │       │CARD  │ │ 2. CHECK LIMIT │
       │          │       │OWNED │ │ 3. GOLD TOKEN  │
       │          │       └──┬───┘ │ 4. ADD TO RSV   │
       │          │          │     └────────┬───────┘
       │          │          │              │
       └──────────┴──────────┴──────┬───────┘
                                   │
                                   ▼
                          ┌───────────────────┐
                          │ CHECK NOBLE VISIT │
                          │ (for each noble)  │
                          └─────┬─────────────┘
                                │
                           [Noble req met?]
                            /        \
                           /          \
                         [Yes]       [No]
                          │           │
                          ▼           │
                    ┌────────────┐    │
                    │ Add Noble  │    │
                    │ Update pts │    │
                    └────┬───────┘    │
                         │            │
                         └────┬───────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ CHECK WIN        │
                    │ (15+ points?)    │
                    └────────┬─────────┘
                             │
                        [Won?]
                         /   \
                        /     \
                      [Yes]   [No]
                        │       │
                        │       ▼
                        │  ┌────────────────┐
                        │  │ CHECK LAST RND │
                        │  │ (win triggered │
                        │  │  last round?)  │
                        │  └─────┬──────────┘
                        │        │
                        │   [Last Round?]
                        │    /         \
                        │   /           \
                        │ [Yes]         [No]
                        │  │             │
                        │  ▼             │
                        │┌──────────────┐│
                        ││ END GAME     ││
                        ││ (complete    ││
                        ││  round)      ││
                        │└──────┬───────┘│
                        │       │        │
                        └───┬───┴────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │ GAME END        │
                    │ - Calculate pts │
                    │ - Determine win │
                    │ - Save record   │
                    │ - Award rewards │
                    └─────────────────┘
                            │
                            ▼
                         ┌─────┐
                         │ END │
                         └─────┘
```

---

## 3. Multiplayer Matchmaking Flow

```
START
  │
  ▼
┌──────────────────────┐
│ PLAYER QUEUE         │
│ - Select game mode   │
│ - Select difficulty  │
│ - Enter queue        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ QUEUE WAIT           │
│ (waiting for match)  │
│ Display: queue pos   │
│ Enable: cancel       │
└──────────┬───────────┘
           │
      ┌────┴─────┐
      │           │
   [Match]     [Cancel]
      │           │
      ▼           ▼
┌─────────┐  ┌──────────┐
│Match!!  │  │ Exit     │
└────┬────┘  │ Queue    │
     │       └──────────┘
     │
     ▼
┌──────────────────────┐
│ LOBBY SETUP          │
│ - 2-4 players ready? │
│ - Countdown (30s)    │
│ - If not ready: eject│
└──────────┬───────────┘
           │
      ┌────┴───────────┐
      │                │
  [Ready]         [Not Ready/Left]
      │                │
      ▼                ▼
┌──────────────┐  ┌────────────┐
│ Everyone In │  │ Return to   │
│ Initialize  │  │ Queue or    │
│ Game        │  │ Main Menu   │
└──────┬───────┘  └────────────┘
       │
       ▼
┌──────────────────────┐
│ STREAM SYNC          │
│ - Send game state    │
│ - WebSocket connect  │
│ - Verify all ready   │
└──────────┬───────────┘
           │
      [All sync'd?]
       /         \
    [Yes]       [No]
      │           │
      │           ▼
      │    ┌──────────────┐
      │    │ Timeout      │
      │    │ (30s) or     │
      │    │ disconnect   │
      │    │ → End game   │
      │    └──────────────┘
      │
      ▼
┌──────────────────────┐
│ GAME START           │
│ (see Splendor flow)  │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
 [Normal]     [Disconnect]
    │             │
    ▼             ▼
┌─────────────────────────────┐
│ GAME CONTINUES              │
│ (solo play or reconnect)    │
└──────────┬──────────────────┘
           │
           ▼
┌────────────────────────────┐
│ GAME ENDS                  │
│ - Calculate results        │
│ - Update stats             │
│ - Sync with server         │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ RESULTS SCREEN             │
│ - Winner/Loser             │
│ - Rewards (coins, points)  │
│ - Options: play again,home │
└────────────────────────────┘
         │
         ▼
      ┌───┐
      │ END
      └───┘
```

---

## 4. Payment Processing Flow

```
START
  │
  ▼
┌──────────────────────┐
│ SHOP UI              │
│ - Browse items       │
│ - Select cosmetic    │
│ - Click buy button   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PURCHASE DIALOG      │
│ - Show item details  │
│ - Show price (gems)  │
│ - Confirm purchase   │
└──────────┬───────────┘
           │
      ┌────┴────────┐
      │             │
  [Confirm]     [Cancel]
      │             │
      ▼             ▼
  [Proceed]    [Return to Shop]
      │
      ▼
┌──────────────────────┐
│ CHECK BALANCE        │
│ - Do I have gems?    │
└──────────┬───────────┘
           │
      [Have gems?]
       /         \
    [Yes]       [No]
      │           │
      ▼           ▼
  [Process]   ┌──────────────┐
      │       │ Show upgrade  │
      │       │ to gems       │
      │       │ (offer email) │
      │       └──────┬───────┘
      │              │
      │          [Proceed]
      │              │
      │              ▼
      │       ┌──────────────────────┐
      │       │ PAYMENT OPTION       │
      │       │ - Credit/Debit       │
      │       │ - Google Play        │
      │       │ - Apple Pay          │
      │       │ - PayPal             │
      │       └────────┬─────────────┘
      │                │
      │                ▼
      │       ┌──────────────────────┐
      │       │ PAYMENT FORM         │
      │       │ - Enter card details │
      │       │ - Process            │
      │       └────────┬─────────────┘
      │                │
      │<───────────────┘
      │
      ▼
┌──────────────────────┐
│ PAYMENT API CALL     │
│ - Send to Stripe     │
│ - Create charge      │
└──────────┬───────────┘
           │
      [Success?]
       /      \
    [Yes]    [No]
      │        │
      ▼        ▼
  [Process] ┌──────────────────┐
      │     │ Error message:   │
      │     │ - Card declined  │
      │     │ - Try again/use  │
      │     │   different card │
      │     └──────┬───────────┘
      │            │
      │       [Retry]
      │            │
      │            └────┐
      │                 │
      │                 ▼
      │         [Loop back]
      │
      ▼
┌──────────────────────┐
│ BACKEND PROCESSING   │
│ - Verify charge      │
│ - Create transaction │
│ - Add items          │
└──────────┬───────────┘
           │
      [Success?]
       /      \
    [Yes]    [No]
      │        │
      ▼        ▼
  [Complete] ┌──────────────┐
      │      │ Refund       │
      │      │ Notify user  │
      │      │ Retry later  │
      │      └──────────────┘
      │
      ▼
┌──────────────────────┐
│ UPDATE INVENTORY     │
│ - Add cosmetic item  │
│ - Save to DB         │
│ - Notify client      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ RECEIPT SCREEN       │
│ - Item purchased     │
│ - Available now      │
│ - OK button          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ INVENTORY UPDATE     │
│ - Show new cosmetic  │
│ - Select to use      │
│ - Go to shop/home    │
└──────────┬───────────┘
           │
           ▼
        ┌──────┐
        │ END  │
        └──────┘
```

---

## 5. AI Decision Making Flow

```
START (AI Turn)
  │
  ▼
┌──────────────────────┐
│ GET GAME STATE       │
│ - Current player id  │
│ - Board state        │
│ - Token pool         │
│ - Cards visible      │
│ - My tokens          │
│ - My cards           │
│ - My score           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GET CANDIDATES       │
│ - Affordable cards   │
│ - Token combos       │
│ - Reserve options    │
│ - All legal moves    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ DIFFICULTY CHECK     │
│ (apply strategy)     │
└────────┬──────┬──────┴─────────┐
         │      │                │
     [Easy]  [Med]           [Hard]
         │      │                │
         ▼      ▼                ▼
     ┌────┐ ┌────┐           ┌────┐
     │80% │ │50% │           │20% │
     │rnd │ │rnd │           │rnd │
     └┬───┘ └┬───┘           └┬───┘
      │      │                │
      │      ▼                ▼
      │  ┌────────────┐   ┌──────────────┐
      │  │ EVAL DEPTH │   │ DEEP EVAL    │
      │  │ Look ahead │   │ 3-move ahead │
      │  │ 1-2 moves  │   │ Min/max tree │
      │  └────┬───────┘   └──────┬───────┘
      │       │                  │
      └───────┼──────┬───────────┘
              │      │
              ▼      ▼
       ┌──────────────────────────┐
       │ SCORE EACH ACTION        │
       │                          │
       │ Points for:              │
       │ - Victory points (×10)   │
       │ - Noble progress         │
       │ - Token efficiency       │
       │ - Card blocking (enemy)  │
       │                          │
       │ Minus for:               │
       │ - Cost to afford         │
       │ - Token inefficiency     │
       └──────────┬───────────────┘
                  │
                  ▼
       ┌──────────────────────────┐
       │ RANK ACTIONS BY SCORE    │
       │ 1. Best option           │
       │ 2. Good option           │
       │ 3. ...                   │
       │ N. Poor option           │
       └──────────┬───────────────┘
                  │
          [Difficulty check]
           /      |      \
        [E]     [M]      [H]
         │       │        │
         ▼       ▼        ▼
    ┌─────┐ ┌──────┐  ┌────────┐
    │Pick │ │Pick  │  │Pick    │
    │rand │ │top   │  │#1 (or  │
    │(80% │ │50%   │  │slight  │
    │else │ │else  │  │random) │
    │top) │ │rand) │  └───┬────┘
    └──┬──┘ └───┬──┘      │
       │        │         │
       └────┬───┴──────────┘
            │
            ▼
    ┌────────────────────────┐
    │ HAVE ACTION            │
    │ (final decision made)   │
    └──────────┬─────────────┘
               │
               ▼
            ┌────┐
            │ END│
            │ (emit to server)
            └────┘
```

---

## 6. User Registration & Onboarding

```
START
  │
  ▼
┌──────────────────────────┐
│ LANDING PAGE             │
│ - Welcome message        │
│ - Game screenshots       │
│ - Sign up button         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ SIGN UP FORM             │
│ - Email                  │
│ - Username               │
│ - Password               │
│ - Age verification       │
│ - Terms agreement        │
└──────────┬───────────────┘
           │
           │[Fill Form]
           │
           ▼
┌──────────────────────────┐
│ VALIDATE INPUT           │
│ - Email valid?           │
│ - Username available?    │
│ - Password strong?       │
│ - Age 13+?               │
│ - Terms agreed?          │
└──────────┬───────────────┘
           │
      [All valid?]
       /        \
    [Yes]      [No]
      │         │
      │         ▼
      │    ┌─────────────────┐
      │    │ Show error(s)   │
      │    │ Highlight field │
      │    │ Allow retry     │
      │    └────────┬────────┘
      │             │
      │        [Correct]
      │             │
      │             └──────┐
      │                    │
      │                    ▼
      │                [Loop back]
      │
      ▼
┌──────────────────────────┐
│ CREATE ACCOUNT           │
│ - Hash password          │
│ - Create user record     │
│ - Create player account  │
│ - Send verification      │
└──────────┬───────────────┘
           │
      [Success?]
       /        \
    [Yes]      [No]
      │         │
      │         ▼
      │    ┌────────────────┐
      │    │ Error: retry   │
      │    │ or contact     │
      │    │ support        │
      │    └────────────────┘
      │
      ▼
┌──────────────────────────┐
│ LANGUAGE SELECTION       │
│ - English                │
│ - Persian (فارسی)       │
│ Save to preferences      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ TUTORIAL START           │
│ - Game rules             │
│ - First game (vs AI Easy)│
│ - UI walkthrough         │
│ - Bonus for completion   │
└──────────┬───────────────┘
           │
      [Tutorial mode]
      (simplified game)
           │
      [Play intro game]
           │
      [Win or lose]
      (doesn't matter)
           │
           ▼
┌──────────────────────────┐
│ TUTORIAL COMPLETE        │
│ - Offer 100 bonus coins  │
│ - Explain shop           │
│ - Add starter cosmetic   │
│ - Show friends menu      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ HOME SCREEN              │
│ - Settings prompt        │
│ - Friend add tutorial    │
│ - Continue playing       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ ONBOARDING COMPLETE      │
│ - Player ready for games │
│ - Full access enabled    │
│ - Daily quests available │
└──────────┬───────────────┘
           │
           ▼
        ┌──────┐
        │ PLAY │
        └──────┘
```

---

## 7. Guild/Group Creation Flow

```
START
  │
  ▼
┌──────────────────────┐
│ GROUPS HOME          │
│ - My guilds          │
│ - Join guild button  │
│ - Create guild btn   │
└──────────┬───────────┘
           │
      [Create Guild]
      or [Join Guild]
           │
           ├──────────┬──────────┐
           │          │          │
        [C]        [J]         [J]
           │          │          │
           ▼          │          │
      ┌──────┐        │          │
      │Create│        │          │
      │Form  │        │          │
      └───┬──┘        │          │
          │           │          │
          ▼           ▼          ▼
      ┌────────────────────────────────┐
      │ GUILD CREATION              OR │
      │ GUILD SEARCH & JOIN            │
      └────┬─────────────────────┬─────┘
           │                     │
           ▼                     ▼
      ┌─────────────┐      ┌──────────────┐
      │ Form:       │      │ Search list  │
      │ - Name      │      │ - Filter     │
      │ - Desc      │      │ - Sort       │
      │ - Icon      │      │ - Join click │
      │ - Max size  │      │              │
      │ - Privacy   │      │              │
      └────┬────────┘      └────┬─────────┘
           │                    │
           ▼                    ▼
      ┌──────────────┐    ┌──────────────┐
      │ VALIDATE     │    │ SEND REQUEST │
      │ - Name avail │    │ to guild     │
      │ - Min length │    │ (pending)    │
      │ - Max size   │    │              │
      └────┬─────────┘    └────┬─────────┘
           │                   │
      [Valid?]            [Success?]
       /    \               /    \
    [Y]    [N]          [Y]    [N]
      │     │             │      │
      │     ▼             │      ▼
      │  ┌──────┐         │  ┌─────────┐
      │  │Error │         │  │ Error   │
      │  │Retry │         │  │ Retry   │
      │  └──────┘         │  └─────────┘
      │     │             │      │
      │     └──────┬──────┘      │
      │            │             │
      ▼            ▼             │
  ┌────────────────────┐         │
  │ GUILD CREATED      │         │
  │ - I'm the leader   │         │
  │ - 1 member (me)    │         │
  │ - Invite others    │         │
  └──────────┬─────────┘         │
             │                   │
             │                   ▼
             │              ┌─────────────────┐
             │              │ REQUEST PENDING │
             │              │ - Await vote    │
             │              │ - Cancel option │
             │              └────────┬────────┘
             │                       │
             │                   [Voted]
             │                  /    \
             │              [Accept][Deny]
             │              /         \
             │             /           \
             │            ▼            ▼
             │       ┌────────┐    ┌────────┐
             │       │Member  │    │Rejected│
             │       │Added   │    │(no fee)│
             │       └────┬───┘    └────────┘
             │            │
             │            │
             └──────┬─────┘
                    │
                    ▼
            ┌──────────────────┐
            │ GUILD HOME       │
            │ - Members list   │
            │ - Chat           │
            │ - Ranking        │
            │ - Treasury       │
            │ - Invite others  │
            │ - Leave/manage   │
            └──────────────────┘
                    │
                    ▼
                 ┌─────┐
                 │ END │
                 └─────┘
```

---

## 8. Deployment & Release Flow

```
START (Feature Complete)
  │
  ▼
┌──────────────────────────┐
│ FEATURE BRANCH           │
│ - Development            │
│ - Local testing          │
│ - Code review (2+ LGTM)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ PULL REQUEST             │
│ - CI/CD triggers         │
│ - Linting checks         │
│ - Unit tests run         │
│ - Build artifacts        │
└──────────┬───────────────┘
           │
      [All checks pass?]
       /            \
    [Yes]          [No]
      │             │
      │             ▼
      │        ┌──────────────┐
      │        │ Fix issues   │
      │        │ Push updates │
      │        └────────┬─────┘
      │                 │
      │            [Re-run]
      │                 │
      │                 └────┐
      │                      │
      └──────┬─────────┬─────┘
             │         │
             ▼         ▼
      ┌────────────────────────┐
      │ CODE REVIEW            │
      │ - Approve/request      │
      │ - Discuss changes      │
      │ - Final approval       │
      └────────┬───────────────┘
               │
          [Approved?]
           /        \
        [Yes]      [No]
          │         │
          │         ▼
          │    ┌────────────────┐
          │    │ Request changes│
          │    │ Loop back      │
          │    └────────────────┘
          │
          ▼
      ┌────────────────────────┐
      │ MERGE TO DEV           │
      │ - Auto-merge           │
      │ - Deploy to staging    │
      │ - Run E2E tests        │
      │ - Run smoke tests      │
      └────────┬───────────────┘
               │
          [Staging OK?]
           /        \
        [Yes]      [No]
          │         │
          │         ▼
          │    ┌──────────────────┐
          │    │ Rollback + Issue │
          │    │ Investigate      │
          │    └──────────────────┘
          │
          ▼
      ┌────────────────────────┐
      │ QA TESTING             │
      │ - Manual testing       │
      │ - Device testing       │
      │ - Regression tests     │
      │ - Performance check    │
      └────────┬───────────────┘
               │
          [QA Pass?]
           /        \
        [Yes]      [No]
          │         │
          │         ▼
          │    ┌───────────────────┐
          │    │ Bug report        │
          │    │ Fixed? → loop back│
          │    │ Not fixed? → defer│
          │    └───────────────────┘
          │
          ▼
      ┌────────────────────────┐
      │ RELEASE PREP           │
      │ - Update version       │
      │ - Update changelog     │
      │ - Draft release notes  │
      │ - Tag release          │
      └────────┬───────────────┘
               │
               ▼
      ┌────────────────────────┐
      │ PRODUCTION DEPLOY      │
      │ (via CD pipeline)      │
      │ - Build images         │
      │ - Push to registry     │
      │ - Deploy blue/green    │
      │ - Health check         │
      │ - Smoke tests          │
      └────────┬───────────────┘
               │
          [Deploy OK?]
           /        \
        [Yes]      [No]
          │         │
          │         ▼
          │    ┌──────────────────┐
          │    │ Rollback         │
          │    │ Incident response│
          │    │ Postmortem       │
          │    └──────────────────┘
          │
          ▼
      ┌────────────────────────┐
      │ MONITORING             │
      │ - Error tracking       │
      │ - Performance metrics  │
      │ - User feedback        │
      │ - 24h observation      │
      └────────┬───────────────┘
               │
          [Issues?]
           /        \
        [Yes]      [No]
          │         │
          │         ▼
          │    ┌────────────────┐
          │    │ Released! ✓    │
          │    │ Notify users   │
          │    │ Monitor stats  │
          │    └────────────────┘
          │
          ▼
      ┌──────────────────────┐
      │ HOTFIX PROCESS       │
      │ - Emergency patch    │
      │ (if issues found)    │
      └──────────────────────┘
               │
               ▼
            ┌─────┐
            │ END │
            └─────┘
```

---

## 9. Analytics & Monitoring Flow

```
GAME RUNNING
  │
  ├─────┬────────┬────────┬─────────┐
  │     │        │        │         │
  ▼     ▼        ▼        ▼         ▼
 USER  GAME    ERROR    PERF      PAYMENT
 EVENT LOGIC   TRACK    METRIC    EVENTS
  │     │        │        │         │
  │     │        │        │         │
  │     │        │        │         │
  └──┬──┴────┬───┴────┬───┴────┬────┘
     │       │        │        │
     │       │        │        │
     ▼       ▼        ▼        ▼
┌───────────────────────────────────────┐
│        EVENT COLLECTOR                │
│  - Structured JSON logging            │
│  - Timestamp each event               │
│  - User ID for correlation            │
│  - Batch events                       │
└───────────────┬───────────────────────┘
                │
                │ (batch every 5s)
                │
                ▼
        ┌──────────────────┐
        │ SEND TO BACKEND  │
        │ - /api/analytics  │
        │ - HTTP POST      │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ BACKEND PROCESS  │
        │ - Parse events   │
        │ - Validate       │
        │ - Dehash IPs     │
        │ - Save to DB     │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ AGGREGATE DATA   │
        │ (hourly job)     │
        │ - Count DAU      │
        │ - Session avg    │
        │ - Error rates    │
        │ - Revenue data   │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ STORE IN DW      │
        │ - BigQuery       │
        │ - Athena         │
        │ - Data Lake      │
        └────────┬─────────┘
                 │
        ┌────────┽────────┐
        │        │        │
        ▼        ▼        ▼
    ┌────┐  ┌──────┐  ┌────────┐
    │GA4 │  │Stats │  │Reports │
    │    │  │Cache │  │        │
    └──┬─┘  └──┬───┘  └────┬───┘
       │       │           │
       └───────┼─────┬─────┘
               │     │
               ▼     ▼
        ┌──────────────────┐
        │ DASHBOARD        │
        │ (real-time)      │
        │ - DAU/WAU/MAU    │
        │ - Revenue        │
        │ - Retention      │
        │ - Errors         │
        │ - Performance    │
        └────────┬─────────┘
                 │
                 ├─────────────────┐
                 │                 │
            [Daily]         [Weekly/Monthly]
                 │                 │
                 ▼                 ▼
        ┌──────────────────┐  ┌────────────┐
        │ ALERTS SET       │  │ REPORTS    │
        │ - Threshold      │  │ GENERATED  │
        │   violations     │  │ - Email    │
        │ - Auto-notify    │  │ - Slack    │
        │   team           │  │ - PDF      │
        └─────┬────────────┘  └────┬───────┘
              │                    │
              │                    │
              └──────────┬─────────┘
                         │
                         ▼
                  ┌────────────────┐
                  │ STAKEHOLDER    │
                  │ REVIEW         │
                  │ (data-driven   │
                  │  decisions)    │
                  └────────────────┘
```

---

## 10. Churn Prevention Flow

```
USER PLAYS DAILY
  │
  ├─────────────────────────────────┐
  │                                 │
  ▼                                 ▼
Day 1-7                        [No activity]
Playing                              │
Engaged                              │
  │                                  ▼
  │                           ┌──────────────┐
  │                           │ 1+ day gap   │
  │                           │ (watch)      │
  │                           └──────┬───────┘
  │                                  │
  │                            [2+ day gap]
  │                                  │
  │                                  ▼
  │                           ┌──────────────┐
  │                           │ 3-day lapse  │
  │                           │ Send push    │
  │                           │ notification │
  │                           │ (bonus offer)│
  │                           └──────┬───────┘
  │                                  │
  │                             [Respond?]
  │                              /        \
  │                           [Yes]     [No]
  │                             │         │
  │                             └────┬────┘
  │                                  │
  │                            [7-day lapse]
  │                                  │
  │                                  ▼
  │                           ┌──────────────┐
  │                           │ LAPSED USER  │
  │                           │ Send email:  │
  │                           │ - What miss? │
  │                           │ - New feats? │
  │                           │ - Big bonus? │
  │                           └──────┬───────┘
  │                                  │
  │                                  │
  │                             [Respond?]
  │                              /        \
  │                           [Yes]     [No]
  │                             │         │
  │                             │         ▼
  │                             │    ┌──────────┐
  │                             │    │ 30-day   │
  │                             │    │ CHURNED  │
  │                             │    │ Seasonal │
  │                             │    │ campaign │
  │                             │    │ (special)│
  │                             │    └──────┬───┘
  │                             │           │
  │                             │      [Response]
  │                             │           │
  │                             │      ┌────▼─────┐
  │                             │      │ Win back! │
  │                             │      └───────────┘
  │                             │
  │                             └────┐
  │                                  │
  └──────────────────────┬───────────┘
                         │
                         ▼
                    ┌──────────────┐
                    │ ACTIVE USER  │
                    │ - Engaged    │
                    │ - Paying     │
                    │ - Referring  │
                    └──────────────┘
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 2, 2026 | AI Assistant | Initial flowchart documentation |
| | | | |

---

*These flowcharts should be reviewed and updated quarterly as features and processes evolve.*
