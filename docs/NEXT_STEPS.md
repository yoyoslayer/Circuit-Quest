# Next steps (updated 2026-10-30)

Read `docs/HANDOFF_TO_CODEX.md` first (setup, file map), then this file, then `docs/PROGRESS.md`.

## Where things stand

The published branch is `claude/nifty-knuth-519jg0` on `github.com/yoyoslayer/Circuit-Quest`.

**Eight rooms plus one rush mode** (five stations were cut on 2026-10-30, see PROGRESS.md "The cut"):
- the HQ lobby, with a Workshop arch for practice runs;
- 3 cable floors: Playground, Big Meeting, Lunch Rush;
- 5 station jobs: Overheating Arcade (and Arcade Rush), Robot Garage, QFN bench,
  Signal Observatory, Spectrum Delivery.

Each kept room was reworked from `mockups/review4/DESIGN_A.md` and `DESIGN_B.md` (PROGRESS.md
"Deepening the kept rooms"): direct manipulation instead of menus, live meters, failures that
show *why* without printing the fix. Every floor now carries seeded clutter
(`src/levels/clutter.ts`), so each room has roughly 80–140 physics props; `node tools/debug/audit.mjs`
counts them and checks nothing starts overlapping.

`npm run build` is clean and 95 unit tests pass. The browser specs need `npm run build` first
(they run against the preview server on 4187) and long timeouts under SwiftShader.

## 1. Open items

- **Observatory receiver line.** The bench's receiver lead is still drawn by the station; make it
  the real draggable cable in the room.
- **Phone layout at the bench.** Shared CSS (`body[data-bench]` in `src/ui/ui.css`) and a portrait
  camera pull-back exist. Check every bench at 390×844 and adjust each station's `view` (and
  `view.lookX`) until the tools fit.
- **One bench button style.** Benches still use their own button looks; the QFN keycaps read best.
  A shared helper in `src/render/labels.ts` used by every bench would unify them.
- **First prompt in a room.** It can point at a random nearby prop. A station could return a
  directional prompt toward its current step.
- **Draw calls.** Station rooms ran about 850–1,200 WebGL calls per frame before the clutter pass
  (`snapshot().drawCalls` reports the true count; props are instanced, so clutter adds few).
  Merge static dressing into `game.decorRoot` so `freeze()` batches it. Aim for under about 500,
  then measure on a mid laptop (`THROTTLE=4 node tools/perf.mjs`).
- **VFX and lighting pass** (in progress): spark streaks, fading smoke and sprint dust are in;
  per-room lighting and material detail still need work.

## 2. Features still to build (from `docs/EXPANSION_PLAN.md`)

- **Rush mode for the other stations.** Only the Arcade has one (`arcade-rush`); `requires` locks
  a rush door until its station is done. Copy the pattern in `src/stations/arcade/`
  (`rushJob()` in logic.ts, the `rush` flag in station.ts): seeded jobs, a countdown, and
  `rushStatus()` for the HUD clock and result card.
- **Grand Reopening capstone** (MISSIONS 12): one room combining several stations' fixes.
- **Transfer contracts:** replay a station's idea in a different room with different art.
- Co-op stays out of scope (AGENTS.md rule 1).

## 3. Checks only a person can do

- Is dragging the cable fun for five minutes?
- A blind playtest: can a new player finish each station from the job card and prompts alone?
- 60 fps on a real mid-range laptop.
- **Electronics review.** The rules are simplified tuning values; a qualified engineer should read
  each `src/stations/*/logic.ts` and the in-game messages before this is used for teaching.

## 4. Handing a build to the product owner

1. `node tools/shot.mjs` and `node tools/thumbs.mjs` (need `npx vite --port 4173`).
   `node tools/debug/look.mjs` takes full-effects shots of single rooms.
2. Refresh `docs/screenshots/`.
3. `git archive --format=zip --prefix=Circuit-Crew/ -o ../Circuit-Crew.zip HEAD`.
4. Check that the zip installs and builds from a fresh unzip: `npm install && npm run build`.
