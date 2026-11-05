# Fix log: Cable Playground and HQ Lobby (round 2)

Scripts: `mockups/review5/tools/fix-playground-lobby/` (`look.mjs`, `done.mjs`, `drop.mjs`, `probe.mjs`). Shots are `shots-full/fix-playground-lobby-*.png` (not committed).

Note for whoever runs shots here: the dev server's file watcher does not see edits through the `node_modules` junction on this machine, so it serves stale modules. Restart vite after each edit.

## Fixed

| ID | Change | Files | Verified |
|---|---|---|---|
| R5-031 (P1) | A real lamp switch: a cream wall box on the lamp post at 1.05 m facing the room, I/O marks, a job-yellow toggle lever (up = on, down = off, 60 ms snap), and a pilot dot that is green only while current flows. The lamp's own cord is drawn from the socket along the floor and up the post through the switch to the head. `switchAt` moved onto the switch (7.95,-6.4), so the E radius and the step marker centre on it. | `src/levels/decor.ts` (playground), `src/levels/playground.ts`, `src/game.ts` (`pg.update` in render) | `look.mjs pglamp/pgwin`: lever up/down and lamp on/off visible with HUD hidden (`pg-lit-dwell`, `pg-lit-off`). routes spec. |
| R5-067 (P1) | The lamp is driven by the circuit every frame (`lampLit`), not by `win()`. The Playground wins only after the lamp has burned 1.2 s (`litFor`), so switching it off and on again works and is seen. Meeting keeps the instant win. `snapshot().lampLit` added. | `src/game.ts`, `src/levels/decor.ts` | routes spec now: E → +0.5 s lamp lit, not won; E → off, lamp dark, not won; E → +1.3 s won. Script log: `after E +.5 false on true`, `E off false off false`, `E on +1.4 true on`. |
| R5-032 (P1) | Idle hint is now flat job-yellow floor chevrons (toon, no glow, nothing travels along the path). It starts at the plug (Pip only while the Meeting strip still has to be fetched, then it leads to the strip), follows the level's clean lane when one ends at the socket, else detours round pillars and heavy furniture. Shown after 45 s, 12 s at a time, revealed one chevron after another. | `src/game.ts` (`hintRoute`, hint build/render) | `look.mjs pghint` shots. |
| R5-046 (P1) | The reel's own white lead runs to a live outlet on the side wall right beside it (cream plate, green pilot and small glow), so power visibly comes from the wall. The green glow on the practice wall is gone. The how-to poster now starts with the outlet: outlet → reel → cable → plug → socket → lamp. | `src/levels/decor.ts`, `src/levels/playground.ts` (keep-out lane over the lead) | `pg-start`, `pg-reel-close`. |
| R5-152 (P1) | One socket only (the plain game.ts box is hidden when the Playground decor builds its own): housing, cream face plate with two slots toward the route, and a pilot that lights when the plug is in. A seated plug sits at the face with its pins in the slots (`Game.seat()`, also used by the ghost plug), nothing pokes out of the back. The lamp moved 1.18 m from the socket so its base clears the ring even when the ring swells. | `src/levels/decor.ts`, `src/game.ts` (`seat`, socket hidden, ghost position) | `pg-lit-dwell`, `pg-socket-back`; `audit(.02)` = []. |
| R5-125 (P1, partial) | The three yellow perimeter lines (a 30 m U) are gone. One dashed yellow line runs along the clean route (lanes[0]) from the start square to an arrow at the socket. The prompt wording part is shared (below). | `src/levels/decor.ts` | `pg-start`: dashes lead past the pillar to the socket. |
| R5-262 (P2) | `nearSwitch` is false while a loose, unplugged plug is within 1.75 m, so both the pill and E/F offer the plug first. | `src/game.ts` | `drop.mjs`: plug laid by the switch → pill reads the plug prompt, E picks it up, switch untouched. |
| R5-283 (P2) | Spawn moved to (-6,5.4) (START tape and lanes follow), so the plug at (-7.3,4.7) is in plain view beside Pip and still within F reach. | `src/levels/playground.ts` | `pg-start`; objectives spec ('Pick up the plug' at start). |
| R5-362 (P2, partial) | Pallets are side by side (no overlap), each 3 stringers + 5 slats; their boxes moved to match. Cage reels sit on cradles touching the floor and are muted (no red "apple"); the cage gets its fourth side rails, a door post and a hasp. Cooler and plant pots are prefabs (not mine). | `src/levels/decor.ts`, `src/levels/playground.ts` | layout spec; `audit` []. |
| R5-132 (P1) | Side-door blade signs rebuilt: parented to the side wall's upper part (they fold with the cutaway), an arm out of the wall under the cap, two hangers, and back-to-back plates carrying only the number (the name stays on the lintel). No post through the title, nothing floating. | `src/hub/lobby.ts` | `lobby-sidedoor`. |
| R5-133 (P1) | Leaves now swing inward into the corridor (+rotation) and are hidden once open > 0.25, so nothing sweeps through Pip and the portal glimpse shows past him. | `src/hub/lobby.ts` | `door-lunch`, `lobby-sidedoor`: Pip whole at the open door. |
| R5-150 (P1) | Wing lamp is now a sconce beside the lintel below the cap (backplate, arm, shade in wing colour, bulb, glow 0.4 m). Done doors also light warm-white strips down both post fronts (dark strips otherwise), readable in greyscale at the start view. The medal is a 0.44 m plate on a dark backing on the wall beside the door. Returning from a finished job flicks the lamp and strips on with sparks, confetti and a jingle (see R5-235). | `src/hub/lobby.ts` | `done.mjs`: `done4-nohud` shows four lit doors and their A/B/A/C medals; `return-ignite`. |
| R5-162 (P2) | Locked door: E rattles the leaf (decaying ±0.06 rad), flashes the padlock red, knocks and Pip shrugs. LOCKED band moved above the colour panel; a real padlock (body, shackle, keyhole) clear of the knob; diagonal hazard tape; frame greyed toward #8a8fa6. | `src/hub/lobby.ts` | `door-rush-rattle`. |
| R5-175 (P2, partial) | Workshop radius 1.2 m (was 1.6) and the beanbag moved to (10.8,6.6), so nearby props are grabbable. Hiding the reticle while a hub prompt is up is game.ts (below). | `src/hub/lobby.ts`, `src/levels/lobby.ts` | lobby spec (Workshop prompt at the arch). |
| R5-235 (P2) | Entering a door: input held, a full-screen veil fades in the wing colour then to near-black over ~0.4 s, then the job loads. The door id is kept in sessionStorage; coming back to the lobby spawns Pip at that door, and a done job plays the ignition beat. | `src/hub/lobby.ts` | lobby spec (E at door still navigates); `done.mjs` player spawned at (-12.4,-8.9) = Playground door. |
| R5-241 (rest) | Door slots: seven on the back wall (3.3 m pitch from x -12.4), two on the left wall near the corner. With the lead's yaw 0.4 all nine doors are in the start frame and none is under the job card. Bolt poster moved to the side wall. | `src/hub/lobby.ts` | `lobby-start`. |
| R5-294 (P2) | Atrium benches moved to x ±4.6 (clear of the arch); loose blocks gone; subtitle plate lowered to y 2.24 / z .235 (no seam with the main plate); posts get darker trim feet and bolt heads; a practice bench with pegboard, tools, a vice, a mini reel and parts stands beside the arch (with a collider), so the arch stays a clear walk-through. Coworker moved to (5.6,1.0). | `src/hub/lobby.ts`, `src/levels/lobby.ts` | `workshop` shot; layout spec. |
| R5-300 (P2) | Directory board: column-major (00…03R left, 04…07 right), plates 1.45 × 0.25 m at 0.27 m pitch (no overlap), staggered z, w512/h88 textures, a wood frame, two stand posts to the floor and a collider. Top stays at 2.8 m (old top 2.85). | `src/hub/lobby.ts` | `board` shot. |
| R5-328 (P2) | Portal side walls: dark skirting, a row of wall-lamp dots, stronger darkening with depth, and 25% of the destination's average colour near the far end; corridor depth 2.0. | `src/render/portal.ts`, `src/hub/lobby.ts` | `lobby-sidedoor` oblique view. |

