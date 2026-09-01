# Publish Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Gemstone Guilds safe enough to publish (web + Capacitor stores) by closing auth leaks, fake payments, unguarded routes, client-trusted multiplayer, wrong Splendor rules, and native/config landmines.

**Architecture:** Keep the existing Vite React client and `server.js` Socket.IO process. Add a small `server/security.js` module for password hashing, public user DTOs, session tokens, and bounded JSON bodies. Stop treating localStorage as the source of truth for passwords, premium, and online boards. Online rooms keep seats by stable `playerId`, allow reconnect, and only accept state from the current seat. Shop grants happen only after native store billing succeeds. Unimplemented catalog games are marked coming-soon instead of loading Splendor.

**Tech Stack:** React 18, TypeScript, Vite, Socket.IO, Capacitor 8, Node `crypto` (scrypt, no extra hash library), Vitest.

## Global Constraints

- Do not store or return plaintext passwords. Existing `password` fields in `server-data/shared-state.json` must be hashed on next read and the plaintext field deleted.
- Do not grant coins, gems, avatars, stickers, or premium unless `window.GemstoneNativeBilling` reports `success: true` (or the item is explicitly a free/daily reward).
- `VITE_REQUIRE_PREMIUM` controls play gates. Default **false** on web so the app is playable without fake IAP. Store builds set it **true**.
- Socket rooms identify players by `playerId`, not `socket.id`.
- Never replace `room.gameState` from a socket that is not in the room, or from a player who is not the current seat (except reconnect snapshots sent by the server).
- Do not list Coup or Ticket to Ride as playable until they have their own game views.
- Do not commit `.env` or `server-data/`. Do not put comments on the same line as `VITE_SOCKET_URL=`.
- TypeScript stays as-is for this plan (`strict: false`); do not enable strict as a drive-by.
- Tests run with `npm run test` (Vitest). Server helpers that are Node-only live in `server/` and are tested from Vitest via relative import if the helper is pure, otherwise via a small extracted module under `src/lib` for shared logic.
- Each task ends with a commit unless the human says not to commit.

## How to use this roadmap

Work **top to bottom**. Later phases assume earlier ones. You can ship a **web demo** after Phase A–C. Do not advertise public multiplayer until Phase D is done. Store listing needs Phase C + F.

| Phase | Theme | Blocks publish? |
| --- | --- | --- |
| A | Passwords, sessions, open APIs | Yes — never put the current server on the public internet |
| B | Route guards and premium flag | Yes — `/game` bypasses login today |
| C | Shop / IAP | Yes — current shop gives paid items for free |
| D | Online authority, reconnect, matchmaking | Yes if you advertise multiplayer |
| E | Splendor / DMD / timeout rules | Recommended before calling the games “correct” |
| F | Native, env, packaging, catalog | Yes for stores / device online |
| G | Tests, error boundary, play-again, polish | Recommended |

---

## File map

**Create:**

- `server/security.js` — `hashPassword`, `verifyPassword`, `toPublicUser`, `migrateUserRecord`, `createSessionToken`, session map helpers, `MAX_BODY_BYTES`
- `src/lib/authStorage.ts` — session token keys; never persist password lists
- `src/lib/featureFlags.ts` — `requirePremium()` from `VITE_REQUIRE_PREMIUM`
- `src/components/ErrorBoundary.tsx` — WebView crash recovery
- `src/test/authPublicUser.test.ts`
- `src/test/gameLogic.tokens-nobles.test.ts`
- `src/test/shopPurchaseGuard.test.ts`
- `src/test/gameCatalog.test.ts`

**Modify:**

- `server.js` — CORS still needed for LAN; strip users; auth routes; body limit; join/reconnect; validate emitters; timeout uses real turn advance; rematch events; gitignore data
- `src/hooks/useAuth.tsx` — login/register against `/auth/*`; rememberMe; no password cache
- `src/lib/social.ts` — stop writing full `/users` including passwords
- `src/components/auth/RequireAuth.tsx` — loading spinner
- `src/App.tsx` — guard `/game`; Capacitor `App` back button; error boundary; `RedirectIfAuthed` uses `Navigate`
- `src/pages/Index.tsx`, `src/pages/ModeSetup.tsx` — honor `requirePremium()`
- `src/lib/shop.ts`, `src/pages/Shop.tsx` — no grant without billing
- `src/hooks/useGame.ts`, `src/pages/OnlineGame.tsx`, `src/pages/OnlineMatchmaking.tsx`, `src/hooks/useOnlineGame.ts`
- `src/lib/gameLogic.ts`, `src/lib/aiPlayer.ts`, `src/test/gameLogic.test.ts`
- `src/pages/game/useSplendorGameController.ts`
- `src/lib/deadMansDraw.ts` (timeout helper if needed), `src/pages/dead-mans-draw/helpers.ts`, `src/hooks/useLanguage.tsx`
- `src/lib/gameCatalog.ts`, `src/pages/game/GameRouterView.tsx`, `src/pages/GamesList.tsx`
- `src/lib/socketConfig.ts`, `.env.example`, `.env.mobile`, `.gitignore`, `package.json`, `capacitor.config.ts`
- `src/pages/SplendorIntroTutorial.tsx` — `/menu` not `/games`

