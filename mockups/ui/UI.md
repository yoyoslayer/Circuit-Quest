# Circuit Crew UI system

One idea runs through every screen: **the cable**. Cable links go live between objective stages, job tags hang on a striped cable, the logo's plug snaps into a socket, and on the result tag the winning stat's cable feeds the grade stamp. Everything else is quiet: paper panels, 3 px ink outlines, hard ink shadows.

The pages share `ui.css` (tokens and components) and `icons.js` (the sprite). Backgrounds are frozen screenshots in `bg/`, because `artifacts/` keeps being regenerated. To re-shoot, run `node mockups/ui/shoot.mjs`.

## Palette
- night `#1D1F2B`: void and scrims
- ink `#262A40`: outlines, text, shadows
- ink-2 `#4A4F68`, muted `#8A8FA6`
- paper `#FAF3E3`, paper-2 `#F0E5CC`, paper-3 `#DDCFAF`
- hat `#FFC53D` (rim `#E09A12`): the single primary action per screen and the current stage
- snap `#5ED6CC`: snap targets, live flow, focus, selection
- live `#3BB273`: done / warm `#FF8A3D`: warning / trip `#E5484D`: tripped or spoiled
- medals: A gold `#FFC53D`, B silver `#CBD5DE`, C bronze `#E49B63`, D tin `#B3B6C3`
- level discs: Playground `#5ED6CC`, Meeting `#6E9BEA`, Lunch `#FF8A3D`. Cart gauge bezels match the cart bodies (`#FFC53D`, `#E9803A`).

Readable, not bright: saturated colour only on small signals.

## Type
**Fredoka** variable (wght 300–700, wdth 75–125, OFL) is the only family. The mockups use Google Fonts. To ship, self-host it with `@fontsource-variable/fredoka` (`wdth.css`). Fallback: `'Nunito', ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif`.

Scale (px): 12 keycap, 15 hint, 19 HUD number or button, 22 tagline, 28 tag title, 34 result value, 46 heading, 124 grade, 164 logotype. Weights: 500 body, 600 numbers, 700 display. Display uses `font-stretch:108–110%`. The logotype gets a 14 px stacked ink extrusion.

## Spacing, radii, depth
- 4 pt grid (4/8/12/16/24/32/48). HUD inset is 24 px (12 px on phone, plus safe-area insets).
- Radii: keycap 7, chip 10, button 16, action 20, big button 24, panel 28. Tags are 18 px on top and 28 px on the bottom.
- Shadows are hard: `0 5px 0 ink` on buttons, `0 8px 0 ink` plus `0 26px 50px rgba(8,10,20,.45)` on panels. Pressed: `translateY(4px)`, 1 px drop.
- Touch targets are at least 56 px (70–92 px on phone).

## Icons
32-unit grid, 2.4 ink stroke, round joins. Duotone via custom properties: `--ic` body, `--ic-a` accent, `--ink-c` ink. State changes only swap the variables: done goes green, current inverts to paper on yellow, todo goes ink-2 with a dashed ring. The redrawn coins no longer read as a database. `mug` replaces `damage`. New icons: spoiled, socket, fridge, cart, gamepad, mouse, dash, home, jobs, next, star.

## Components
- **Job plate**: badge whose time ring drains to `level.deadline`, then tallies (clock, mug, coins).
- **Strain**: the reel's cyan ring shows cable left. The bar fills through white → yellow → orange → red, with a dotted snap line at 85%. The pause button sits next to it. Sound and restart move into pause.
- **Actions**: grab, cable, throw and jump, then camera. Keycaps swap to pad glyphs when a gamepad is active. States: `.on` (holding), `.ready` (breathing cyan ring when a target is in reach), `.off`.
- **Lunch chain**: `.step.done/.now/.todo` with `.link.live/.cold`. The current step has a progress arc. The thermometer has zones at 55% and 80%, and the sad-lunch icon wobbles once it passes 80%.
- **Breakers**: one needle dial per cart (0–6 bars, limit at 5). `.hot` lights the pip; `.tripped` shakes.
- **World cues**: snap ring (faint when idle; dashed and rotating while a plug is carried; red when tripped). Grab reticle brackets. `!` bubbles (a yellow variant marks the spoiling fridge). Ghost route dots, shown after an idle delay. Throw arc with a landing ring. A `+1` damage chip. An off-screen pointer on phone.
- **Tags** (jobs, result, fail): hang by an eyelet from a string or cable clip. The selected job gets a cyan outline and the only Play button.

## Grading and failure
Each stat shows its own medal. The overall grade is the best of the three: that row is taped yellow and cabled into the stamp. The mockup shows damage at C with an overall A, so chaos visibly costs nothing. A spoiled or burned tray shows no grade: the sagging tag has the spoiled lunch, a pegged thermometer, how far the chain got, and a big Retry (for a burned tray, swap in the oven icon plus smoke).

## Motion
All motion lives in `ui.css` and is off under reduced motion.
- Press: 120 ms `cubic-bezier(.34,1.56,.64,1)`.
- Title: letters drop over 600 ms (staggered 120 ms); the plug swings in at 500 ms and sparks at 1.25 s.
- Tags: drop in over 700 ms, then swing ±2.5° on a 3–4 s loop.
- Result: rows rise at 0.6, 0.85 and 1.1 s while the numbers count up. The **stamp** lands at 1.5 s: scale 2.6 → 0.92 → 1, blur 6 → 0, settling at −12°, with a 120 ms shake and a thud. The star pops at 1.9 s.
- Fail: the tag sags (overshoots to 7°), the bowl wobbles and the thermometer shakes.
- HUD: the reel spins while cable pays out, the live link flows, and `!` bubbles pop in over 500 ms.

## What replaces what
- `src/style.css` → `ui.css`. Drop `.scene`, `.patch` and `.still`, which are mockup-only.
- `src/render/icons.ts` → the `icons.js` symbols. Keep `icon(name)` but return `<svg class="ico"><use href="#i-name"/></svg>`.
- `game.ts setupUI()`:
  - `.job`, `.stats`, `.timer` → `.jobplate`, `.tallies`, `.badge .ring`
  - `.tension` → `.strain` (`--left`, `--t`)
  - `.toolbar` → `.actions/.act`
  - `.utility` → `.pausebtn`
  - `.intro` and `.levels` → the title and level-select screens
  - `.pause` → the pause screen
- `game.ts win()` → the result screen (`.result.tag`, `.stamp`, `.row.best`, `.feed`).
- `lunch-runtime.ts`: `.lunch-chain` → `.chain` plus `.thermo --h`. `supplyGauges` gains HUD `.breakers` (needle = draw/6·180°). The fail `innerHTML` → the fail screen. `port.ring` colours follow the snap-ring spec.
- `reference/render_kit/hud.css` and the concept HUDs are superseded.

No words are needed during play. Text only appears on the title, on menus (backing up the icons), and on tag names.
