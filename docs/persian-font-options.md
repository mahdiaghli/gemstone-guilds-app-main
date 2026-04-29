# Persian Font Options for the Game

I put the font choice list in this file so you can review everything in one place.

Current global game font hook:
- `src/index.css`
- `body { font-family: ... }`

Recommended place to wire the final Persian font after you choose one:
- `src/index.css`
- optional future font files folder: `src/assets/fonts/`

## 20 font options

1. Vazirmatn - modern, clean, highly readable for UI and long text
2. IRANSansX - polished app-style Persian font with balanced weight
3. Peyda - contemporary, strong headings and clean body text
4. Yekan Bakh - premium-looking, rounded, good for game UI
5. Estedad - elegant, versatile, nice for both titles and interface
6. Sahel - simple and readable, good low-friction default
7. Shabnam - friendly, soft Persian typeface for casual UI
8. Tanha - neat geometric style with good legibility
9. Dana - modern commercial-style Persian font feel
10. Morabba - squared personality, strong for bold game headings
11. Lalezar - decorative and playful for title treatment
12. Kalameh - stylish headline font with premium tone
13. Gandom - warmer traditional-modern blend
14. Samim - approachable and human, comfortable for body text
15. Nahid - classic readable Persian UI option
16. Anjoman - editorial-looking, refined and expressive
17. Ordibehesht - more literary and elegant for thematic screens
18. Koodak - softer and more playful personality
19. Roya - older familiar Persian UI feel
20. Mitra - classic formal Persian text style

## Quick picks by style

- Best all-around UI: Vazirmatn, Peyda, Yekan Bakh, Estedad
- Best for elegant game menus: Kalameh, Anjoman, Ordibehesht
- Best for bold fantasy/pirate titles: Morabba, Lalezar
- Best for safe readability: Sahel, Shabnam, Samim

## Important note

These 20 options are listed here for you to choose from, but I did not download or install the actual font files into the project because this environment does not currently have network access for fetching them.
Once you pick 1 or 2 names, I can wire the chosen font into `src/index.css`, and if you want, I can also set up the exact font files in `src/assets/fonts/` after they are available locally.
