# Review A: lobby, Via Counter / Via Rush, Fabrication Bay (QFN), Archive, Waterworks, Signal Observatory

Branch `claude/finish-circuit-crew` @ 9681076. Captured with `tools/debug/review-a.tmp.mjs` (chromium, D3D11 ANGLE, `?manual&fullfx`, 1440×900 plus 390×844). All screenshots are in `mockups/review3/a/`. No page errors in any run.

Caveats from `?manual` mode: the HUD clock only advances when the driver asks, so 0:04 to 0:11 on result cards is expected. The QFN "stale rings" (item S6) would last up to 4 s in real play, not indefinitely.

---

## MUST FIX

### M1. The phone bench layout is unplayable on every station (all five, and Via Rush)
- **Screens:** `vias-6-bench-phone.jpg`, `vias-3b-fail-phone.jpg`, `viasrush-6-bench-phone.jpg`, `qfn-6-bench-phone.jpg`, `archive-6-bench-phone.jpg`, `archive-3b-toast-phone.jpg`, `waterworks-6-bench-phone.jpg`, `waterworks-3b-toast-phone.jpg`, `observatory-6-bench-phone.jpg`, `observatory-3b-toast-phone.jpg`.
- **What's wrong:**
  - The objective card, the station panel, the toast and the prompt pill all stack on top of each other over the middle of the table.
  - The prompt pill wraps to four lines and its `Click` badge overlaps the text.
  - The walking touch controls (joystick, grab, jump, cable, camera) stay on screen and cover the bottom third.
  - Most bench tools are off-screen: the bench camera is framed for 16:10. On Vias only the layer stack is visible. On QFN none of MOVE, TURN, PEN, ERASE or SHIP are visible. On Waterworks the panel covers the gauges.
  - Archive: the terminal shrinks to a search box plus a document header, and the work order covers the prompt.
- **Fix:**
  1. `src/ui/ui.css`: add a bench state. Set `document.body.dataset.bench` in `Game.enterBench`/`leaveBench` (`src/game.ts` ~l.227). Under `@media (max-width:700px)`:
     - `body[data-bench] .objective{display:none}`;
     - collapse `.station-panel` to a one-line header chip at the top (hide `header p` too, not only `.build`/`.profile`);
     - put `.station-toast` at `top:` just under that chip;
     - `.prompt-pill{bottom:calc(16px + var(--safe-b))}`.
  2. `src/ui/screens.css` (the `max-width:700px` block ~l.214-280): `body[data-bench] .stick, body[data-bench] .actions{display:none}`. Add a single "Stand up" button in their place.
  3. `Station.view`: add an optional portrait override (e.g. `viewPortrait={distance,pitch,lookY}`) and use it in `src/game.ts` l.343 when `innerWidth/innerHeight < 1`. Vias needs about 1.6× distance and QFN about 1.4×.
  4. `src/stations/archive/archive.css`: at ≤700px, use a tabbed layout (Docs | Document | Order) instead of three columns.

### M2. At the bench, the walking action bar still shows, with key hints that are wrong there
- **Screens:** every `*-2-bench.jpg` / `*-3-*.jpg` at 1440 (for example `qfn-2-bench.jpg`, `waterworks-2-bench.jpg`).
- **What's wrong:**
  - The Grab (E), Cable (F), Throw (Q), Jump (Space) and Camera (C) bar sits over the front edge of every table.
  - At the bench, E means *stand up*, not grab (`src/game.ts` l.151).
  - C means CHECK on QFN and COMPARE on Waterworks, but the bar still says C = camera.
  - There is no visible way to leave the bench. Nothing on screen says E/Esc stands up.
- **Fix:**
  - `src/ui/ui.css`: `body[data-bench] .hud .actions{display:none}` (same `data-bench` flag as M1).
  - Show a small fixed chip bottom-left, `<kbd>Esc</kbd> Stand up`, from `ObjectivesHUD` (`src/ui/objectives.ts`) when `g.atBench`.
  - The freed space also lets the prompt pill and toast drop about 90 px, which uncovers the table fronts (see M4).