## Skipped

- R5-068 (P1): the sim is already order-free (switch and plug are two series breaks). The false wording lives in `src/ui/objectives.ts` (lead's file). See shared changes.
- R5-208 (P2): card step merge is in `src/ui/objectives.ts`. See shared changes.
- R5-047 (P1): pulses live in `src/render/actors.ts` (shared with Lunch) and the `pulses.update` call in game.ts `drawCable` is shared cable code.
- R5-284, R5-361 (P2): cable tint and radius are the shared hose code in game.ts `drawCable`.
- R5-307 (P2): floor collider in `Game.buildRoom`, shared by every level.
- R5-360 (P2): the anchor reel is built in game.ts for every cable level (Meeting too).
- R5-273 (P2): pause card is `src/ui/screens.ts`/`game-ui.ts`/CSS.
- R5-274 (P2): the card text is objectives code. I tried a verb in the lobby step text ('Walk through door 00 · …'), but it wraps the card to two lines and puts it back over the left-wall doors, so I reverted it.

## Needs shared change

1. `src/ui/objectives.ts:81` (R5-068): `return {key:'E',text:g.switchedOn?'Flip the switch off':'Flip the switch on'};` regardless of `g.connected`. Update `tests/objectives.spec.ts` to expect 'Flip the switch on' (it now expects 'Switch it on').
2. `src/ui/objectives.ts:24-26` (R5-208): merge steps 2 and 3 into one 'Light the lamp' step (`done:g=>g.won||g.lampLit`, `at:g=>g.level.target`), and show the switch prompt only within 1.5 m of `switchAt` (the switch is now a visible object).
3. `src/ui/objectives.ts:79` (R5-125): when `g.rope.strain>1` and `distance(g.plugPosition,g.level.target)>2`, return `{key:'Q',text:'Let go'}` (no 'slingshot'); keep the slingshot wording only when a prop lies within 1.1 m of the rope.
4. `src/render/actors.ts` Pulses + `src/game.ts` drawCable (R5-047): two trains (one reversed) riding the hose surface (`p + up*.075 ± binormal*.05`, slug radius .038), count `ceil(length/1.2)`, ink outline; Lunch passes amps for speed/density.
5. `src/game.ts` drawCable (R5-284/361): connected tint not in STRAIN/strainColor (e.g. keep the relaxed white and add a teal stripe), hose radius .07–.075 with a darker slack tone.
6. `src/game.ts:125` (R5-307): floor collider `solid(this,l.width,.35,l.depth,0,-.175,0)` and avatar offset `p.y-.795`.
7. `src/game.ts:96-97` (R5-360): turn the anchor reel 90° so its side faces the camera, axle at y .44, A-frame legs, crank, cable guide.
8. `src/game.ts` render reticle (R5-175): `this.reticle.visible=...&&!this.hub?.prompt()`.
9. `src/ui/objectives.ts:118` (R5-283): marker height `max(2.1, pip.y+.6+.6)` when the target is within 1 m of Pip.
10. `src/render/labels.ts` (R5-300): a fixed `size` option for `labelTexture`, so every directory row has the same cap height.
11. `src/ui/screens.ts` / CSS (R5-273): keep short all-caps words in `title()` ('HQ'); hide the pause stats and Jobs button under `body[data-hub]`.

## Open questions

- R5-031 verifier offered "refuse the toggle before power". I kept the switch working in either order (truthful, and R5-068 asks for that), with the lever showing its state, so pre-switching is readable.
- The Playground card still shows "Done!" after the switch is turned back off during the 1.2 s dwell (objectives step `done` is `connected&&switchedOn`, but the card may latch). Worth a look with item 2.

## Test results

- `npm test`: 124 passed. `npm run build`: ok.
- Browser specs (routes, objectives, lobby, smoke, layout): 24/25 passed in the full run; the Meeting smoke test ('office contains over 300 props') hit the 60 s timeout under load, and passed on a rerun of smoke.spec alone (4/4).
- `drop.mjs`: pill 'F Pick up the plug', E picks it up, switch stays off. `look.mjs pghint` at 48 s: chevrons from the plug along the lane, no beads.

