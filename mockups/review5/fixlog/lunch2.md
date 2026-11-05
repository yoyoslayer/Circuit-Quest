# Fix log: lunch2 (shared-change items for Lunch, the Meeting strip and the circuit sim)

Branch `worktree-agent-a6800b5fc2b4e86de`, reset to `claude/nifty-knuth-519jg0` @ 7c668fb.
Files touched: `src/lunch-runtime.ts`, `src/meeting-strip.ts`, `src/sim/electrical.ts`, `src/sim/electrical.test.ts`.
Scripts: `mockups/review5/tools/fix-lunch2/{shots,probe}.mjs` (`BASE=http://localhost:4212`). Shots in `mockups/review5/shots-full/fix-lunch2-*-{before,after}.png` (not committed).

## Fixed

| ID / item | Change (files) | Verified |
|---|---|---|
| R5-060 (from lunch.md) | `electrical.ts`: the free recharge (`charge += dt` with no current) is gone. A capacitor charges only by drawing real current (`Capacitor.chargeRate`, default 1 bar) from a live feed (its `node`, or its load's route) while below `CAP_FULL` (12) and not giving a kick; that current is added to the supply's and every lead's draw, so it counts toward trips and heating. `cap.charging` reports it. `lunch-runtime.ts`: the fake `'cap'` load and the after-tick correction are dropped; the runtime only sets `chargeRate` (1 with the lift off, 0.4 while it runs, so conveyor 1.5 + lift 3 + 0.4 = 4.9 < 5). | New unit tests: charging draws 1 bar on the supply and lead, stops when unfed or full; conveyor-then-capped-lift with 0.4 recharge peaks ≤ 4.9 and never trips. Old recharge test still passes (it now pays for the recharge). Lunch specs (intended solution waits for `capCharge>6`). |
| R5-199 (I² heating) | `electrical.ts`: `heatRate(amps,rating)=((amps/rating)²−1)·0.43` over the rating (−0.4/s cooling under it), per the verifier's scaled formula; comment marks the time scale as tuning. | Unit test: 1.33× heats at 0.334/s and scorches in 5.5–6.5 s; 2× heats at 1.29/s. Scorch spec. |
| R5-141 (render.md item 1) | Storeroom lid plane removed. Constructor sets `darkBox={x:-16.6,y:-7.75,z:-10.2,w:0}`, `darkness.amount=1`; `render()` fades it over 0.5 s toward 0 when `lit()` and back up when not. `capacitor`/`cooler-box` are no longer hidden in the dark (they fade up with the room); the cap hint badge still floats over the storeroom door while the cart is in the unlit store. `dispose()` sets `darkness.amount=0` and is called on `pagehide` (levels change by page load, and game.ts has no level teardown hook). | Before/after shots `fix-lunch2-store-dark-close-*`, `-store-dark-survey-*`, `-store-lit-after`/`-capcart-after`: before = lid with the cart and cooler box hidden; after = blue-violet dark room with the cart, cans, cooler box and cartons readable as silhouettes, then normal colours once the lamp is on. Probe: `darkness.amount` 1, box set, both props visible. |
| juice: meeting-strip trip (R5-108/120/094/095) | On trip: `audio.breakerTrip(loads on the strip)`, `freeze(.08)`, `flash('#ff7a6b',.22)`, `alarm({x:12,z:-5.5},6)` plus the local alarm, two `voice('groan')`. Replaces the old tone+noise. | Meeting specs (routes, objectives). |
| juice: meeting-strip unplug | Three groans and the boardroom alarm replaced by one `voice('hm')`; `bell(988,.3,.03)` when that unplug brings the strip's demand back under 5 A. | Code path; meeting reset spec. |
| juice: Lunch trip/short (R5-120/094) | Event loop branches: `'short'` → `audio.short(water)`, `'trip'` → `audio.breakerTrip(loads browned out)`, both `freeze(.08)`. Sparks/dust/alarm/shake kept. | Lunch rules specs (leak, lift kick). |
| juice: Lunch plug-in (R5-094) | Plug-in spark burst → `g.plugFlash(target.pos)`. The mechanical click stays and the chime still waits a step (R5-114), so `audio.plug()` (which chimes at once) is not called. | Specs plug every cable. |
| juice: BURN_WARNING (R5-088) | A pulsing warning sprite (red-ring disc, flame over a tray) over the oven while a baked tray sits past `BURN_WARNING`; extra smoke puffs from the oven top at twice the front rate. Placed at y 2.2 in front of the hood: at y 2.6 the top HUD bar covered it at the kitchen camera. | `fix-lunch2-burn-warning-after.png`: badge above the oven, smoke from the top. |
| R5-168 | E: with no prop in reach (`g.nearest()`), E picks up a *loose* cable end within 1.75 m; it never unplugs or splices (F still does all cable work, R5-177 kept). With a prop in reach, `interact` returns false (generic grab) and `promptAt` returns null before the cable prompt, so the generic "E Grab the …" prompt shows. | Lunch specs (all E presses grab props). Shot `-burn-warning-after` shows "E Grab the mug" with a cable end nearby. |
| models: cap port (R5-343) | `Port.local`: a port on a prop can sit at a local offset rotated with the body. The cap inlet is at local (+.75, +.1, 0), the control box's socket plate. The cart's cord to the winch starts at the plate and drops outward. | Probe: port at (−11.25, .67, −7) for the cart at (−12, .57, −7). |
| lead's item: cooler-box spec stall (`lunch-rules.spec.ts:87`) | Cause: the "cooled" trigger (Pip within 2 m of (−5.6,−1.8) with the box) fires while Pip is still passing the feed post at about (−5.0,−3.7). The runtime then just let go (`g.held=undefined`), so the box dropped dynamic at about (−4.6,0.9,−3.7), right on the route to (−4.4,−3.6)/(−4.4,−1.8), and Pip walked into it. The collider dump in `tools/fix-lunch2/cooler.mjs` shows the box (he .5/.3/.32) 0.67 m in front of the stalled Pip. Nothing outside lunch-runtime.ts is involved. Fix (`lunch-runtime.ts`): on delivery the box is set down upright, at rest, between the fridge and the kitchen's front wall at (−5.6,·,−1.05), with a dust puff. | `cooler.mjs`: the route completes and `cooled` is true; the box rests at (−5.38,−0.66), off the walking line. Spec :87 passes. |
| models: gauge stems (R5-338) | Supply-cart gauges mount with `stem:true`. | `fix-lunch2-supply-gauges-after.png`. |

## Skipped

- **R5-302 seated NPCs**: can't be done from `src/levels/lunch.ts` data. `NpcSpot` has no `seated` field (types.ts) and game.ts seats coworkers only in the Meeting (`seated=this.level.id==='meeting'&&!p.standing`). See shared change.
- HUD oven icon red flash for BURN_WARNING (game-ui, not mine).

## Needs shared change

- **types.ts + game.ts (R5-302)**: add `seated?:boolean` (and optional `seatY`) to `NpcSpot`; in game.ts `seated=p.seated??(this.level.id==='meeting'&&!p.standing)`, using `seatY??.47`. Then in lunch.ts set `seated:true,yaw:Math.PI` on the two bench blobs at (−4.2, 9.45) and (−2.6, 9.45) with a bench seat height of ~.45.
- **game.ts (optional)**: a level teardown hook (`this.lunch?.dispose()`) if levels ever switch without a page load; today `pagehide` covers it.
- **ui/game-ui.ts (R5-088)**: flash the HUD oven icon red while `lunch.job.tray==='baked'&&ovenWait>BURN_WARNING`.

## Open questions

- Darkness strength: with `darkness.tint` (.34,.36,.58) the store reads dark but still fairly bright purple at the kitchen camera; tune the tint in toon.ts if it should be darker.
- `plugFlash` makes nearby coworkers cheer on every plug-in, including one that then trips (e.g. the fridge socket in the leak). The chime still waits, but the cheer doesn't.
- Vite's file watcher in this worktree missed edits made by `git checkout`/`sed`; restart the dev server before taking shots.

## Test results

- `npm.cmd test`: 11 files, 136 tests pass (3 new in electrical.test.ts). `npm.cmd run build`: ok. `tsc --noEmit`: ok.
- Browser (PW_PORT=4202, software rendering):
  - lunch-rules + routes + objectives + smoke + layout: 33 passed, 4 failed. Reruns:
    - cooler box (:87): now **passes** with the fix above.
    - `smoke.spec.ts:21` (300 props): passed on rerun; the first failure was a load timeout.
    - `smoke.spec.ts:33` (R5-143 quality, garage boot): times out on `page.goto` under software rendering both times. It is the render agent's test and loads the garage; not in these files.
    - `routes.spec.ts:36` "meeting single reel only reaches when overstretched at a sprint": fails at line 41 (Pip gets within 2.3 m of the door while walking). **It fails the same way on base 7c668fb** with my four files reverted. It is about the reel's spring and Pip's walk (game.ts/cable), not the strip.
  - `lunch.spec.ts` intended solution: fails at line 44 (tray not delivered). **It fails identically on base 7c668fb**. Cause, from the failure dump: a cleaner bot snags thin-1 (the lift feed) off the capacitor, so the lift stops 2 s after it starts. My best guess: the bot catches the feed on the lane's bottom edge around x 0–0.35, in the gap between bridge-1 (snapped onto the west edge at (−1,1.8); it ended at (−0.95,1.37)) and bridge-2 (dropped at (1.5,.9) → covers x ≥ .35; it ended at (1.87,.99)). A probable spec fix (tests are outside my files): drop bridge-2 nearer x 1.0, or add a bridge at (0.2,1.2). Not verified.
  - lunch-rules scorch test: passed in the full run (its first-run failure was a boot timeout).
- Shots looked at: store dark before/after (close and survey), store lit, cap cart, supply gauges, burn warning, cooler-box after.