### M3. The result card overflows the bottom of a 1440×900 viewport
- **Screens:** `vias-4-result.jpg`, `viasrush-4-result.jpg`, `qfn-4-result.jpg`, `archive-4-result.jpg`, `waterworks-4-result.jpg`, `observatory-4-result.jpg`.
- **What's wrong:** the card starts at `top:92px` and is taller than 808 px. Its bottom border is cut off, and the Retry/Jobs buttons touch the edge of the screen.
- **Fix:** `src/ui/screens.css` l.210. Raise the scale breakpoint from `@media (max-height:860px)` to `(max-height:960px)`, or better, size it from the viewport with `.result{scale:min(1, calc((100vh - 110px) / 830px))}` (use a JS-set `--fit` if `calc` in `scale` is unsupported).

### M4. The station panel covers working parts of the Via Counter table, and the Vias bench labels collide
- **Screens:** `vias-2-bench.jpg`, `vias-2b-midbuild.jpg`, `vias-3-fail-toast.jpg`, `viasrush-2-bench.jpg`.
- **What's wrong:**
  - The FINISH sign (x = 1.38, raised) and the TEST box sit under the right-hand `.station-panel`. You can only read `FINISH` as "FINISH" cut off at the panel edge.
  - The front-row plates collide:
    - `SCRAP` (x −1.95) and `PRESS` (x −1.55) touch;
    - `BIT: 0.30 · 0.20 · LASER` (x −1.08, w .62) runs under PRESS on the left, where it is cut to "IT: 0.30", and over `PLATE` (x −.8) on the right;
    - PLATE is hidden behind the L1–L4 tabs and reads only "TE".
  - The low pitch (.62) gives the top third of the screen to the giant VIA COUNTER sign and the back wall, while the tools crowd the bottom.
- **Fix:**
  - `src/stations/vias/station.ts`:
    - l.54 `view={distance:6.4,pitch:.62,lookY:.32}` → about `{distance:6.8,pitch:.8,lookY:.2}`, so the table fills the frame and the wall sign drops out;
    - l.117-135: respace the front plates at ≥ .5 m pitch (e.g. SCRAP −2.05, PRESS −1.5, BIT −.95 w .5, PLATE −.45 moved in front of the tank rather than behind the tabs);
    - move FINISH down onto the front row (y .08, z .38) like the other plates.
  - Station-panel width: `src/ui/ui.css` l.221 `width:min(330px,…)`. Either cap it at 300 px at the bench, or shift the bench look target left by about 0.3 m (`view.lookX`) so the right tool cluster clears the panel.

### M5. Vias: the build readout paints wrong choices green, so a player can't tell what caused a send-back
- **Screens:** `vias-3-fail-toast.jpg` (the buried via was rejected for "drilled after press", but Hole shows `0.30 mm bit · after press` in green), `viasrush-3-fail-toast.jpg` (the order is L1→L2 microvia, but Joins shows `L1 → L4 · through via` in green).
- **What's wrong:** `li.ok` is applied when a field is *set*, not when it is *right for this order*. Green reads as "correct" everywhere else in the game.
- **Fix:** `src/stations/vias/station.ts`, where the `.build` rows are rendered. Colour a row `ok` only when it matches `cheapest(order)` (or at least is valid for the order kind). Add an `li.bad` class (red, `#c0392b`) in `src/ui/ui.css` l.228 for the row named by the last send-back reason. Show other set rows in neutral ink.

### M6. After a send-back, the Vias prompt points the wrong way
- **Screen:** `vias-3-fail-toast.jpg`. The toast says the buried via must be drilled before lamination, but the prompt pill still says "TEST it, then ring SERVE (Enter)".
- **What's wrong:** a first-time player has no hint that SCRAP (restart the build) is the next action. Re-serving loops the same error.
- **Fix:** `src/stations/vias/station.ts` `prompt()` (~l.290-300). When the current build has been rejected, or is already pressed but needs a pre-press drill, return `{key:'X',text:'SCRAP the board and start again (drill before PRESS)'}` ahead of the TEST/SERVE hint.

