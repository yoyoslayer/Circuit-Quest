# Next steps (Codex continuation, 2026-09-29)

Read `docs/HANDOFF_TO_CODEX.md` for setup and the file map, then
`docs/DESIGN_REVIEW_5.md` for the latest player-feedback review and priorities.
`docs/REVIEW_FIXES.md` records the earlier station round.

## Where things stand

The two Claude branches have been combined for publication on `main` in
`github.com/yoyoslayer/Circuit-Quest`.

**The game has 15 levels:**
- the HQ lobby, with a Workshop arch for practice runs;
- 3 cable floors: Playground, Big Meeting, Lunch Rush;
- 11 station jobs:
  - Via Counter and Via Rush;
  - QFN bench, Archive, Waterworks, Signal Observatory;
  - Overheating Arcade, Robot Garage, Clockwork Kitchen, Delivery Depot, Spectrum Delivery.

The hub and Via now have a spatial redesign; motion, formal human workers,
close camera clearance and active mopping are changed globally. The build is
clean and 150 unit tests pass. Browser coverage includes 57 checks; final results
are recorded in `DESIGN_REVIEW_5.md`. Most other station puzzles still concentrate
the task at a bench. Prioritize a complete Garage room loop, then Waterworks,
using the room-specific plans in review 5. Do not add modes first. Big Meeting
also needs a sustained frame-time and static-dressing optimization pass.

A fresh-eyes design and QA review found concrete defects in the stations:
- the reports are `mockups/review3/REVIEW_A.md` and `REVIEW_B.md`, with screenshots
  alongside;
- the shared fixes and the via counter fixes are merged;
- the Depot, Clockwork and Spectrum fixes are merged;
- the remaining WIP fixes are integrated and reviewed (step 1 below).

## 1. Completed review fixes (branch `claude/review-fixes-wip`)

The WIP commit has been merged with the newer shared fixes. QFN, Archive,
Waterworks, Observatory, Arcade and Garage have been built, tested and captured.
`node tools/bench-review.mjs` reproduces the desktop and phone screenshot review.

Items that branch was meant to cover (details and suggested fixes are in the review reports):
- **QFN:** clear stale problem rings on move, rotate, trace, erase and undo; keep top-row
  parts from drawing over the board title.
- **Waterworks:**
  - bench camera closer;
  - bigger labels;
  - CHECK caption in front of its button;
  - V<sub>th</sub>/R<sub>th</sub>/I<sub>N</sub> as proper subscripts;
  - the formula toast written as a sentence.
- **Observatory:**
  - capitalisation in the decode-fail message;
  - the rerouted cable crossing the ANTENNA plate;
  - rod captions hidden by the rods;
  - one term for an empty series slot.
- **Archive:**
  - when the terminal is hidden, the prompt says how to reopen it (M);
  - toast position matches the other stations.
- **Arcade:**
  - calmer confetti carpet;
  - no confetti through the bench camera;
  - the serviced cabinet is hidden under the job card.
- **Garage:**
  - the FUSE control is tiny while the toast says "click FUSE";
  - confetti through the bench camera.
- **All of them:**
  - `score().cost` in plain credits (Depot, Clockwork and the via counter are already done);
  - prompt badges show real keys, not "Click", "Drag" or "…".

## 2. Remaining review items (not started)

The latest review takes priority over adding more stations or Rush variants:

- **Remaining intersections and NPC collision.** Desk/chair/monitor compound
  shapes are in; audit the other prefabs, static dressing, stock and cables.
  Standing NPCs still allow Pip to pass through them.
- **Camera obstruction.** Closer full follow, four walls and an exterior are in.
  Test doorways, carried furniture, rotated views and tall shelving. Add an
  obstruction response that keeps Pip and the held object visible.
- **Room architecture.** The palette differs by wing, but most station floor
  plans still repeat. Prototype Archive aisles or Garage service bays before
  applying a spatial redesign to the rest. Room-by-room targets are in the review.
- **Foot contact and animation.** The nested-model rig bug is fixed; actual boots
  now move. Review real-time walk/run/carry/jump recordings for residual skating
  and add foot planting if needed.
- **Less bench prose.** The job card is compact with optional details, and order
  panels wait for bench mode. Reduce duplicated explanations within each station.

Earlier remaining items:

- **Physical phone playtest.** All eleven station routes have been captured at
  390×844, the camera includes the tool racks, and Archive has a tabbed terminal.
  QFN and Archive have touch regression checks. Test fine control and readability
  on real phone hardware next.
- **One bench button style.** Each bench uses its own button look; the QFN keycaps are
  the most readable. Add a shared `benchKey(label,key,colour)` helper in
  `src/render/labels.ts` and use it on every bench.
- **One breaker/fuse RESET behaviour** across Arcade, Garage and Depot.
- **Spectrum:** the room beam and the "B MIRROR" floor mark show through the desk view.
- **Draw calls.** Station rooms run about 850–1,200 WebGL calls per frame
  (`snapshot().drawCalls` now reports the true count). Merge static room dressing into
  `game.decorRoot` so `freeze()` batches it, and instance repeated parts. Aim for under
  about 500 per room. Then measure on a mid laptop (`THROTTLE=4 node tools/perf.mjs`).

## 3. Features still to build (from `docs/EXPANSION_PLAN.md`)

- **Rush mode for the other stations.** Only the via counter has one (`vias-rush`, with
  `requires:'vias'` locking its lobby door). The pattern is the same for each station:
  - generate jobs from a seeded RNG;
  - add a patience or countdown timer;
  - implement `rushStatus()` so the HUD clock counts down and the result card shows
    the count.
- **Grand Reopening capstone** (MISSIONS 12): a storm breaks kitchen, tower and lift
  together. It combines several stations' fixes in one room.
- **Transfer contracts:** replay a station's idea in a different room with different art
  (GAME_VISION "teaching and assessment").
- Co-op stays out of scope (AGENTS.md rule 1).

## 4. Checks only a person can do

- Is dragging the cable fun for five minutes?
- A blind playtest: can a new player finish a station from the job card and prompts alone?
- 60 fps on a real mid-range laptop.
- **Electronics review of the station content.** The rules are simplified and labelled,
  but a qualified engineer should read each `src/stations/*/logic.ts` and the in-game
  explanations before this is used for teaching.

## 5. Handing a build to the product owner

1. `node tools/shot.mjs` and `node tools/thumbs.mjs` (need `npx vite --port 4173`).
2. Refresh `docs/screenshots/`.
3. `git archive --format=zip --prefix=Circuit-Crew/ -o ../Circuit-Crew.zip HEAD`.
4. Check that the zip installs and builds from a fresh unzip: `npm install && npm run build`.
