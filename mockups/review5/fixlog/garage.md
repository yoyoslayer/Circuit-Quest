# Robot Garage fix log (review 5, batch R-garage)

Branch base: `claude/nifty-knuth-519jg0` @ 70728fb (the worktree started on an older line; it was reset to the lead branch before any edits, because the review's line numbers are against it).

Files: `src/stations/garage/logic.ts`, `logic.test.ts`, `station.ts`, `room.ts`, `tests/station-garage.spec.ts`, `mockups/review5/tools/fix-garage/shots.mjs`.

## Fixed

| ID | Pri | What changed | Files | Verified by |
|---|---|---|---|---|
| R5-037 | P1 | **Free placement.** Diode, clamp, TVS and snubber fit both protection sockets (cap stays at the controller). The shutdown solver models any diode-like part in either place from its vf/vbr and on-resistance (band at node / band at far end), and the snubber in either place. Truth checks per the verifier: TVS across the motor = plain diode (stop line 'slow') or, flipped, a dead short; diode across the switch = no path ('stop'); flipped = 'stuck'; flipped clamp across the switch = a real fix at ≈25 V. Every legal socket glows; the prompt names every legal key ('A/S Fit it · F turns it'). **Tray shuffled** per run (keys 1–5 follow the tray). **Board cleared between jobs**, so job 3 must re-fit a path *and* re-route the ground. **Bench-time fee**: a PULSE that tries a new placement costs 0.1 past the first two per job; a flip + re-PULSE is free. Job-3/tier-0 prompt is neutral: '1–5 · G Change the setup'. | logic.ts, station.ts, logic.test.ts, spec | New unit tests ("where the part goes is a real choice": 5 cases); solver count 306 setups; spec routes rebuilt for the board clear; shot fix-garage-04 (both sockets glow, prompt 'A/S') |
| R5-054 | P1 | **Polarity is no longer pre-solved.** Each job the tray lays every polar part either way round (random); a part is fitted the way it lies, F turns the part in hand (or the last fitted one), taking a part out keeps its orientation. Each socket end carries a mark (red + for +12 V, yellow dot for the node, grey ground glyph, red + for 5 V) to read the band against. Bands are 1.5× wider, pure white. Panel names the orientation physically ('band → +12 V', 'band → node', '+ → 5 V'). The flip button no longer turns orange when flipped (it gave the answer away). | station.ts, logic.ts (`orientation`, `SOCKET_ENDS`), tests | Unit test 'the panel names the orientation physically'; spec helper `fit()` reads `trayFlip` and turns the part when needed; shots 03–05 |
| R5-055 | P1 | **Job 2 re-skinned truthfully as the parking-brake coil** (verifier option: L 40 mH, R 24 Ω, 0.5 A, no back-EMF). The brake coil replaces the motor on the board for that job (a copper bobbin, sign 'BRAKE COIL', section 'ACROSS COIL'); ask: the spring brake grabs once the coil's current dies, within 2 ms. Diode 3.17 ms (fails), clamp 0.58 ms, TVS 0.66 ms (pass with margin, ratio 5.5×). Scope window widens to 4 ms and the current axis scales to the coil; 'brake grabs ≤ 2 ms'. Job 3 no longer carries the motor 'stop line' spec. | logic.ts, station.ts, tests | Unit tests 'the brake coil (job 2)': closed form; diode offTime > spec > 1.25 × clamp; clamp, TVS < 0.8 × spec; ratio ≥ 3 |
| R5-056 | P1 | TEST no longer plays the reset animation for any tier-0 verdict: only a real shutdown reset ('stop', via land) or start brown-out ('start', on motor-on) reboots the controller. 'Slow' has its own cue: in job 2 the wheels keep turning until the brake coil's current dies (they coast while the beads fade) and the brake coil glows amber while it holds the brake off. | station.ts | Spec: after a failing slow TEST, `resetFlash` stays 0; shots 10–11 |
| R5-057 | P1 | Beads use one speed constant (∝ current, continuous at turn-off). The loop comes from the solver: `shutdown()` now returns which path carried most of the coil's charge (`path: fly / switch / none`), so a diode + backwards TVS shows the switch loop. 'Stuck' keeps the motor running (wheels, beads at running speed, a buzz) until the setup changes, in PULSE and in TEST. | logic.ts, station.ts, tests | Unit test (diode + flipped TVS → path 'switch'); spec: stuck → `stuck` true, `motorOn` 1, cleared after taking the part out; shot 16 |
| R5-058 | P1 | Job 3's long shared ground is drawn: the motor's return becomes a long meander on the board (and the beads follow it). The shared copper warms copper→red with the start surge in proportion to I·R (shared only). The controller's own return current is shown as small green beads on whichever ground it uses (shared wire or the star wire). Star wire is thick, raised, high-contrast blue and runs clear of the GROUND label. The lever is bigger with a yellow knob; the GROUND sign is clickable too. | station.ts | Shots 13–15 |
| R5-111 | P1 | Scope fuse text is cause-only: 'Short across the battery' / 'The fuse resets itself as it cools' (constants in logic `SCOPE_TEXT`, covered by the never-give-the-fix test). While cooling the prompt has no key ('Fuse cooling'). The panel's cooling row counts down (cache key includes the countdown). | logic.ts, station.ts, tests | Unit test regex now includes the scope strings and 'reset the FUSE' / 'backwards part'; spec: no `kbd` in the prompt while cooling, panel text changes over 0.6 s |
| R5-197 | P2 | Motor spin-up 80 ms (was 4 ms); START view spans 0 → 300 ms; the cap message says the surge lasts as long as the motor takes to spin up. Job 3 stays star-ground-only (the cap barely dents it). | logic.ts, station.ts, tests | Unit test: cap > 0.9 × bare sag, still > reset |
| R5-233 | P2 | While the robot drives: a status prompt 'Follow the robot to the dock' (no fall-through to junk props). Standing in its lane: a honk, Pip sees stars, coworkers in range look up (`game.alarm`). | station.ts | Spec checks the 'Follow the robot' prompt |
| R5-234 | P2 | A short or a vented cap at PULSE costs 0.3 bench credit, not a mistake; bonus 3 is now 'No failed test'. `limits.time` 420 → 240 s (estimate, see open questions). | station.ts | Spec: backwards diode PULSE → mistakes 0, spent 0.3 |
| R5-244 | P2 | The job robot's antenna blinks red until it is on the stand; the parked decor robots are green and purple, eyes off (asleep), with full charge meters. Near the robot the prompt reads 'E Pick up the delivery robot'; once it is on the stand it says 'The robot is wired to the test stand' instead of 'Grab the cart'. | station.ts, room.ts | Spec `setUp` checks the prompt contains 'robot'; shot 01 |
| R5-267 | P2 | At the bench before the robot is on the stand the prompt is the status 'Bring the robot to the test stand first' (no E). Step 2 only ticks once the robot is on the stand. At the bench with no robot: 'Fetch the robot first' (no key). | station.ts | shots log `prompt at bench, no robot` |
| R5-268 | P2 | Cycle lamps moved to the pod's front lip, in front of the buttons: radius .035, spacing .09, each in an ink bezel. | station.ts | Shot 09 |
| R5-269 | P2 | Failing graded rows use class `bad` (red, already styled in ui.css); stale rows stay neutral `no`. | station.ts | Spec: `.station-panel li.bad` contains 'Stop spike' after an empty PULSE |
| R5-270 | P2 | Tier-0 prompt '1–5 · G  Change the setup'; the lever wiggles after a 'start' capture; lever ×1.6 with a yellow knob; GROUND sign is a hover/click target. | station.ts | Shot 14 |
| R5-271 | P2 | Job 3 (`startScope`) keeps the scope on START once the stop is clean, so the fix's proof shows where the failure was. PULSE captions are cause-only (numbers live on the scope/panel). `ms()` / `msText()` both print two decimals. | logic.ts, station.ts | Spec: scope stays 'start' after the star-ground PULSE |
| R5-298 | P2 | Rolling road: one long knurled drum per axle in a dark slot (was four 20 cm stubs). Harness re-routed: from the board's battery end, over the bench's back lip, along the floor and up into a service port on the job robot's flank (≥ .36 m from any wheel centre), shown only while the robot is on the stand. | room.ts, station.ts | Shot 02 |
| R5-299 | P2 | Parcel shelves have four posts and back rails and stand against the wall. | room.ts | Shot 18 |
| R5-353 | P2 | Wall chargers: dark unit, cream face, bolt glyph, 4-segment charge meter (empty at the job robot's bay), ink cable to a plug on the pad. | room.ts | Shot 01 |

## Skipped

| ID | Why |
|---|---|
| R5-037 (part) | **Job 4 'road test' not added.** With the board cleared between jobs, job 3 already asks the player to apply everything from a bare board (a path for the kick plus the star ground) in a new situation; a fourth job with the same answers adds time but no new idea. Design question below. |
| R5-058 (part) | **Ground fix is still a lever/G, not a dragged cable.** The world now shows the long shared wire, its heating, and both return paths, but turning the lever into a grabbable ground jumper (a cable act, DR-05) is a larger interaction build. Design question below. The floating 'GND +0.9 V' tag was not added (AGENTS rule 2, no floating world labels); the copper tint carries it. |
| R5-269 (part) | Moving the scope's hline label below the line when the trace is close was not done (cosmetic). |
| R5-298 (part) | The harness is hidden while the robot is off the stand rather than lying unplugged on it. |

Nothing in this batch was phone/touch-only. No shared-file change was needed.

## Open questions

1. **Job 4 road test** (R5-037 verifier): keep it out (job 3 is already the from-scratch synthesis), or add one with a genuinely new constraint (e.g. both the brake coil and the motor on one board)?
2. **Ground as a cable act** (R5-058/DR-05): worth building the drag-the-controller's-ground-lead interaction, or is the lever + visible long wire + return beads enough?
3. **Time limit** (R5-234): 240 s is an estimate (≈1.5× a slow clean first run with three asks to read and the robot carry). It should be re-tuned from a timed human run.
4. **Random tray orientation** (cont.): each job the polar parts lie either way round at random, so a first PULSE may trip the fuse (costs 0.3 credit, never a mistake). If the owner prefers determinism, seed it per run.

## Test results

- `npm.cmd test`: 102 passed (garage: 23 unit tests).
- `npm.cmd run build`: OK.
- `tests/station-garage.spec.ts` (PW_PORT=4192): 2 passed.
- Shots: `mockups/review5/shots-full/fix-garage-01..22` (not committed), from `tools/fix-garage/shots.mjs`, `close.mjs`, `heat.mjs`. Job-3 heat check: snapshot `gndColor` fc4929 at heat 0.88 during the start PULSE (shot 19).
