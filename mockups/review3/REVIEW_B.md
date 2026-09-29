# Review B: Arcade, Garage, Clockwork, Depot, Spectrum, plus a QA pass over every level

Reviewed at HEAD 9681076 (branch `claude/finish-circuit-crew`), using the dev server on port 5302 and Chromium with the D3D11 ANGLE flags.
Screenshots are in `mockups/review3/b/`. Each station was captured at these points: `<id>-1-room`, `<id>-2-bench`, `<id>-3-fail` (plus extra mid-job shots `3b`/`3c`), `<id>-4-result`, and at phone size `<id>-5-bench-phone`, `<id>-5b-fail-phone` and `<id>-6-result-phone`. The per-level QA shots are `qa-<level>.jpg`. The flow shots are `flow-5-back-lobby.jpg` and `qa-load-_level_lobby.jpg`.
The capture scripts are `tools/debug/review-b.tmp.mjs` (station runs, `qa`, `verify`), `tools/debug/review-b-dc.tmp.mjs` (real draw-call counter) and `tools/debug/review-b-2.tmp.mjs` (load probe). All three are gitignored.

## QA summary (all 15 levels)

- **Console:** there were **0 errors, 0 warnings and 0 page errors** on load and after about 5 s of play (W, then D) on all 15 levels, both with default settings and with `&fullfx`. The five station playthroughs were also clean.
- **Flow:** title, then Play, then lobby, then the door, then the job, then the result card, then "Jobs", which returns to the lobby with the lobby running. This loop **works**. It was verified with a Garage win: the "Jobs" button navigated to `?level=lobby` and the lobby autostarted. The exception is the reload case (M2 below).
- **Draw calls:** `snapshot().drawCalls` **always reports 1**, so it is useless (M5). The real WebGL draw calls per frame, counted by wrapping `drawElements`/`drawArrays` and taking the median, were:

| level | draw calls/frame | fps* | props |
|---|---|---|---|
| playground | 510 | 55 | 28 |
| lobby | 689 | 47 | 15 |
| observatory | 836 | 48 | 31 |
| vias-rush | 833 | 43 | 25 |
| vias | 845 | 59 | 25 |
| qfn | 850 | 45 | 28 |
| clockwork | 859 | 42 | 31 |
| archive | 880 | 40 | 49 |
| garage | 953 | 51 | 34 |
| spectrum | 978 | 46 | 37 |
| meeting | 1064 | 60 | 313 |
| lunch | 1090 | 43 | 46 |
| depot | **1149** | 51 | 40 |
| arcade | **1181** | 39 | 40 |
| waterworks | **1181–1208** | 56 | 34 |

\*The fps figures are from headless Chromium on a shared machine, so treat them as relative only. `&fullfx` gives the same counts to within 30. The station wings each use 850–1200 calls for only 25–49 props. That is more than Big Meeting, which has 313 props. The cost comes from the set dressing and bench meshes: every label plane and every tray block is its own mesh, and the OutlineEffect then draws each one twice.

---

## MUST FIX

### M1. Phone layout at the bench is broken on all five stations (and on every station, because the CSS is shared)
Screenshots: `arcade-5-bench-phone.jpg`, `arcade-5b-fail-phone.jpg`, `garage-5-bench-phone.jpg`, `clockwork-5b-fail-phone.jpg`, `depot-5-bench-phone.jpg`, `depot-5b-fail-phone.jpg`, `spectrum-5-bench-phone.jpg`.

**What's wrong:** at 390×844 four cards stack on top of each other over the middle of the table:
- the objective card sits at `top:96px`;
- `.station-panel` sits at `bottom:330px`;
- `.station-toast` sits at `bottom:300px`;
- `.prompt-pill` sits at `bottom:250px`.

The toast covers the station panel. The prompt pill ("Click Pick a block…") is squeezed under both and its text wraps around the kbd chip. The depot panel covers the whole board. Together they hide about 70 % of the tabletop, which is the only input surface. The walking controls (stick, grab, plug, jump, camera) are still shown at the bench even though they do nothing there.