### M7. Waterworks bench camera is too far away; tabletop labels are unreadable at 1440×900
- **Screens:** `waterworks-2-bench.jpg`, `waterworks-3-fail-toast.jpg`, `waterworks-3d-elec-fail.jpg`.
- **What's wrong:**
  - The load and selector labels (VALVE, HOSE, WHEEL 2/6/12, NETWORK, P-CART, F-CART) render about 7 px tall.
  - The cart knob captions (PUMP 9 kPa, SERIES 1.5, BYPASS 2) and the gauge faces are just as small.
  - The bottom 30 % of the frame is floor rug, and the top 25 % is a bucket and a plant.
  - After the reveal, the CHECK caption sits mostly behind the green button (`waterworks-3d-elec-fail.jpg`). In `waterworks-3c-revealed.jpg` it can't be seen at all, even though the prompt says "then CHECK".
- **Fix:**
  - `src/stations/waterworks/station.ts` l.108 `view={distance:9,pitch:.95,lookY:.58}` → about `{distance:6.6,pitch:.9,lookY:.4}`.
  - l.222/225/227/235: raise sign widths about 1.4× (.28 → .4) and tilt them toward the camera (−1.2 → −.8).
  - Put the CHECK label in front of the button (z +.3), not under it.
  - Compare with QFN (`qfn-2-bench.jpg`), which is the best-framed bench in this set.

### M8. Lobby: most doors can't be read, and some are hidden
- **Screens:** `lobby-1-room.jpg`, `lobby-3-door-other.jpg`, `lobby-4-workshop-arch.jpg`.
- **What's wrong:**
  - From spawn, only the six back-wall doors are readable. Their top signs are clipped by the frame, and "Fabrication Bay" sits under the pause button.
  - The three left-wall doors (Archive, Waterworks, Observatory) and five right-wall doors (Arcade to Spectrum) have name plates flush on the side walls. They read edge-on and can't be read.
  - At the Observatory door, Pip, the door and the Waterworks door are under the objective card, with only the ring showing (`lobby-3-door-other.jpg`).
  - The right wall packs five doors 2.9 m apart; they read as one striped slab.
  - The WORKSHOP arch sign is rotated −90°, so it also reads edge-on.
- **Fix:** `src/hub/lobby.ts`:
  - l.77: for side-wall doors, add a sign that sticks out from the wall (a perpendicular blade sign, or a floor decal in front of each door with the number and name) facing the default camera yaw.
  - l.86: rotate the workshop group so `signPlate(a,'WORKSHOP'…)` faces the camera (yaw 0 rather than −π/2).
  - Consider pulling the side doors onto the back and front walls, or widening the room so they sit ≥ 3.5 m apart.
  - Add occlusion fade for the side walls near Pip (AGENTS rule 8). The left wall currently hides Pip.
  - Start the lobby camera slightly higher/further (a survey pose), so the first frame shows all 14 doors.

---

## NICE TO HAVE

### N1. The first prompt in every room points at a random prop, not the objective
- **Screens:** `lobby-1-room.jpg` ("Grab the cone"), `qfn-1-room.jpg` ("Grab the cart", while the objective says *parts crate*), `archive-1-room.jpg` ("Grab the lamp"), `observatory-1-room.jpg` ("Grab the chair").
- **Fix:** `src/ui/objectives.ts` `promptFor` l.78. When `g.station` is set and the current step has an `at()`, prefer a directional hint ("Bring the parts crate → yellow arrow") over the nearest-prop grab prompt, unless the nearest prop *is* the step's target. Also move the spawn points so Pip doesn't start touching a cone, lamp, chair or cart (`src/levels/{lobby,qfn,archive,observatory}.ts`).

