# Architecture optimization guide

**Project:** Gemstone Guilds (Vite + React + TypeScript, Node `server.js`, Socket.IO)  
**Purpose:** Practical steps to improve maintainability, scalability, and safety without rewriting everything at once.

---

## 1. Clarify layers and dependencies

**Goal:** Keep a one-way dependency flow so changes stay localized.

| Layer | Responsibility | Should not depend on |
|-------|----------------|----------------------|
| **Domain** | Pure game rules, types, validators (`gameLogic`, `deadMansDraw`, card data) | React, HTTP, sockets, `localStorage` |
| **Application** | Use-cases: “start online match”, “apply move”, “save profile” | Specific UI components |
| **Infrastructure** | `fetch`, Socket.IO, file/DB I/O, env | JSX |
| **Presentation** | Pages, hooks that only orchestrate UI | Raw `fs` or server-only APIs |

**Actions**

- Treat `src/lib/gameLogic.ts` (and similar) as the **source of truth** for moves; server and client should call the same pure functions where possible, or share a small **validation** module.
- Move cross-cutting “business” helpers out of giant page files into `src/lib/` or `src/features/<game>/` so pages stay thin.

---

## 2. Split the backend (`server.js`)

**Current state:** A single large file mixes HTTP handlers, Socket.IO, and JSON persistence.

**Target shape (incremental):**

```
server/
  index.js           # bootstrap: create HTTP server, attach io, mount app
  routes/            # express-style routers or manual path handlers
  services/          # users, groups, matchmaking — pure-ish functions + I/O
  persistence/       # read/write shared state, migrations
  socket/            # connection handlers, room logic, event names
  validation/        # zod/joi schemas for payloads
```

**Actions**

- Extract **read/write** of `shared-state.json` into one module with a clear API (e.g. `loadState()`, `saveState(state)`, `withState(mutator)` to avoid partial writes).
- Group routes by **URL prefix** (`/api/auth`, `/api/groups`, `/api/games`) even if you stay on manual `createServer` routing.
- Centralize **Socket event names** and payload shapes in a shared constants file (or a tiny `packages/shared` later) so client and server cannot drift silently.

---

## 3. Persistence and concurrency

**Risk:** `readFileSync` / `writeFileSync` on one JSON file does not scale and can corrupt data under concurrent requests.

**Near-term**

- Wrap updates in a **single-process queue** (mutex): only one write at a time; batch rapid writes if needed.
- Keep backups: rotate `shared-state.json` to timestamped copies on startup or on interval.

**Medium-term**

- Introduce a **repository interface** (`UserRepository`, `GroupRepository`) with a JSON implementation today and swap to SQLite/Postgres/Mongo later without changing route code.

---

## 4. Frontend: structure by feature

**Current state:** Many top-level `pages/` and `components/game/` files; multiple games (Splendor, Dead Man’s Draw) share the tree.

**Recommended layout (gradual migration):**

```
src/
  features/
    splendor/
      components/
      hooks/
      pages/
    dead-mans-draw/
      ...
    social/          # groups, friends — if logic grows
  shared/
    components/      # truly generic UI
    hooks/
    lib/
```

**Actions**

- **Lazy-load** heavy routes with `React.lazy` + `Suspense` for game pages and large editors to shrink initial bundle.
- Co-locate **game-specific** types next to that game (`splendorGameSceneTypes.ts` pattern is good; extend it per feature folder).

---

## 5. Use React Query consistently

You already wrap the app in `QueryClientProvider`. **Standardize** server reads through `useQuery` / `useMutation` with:

- Stable **query keys** (e.g. `['groups', userId]`).
- **Invalidation** after mutations instead of manual refetch scattered in components.
- Timeouts and **retry policy** for flaky mobile networks.

This reduces duplicate fetching logic and makes loading/error states uniform.

---

## 6. State management boundaries

**When to use what**

| Concern | Tool |
|---------|------|
| Auth session, theme, language | Context (current approach is fine) |
| Server-backed lists (shop, groups) | React Query |
| Ephemeral UI (modal open, selection) | `useState` in the smallest parent |
| Real-time game state | Dedicated hook (`useGame`, `useOnlineGame`) + single reducer optional |

**Optional:** If `useOnlineGame` or lobby logic grows, a **reducer** (`useReducer`) or a tiny store (Zustand) for “connection + room id + last ack” can simplify debugging compared to many `useState` calls.

---

## 7. Contracts and types between client and server

**Problem:** Duplicated TypeScript types and runtime payloads invite subtle bugs.

**Actions**

- Define **Zod schemas** for API bodies and socket payloads; infer TS types from schemas (`z.infer<typeof Schema>`).
- Prefer **versioned** event names or a `schemaVersion` field in game state if you expect migrations.

---

## 8. Security and configuration

- Keep secrets only in `.env` (never commit); validate required env vars at **server startup**.
- Add **rate limiting** on auth and expensive endpoints before production.
- Tighten **CORS** to known origins in production.
- Log structured errors (request id, route, user id) without leaking passwords or tokens.

---

## 9. Testing strategy (high leverage)

- **Domain:** Unit tests for `gameLogic`, AI helpers, scoring (you have `gameLogic.test.ts`; extend for regression cases).
- **Server:** Integration tests for a few critical routes with a temp JSON file or in-memory repository.
- **UI:** Component tests for forms and critical flows (login, create group), not every pixel.

---

## 10. Observability and operations

- Health check route: `GET /health` → `{ ok: true }` for load balancers.
- Separate **build** (Vite static assets) from **API** in deployment when you outgrow `server.js` serving both.
- Document **runbooks**: how to restore `shared-state.json`, how to rotate logs, environment matrix (dev/staging/prod).

---

## 11. Prioritized roadmap

1. **Quick wins:** Lazy routes; centralize socket event names; mutex/queue for JSON writes; env validation on boot.  
2. **Structural:** Split `server.js` into `routes/` + `services/` + `persistence/`; introduce Zod on APIs.  
3. **Scale:** Replace JSON store with SQLite or Postgres behind repositories; add Redis only if you need sessions or cross-server pub/sub.  
4. **Platform:** CI (lint + test + build), preview deployments, error tracking (e.g. Sentry) when you have real users.

---

## 12. How this relates to `ARCHITECTURE.md`

`ARCHITECTURE.md` describes the **target** patterns (services, storage abstraction, scaling). This document is the **migration path**: concrete steps that align the codebase with that vision without a big-bang rewrite.

---

*Last updated: May 2, 2026*