**Fix:**
1. In `src/game.ts` `enterBench()`/`leaveBench()`, set and clear `document.body.dataset.bench='1'`.
2. In `src/ui/ui.css`, inside `@media (max-width:700px)`:
   - hide the controls with `body[data-bench] .stick, body[data-bench] .acts{display:none}`;
   - hide the objective list with `body[data-bench] .objective ol, body[data-bench] .objective .bonus{display:none}`, keeping just the h3 as a one-line header;
   - make `.station-panel` a bottom sheet (`bottom:calc(12px + var(--safe-b));top:auto;max-height:28vh;overflow:auto`) with only the header visible until tapped;
   - put `.station-toast` at the top (`top:calc(150px + var(--safe-t));bottom:auto`);
   - put `.prompt-pill` directly above the sheet.
3. Make the bench camera aspect-aware in `src/game.ts` line 343: `distanceTo=v.distance*Math.max(1,1.25/this.view.camera.aspect)` (or fit the table width), so the whole tabletop fits in portrait.

### M2. Reloading `?level=lobby` (the URL that "Jobs" leaves you on) opens the Jobs picker with **Cable Playground** selected
Screenshot: `qa-load-_level_lobby.jpg`

**What's wrong:** `GameUI` shows the `jobs` screen whenever `?level=` is present. The lobby is not in the `levels` list, so `this.sel` falls back to 0, and "Play" sends you to Playground instead of HQ. Anyone who presses F5 or shares the link after "Jobs" lands in the wrong place.

**Fix:** in `src/ui/game-ui.ts`, around lines 49–51, change it to `this.show(!params.has('level')||params.get('level')==='lobby'||params.has('intro')?'title':'jobs')`. Alternatively, make `toJobs()` navigate to `location.pathname` (the bare URL already opens the lobby), with `flagAutostart('lobby')` kept.

### M3. The Cost row on the result card uses a different unit at each station
Screenshots: `clockwork-4-result.jpg` shows **50** for 5 credits spent; `depot-4-result.jpg` shows 55; `arcade-4-result.jpg` shows **6** for 6 credits; `spectrum-4-result.jpg` shows 8.

**What's wrong:** the `score()` implementations disagree:
- `clockwork`, `depot` and `vias` return `Math.round(spent*10)`;
- `arcade`, `garage`, `archive`, `observatory` and `waterworks` return `Math.round(spent*10)/10`, which is the raw credits;
- `qfn` returns `Math.round(spent)`;
- `spectrum` returns the raw `spent`.

The bench panel says "Parts cost 5 credits", then the card says 50. Players can't compare stations, and the grade thresholds in `limits.cost` are a mix of both scales.

**Fix:** pick one rule. Credits as shown on the panel is the simpler choice. Make every `src/stations/*/station.ts` `score()` return `cost:Math.round(this.spent*10)/10`, then rescale `limits.cost` in `clockwork`, `depot` and `vias` by ÷10. Also update the "process cost ×10" wording in `docs/EXPANSION_PLAN.md`.

### M4. Celebration confetti flies through the bench camera and covers readouts
Screenshots: `arcade-3-fail.jpg` (a cream confetti square sits on "RESISTOR P_R" on the monitor), `arcade-2-bench.jpg` (large confetti at the top of the frame), `depot-3b-short.jpg` and `verify-depot-meter-after-wait.jpg` (fist-sized confetti over the rails, the plant and "BAY 2").

**What's wrong:** the per-job cheers call `game.burst(...,'confetti')` at table height, 0.8–1.4 m above the top:
- `arcade/station.ts:230`;
- `depot/station.ts:291`;
- `clockwork/station.ts:223`;
- `garage/station.ts:206`;
- `spectrum/station.ts:219`.

Particles launch at 5–11 m/s upward, so they pass right through the close bench camera and hang in front of the screens for about 2.5 s, which is exactly when the player reads the result.

**Fix:** while `game.atBench` is true, burst from behind and above the table's far edge, for example `table + (0, 2.4, -1.6)` in table space. Use about 12 particles instead of 28–30, and a smaller `size` (0.08). Alternatively, add a `nearClip` option to `Particles` that culls particles within 2 m of the camera. The in-room confetti in `game.ts:324` is fine.

### M5. `snapshot().drawCalls` always reports 1
Evidence: every `[shot]` line in the run logs, and every level in the `qa` pass.

**What's wrong:** `renderer.info.autoReset` is true and the post chain in `src/render/post.ts` ends with a fullscreen pass, so `info.render.calls` only counts the last pass. The perf budget can't be monitored.