### N2. Toast position differs on the Archive
- **Screen:** `archive-3-fail-toast.jpg`. The toast appears at the top centre (y ≈ 45). Every other station puts it just above the prompt pill.
- **Fix:** `src/stations/archive/archive.css`. Either keep it at the bottom and lift the terminal 60 px, or put all station toasts at the top when a full-screen station UI is open. Pick one rule and document it in `docs/EXPANSION_PLAN.md`.

### N3. Button style differs from bench to bench
- **Screens:** `vias-2-bench.jpg`, `qfn-2-bench.jpg`, `waterworks-2-bench.jpg`, `observatory-2-bench.jpg`.
- **What's wrong:** each bench uses a different button language:
  - Vias: flat white plates in caps, no key letters;
  - QFN: chunky italic keycaps with M/R/T/X/C key letters;
  - Waterworks: tiny floor-plate captions;
  - Observatory: rounded captions plus a round LOG button.
  - The prompt badge also switches between `Click`, `Enter`, `C`, `M`, `T`, `Drag` and `…`.
- **Fix:** add a shared `benchKey(label,key,colour)` helper in `src/render/labels.ts` (the QFN keycap is the most readable) and use it on all benches, with the key letter on every cap. In `src/stations/*/station.ts` `prompt()`, show the *key* in the badge (`Enter`, `C`) and put "click" in the text. Avoid `Click` as a badge, and never use `…` (`archive-3a-carry-rig.jpg`).

### N4. Via Rush: two clocks, and the result card doesn't show the rush score
- **Screens:** `viasrush-3b-after-walkout.jpg`, `viasrush-4-result.jpg`.
- **What's wrong:**
  - The HUD clock counts up (0:56) while the panel counts down (`124 s left`).
  - The result card shows Time 3:00 with a B. That value is always the full shift, so it tells the player nothing.
  - The orders served, the main rush number, isn't on the card at all.
- **Fix:**
  - `src/ui/game-ui.ts`: for rush levels, drive `#clock` from the rush countdown (m:ss, red under 30 s).
  - In the result builder (~l.200-215), replace the time row with an "orders served" row when `level.id.endsWith('-rush')`.

### N5. Waterworks uses raw `V_th`, `R_th`, `I_N`
- **Screens:** `waterworks-3c-revealed.jpg`, `waterworks-3d-elec-fail.jpg`. Knob captions, the panel, the prompt and the toast show underscores.
- **Fix:** in `src/stations/waterworks/station.ts` l.29 and l.233-290, render `V<sub>th</sub>` in HTML panels and toasts, and use `Vth`/`Rth`/`IN` with a smaller subscript on the canvas-drawn knob labels (`label()` l.37). Also reword the bare formula toast into a sentence: "I_N must be V_th ÷ R_th: 9 V ÷ 150 Ω = 60 mA".

### N6. QFN: problem rings stay on cells that are now empty
- **Screen:** `qfn-3b-midroute.jpg`. Red rings from the failed ship stay on the parts' old cells after the parts have moved (for up to 4 s).
- **Fix:** `src/stations/qfn/station.ts` l.216-219. Call `this.marks.clear()` in `act('move'|'rotate'|'trace'|'erase'|'undo')`.

### N7. QFN: tall parts on the top row draw over the board title
- **Screen:** `qfn-3d-lastboard.jpg`. On board 3, C1 and R1 in the top row draw over the `BOARD 3 · TWO LAYERS` plate and the `still to route` legend.
- **Fix:** `src/stations/qfn/station.ts`. Move the board title and legend plates onto the front edge of the tray (toward the camera), or add about 0.15 m of margin above row 0.

### N8. Celebration confetti lands on the working surface
- **Screens:**
  - `qfn-3d-lastboard.jpg`: a sticky-note-sized orange piece and a blue diamond over J2;
  - `observatory-3d-job2-step.jpg`, `observatory-3e-job3-antenna.jpg`: pieces over the scope screen;
  - `waterworks-3c-revealed.jpg`.
