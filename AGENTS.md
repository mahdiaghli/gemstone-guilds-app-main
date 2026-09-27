# AGENTS.md

## Product direction

This is a mobile-first board-game application. Treat a 344 x 642 CSS-pixel viewport as the primary design target, then verify that layouts scale cleanly to larger phones, tablets, and desktop browsers.

## Required engineering standards

- UI/UX is a first-class requirement: keep primary actions obvious, navigation consistent, states understandable, and screens usable with one hand.
- Build responsive layouts without horizontal overflow. Respect Android/iOS safe areas and the on-screen keyboard.
- Touch targets should normally be at least 44 x 44 CSS pixels and must have visible pressed, disabled, loading, success, and error states.
- The app is bilingual. Persian screens must use UTF-8, natural Persian copy, RTL direction, right-aligned text, and a Persian-capable font. English screens must use LTR. Avoid mojibake and mixed-direction layout bugs.
- Keep accessibility in scope: semantic controls, labels, keyboard support, sufficient contrast, and reduced-motion compatibility.
- Never trust client-owned currency, rewards, purchases, identity, scores, or group permissions. Validate sensitive operations on the server.
- Hash passwords using an established password KDF, keep secrets in environment variables, use authenticated requests, validate input, rate-limit authentication, and never expose password hashes or salts to clients.
- Persist production data in PostgreSQL. Local JSON storage is only a development fallback. Schema changes should be migration-friendly and preserve existing users.
- Bazaar/Myket purchases must be verified server-side before granting gems or inventory. Purchases must be idempotent and restorable.
- Prefer small, focused components and typed interfaces. Preserve existing game rules unless the task explicitly changes them.
- Optimize media and rendering for lower-end Android devices and unreliable networks.

## Verification before handoff

- Run the production build and relevant tests.
- Check at 344 x 642 in Persian and English.
- Exercise authentication, persistence after server restart, insufficient/exact currency boundaries, offline/error states, and first-interaction audio playback.
- Do not commit secrets, signing keys, generated stores, or user data.