**Do not create a second backend.** Do not migrate to Express unless a task explicitly needs it (`server.js` already uses raw `http`).

---

### Task 1: Password hashing and public user DTO

**Files:**
- Create: `server/security.js`
- Create: `src/lib/userPublic.ts` (shared shape the client expects after login)
- Test: `src/test/authPublicUser.test.ts`

**Interfaces:**
- Consumes: existing user objects `{ id, username, email?, password?, createdAt }`
- Produces:
  - `hashPassword(plain: string): { salt: string, hash: string }`
  - `verifyPassword(plain: string, salt: string, hash: string): boolean`
  - `toPublicUser(user): { id, username, email?, createdAt }` (never `password` / `passwordHash` / `salt`)
  - `migrateUserRecord(user): user` hashes leftover plaintext `password` then deletes it

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { toPublicUser } from "@/lib/userPublic";

describe("toPublicUser", () => {
  it("strips password fields", () => {
    const publicUser = toPublicUser({
      id: "1",
      username: "ada",
      email: "a@b.c",
      createdAt: "2026-01-01",
      password: "secret",
      passwordHash: "abc",
      salt: "def",
    });
    expect(publicUser).toEqual({
      id: "1",
      username: "ada",
      email: "a@b.c",
      createdAt: "2026-01-01",
    });
    expect("password" in publicUser).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/authPublicUser.test.ts`

Expected: FAIL — `Cannot find module '@/lib/userPublic'`

- [ ] **Step 3: Write minimal implementation**

`src/lib/userPublic.ts`:

```ts
export type PublicUser = {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  password?: string;
  passwordHash?: string;
  salt?: string;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
```

`server/security.js` (Node only):

```js
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEYLEN).toString("hex");
  return { salt, hash };
}

export function verifyPassword(plain, salt, hash) {
  const actual = scryptSync(plain, salt, KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function migrateUserRecord(user) {
  if (!user || typeof user !== "object") return user;
  const next = { ...user };
  if (next.password && !next.passwordHash) {
    const { salt, hash } = hashPassword(String(next.password));
    next.salt = salt;
    next.passwordHash = hash;
  }
  delete next.password;
  return next;
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export const MAX_BODY_BYTES = 256 * 1024;
```

If `server.js` is CommonJS (`require`), write `server/security.js` as CJS (`module.exports = { ... }`) instead of ESM. Match `server.js` module style exactly.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm run test -- src/test/authPublicUser.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/userPublic.ts src/test/authPublicUser.test.ts server/security.js
git commit -m "feat: hash-ready public user DTO for auth"
```

---

### Task 2: Server auth routes, strip GET /users, body limit, ignore client password overwrites

**Files:**
- Modify: `server.js` (CORS block ~135, `parseBody` ~147, `/users` ~177-200, later social handlers)
- Modify: `.gitignore` — add `/server-data/`
- Test: reuse `src/test/authPublicUser.test.ts` plus a Node smoke script if you prefer; primary check is manual curl after server start

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword`, `migrateUserRecord`, `toPublicUser`, `MAX_BODY_BYTES`
- Produces HTTP:
  - `POST /auth/register` `{ username, email, password }` → `{ ok, token, user: PublicUser }`
  - `POST /auth/login` `{ username, password }` → `{ ok, token, user: PublicUser }`
  - `GET /auth/me` header `Authorization: Bearer <token>` → `{ user: PublicUser }`
  - `POST /auth/logout` Bearer token → `{ ok: true }`
  - `GET /users` → `{ users: PublicUser[] }` (no secrets)
  - Remove password from `POST /users` or reject it; never assign `state.users[i] = payload` from the client

In-memory: `const sessions = new Map()` mapping token → `{ userId, createdAt }`.

- [ ] **Step 1: Cap `parseBody`**

In `parseBody`, accumulate length; if `received > MAX_BODY_BYTES`, destroy the request and reject.

```js
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
```

- [ ] **Step 2: Migrate users on every `readSharedState`**

After JSON parse, map `state.users` through `migrateUserRecord`. If any record changed, `writeSharedState`.

- [ ] **Step 3: Replace `/users` GET/POST**

GET:

```js
res.end(JSON.stringify({ users: (state.users || []).map(toPublicUser) }));
```

POST `/users`: do **not** accept password. If used for profile sync, merge only `username`/`email` for the session user. Prefer new `/auth/register` instead of this POST for new accounts.

- [ ] **Step 4: Add `/auth/register` and `/auth/login`**

Register: validate username (trim, length 1–15), password length ≥ 8, unique username, `hashPassword`, push user, `createSessionToken`, return public user + token.

Login: find by username, `verifyPassword`, return token + public user. Do not leak whether username exists vs bad password if you can avoid it; one message `"Invalid username or password"` is enough.

Helper:

```js
function createSessionToken(userId) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

function userFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = sessions.get(token);
  if (!session) return null;
  const state = normalizeSocialState(readSharedState());
  return (state.users || []).find((u) => u.id === session.userId) || null;
}
```

- [ ] **Step 5: Gate social mutations**

`/groups/respond`, `/groups/update`, DM POST, friend actions: resolve actor from `userFromRequest(req)`, ignore client `actorId` / `fromUserId` / `userId` when they disagree with the session. If no session, `401`.

- [ ] **Step 6: Smoke test**

Run: `npm run dev:server` then:

```bash
curl -s http://localhost:3001/users
```

Expected: JSON users **without** `password` or `passwordHash`.

```bash
curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\"username\":\"nope\",\"password\":\"nope\"}"
```

Expected: 401 JSON, no user dump.

- [ ] **Step 7: Commit**

```bash
git add server.js server/security.js .gitignore
git commit -m "fix: stop serving passwords and add session auth routes"
```

---

### Task 3: Client login uses the server; rememberMe; stop caching password lists

**Files:**
- Create: `src/lib/authStorage.ts`
- Modify: `src/hooks/useAuth.tsx`
- Modify: `src/lib/social.ts` (fetch `/users` must not `setItem("splendor_users", data.users)` if those ever contain secrets; store public profiles only under `splendor_public_users`)
- Modify: `src/pages/Login.tsx` / `src/pages/SignUp.tsx` if they still assume local password lists
- Modify: `src/components/auth/RequireAuth.tsx`

**Interfaces:**
- Consumes: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `toPublicUser`
- Produces: `login(username, password, rememberMe): Promise<boolean>` stores `splendor_session_token` in `localStorage` if rememberMe else `sessionStorage` only

- [ ] **Step 1: Storage helpers**

```ts
export const SESSION_TOKEN_KEY = "splendor_session_token";
export const USER_STORAGE_KEY = "splendor_user";

export function saveSession(token: string, user: unknown, rememberMe: boolean) {
  const payload = JSON.stringify(user);
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(USER_STORAGE_KEY, payload);
  if (rememberMe) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, payload);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function clearSession() {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(SESSION_TOKEN_KEY);
    store.removeItem(USER_STORAGE_KEY);
  }
}
```

- [ ] **Step 2: Rewrite `login` / `register` / hydrate**

On boot: read token from sessionStorage then localStorage; `GET /auth/me` with Bearer token; if 401, `clearSession`.

Delete the `users.find(u => u.password === password)` path.

Stop `localStorage.setItem("splendor_users", JSON.stringify(data.users))` from the raw `/users` payload until Task 2 is deployed (after Task 2 it is public-only, but still do not treat it as a password database).

Honor the `rememberMe` argument (today it is `_rememberMe` unused). Register password: require length ≥ 8 to match the copy in `useLanguage.tsx` (`passwordHint`).

- [ ] **Step 3: RequireAuth loading UI**

Replace `if (isLoading) return null` with a short centered “Loading…” / `در حال بارگذاری…` using `useLanguage` if already inside `LanguageProvider` (it is, in `App.tsx`).

- [ ] **Step 4: Manual test**

Run: `npm run dev` + `npm run dev:server`

1. Sign up with remember me off, close tab, reopen — must be logged out.
2. Sign up with remember me on — must stay logged in.
3. DevTools Application: no `password` keys under `splendor_users`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.tsx src/lib/authStorage.ts src/lib/social.ts src/components/auth/RequireAuth.tsx src/pages/Login.tsx src/pages/SignUp.tsx
git commit -m "fix: authenticate against server sessions and respect remember me"
```

---

### Task 4: Guard `/game`, premium feature flag, fix auth redirect

**Files:**
- Create: `src/lib/featureFlags.ts`
- Modify: `src/App.tsx` (`/game` route, `RedirectIfAuthed`)
- Modify: `src/pages/Index.tsx`, `src/pages/ModeSetup.tsx`
- Modify: `.env.example` — document `VITE_REQUIRE_PREMIUM`

**Interfaces:**
- Consumes: `useAuth()`, `hasActivePremium` from shop/extras
- Produces: `export function requirePremium(): boolean` → `import.meta.env.VITE_REQUIRE_PREMIUM === "true"`

- [ ] **Step 1: Feature flag**

```ts
export function requirePremium(): boolean {
  return import.meta.env.VITE_REQUIRE_PREMIUM === "true";
}
```

`.env.example`:

```
# Set true for store builds that sell subscriptions
VITE_REQUIRE_PREMIUM=false
```

- [ ] **Step 2: Wrap `/game`**

```tsx
<Route
  path="/game"
  element={
    <RequireAuth>
      <Game />
    </RequireAuth>
  }
/>
```

Keep tutorials public if you want first-run teaching without an account; that is optional. Playable full games must not be.

- [ ] **Step 3: Premium checks**

In `Index.tsx` / `ModeSetup.tsx`, only redirect to `/shop?reason=premium-required` when `requirePremium() && !hasActivePremium(...)`.

- [ ] **Step 4: RedirectIfAuthed**

```tsx
if (user) return <Navigate to="/menu" replace />;
```

Do not render `<Landing />` inside the login route.

- [ ] **Step 5: Manual test**

While logged out, open `/game?players=2&mode=local&game=splendor` → must land on `/login`. After login, game loads. With `VITE_REQUIRE_PREMIUM` unset, local play works without buying.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/lib/featureFlags.ts src/pages/Index.tsx src/pages/ModeSetup.tsx .env.example
git commit -m "fix: guard /game and make premium gating explicit"
```

---

### Task 5: Stop granting shop and premium without billing

**Files:**
- Modify: `src/lib/shop.ts` (`purchasePremiumPlan`, `applyOfferPurchase`)
- Modify: `src/pages/Shop.tsx`
- Test: `src/test/shopPurchaseGuard.test.ts`

**Interfaces:**
- Consumes: `window.GemstoneNativeBilling?.purchaseSubscription` / `purchaseProduct`
- Produces: `purchasePremiumPlan` returns `{ ok: false, message }` and does **not** call `grantPremiumPlan` if billing is missing or `success` is not true. Paid coin/gem/avatar/sticker offers follow the same rule. `claimWeeklyReward` stays free.

- [ ] **Step 1: Failing test for the guard helper**

Extract:

```ts
export function canGrantPaidReward(nativeBilling: { purchaseSubscription?: unknown } | undefined) {
  return Boolean(nativeBilling?.purchaseSubscription);
}
```

Test: `canGrantPaidReward(undefined) === false`, `canGrantPaidReward({ purchaseSubscription: async () => ({ success: true }) }) === true`.

- [ ] **Step 2: Change `purchasePremiumPlan`**

Today after the optional billing block it always `grantPremiumPlan`. Replace with:

```ts
const nativeBilling = window.GemstoneNativeBilling;
if (!nativeBilling?.purchaseSubscription) {
  return { ok: false as const, message: "Store billing is unavailable in this build." };
}
const result = await nativeBilling.purchaseSubscription({ ... });
if (!result?.success) {
  return { ok: false as const, message: result?.message || "Purchase was cancelled." };
}
grantPremiumPlan(userId, planId, provider);
```

- [ ] **Step 3: Paid offers**

`applyOfferPurchase` must not add coins/gems/cosmetics for `offer.price > 0` (or any non-free offer) without a successful `purchaseProduct` call. If there is no product API yet, return early and let `Shop.tsx` show “Available on the App Store / Cafe Bazaar / Myket”.

Disable or hide paid offer buttons on web when billing is missing (do not leave a clickable button that pretends to succeed).

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/test/shopPurchaseGuard.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/shop.ts src/pages/Shop.tsx src/test/shopPurchaseGuard.test.ts
git commit -m "fix: grant premium and paid shop items only after store billing"
```

---

### Task 6: Splendor token takes and nobles (real rules)

**Files:**
- Modify: `src/lib/gameLogic.ts` (`performTakeTokens`, `checkNobles`)
- Modify: `src/lib/aiPlayer.ts` (easy AI unique colors)
- Modify: `src/test/gameLogic.test.ts` (the “at most one noble” test currently encodes the bug)
- Test: `src/test/gameLogic.tokens-nobles.test.ts`
- Modify: `src/pages/game/useSplendorActions.ts` confirm button — reject illegal takes in UI too

**Interfaces:**
- Consumes: `GameState`, `GemType[]`
- Produces: `performTakeTokens` allows only (a) three distinct colors with pool ≥ 1 each, or (b) two of the same color with pool ≥ 4. One- and two-different-color takes are illegal when those options exist; if fewer than 3 colors remain in the pool, taking all remaining distinct colors is allowed (standard empty-board exception).

`checkNobles`: at most **one noble per turn** (keep the `break` after the first visit). Remove `if (player.nobles.length >= 1) return` so a player may receive nobles on later turns.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { initializeGame, performTakeTokens, advanceTurn } from "@/lib/gameLogic";

describe("performTakeTokens", () => {
  it("rejects a single token when three colors are available", () => {
    const state = initializeGame(2);
    const next = performTakeTokens(state, ["diamond"]);
    expect(next).toBe(state);
  });

  it("accepts three different tokens", () => {
    const state = initializeGame(2);
    const next = performTakeTokens(state, ["diamond", "sapphire", "emerald"]);
    expect(next).not.toBe(state);
    expect(next.players[0].tokens.diamond).toBe(1);
  });
});

describe("nobles", () => {
  it("allows a second noble on a later turn", () => {
    let state = initializeGame(2);
    state.currentPlayerIndex = 0;
    state.nobles = [
      { id: 1, points: 3, requirements: { diamond: 4, sapphire: 4 } },
      { id: 2, points: 3, requirements: { emerald: 4, ruby: 4 } },
    ];
    const four = (gem: "diamond" | "sapphire" | "emerald" | "ruby") =>
      Array.from({ length: 4 }, (_, i) => ({
        id: 100 + i,
        level: 1 as const,
        gemBonus: gem,
        points: 0,
        cost: {},
      }));
    state.players[0].cards = [...four("diamond"), ...four("sapphire")];
    state = advanceTurn(state);
    expect(state.players[0].nobles).toHaveLength(1);
    state.currentPlayerIndex = 0;
    state.players[0].cards = [
      ...state.players[0].cards,
      ...four("emerald"),
      ...four("ruby"),
    ];
    state = advanceTurn(state);
    expect(state.players[0].nobles).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test -- src/test/gameLogic.tokens-nobles.test.ts src/test/gameLogic.test.ts`

- [ ] **Step 3: Implement `performTakeTokens` shape check**

After computing `unique`, if not the double-take branch:

```ts
const availableColors = GEM_TYPES.filter((g) => newPool[g] > 0);
if (gems.length === 2 && gems[0] === gems[1]) {
  // existing pool >= 4 check
} else {
  const unique = new Set(gems);
  if (unique.size !== gems.length) return state;
  const expectedCount = Math.min(3, availableColors.length);
  if (gems.length !== expectedCount) return state;
  // existing decrement loop
}
```

`availableColors` must be computed from the pool **before** decrement.

Remove the permanent one-noble-per-game guard. Keep the per-turn `break` in the noble loop.

Change `src/test/gameLogic.test.ts` “gives each player at most one noble” to “gives at most one noble **per turn**”: after first `advanceTurn`, still length 1; do not assert that a later turn cannot earn a second.

Easy AI: sample without replacement when picking three colors.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/gameLogic.ts src/lib/aiPlayer.ts src/test/gameLogic.test.ts src/test/gameLogic.tokens-nobles.test.ts src/pages/game/useSplendorActions.ts
git commit -m "fix: enforce Splendor token takes and multi-noble visits"
```

---

### Task 7: Turn timeout must call real turn resolution

**Files:**
- Modify: `server.js` (`startTurnTimer` timeout ~848-863)
- Modify: `src/pages/game/useSplendorGameController.ts` (online `mustReturnTokens` phase; local AI vs timer race)

**Interfaces:**
- Consumes: Splendor `advanceTurn` cannot be imported into CJS `server.js` unless you duplicate a tiny helper or load a compiled module. Pragmatic approach for this task: emit `turn-timeout` to the **current player’s socket** and let that client call existing `endTurn` / DMD finalize, then `sync-game-state`. If the client is gone, server still bumps index **and** clears DMD `pendingEffect`, `treasureArea`, `forcedRevealRemaining` on that seat.

Better long-term (do it in this task if `gameLogic.ts` can be loaded): extract `advanceTurn` + DMD `finalizeTimedOutTurn` into files without Vite aliases.

Minimum required behavior:

1. Splendor timeout: run noble check + last round logic equivalent to `advanceTurn` (copy the function into `server/splendorTurn.js` if import is hard — keep it in sync with `gameLogic.ts`).
2. DMD timeout: clear pending UI fields, then next player.
3. Client: when `currentPlayerIndex` changes from the server, set phase to `idle` even if `mustReturnTokens` was set.
4. Local: do not `endTurn` on timer if `gameMode === "ai"` and it is the AI seat; online: do not run a local 1s interval that races `turn-timer-updated` (guard `gameMode === "online"`).

- [ ] **Step 1: Server timeout**

Replace:

```js
r.gameState.currentPlayerIndex = (idx + 1) % Math.max(2, playerCount);
```

with a call to `advanceSplendorTurn(r.gameState, r.targetScore || 15)` when `r.gameId !== "dead-mans-draw" && r.gameId !== "totem" && r.gameId !== "beasty-bar"`.

For DMD, implement `timeoutDeadMansDraw(state)` that:

- sets `pendingEffect` to null / none
- leaves treasure in the discard or as your existing bust rules dictate (prefer: treat as pass without collect — document the choice in the commit message: timeout = bust/pass, treasure discarded, next player)
- increments `currentPlayerIndex`

For Jungle Speed / Beasty Bar: do not advance a turn index that those games do not use; only emit timeout if they have a turn field.

- [ ] **Step 2: Client phase reset**

In `useSplendorGameController.ts`, when `gameState.currentPlayerIndex` changes, `setPhase("idle")` and clear `actionSubmitting`.

Skip the local countdown interval when `gameMode === "online"`.

- [ ] **Step 3: Manual test**

Local AI: AI must not buy a card after your timer already passed the turn.

Online Splendor: idle until timeout with 11 tokens in return phase — after timeout you must be able to act on your next turn.

- [ ] **Step 4: Commit**

```bash
git add server.js src/pages/game/useSplendorGameController.ts server/splendorTurn.js
git commit -m "fix: resolve skipped turns instead of only bumping the player index"
```

---

### Task 8: Online rooms — reconnect, stable seats, no blind state overwrite

**Files:**
- Modify: `server.js` (`join-room`, `disconnect`, `handlePlayerDeparture`, `sync-game-state`, `game-action`, `card-purchased`, `tokens-taken`, voice/chat)
- Modify: `src/hooks/useOnlineGame.ts` (`joinedRef`, `playerIndexMap`)
- Modify: `src/pages/OnlineMatchmaking.tsx` (do not `socket.disconnect()` on unmount after `match-found`; pass `playerCount` and keep socket or reconnect with same `playerId`)
- Modify: `src/pages/OnlineGame.tsx` (`useGame(actualPlayerCount)` must reset when count changes; memoize DMD init; play-again events)
- Modify: `src/pages/OnlineLobby.tsx` (join payload includes `playerCount`)

**Interfaces:**
- Produces: `join-room` while `status === "playing"` **succeeds** if `playerId` already exists in `room.players` or `room.turn.playersInGame`; updates `socketId`; sets `connected: true`; emits current `gameState` to that socket only.
- Disconnect: mark `connected: false`, **do not** remove from a playing game for 60s (`reconnectMs = 60000`). After timeout, then `handlePlayerDeparture`.
- `playerIndexMap` keys are `playerId` (and optionally also `socketId` for old clients). Client looks up `playerIndexMap[playerId]`.
- `sync-game-state` / `game-action`: reject if `socket` is not in the room; reject if `playerId` is not the current seat (`room.gameState.currentPlayerIndex` maps to that playerId). Exception: host `start-game` initial state.
- Chat / voice: require shared `roomId` membership (`socket.rooms.has(roomId)`).
- Matchmaking: `find-match` dedupes by `playerId`. After `match-found`, navigate **without** disconnecting, or immediately `join-room` with `isHost` true for the first player and `maxPlayers` preserved on the existing room (do not `rooms.delete` while players are transferring).
- `useGame`: when `playerCount` changes and there is no `initialState`, `resetGame` / re-`initializeGame(playerCount)`.
- DMD: `useMemo(() => initializeDeadMansDrawGame(actualPlayerCount, true), [actualPlayerCount, roomId])` so auto-start does not reshuffle every render.
- Play again: implement `post-game-action` and `post-game-votes` **or** change the client to the existing `request-rematch` / `respond-rematch` pair — pick one pair and use it on both sides.

- [ ] **Step 1: Reconnect path in `join-room`**

Before the `status !== "waiting"` rejection:

```js
const already = room.players.get(playerId);
if (already && room.status === "playing") {
  already.socketId = socket.id;
  already.connected = true;
  socket.join(roomId);
  socket.emit("game-state-updated", room.gameState);
  socket.emit("players-updated", {
    players: getRoomPlayersArray(roomId),
    roomStatus: room.status,
  });
  return;
}
```

- [ ] **Step 2: Soft disconnect**

On `disconnect`, if room is playing, set `connected: false` and `setTimeout` 60s to remove. Clear that timeout on reconnect.

- [ ] **Step 3: Authorize state sync**

```js
function assertCanPublishState(socket, room, playerId) {
  const member = room.players.get(playerId);
  if (!member || member.socketId !== socket.id) return false;
  const idx = room.gameState?.currentPlayerIndex;
  const seated = room.turn.playersInGame?.[idx];
  return seated && seated.id === playerId;
}
```

Jungle Speed totem: still last-write-wins unless you add a server `grab-totem` timestamp (optional follow-up). For publish, at least require membership.

- [ ] **Step 4: Fix matchmaking cleanup**

Remove `socket.disconnect()` from the matchmaking effect cleanup when `match-found` already fired (use a ref `transferredRef`). Keep `maxPlayers` on the room. Store `playerCount` in localStorage for guests in `OnlineLobby.tsx`.

- [ ] **Step 5: `joinedRef`**

In `useOnlineGame` cleanup, set `joinedRef.current = false` after disconnect so a new socket can join.

- [ ] **Step 6: Two-browser test**

1. 2-player matchmaking → both enter the same 2-player Splendor board (not 4).
2. Refresh one client → same seat, game continues.
3. From DevTools, emit a fake `sync-game-state` as the non-current player → ignored.

- [ ] **Step 7: Commit**

```bash
git add server.js src/hooks/useOnlineGame.ts src/pages/OnlineMatchmaking.tsx src/pages/OnlineGame.tsx src/pages/OnlineLobby.tsx src/hooks/useGame.ts
git commit -m "fix: reconnect online seats and stop accepting foreign game state"
```

---

### Task 9: Catalog, coming-soon, i18n snake text, dead `/games` link

**Files:**
- Modify: `src/lib/gameCatalog.ts`
- Modify: `src/pages/game/GameRouterView.tsx`
- Modify: `src/pages/GamesList.tsx`
- Modify: `src/pages/dead-mans-draw/helpers.ts`
- Modify: `src/hooks/useLanguage.tsx` (`deadMansDrawActionSnakeForcedCount` copy)
- Modify: `src/pages/SplendorIntroTutorial.tsx` (`navigate("/games")` → `navigate("/menu")`)
- Test: `src/test/gameCatalog.test.ts`

**Interfaces:**
- Produces: `GameConfig.playable: boolean`. `getPlayableGames()` filters catalog. Router: if `!selectedGame.playable`, render a simple “Coming soon” card, **not** `SplendorGame`.

- [ ] **Step 1: Test**

```ts
import { describe, expect, it } from "vitest";
import { getGameById } from "@/lib/gameCatalog";

it("does not treat coup as splendor", () => {
  expect(getGameById("coup").id).toBe("coup");
  expect(getGameById("coup").playable).toBe(false);
});
```

- [ ] **Step 2: Catalog + router**

Set `playable: true` for `splendor`, `dead-mans-draw`, `totem`, `beasty-bar`. `coup` and `ticket-to-ride`: `playable: false`.

`GamesList`: coming-soon games navigate nowhere / show toast, or open a dialog. Do not send them to `/menu/coup` that still starts Splendor.

Snake regex:

```ts
const snakeMatch = action.match(
  /^Snake revealed: draw (\d+) more card\(s\) before you can collect\.$/,
);
```

Align EN string in `useLanguage.tsx` with that sentence.

- [ ] **Step 3: Commit**

```bash
git add src/lib/gameCatalog.ts src/pages/game/GameRouterView.tsx src/pages/GamesList.tsx src/pages/dead-mans-draw/helpers.ts src/hooks/useLanguage.tsx src/pages/SplendorIntroTutorial.tsx src/test/gameCatalog.test.ts
git commit -m "fix: hide unimplemented games and translate DMD snake actions"
```

---

### Task 10: Native, env URL, packaging

**Files:**
- Modify: `package.json`
- Modify: `capacitor.config.ts`
- Modify: `src/App.tsx` (`AppBackHandler`)
- Modify: `src/lib/socketConfig.ts`
- Modify: `.env.example`, `.env.mobile`

**Interfaces:**
- Produces: `socket.io` in `dependencies`. `@capacitor/cli` in `devDependencies`. Add `@capacitor/app` and `@capacitor/splash-screen`. Hardware back via `@capacitor/app` `backButton`. `SOCKET_SERVER_URL` never includes `#` comments. Native default is `import.meta.env.VITE_SOCKET_URL` or a clear error screen, not `hostname:3001` on device.

- [ ] **Step 1: package.json moves**

```json
"dependencies": {
  "@capacitor/android": "^8.4.2",
  "@capacitor/core": "^8.5.0",
  "@capacitor/ios": "^8.5.0",
  "@capacitor/app": "^8.0.0",
  "@capacitor/splash-screen": "^8.0.0",
  "socket.io": "^4.8.3"
},
"devDependencies": {
  "@capacitor/cli": "^8.5.0",
  "socket.io": undefined
}
```

Remove unused `express` and `cors` **or** actually use them — do not leave both unused and `socket.io` only in devDeps. After edit run `npm install`.

- [ ] **Step 2: Back button**

```ts
import { App as CapApp } from "@capacitor/app";
import { isNativeApp } from "@/lib/nativeApp";

useEffect(() => {
  if (!isNativeApp()) return;
  const sub = CapApp.addListener("backButton", ({ canGoBack }) => {
    // same path logic as current handleBack
  });
  return () => {
    sub.then((h) => h.remove());
  };
}, [location.pathname, navigate]);
```

Delete `document.addEventListener("backbutton")`.

- [ ] **Step 3: Env**

`.env.example`:

```
VITE_SOCKET_URL=http://localhost:3001
# Native device: your PC LAN IP, no comment on this line
# VITE_SOCKET_URL=http://192.168.1.10:3001
VITE_REQUIRE_PREMIUM=false
```

`socketConfig.ts`:

```ts
function cleanEnvUrl(raw: string | undefined) {
  if (!raw) return "";
  return raw.split("#")[0].trim().replace(/\/$/, "");
}

export const SOCKET_SERVER_URL =
  cleanEnvUrl(import.meta.env.VITE_SOCKET_URL) ||
  (typeof window !== "undefined" && window.location.protocol.startsWith("http")
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");
```

On native (`isNativeApp()`), if env URL is empty, log a visible error — do not silently use a useless hostname.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts src/App.tsx src/lib/socketConfig.ts .env.example .env.mobile
git commit -m "fix: Capacitor back/splash deps and a clean socket URL"
```

Do **not** commit `.env` if it contains a LAN IP you do not want public; keep it gitignored.

---

### Task 11: Error boundary, play-again (if not done in Task 8), leftover polish

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/main.tsx` or `src/App.tsx` wrap router
- Modify: `src/pages/OnlineGame.tsx` / `server.js` if Task 8 deferred rematch
- Optional: skip wiring unused `SplendorIntroTutorial` or add its route

- [ ] **Step 1: Error boundary**

Class component `getDerivedStateFromError` + “Reload” button calling `window.location.assign("/menu")`. Wrap `<BrowserRouter>` children.

- [ ] **Step 2: Confirm rematch**

Grep `post-game-action` and `request-rematch`. One pair must exist on server and client.

- [ ] **Step 3: Delete or skip `src/test/example.test.ts`** `expect(true).toBe(true)` — replace with a comment that real tests live next to features, or delete the file.

- [ ] **Step 4: Full verification**

```bash
npm run test
npm run lint
npm run build
```

Expected: tests pass; build emits `dist/`. Then two-device LAN: login, local Splendor, one online match, shop buttons do not grant free premium.

- [ ] **Step 5: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/main.tsx src/App.tsx src/test/example.test.ts
git commit -m "fix: recover from render crashes and drop placeholder tests"
```

---

## Coverage checklist (review findings → tasks)

| Finding | Task |
| --- | --- |
| GET /users passwords | 2 |
| Client-only plaintext login / forgeable session | 2, 3 |
| Premium/shop grant without payment | 5 |
| `/game` unguarded | 4 |
| Client `gameState` overwrite | 8 |
| Matchmaking 2-player board / disconnect deletes room | 8 |
| Disconnect ejects forever | 8 |
| Timeout skips nobles / DMD pending | 7 |
| One noble per game | 6 |
| Coup/TTR → Splendor | 9 |
| Cordova back / missing splash plugin | 10 |
| `socket.io` in devDependencies | 10 |
| Comment glued to `VITE_SOCKET_URL` | 10 |
| Play-again events missing | 8 or 11 |
| DMD snake i18n mismatch | 9 |
| Empty tests / placeholder | 6, 11 |
| CORS * + unauthenticated social | 2 |
| Illegal 1-token takes / easy AI dupes | 6 |
| Local timer vs AI race; online local interval | 7 |
| rememberMe ignored | 3 |
| `joinedRef` blocks reconnect | 8 |
| God-file split | **Out of scope** (do not refactor `useSplendorGameController.ts` except the phase/timer lines in Task 7) |
| Enable `strict: true` | **Out of scope** |

## Out of scope (do not do in this plan)

- Rewriting `useSplendorGameController.ts` into many hooks
- Turning on TypeScript `strict`
- Replacing Socket.IO with another realtime stack
- Implementing Coup or Ticket to Ride
- Server-side receipt validation with Apple/Google/Cafe Bazaar APIs (requires store consoles). Task 5 only refuses grants when the native plugin does not confirm success. Add receipt verification as a **follow-up** after store accounts exist.

## Suggested publish gates

1. **Internal web demo:** Tasks 1–5, 9 (catalog), 10 (env).
2. **Public multiplayer:** + Tasks 6–8.
3. **App Store / Bazaar / Myket:** + Task 10 plugins, real IAP product IDs, `VITE_REQUIRE_PREMIUM=true`, privacy policy for accounts, and **never** expose `GET /users` on a public IP until Task 2 is verified live.