- **Fix:** in the per-step burst call (the station's `say(...,'ok')` / job-complete path, via `game.burst`), spawn it at the customer or the room, not above `table`, while `atBench`. Alternatively, set confetti from bench steps to fade within about 1 s (`src/render/particles.ts`).

### N9. Observatory copy and overlap details
- `observatory-3-fail-toast.jpg`: the text reads "…needs 6 dB. reroute the cable…". Capitalise "Reroute" (`src/stations/observatory/station.ts`, decode-fail message).
- `observatory-3c-filtered.jpg`: once rerouted, the red cable runs across the ANTENNA plate. Route the "clear" spline behind the antenna mount.
- `observatory-2-bench.jpg`: the rod-rack captions (`75 cm`, `1.5…`, `3.1 cm`, `17 cm`) are hidden by the rods. Move the captions in front of the rods.
- Terminology: the panel says both "wire link" (Series) and "plain cable" (Filter) for the same nothing-fitted state. Pick one term.

### N10. Workshop picker details
- **Screens:** `lobby-5-workshop-picker.jpg`, `lobby-6-picker-phone.jpg`.
- **What's wrong:**
  - There is no scrim. The objective card, prompt pill ("Workshop: practise any station") and action bar stay live behind the modal.
  - Spelling is mixed: the arch sign says "practice", the picker says "Practise", the result tag says "Practice".
  - On a phone, the panel is taller than the screen, so its top and bottom borders are cut. It needs `max-height:calc(100dvh - 32px);overflow:auto`.
  - Two-line titles in the 3-column grid ("Fabrication / Bay") are centred, while one-line titles sit left.
- **Fix:** `src/ui/ui.css` l.237-242: add `.workshop-picker::before` as a full-screen scrim, set `text-align:left` on the grid buttons, and add the max-height rule. `src/hub/lobby.ts` l.88/98: use one spelling ("practise" as the verb, "practice" as the noun is correct British usage, but the sign uses it as a verb). Hide `.objective`/`.prompt-pill` while the picker is open.

### N11. The objective card crowds the room views
- **Screens:** `archive-3a-carry.jpg` (the test rig the prompt sends you to, "left of the desk", is under the objective card); `lobby-3-door-other.jpg`.
- **Fix:** `src/ui/ui.css` l.195. When the player is moving (or after about 6 s on the same step), collapse the card to the title plus the current step. Hide `.bonus` outside the bench. Alternatively, offset the room camera focus about 1.5 m right so the left third isn't needed.

### N12. Title screen
- **Screen:** `lobby-0-title.jpg`. The Play button carries an "HQ" sub-badge whose meaning is unclear. The controller icon at bottom-right renders at about 20 % opacity and looks broken.
- **Fix:** `src/ui/screens.ts` (title markup). Label it "Play · HQ lobby", or drop the badge. Hide the gamepad hint until a gamepad connects.

### N13. The Archive shows "Hide M" at the bench but not how to get back
- **Screen:** `archive-2-bench.jpg`. The terminal has a `Hide M` chip. Once hidden (not captured), nothing shows the key to bring it back.
- **Fix:** `src/stations/archive/station.ts` `prompt()`. When the terminal is hidden, return `{key:'M',text:'Open the archive terminal'}`.

---

## What works well (keep)
- **QFN bench** (`qfn-2-bench.jpg`, `qfn-3c-check.jpg`): clear framing, readable keycaps, dashed ratsnest, and a live net checklist. This is the model for the other benches.
- **Observatory scope** (`observatory-3c-filtered.jpg`, `observatory-3d-job2-step.jpg`): the trace and spectrum change visibly with each part, and the decoded text is a nice payoff.
- **Waterworks reveal** (`waterworks-3c-revealed.jpg`): the glass clearing into a schematic is a strong moment. The compare table with red failing cells explains mistakes well.
- **Archive terminal** (`archive-2b-doc-open.jpg`): readable, datasheet-like, with typical, guaranteed and absolute values clearly tagged.
- Room sets (`*-1-room.jpg`) all match the Agent Office look: pale wood, cream walls, pastel zones and restrained outlines.