**Fix:** in the view setup, set `renderer.info.autoReset=false`. Call `renderer.info.reset()` at the top of `Game.render()` in `game.ts` around line 420, before `this.view.render()`. The snapshot then reports the whole frame, which is 500–1200 per the table above.

### M6. Depot bench: the board is too far away, so almost every label is unreadable, and one probe button is hidden
Screenshots: `depot-2-bench.jpg`, `depot-3-fail.jpg`

**What's wrong:**
- `view.distance` is **9.6**, where the other stations use 5.6–6.9. The board fills only about 50 % of the width, while yellow and blue carts and a cardboard box take up the foreground.
- These labels render at about 6 px: "THIN RETURN", "HEAVY RETURN", "SOURCE E", "TRUCKS: AN ANALOGY", "TRUCKS · METER", "DISPATCH", and the probe buttons SOURCE/FEED/RETURN/BAY 1/BAY 2.
- The **BAY 3 probe button is hidden behind the green DISPATCH dome**.
- The "THIN FEED" label is covered by the breaker and the rail.
- The tan cardboard box (a knock-about prop) sits in front of the bench's right corner.

**Fix:**
1. In `src/stations/depot/station.ts:69`, use `view={distance:7.2,pitch:.86,lookY:.3}`.
2. Double the label plane sizes in the build code, or use `labelTexture(...,{w:256,h:64})` planes at least 0.28 m wide.
3. Move the probe-button grid 0.25 m left, or the DISPATCH button 0.2 m right and forward, so the BAY 3 button is clear.
4. In `src/levels/depot.ts`, keep knock-about props at least 1.5 m from the bench front, or on the far side.

### M7. Clockwork, Spectrum and Garage bench labels are too small to read at 1440×900
Screenshots: `clockwork-2-bench.jpg`, `spectrum-2-bench.jpg`, `garage-2-bench.jpg`

**What's wrong:**
- **Clockwork:** the module tags "CERAMIC 8 MHz / CRYSTAL 12 MHz / WATCH 32 kHz" on the shelf tray (around x 950–1150) are about 5 px and illegible, but they are the whole decision in this puzzle. "INT RC" and "DIVIDER ÷8000" are about 7 px.
- **Spectrum:** the detector labels (DIPOLE, PATCH, THERMO, NEAR IR, GREEN), the power buttons (1 mW, 10 mW, 100 mW), LAB HATCH, SEND and the band labels are 6–7 px. The **GREEN detector label is covered** by the knob in front of it.
- **Garage:** FUSE, NODE, MOTOR and SWITCH are about 7 px. The fuse itself is a small white knob, yet the toast says "click FUSE".

**Fix:**
- In each `station.ts`, make the tag planes at least 0.3 m wide and 0.09 m tall. On clockwork, put the MHz value on the module's top face in large type, and show the long name only on hover.
- Spectrum detector row: move the labels in front of the knobs (+z 0.08), or stagger them.
- Garage: give the fuse a larger holder with a "RESET" cap, like the arcade's red RESET button (see N3).

### Note (not a defect): the stale-looking Depot bay tags, Garage scope and Spectrum panel
Screenshots: `depot-3c-plain-meter.jpg` vs `verify-depot-meter-after-wait.jpg`

These look stale right after `act()`, but they are correct one frame later. The same one-frame lag was seen on the Garage scope and the Spectrum panel. It is **not a player bug**, so no fix is needed. It is recorded here so nobody chases it. See N8 for the tooling fix.

---

## NICE TO HAVE

### N1. The result card is taller than a 900 px viewport
Screenshots: `*-4-result.jpg`

The card's bottom border and shadow fall below the fold, and the "Jobs" button sits about 15 px from the edge.

**Fix:** in `ui.css` `.result-screen .card`, add `max-height:calc(100vh - 110px)`. Shrink the medal with `clamp(120px,22vh,190px)` on `@media (max-height:920px)`.

### N2. Garage and Arcade: a stale toast stays up after you sit down
Screenshot: `garage-2-bench.jpg` shows "Robot on the stand and wired to the bench. Sit at the bench to diagnose it." while you are already seated.

**Fix:** in each station's `setActive(true)`, clear the toast (`this.say('')`), or skip the "sit at the bench" hint when `game.atBench`.

