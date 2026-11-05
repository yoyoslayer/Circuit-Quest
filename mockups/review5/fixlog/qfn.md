# Fix log: QFN bench / Fabrication Bay (`qfn`, batch R-qfn)

Branch: `worktree-agent-ac3d1c907ed45e235`, rebased onto `claude/nifty-knuth-519jg0` (the worktree was
cut from `main`, which doesn't have the review 5 work).

Verification used throughout: `npm test` (vitest, includes `src/stations/qfn/logic.test.ts`),
`npm run build` (tsc + vite), `tests/station-qfn.spec.ts` (4 specs, swiftshader, PW_PORT=4193), and
the capture script `mockups/review5/tools/fix-qfn/shots.mjs` (shots `fix-qfn-*`, in `shots-full/`,
not committed).

## Fixed

| ID | Pri | What changed | Files | Verified |
|---|---|---|---|---|
| R5-023 | P1 | Verifier version: two-pin parts now have a tall body grip (0.12 × 0.075) and low flat end caps (0.018 tall at ±0.09) that read as pads. Press and hold (≥0.3 s without leaving the cell) anywhere on a movable part's pad turns the press into a move instead of a track. | station.ts | Spec 4: press on R1's far pad (hover reports no body), hold 450 ms, drag: R1 moves to (1,6) and `design.traces` stays empty. Shot fix-qfn-01 shows the new parts. |
| R5-070 | P1 | Note now gives the real cause: "A longer loop has more inductance: when the chip suddenly draws current, the voltage at its pins sags before the cap's current can ramp up." Pulses are spread evenly round the whole loop and all lit at once, at one linear speed on every loop (a long loop just holds more, smaller pulses, r 0.014). Pulses only exist when every pad of the supply nets (VDD/VIN and GND, J1 included) is joined, the verifier's gate. A status LED on U1 shows the consequence during CHECK: steady green when every loop is short, a stutter while the chip body blinks (resets) when a loop is too long. Panel row reads "C1 loop (shorter = less sag)". | logic.ts, station.ts, logic.test.ts | Unit test: far-cap note matches /inductance/, not /travel\|in time/. Shots fix-qfn-07/-08 (board 2, far C2, +0.3 s/+1.0 s). |
| R5-071 | P1 | SHIP on a board that works now runs a 2.2 s bring-up test on the bench before it leaves: the board stays powered, the pulses run, the LED shows the result (stutter + chip reset blink for a long loop, slow blink when too hot, steady when fine), and the too-long loop pulses fast. The toast names the flaw ("Works, but the MCU resets when it gets busy: C2's loop to its pins is too long." / "...runs at 109 °C and throttles itself to cool down.") followed by the board's teach line. Only tier ≥ 2 gets the cheer and confetti; tier 1 gets a flat two-note chime. Still never a fail: shipped, no mistake. Input is locked during the test. | station.ts, station-qfn.spec.ts | Spec 3 ships board 2 with C2 in the far corner: toast "resets when it gets busy", `testing` true, mistakes 0, tiers [3,1] after 2.5 s. Shots fix-qfn-09/-10. Spec 1 still wins with three tier-3 boards. |
| R5-072 | P1 | Pin order is now a real decision. Board 1's J1 arrives as the mirrored header (`Place.flip`: the same header with its pins in reverse order); the right one sits in a tray left of the board, and clicking it swaps them (`swap` act, undoable). The copper outside the chip is a ring, so a mirrored pinout can never route on one layer: `pinOrderOk()` compares the cyclic order of the chip pins and the header pins round the chip, and `check()` reports it as a problem once J1 is on an edge mouth-out. After a track hits a short with the wrong header (or a CHECK), the prompt says "Try the spare header". Teach line rewritten to what the board teaches. Decoupling moved off board 1 (board 2 introduces it), so board 1 is one new idea: pin order on one layer. | logic.ts, station.ts, logic.test.ts, station-qfn.spec.ts | Unit test: the correct header passes `pinOrderOk` on 7 edge placements, the mirrored one fails all; mirrored reference reports the problem. Spec 3: mirrored J1 on an edge → CHECK toast names the spare; swap, undo, swap. Shots fix-qfn-01..-03. |
| R5-127 | P1 | prompt() order: dragging → "Drop it on the board"; a connector off the edge or mouth in → "Move J1 to an edge, mouth out"; wrong header after a short → "Try the spare header"; parts never moved on a fresh board → "Slide the parts into place"; then "Draw from a pad", "Cool the chip" (V) when powered and over the limit, Check, Ship. | station.ts | Shot fix-qfn-01 (board 1 start prompt). |
| R5-128 | P1 | Loops are drawn as two ink-outlined, normally blended strips beside the copper (±0.045 from the track centre, so the track colour shows between them): solid #2fbf71 when short, dashed #ff7a1a pulsing at 2 Hz (5 Hz during a test) when too long. Panel: failing reliability rows (loop, chip temperature, connector) use `li.bad` (red); the par row is green whenever the board works and cost ≤ par, independent of tier 3 (neutral while the board doesn't work yet). Too-long loops also get orange rings on their chip pins on CHECK. | station.ts | Shots fix-qfn-07/-08: C2's 12-cell loop reads orange and dashed, C1's 4-cell loop green and solid, the C2 row red, and orange rings on U1's right-hand VDD/GND pins. |
| R5-160 | P1 | Partial, within my files: the level's clutter no longer uses the office recipes (pod, shelf, cabinets): recipes are crates, carts and parts (reels). The room dressing adds fab kit: two ESD workbenches (green mat, soldering station and iron holder, fume extractor arm, magnifier lamp, a board), two SMT reel towers, two small-parts drawer cabinets and a yellow/black hazard tape line where the machine bay starts. All with colliders, so clutter keeps clear of them. New fab clutter *prefabs* (totes, panel carts as physics props) need shared files; see below. | levels/qfn.ts, room.ts | Shot fix-qfn-15 (survey). |
| R5-182 | P2 | The level chair moved from (−3.4, 1.6) to (−3.4, 2.8), about 1.65 m from the lane centreline (lane r 1.05 + chair reach 0.44). | levels/qfn.ts | Specs walk the same route. |
| R5-186 | P2 | Verifier version: the chip is powered once U1.1/U1.2 and J1's VIN/GND pins are on one piece of copper (`thermal.power` pairs). Unpowered, `thermal.temp` is ambient and `powered:false`; the panel reads "Chip — (no power)"; the body tint ramps up over ~1.5 s once powered. | logic.ts, station.ts, logic.test.ts | Unit test: blank driver board → {vias:0,temp:25,powered:false}. Spec 3 checks board 3 starts cold. Shots fix-qfn-11..-13. |
| R5-211 | P2 | Panel row is "L1 · top" / "L2 · bottom". | station.ts | Read in code. |
| R5-213 | P2 | HEAT = {power 1.6, ambient 25, board 110, via 300, limit 100, max 125}. 3 vias → 109 °C (over), 4 vias → 96 °C; `viasNeeded()` stays 4 and the reference is unchanged. Note: "must stay at or under 100 °C for a long life (its absolute max is 125 °C)". | logic.ts, logic.test.ts | Unit tests updated ({vias:3,temp:109,limit:100,powered:true}). |
| R5-214 | P2 | Tier 3 renamed "Elegant"; par note: "Shorter tracks have less resistance and pick up less noise, and every via is another hole to drill." | logic.ts, station.ts | Spec 1 still finds "Elegant" in the CHECK toast. |
| R5-289 | P2 | Done together with the bring-up test (as the verifier asked). Board 2 ask: "This MCU resets whenever its supply sags. Wire it so it stays up." Board 3 ask: "Power passes through to J2, whose pins are flipped. Route it, and keep the LED driver under its temperature." Job card: "keep the MCU from resetting", "cross VIN and GND, keep it cool". The "SHORT LOOP / cap beside the pins" poster is now a picture only: a small loop with a happy chip, a big loop with a sad one. | logic.ts, station.ts, room.ts | Read in code; poster visible in fix-qfn-15 if in frame. |
| R5-290 | P2 | Notes name pins as the bench shows them: "C2's loop to U1's right-hand VDD/GND pins is 6 cells". | logic.ts, logic.test.ts | Unit test matches "U1's left-hand VDD/GND pins". |
| R5-288 | P2 | Partial: heat sprite size 0.9 → 0.7 (verifier cap), raised to y 0.3, opacity ≤ 0.45. | station.ts | Shot fix-qfn-13. |
| R5-309 | P2 | AOI monitor raised to y 2.2 on an arm and base plate; pick-and-place hood is rbox(2.9,1.0,1.6) from the machine top (1.0) to 2.0 with ink corner posts, so the gantry no longer pokes through; the feeder reels sit in a new feeder bank with slot dividers at the front (z 1.0); stock-shelf reels rest on the shelf (y .59). Pendant unchanged (verifier). | room.ts | Shot fix-qfn-15. |
| R5-318 | P2 | Title plate and legend moved to h/2 + 0.24, past the reach of a connector shroud on the board's near edge. | station.ts | Shots fix-qfn-04/-05 (J1 at the reference spot on the bottom edge). |
| R5-331 | P2 | Crane beam is one striped sleeve (hazard stripes on all four faces, one draw call instead of 13), with end caps over the legs and a trolley rail under it. | room.ts | Shot fix-qfn-15. |
| R5-332 | P2 | No ratsnest (or legend) before the crate arrives; while a part is dragged the ratsnest is computed for where it would land. | station.ts | Read in code; fix-qfn-06. |
| R5-333 | P2 | New-board parts drop from ~0.22 m instead of 0.6–0.9 m. The ship toast now describes the board on the bench during its bring-up test (the board leaves after the test). | station.ts | Shots fix-qfn-05, -09. |
| R5-365 | P2 | Partial: the locked connectors' end caps use a periwinkle base with ink diagonals (not job yellow); the QFN pin tags fade to 0.45 with the body in the layer-2 x-ray. Lead tabs not added. | station.ts | Shot fix-qfn-14. |
| R5-367 | P2 | Board rack is an open frame facing the room (side, back and top panels, plinth), with seven boards on ink rails showing their front edges and label tabs. | room.ts | Shot fix-qfn-15. |

## Skipped

| ID | Pri | Why |
|---|---|---|
| R5-160 (rest) | P1 | New physics prefabs (`reelrack`, `tote`, ESD bench, drawers, panel cart as knock-about props) and new clutter recipes live in `src/props/prefabs.ts` and `src/levels/clutter.ts`: **needs shared change**. The room-side fab kit above is static dressing with colliders. |
| R5-209 | P2 | Layer-2 pour under the EP and counting only vias that reach layer-2 GND copper: a modelling change to occupancy, connectivity and spacing, plus retuning and a new reference. Not quick; worth doing as its own task. |
| R5-210 | P2 | Making the MCU's EP a GND pad needs a re-par of board 2 and a new reference route; design question whether board 2 should get the EP shortcut. Not quick. |
| R5-212 | P2 | Making board 3 drive a real LED (J2 as LED out, pin renames) changes the board's nets and reference: not quick. |
| R5-287 | P2 | Mostly covered by R5-070/R5-128 (ink-edged loop outline, r 0.014 pulses, gated on power). Not done: the plug icon on J1. |
| R5-288 (rest) | P2 | EP cell grid while VIA is armed, and via pips on the body top: not done. |
| R5-363 | P2 | Full machine rebuilds (segmented reflow tunnel, stack lights, HMI, AOI camera gantry): large modelling task. |
| R5-364 | P2 | Open-front stock bins with contents: modelling, not quick. |
| R5-365 (rest) | P2 | QFN lead tabs. |
| R5-366 | P2 | Tote prefab and id-aware names: `src/props/prefabs.ts` and `objectives.ts`: **needs shared change**. |

## Needs shared change

- R5-160: fab clutter prefabs and recipes in `src/props/prefabs.ts` / `src/levels/clutter.ts`
  (`reeltower`, `esdbench`, `totes`, `drawers`, `panelcart`). Once they exist, `src/levels/qfn.ts`
  recipes can list them.
- R5-366: `tote` prefab, and a name for `spec.id==='parts'` ("parts crate") in the objectives code.
- R5-182 (test half): a unit test that every hand-placed level prop clears its lanes would go next to
  `src/levels/clutter.ts`.

## Notes

- Capture: the dev server binds `localhost` (IPv6) here, so `BASE=http://localhost:4193` works and `127.0.0.1` refuses. The one console error in captures is a 403 for the Fredoka font, because `node_modules` is a junction outside Vite's allow list (setup artefact, not a game bug).

## Open questions

- Board 1 now opens with the mirrored header on the board. The wrong pinout is visible (pin labels on
  the header, the spare beside it), the CHECK toast names the spare, and the prompt points at it after
  the first refused short. Is starting with the wrong part right for the first board, or should the
  correct one be placed and the mirrored one be the spare (fewer players would then meet the lesson)?
- Bring-up test length is 2.2 s per shipped board (BRING_UP in station.ts).
- `R5-209` is the remaining truthfulness gap on board 3: vias still count without layer-2 copper.
