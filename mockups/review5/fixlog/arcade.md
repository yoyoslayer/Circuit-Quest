# Review 5 fix log: Overheating Arcade + Arcade Rush (batch R-arcade)

Files: `src/stations/arcade/{station,logic,logic.test,room}.ts`, `tests/station-arcade.spec.ts`,
`tests/station-arcade-rush.spec.ts`, checks script `mockups/review5/tools/fix-arcade/checks.mjs`
(shots `fix-arcade-*` in `shots-full/`, not committed).

Note: the worktree started on `origin/main`. It was reset to the lead branch
`claude/nifty-knuth-519jg0` (70728fb) before any work, because the review's line numbers, R5-006 and the
rush spec only exist there.

## Fixed

| ID | Pri | What changed | Verified |
|---|---|---|---|
| R5-010 | P1 | Lifting the last block out of a live chain powers the bench off first (lever clacks back, no trip). Any board edit hides the old toast (`edited()`), so a message never outlives its arrangement. (station.ts) | checks `story`: lift live → powered false, trips 0, toast null. Spec 2 asserts trips 0 / tripped false after the live swap. |
| R5-027 | P1 | `touched` flag per cabinet (set by slot/flip, cleared in showJob). While untouched, `fault()`, `popBlock()`, `popLed()` count no mistake, trip or spend; sparks, TILT and toast still play, prefixed "As found:". Prompt says "P Power on to see the fault" for an untouched cabinet with blocks in the chain. (station.ts) | Spec 1: pinball as found → trips 0, mistakes 0, toast "As found"; claw as-found scorch/fail is free; final trips 0, mistakes 0. Rush spec: power each start, mistakes/trips stay 0. Spec 2 still counts a built 100 Ω fault (mistakes 1). |
| R5-028 | P1 | Option (b): a block the player placed and later took out again is ½ credit of scrap (inspecting bins is free; removing a cabinet's own start block is free). Running spend shows on the Parts row. ★ zone on the meter only shows once this cabinet has passed a play test. Story cost limit = best() costs × 1.5. (station.ts) | Spec 2: swapping two 100 Ω for one 220 Ω → spent 1 before sign-off, 2 after. checks `story`: 470→220 sweep adds 0.5. |
| R5-034 | P1 | `popWhy()`: "62.5 mA is 3.1× the LED's 20 mA rating: that far over, it burns out at once. A spare goes in." The over-rating note now carries the ratio ("1.5× … runs hot and dies early"). (logic.ts, station.ts) | logic.test "an LED over its rating…"; checks `led` toast after pop. |
| R5-036 | P1 | LED keeps its hue (no white lerp); dome multiplier capped at 1.15; overdrive = bigger flickering halo (`.4+min(3,level)*.6`); board light capped at intensity 2, distance 0.8. LED has its own `HOUSE.ledTau=.25` and pops from `heat.led > ledPop`. Unlit dome tint 0.25 toward white. LED HEAT → "LED LOAD" bar 0–3×, dashed line at rated, red burn-out zone from 2.5×, text "2.1× rated" (also covers R5-195 option a). Claw story rewritten; header notes LED colour is fixed. | Shots fix-arcade-11/12 (hue holds, bar races into red before pop), logic.test ledTau / claw < ledPop. |
| R5-051 | P1 | Rush stories derived from the start reading (`storyFor`). 'hot' start searched over singles and two-block runs for !tripped, 1 < level < 0.9·ledPop, block heat 0.6–1.0; skipped if none. (logic.ts) | logic.test: 500 jobs, story === storyFor, "Glaring" ⇒ 1<level<2.5 and not tripped, "fuse" ⇔ tripped. |
| R5-052 | P1 | Base gets `betaMin:40`; story; band 5–15 mA; base ★ zone = middle third (8.3–11.7 mA) with drive-margin notes; under-band note says a weak part would be half on. Meter MOTOR: "FULL" only when β40 saturates, amber "FULL (typical part)" with a juddering wheel in between. best(hopper) = one 470 Ω (9.13 mA). | logic.test hopper case; spec 1 hopper 470 → 9.13 mA tier 3; shot fix-arcade-05 (amber, PLAYS · LOW DRIVE). |
| R5-053 | P1 | Hopper board draws two loops: thin base loop and thick (30 px) 12 V motor loop: 12 V post → motor (moved onto the board) → C → E → ground, with a "C" leg label and "MOTOR" legend; ACROSS slot hidden. Moving dashes (`Flow`) run on the live loop(s), speed ∝ current: slow base loop, fast motor loop. Main loop dashes also show on LED jobs. | Shot fix-arcade-21. |
| R5-117 | P1 | Partial (my files): three trip pips beside the fuse turn red per counted trip. HUD tally part needs a shared change (below). | Shot fix-arcade-01 (pips). |
| R5-163 | P2 | Hover on a hidden part is dropped in showJob/redraw (`unhover`); across-slot hint suppressed on the hopper. | Code; checks run. |
| R5-184 | P2 | Partial, option (b) (keeps R5-006): fuse described as a self-resetting thermal breaker; amber tint, halo ≤ 0.28, no red. | Shot fix-arcade-01. |
| R5-188 | P2 | 'dim' rush start must be under half the band's bottom; story "Dimmer than the other cabinets." | logic.test (dim ⇒ iLoad < band[0]/2). |
| R5-189 | P2 | 'backwards' rush fault only on supplies ≤ 5 V. | logic.test. |
| R5-191 | P2 | Overloaded logic pin: its terminal glows orange and smokes (motor keeps running: truthful, base current is still large). | Shot fix-arcade-22. |
| R5-193 | P2 | `HOUSE.blockPop=2.5`: pop at once only above 2.5×; above 1× a block scorches (wisp of smoke, orange/red) and fails after `scorchFail=8` s. Claw as found now glares and scorches, then fails (free). BLOCK HEAT bar 0–2.5× with red zone above 1×. Sustained heat smoke is a small local wisp instead of big puffs. | logic.test thermal case; spec 1 claw step; shots fix-arcade-03/04. |
| R5-222 | P2 | Rush sign-off charges only waste over the cheapest chain reaching the same tier (`minCost(job,tier)`). | logic.test (best() wastes 0); rush spec spent 0 after two elegant cabinets. |
| R5-223 | P2 | Rush overtime: a cabinet mid play-test at 3:00 finishes (current()/complete() hold for up to RUSH_SOAK) and signs itself off. Red HUD clock needs shared change. | checks `rush`: at 180 s not won, soak 1.4; at 180.6 s served +1, won. |
| R5-254 | P2 | Partial: panel header drops the seconds ("RUSH · 7 fixed · CLAW"). Ring fix is shared. | Shot fix-arcade-30. |
| R5-256 | P2 | Tier-1 pass: amber strip "PLAYS · DIM / LOW DRIVE / OVER BAND / HOT BLOCK", kid shrugs. Step text "Pinball bumper — Red LED on 5 V · 12–20 mA". Story panel no longer repeats the ask (rush keeps it). | Shots fix-arcade-01/05. |
| R5-296 | P2 | LED BASICS poster moved to x 3.05, clear of the prize shelf. | Shot fix-arcade-41. |
| R5-319 | P2 | Handheld raised onto a plum display stand (foot on the deck + back strut). | Shot fix-arcade-42 (small at that distance; not zoom-checked). |
| R5-320 | P2 | `light(k)` only once per cabinet; story lights its own cabinet; rush lights one back-wall cabinet per two fixed, retitled with the rush cabinet. | Code. |
| R5-340 | P2 | Ribbon runs from the cabinet back, behind the bins, to an ink connector at the board's SUPPLY edge. | Shot fix-arcade-40. |
| R5-373 | P2 | 3 room point lights (+ bench LED = 4): lilac and storeroom lamps became light pools; lightUp raises the pink light instead of adding one; win glow 6.5 m, opacity .22. | checks `room`: 4 PointLights. |

## Skipped

| ID | Why |
|---|---|
| R5-117 (HUD part) | Needs shared change: `src/ui/game-ui.ts:166` should show `g.damage+(g.won?0:station.score().mistakes)` and the same for cost. |
| R5-223 (red clock / tick) | Needs shared change in `game-ui.ts` (rush clock urgency under 30 s). |
| R5-254 (ring) | Needs shared change in `game-ui.ts` (ring = rush.left/RUSH_TIME). |
| R5-255 | Shared: `src/ui/screens.ts` / `game-ui.ts` result card. |
| R5-347 | Needs a new `stool` PropKind in shared `src/props/prefabs.ts`. |
| R5-184 (latching PTC, option a) | Conflicts with the lead's R5-006 (P while tripped keeps power on). Took option (b). |
| R5-187 | Design question: making P = I²R decide ≥25 % of rush jobs needs a rethink of the rush generator/bands. |
| R5-190, R5-192 | Design questions: moving the rhythm pad / re-splitting the job ladder changes the story progression and the ★ bonus; needs owner sign-off. |
| R5-194 | Design question: a 30 mA abs-max tier changes what "over rating" means across all jobs and the LED LOAD scale. |
| R5-195 | Done via R5-036 (option a). |
| R5-295, R5-345, R5-346 | Modelling-only P2s (claw machine, pinball, change machine / prize shelf rebuilds); not quick. |

## Open questions

- R5-028: the ★ zone is now hidden until a cabinet's first pass. Is that too stingy for first-time players? (Lead reviewer's fix; easy to revert in `drawMeter`.)
- R5-027: an as-found cabinet that pops a part is also free. Re-powering the untouched cabinet stays free (it is still "as found").
- The 403 console message in capture/spec runs is the Fredoka font served from the shared `node_modules` junction, outside Vite's fs allow list (worktree setup only, not a game bug).

## Test results

- `npm test`: 98/98 pass. `npm run build`: OK.
- `tests/station-arcade.spec.ts` + `tests/station-arcade-rush.spec.ts`: 3/3 pass (5.2 min).