### N3. The fuse and breaker reset control is different at every station
Screenshots: `arcade-3-fail`, `garage-3-fail`, `depot-3b-short`

- Arcade uses a red "RESET" button on the board.
- Garage uses a tiny white knob labelled "FUSE", and the toast says "click FUSE".
- Depot uses an unlabelled "breaker" that you reset through `act('breaker')`, with the label "BREAKER 4 A" tiny in the corner.

**Fix:** one shared prefab, for example `kit.resetButton(label)` in `src/render/kit.ts`, used by all three stations: a red dome, the label "RESET", and a pulsing ring while tripped. Make the toast wording consistent too ("press RESET").

### N4. Spectrum: the room's beam line and the "B MIRROR" floor decal show through the bench view
Screenshots: `spectrum-2-bench.jpg`, `spectrum-3b-mirror.jpg`

The green or red room beam crosses the top-right of the frame. In `3b` it runs straight over the detector knobs and the SEND button. The giant "B MIRROR" decal sits top-centre. The transmitter mast and its black base cut into the desk's right end.

**Fix:** in `spectrum/station.ts`, while at the desk, either hide the room beam mesh or raise it above the camera's view. Raise `lookY` a little less (0.45) and increase the pitch to 0.95, so the floor decal leaves the frame. Move the mast 0.4 m further from the desk end in `spectrum/room.ts`.

### N5. Arcade room: the confetti carpet is very busy and off-brief
Screenshot: `arcade-1-room.jpg`

The dark plum carpet with dense multicoloured confetti is the noisiest floor in the game. It fights with every prop, and at the bench it shows through as bright shapes around the monitor (`arcade-2-bench.jpg`). It is also far from the "pale wood, cream walls, pastel work areas" brief.

**Fix:** in `src/stations/arcade/room.ts` `confetti()` (line 19), cut the confetti density about 60 % and lighten the base to a dusty mauve (around `#6a5480`). Alternatively, keep the confetti carpet only as a rug under the cabinets and use the shared pale wood floor elsewhere.

### N6. Depot: the red and black probe leads loop across the whole board
Screenshots: `depot-2-bench.jpg`, `depot-3b-short.jpg`

The meter leads arc over the rails and the trucks and are the most visually dominant thing on the table.

**Fix:** in `depot/station.ts`, lower the lead curve's control-point height (to about 0.15 m) and route the leads along the board edge to the probed point.

### N7. The objective card can show completed rows with the yellow "just done" flash
Screenshots: `garage-2-bench.jpg`, `depot-3b-short.jpg`

This only happens in `?manual` mode. The flash is cleared by a real-time `setTimeout` in `src/ui/objectives.ts:97`, but the card only re-renders on `update()`. It is harmless for players. To keep screenshots honest, clear the flash in `update()` by comparing against `game.time` instead of `setTimeout`.

### N8. Tooling: `drive.act()` renders without running a zero-dt update, so panels and screens lag one action behind
Screenshots: `spectrum-3b-mirror.jpg` (the panel says Radio and the hatch is shut, while the toast says "Hatch open"), `garage-3b-scope.jpg`

**Fix:** in `src/game.ts:448`, call `this.station?.update?.(0)`, or `this.step(0)`, before `this.render(1/60)`. Test screenshots then match what players see.

### N9. Performance: the wings average about 900–1200 draw calls for 25–49 props
Draw calls roughly double because of the OutlineEffect.

**Fix:**
- Merge static bench and room dressing per material (`BufferGeometryUtils.mergeGeometries`) in each `room.ts` `dress()`. Anything in `game.decorRoot` qualifies.
- Instance repeated items: tray blocks, confetti carpet bits, rail sleepers and label plates. Put the text labels in one atlas texture per station.
- Priority order: arcade (1181), waterworks (1181–1208), depot (1149) and lunch (1090).

### N10. Clockwork: the right station panel covers the far end of the conveyor
Screenshot: `clockwork-3-fail.jpg`

The belt continues under the panel, so the OUT end, where the finished trays land, is partly hidden.

**Fix:** move the belt's OUT end 0.5 m left, or set `view.lookY` and yaw so the table is centred slightly left (for example, shift the look target by `-0.5` on the table's x in `clockwork/station.ts`).
