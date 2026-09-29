# Expansion plan: the stations and wings (product-owner request, 2026-09-29)

The product owner pointed out that many features, rooms and ideas from the original
brainstorm never made it into the build. The sources are:

- the Circuit Quest brainstorm, pasted in by the product owner;
- `reference/original_handoff/MISSIONS.md`;
- `reference/original_handoff/GAME_VISION.md`.

Only the cable-floor jobs were built: Playground, Big Meeting and Lunch Rush. This file
lists everything that is missing and the order it gets built in.

## Decisions (product owner can override)

- **One building.** Every station is a wing of the same Circuit Crew building, in the
  same Agent-Office look (elevated third-person camera, rounded forms, pale wood, cream
  walls, pastel work areas). Each wing gets its own palette.
- **Solo only** (AGENTS.md rule 1). The brainstorm's drop-in co-op is not built.
- **The board stays in the room.** Pip walks to a bench and presses E. The camera eases
  onto the tabletop, and the puzzle runs there in 3D. The room keeps running around it.
- **Two layers per station.** Room physics can be floppy (drop a tray, yank a cable), but
  the electronics simulation is exact: parts land precisely in sockets, and meters
  always show the true circuit state.
- **Short text only.** Objective text and short explanations are allowed, following the
  earlier override for on-screen text. The Datasheet desk is the one deliberate reading
  station.
- **Three success grades per station:** works, works reliably, and elegant to
  manufacture. A messy valid solution finishes the job; replays improve the grade.
- **Stay truthful** (guardrails from MISSIONS.md):
  - Analogies are labelled as analogies.
  - An inductor opposes changes in current. It does not "block AC".
  - A decoupling capacitor supplies brief transient current. It is not a battery.
  - An absolute maximum is a stress limit, not a design target.
  - Ground stitching describes what a via does, not a kind of via.
  - Annular-ring minimums depend on the fabrication house, and are labelled as such.

## Audit

| Idea | Source | Status |
|---|---|---|
| Cable floors: Playground, Big Meeting, Lunch Rush (capacitor cart, brownout) | GAME_DESIGN, MISSIONS 01/03 | Built |
| **Via service counter**: pictorial orders at a hatch; drill, plate, set the ring, fill/cap, test, serve | brainstorm 2, MISSIONS 09 | Built (`vias`, plus `vias-rush`) |
| **QFN parking puzzle**: grid bench, slide and rotate parts, draw traces, second layer and vias, decoupling placement, thermal pad | brainstorm 1, MISSIONS 10 | Built (`qfn`) |
| **Datasheet detective desk**: search documents, bookmark evidence, typical vs guaranteed vs absolute max, a part that fails when installed | brainstorm 3, MISSIONS 11 | Built (`archive`) |
| **Thevenin/Norton waterworks**: hidden pipe network with two ports, test loads, build an equivalent cart, reveal the circuit | brainstorm 4, MISSIONS 05 | Built (`waterworks`) |
| **Signal observatory**: garbled message, scope, filter modules, antenna, spectrum exhibits | brainstorm 5, MISSIONS 06/07 | Built (`observatory`) |
| **Clockwork kitchen**: internal vs external oscillator, drift causes bad cook cycles | brainstorm, MISSIONS 08 | Built (`clockwork`) |
| **Overheating arcade**: pick an LED/motor current-limiting resistor; brightness, temperature, battery life, resettable fuses | brainstorm, MISSIONS 02 | Built (`arcade`) |
| **Robot garage**: motor resets its controller on shutdown; diagnose the transient and add protection | brainstorm | Built (`garage`) |
| **Delivery depot**: voltage as energy per charge, current as charge per second, power as their product; trucks plus gauges | brainstorm, MISSIONS 04 | Built (`depot`) |
| **Spectrum delivery**: move a signal past obstacles; choose transmitter, detector and optical path | brainstorm, MISSIONS 07 | Built (`spectrum`) |
| Building lobby with wings that unlock as jobs are finished | GAME_VISION | Built (`src/hub/lobby.ts`): doors, medals, wing lamps, rush locked until the counter is done |
| Free Workshop mode (try parts, no penalties) | brainstorm, GAME_VISION "Open Lab" | Built: Workshop arch in the lobby, `&practice` runs are never recorded |
| Rush mode per station, unlocked once the station is understood | brainstorm, "Crew Rush" | Built for the via counter (`vias-rush`); other stations later |
| Grand Reopening capstone | MISSIONS 12 | Later |
| Drop-in co-op | brainstorm | Excluded by the solo-only rule |

