# Next steps (updated 2026-10-30)

> **Read first:** five stations were cut on 2026-10-30 (see PROGRESS.md "The cut"). Anything below
> that names the via counter, archive, waterworks, clockwork or depot no longer applies. The plan
> now is to deepen the eight kept rooms using `mockups/review4/DESIGN_A.md` and `DESIGN_B.md`.


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

## 1. Review fixes: done

The `claude/review-fixes-wip` branch was run (tests and bench screenshots) and merged on
2026-10-29. Every station's `score().cost` is now in credits. See PROGRESS.md "Fourth pass".

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
- ~~One breaker/fuse RESET behaviour~~ done: `resetButton()` in `src/stations/shared.ts`.
- **Spectrum:** the room beam and the "B MIRROR" floor mark show through the desk view.
- **Draw calls.** Station rooms run about 850–1,200 WebGL calls per frame
  (`snapshot().drawCalls` now reports the true count). Merge static room dressing into
  `game.decorRoot` so `freeze()` batches it, and instance repeated parts. Aim for under
  about 500 per room. Then measure on a mid laptop (`THROTTLE=4 node tools/perf.mjs`).
- **Via counter:** the ROW stepper sits half under the order panel at 1440×900. It's
  usable, but move it forward.

## 3. Features still to build (from `docs/EXPANSION_PLAN.md`)

- **Rush mode for the other stations.** The via counter (`vias-rush`) and the Arcade (`arcade-rush`) have one;
  `requires` locks each rush door until its station is done. The pattern is the same for each station
  (copy `src/stations/arcade/` — `rushJob()` in logic.ts, the `rush` flag in station.ts):
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
