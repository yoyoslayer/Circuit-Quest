# Next steps (stopping point, 2026-09-29)

Work stopped here at the product owner's request. Read `docs/HANDOFF_TO_CODEX.md` first
(setup, file map), then this file.

## Where things stand

The published branch is `claude/nifty-knuth-519jg0` on `github.com/yoyoslayer/Circuit-Quest`.

**The game has 15 levels:**
- the HQ lobby, with a Workshop arch for practice runs;
- 3 cable floors: Playground, Big Meeting, Lunch Rush;
- 11 station jobs:
  - Via Counter and Via Rush;
  - QFN bench, Archive, Waterworks, Signal Observatory;
  - Overheating Arcade, Robot Garage, Clockwork Kitchen, Delivery Depot, Spectrum Delivery.

The build is clean and 142 unit tests pass. The full browser suite passed 48/48 before
the review-fix round. Since then the via, lobby, smoke, depot, clockwork and spectrum
specs have been rerun and pass.

A fresh-eyes design and QA review found concrete defects in the stations:
- the reports are `mockups/review3/REVIEW_A.md` and `REVIEW_B.md`, with screenshots
  alongside;
- the shared fixes and the via counter fixes are merged;
- the Depot, Clockwork and Spectrum fixes are merged;
- the rest are unfinished (step 1 below).

## 1. Finish the unfinished review fixes (branch `claude/review-fixes-wip`)

That branch is one WIP commit on top of the merged work. It touches QFN, Archive,
Waterworks, Observatory, Arcade and Garage (station files, their levels and two specs). It
typechecks, but **nothing on it has been run**.

1. `git checkout claude/review-fixes-wip`
2. Run `npx tsc --noEmit` and `npm test`.
3. Run each touched station spec: `npx playwright test tests/station-{qfn,archive,waterworks,observatory,arcade,garage}.spec.ts`.
4. Take screenshots at 1440×900 of each bench. Scripts are in `tools/debug/`, or copy
   `tools/debug/vias.mjs`.
5. Check each fix against the review items listed below.
6. Fix what's broken, then merge into the main branch.

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

- **Phone layout at the bench.** The shared CSS (`body[data-bench]` in `src/ui/ui.css`)
  and a portrait camera pull-back are in. Check every bench at 390×844 and adjust each
  station's `view` (and `view.lookX`, added for this) until the tools fit. The Archive
  terminal needs a tabbed layout on phones (`src/stations/archive/archive.css`).
- **The first prompt in a room points at a random prop** ("Grab the cone"). Let a station
  return a directional prompt from `prompt(false)` toward its current step, and move
  spawns away from clutter.
- **One bench button style.** Each bench uses its own button look; the QFN keycaps are
  the most readable. Add a shared `benchKey(label,key,colour)` helper in
  `src/render/labels.ts` and use it on every bench.
- **One breaker/fuse RESET behaviour** across Arcade, Garage and Depot.
- **Spectrum:** the room beam and the "B MIRROR" floor mark show through the desk view.
- **Draw calls.** Station rooms run about 850–1,200 WebGL calls per frame
  (`snapshot().drawCalls` now reports the true count). Merge static room dressing into
  `game.decorRoot` so `freeze()` batches it, and instance repeated parts. Aim for under
  about 500 per room. Then measure on a mid laptop (`THROTTLE=4 node tools/perf.mjs`).
- **Via counter:** the ROW stepper sits half under the order panel at 1440×900. It's
  usable, but move it forward.

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