## Build order

1. **Framework.** Station levels, bench mode (sit, ease the camera, pointer on the table,
   stand up), a `Station` interface, objectives and grades supplied by the station, and a
   job board grouped by wing.
2. **Via Foundry: the via service counter.** Built first because it is the most
   immediately fun station, and it proves the framework.
3. **Four more stations, built in parallel:**
   - Fabrication Bay: the QFN parking puzzle.
   - Archive: the Datasheet detective.
   - Waterworks: Thevenin and Norton.
   - Signal Observatory: filters, scope and antenna.
4. **Five smaller jobs:**
   - Overheating Arcade.
   - Robot Garage.
   - Clockwork Kitchen.
   - Delivery Depot.
   - Spectrum Delivery.
5. **Modes and structure:**
   - The walkable lobby, with wings that unlock.
   - Workshop mode.
   - Rush mode for the via counter and the other stations.
6. **Finish:** tests, screenshots, docs, zip and push.

Each station has:
- a pure logic module in `src/stations/<id>/` with unit tests;
- a level file with the room, props and coworkers;
- a browser test that plays it through;
- a screenshot of it in `docs/screenshots/`.

## How to build a station (the pattern the Via counter set)

Read `src/stations/types.ts`, then the reference station `src/stations/vias/`:
- `logic.ts`: the rules, as pure functions;
- `logic.test.ts`: unit tests for the rules;
- `station.ts`: the tabletop and panels;
- `room.ts`: the room's set dressing.

The level lives in `src/levels/vias.ts`, and the browser test in `tests/stations.spec.ts`.

1. **Rules first, pure and tested.** Put the rules in `src/stations/<id>/logic.ts`, with
   no three.js and no DOM, and unit tests next to it. Include a brute-force or explicit
   solver that proves every job is solvable and defines the best (elegant) answer.
   State the teaching guardrails in comments and in the player-facing explanations.
2. **One station class** implements `Station` in `src/stations/<id>/station.ts`:
   - Build the tabletop under `game.root`. Static parts go in `game.decorRoot`.
   - Every tool is a clickable object that calls `act(name, arg)`. Keys map to the same
     `act()` calls.
   - `act()` returns false, and calls `say()` with a reason, when an action isn't possible.
   - Show state on the table in 3D first (the board, pipes or scope trace). The
     `.station-panel` card holds the order and a readout.
   - Put `.station-toast` messages under a short explanation.
   - `job` has a physical first step in the room (fetch something, move something), then
     the bench steps. `bonuses` are three optional goals.
   - `limits` sets the grade: time in seconds, mistakes, and process cost ×10.
   - `score()` returns `{mistakes, cost}`.
   - `snapshot()` gives tests everything they need to assert.
3. **Room.** `dress(kit)` builds the room in its wing palette: floor, windows, machines,
   posters, lamps, and colliders (`solid`). Keep the counter area clear of hanging lamps
   so the bench camera sees the table.
4. **Level.** `src/levels/<id>.ts` sets `station:'<id>'` and holds:
   - dozens of knock-about props;
   - coworkers, used as customers or workers;
   - `target` at the bench.

   Register the level in these places:
   - `levels/index.ts`;
   - the `LevelId` union;
   - the `StationId` union;
   - `stations/index.ts`;
   - `LOOK` (`ui/screens.ts`);
   - `MOODS` (`render/toon.ts`);
   - a badge icon (`render/icons.ts`).

   Station-specific CSS goes in its own file, imported by the station module.
5. **Browser test.** In `tests/station-<id>.spec.ts`, play the whole job through
   `drive.act()` in `?manual` mode, check the grade and bonuses, and test one recoverable
   mistake.
6. **Look at it.** Take a screenshot at the bench and in the room (see
   `tools/debug/*.mjs`), and fix anything unreadable before calling it done.

Parallel worktrees: run `npm ci` in the worktree (never link or delete another
checkout's `node_modules`), and give each worktree its own ports. Use `PW_PORT=<port>`
for Playwright, and `npx vite --port <port>` for screenshot scripts.
