# Circuit Crew: play it and test it (PC)

PC first. The phone and touch layout is last on the list.

## Run the game

From the project folder:

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://127.0.0.1:5173). The title screen starts the game
at the HQ lobby, where every job is a door.

To build a static copy: `npm run build` (type check, then Vite build into `dist/`).

## Controls (keyboard and mouse)

| Key | What it does |
|---|---|
| W A S D / arrows | Walk |
| Shift | Run |
| Space | Jump |
| E | Grab or drop an item. At a door: enter the job. At the Workshop arch: pick a practice station |
| F | Plug or unplug the cable (the cable end you are holding) |
| Q | Throw what you are holding |
| Right-drag | Orbit the camera |
| Left click | Grab, the same as E |
| Mouse wheel | Zoom |
| C | Reset the camera behind Pip |
| Tab | Survey: see the whole room |
| R (hold) | Restart the level |
| Esc | Pause and menu |

Walking into an open doorway enters that job, as E does. Locked doors rattle.

A gamepad works too: left stick walks, right stick orbits, A jumps (and presses the main button on the result
card), X grabs, B is the cable, Y throws, Start pauses.

## Look tuning (URL parameters)

Add these to the address to compare looks:
- `?ink=0.005`: the outline thickness (0.0035 by default).
- `?benchfill=0.9`: how much of the screen a station bench fills (0.86 by default).
- `?lowfx`: the cheap rendering path.

## What to check by hand

Walk the lobby first. Then play, in order: Cable Playground, Big Meeting, Lunch Rush,
Overheating Arcade, and the rest as they unlock.

- The doorways: walk into one, and the job should load.
- The camera: orbit behind a pillar or a rack. Pip should stay visible and the camera should not
  sit inside furniture.
- The cable: pull it taut past a box. It should slingshot the box and stay whole where it passes Pip.
- A job item knocked out of the room, or stranded out of reach, comes back home after a few seconds.

Report anything that feels wrong with the level name, what you did, and what you expected.

## Automated tests

These use Playwright (browser) and Vitest (logic). The first run downloads the browser:
`npx playwright install chromium`.

```bash
npm test                  # unit tests (Vitest): electrical, cable, grading, logic
npm run smoke             # browser tests (Playwright): full suite, about 25 minutes
```

To run one browser spec, pass its file name:

```bash
node node_modules/@playwright/test/cli.js test tests/lobby.spec.ts
```

On Windows, call the Playwright and Vitest entry scripts directly as above. The `npx` wrapper
drops flags in some shells.

The browser tests start their own dev server, on port 4187 unless `PW_PORT` says otherwise.
Do not edit source files while a full browser run is going: the pages reload and tests fail.

## Known open items

See `mockups/review6/PLAYABILITY_LOOKS_REVIEW.md` for the playability and looks review,
and `docs/PROGRESS.md` for the rest.
