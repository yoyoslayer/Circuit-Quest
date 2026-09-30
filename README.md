# Circuit Crew

A solo physics-comedy repair game set in Circuit Crew HQ. Pip drags springy power cables
through crowded office floors, and works electronics benches in the building's wings: via
fabrication, PCB layout, datasheets, Thevenin/Norton, filters and antennas, LED resistors,
motor kickback, clock sources, V/I/P and propagation. Truthful, simplified electronics;
chaos is graded, never punished with failure. Status: `docs/PROGRESS.md`; the station plan
and audit: `docs/EXPANSION_PLAN.md`.

## Play

```
npm install
npm run dev          # http://127.0.0.1:5173
```

Play opens the **HQ lobby**: walk to a job's door and press E. Doors show your best medal,
and a lamp over a door lights once that job is done. The **Workshop** arch practises any
station without recording a grade. The jobs board is still one click away on the title
screen. `?level=<id>` opens a job directly (`lobby`, `playground`, `meeting`, `lunch`,
`vias`, `vias-rush`, `qfn`, `archive`, `waterworks`, `observatory`, `arcade`, `clockwork`
and the rest of the stations); `&practice` plays it unrecorded; `?lowfx` turns off the
expensive effects.

**Stations:** walk up to the bench and press E; the camera eases onto the tabletop. Click
the tools (each station also has keys, shown on the table and in the prompt), E or Esc
steps back. The job card lists the steps; the panel on the right shows the order and a
live readout; each station grades works / works reliably / elegant.

| Input | Keyboard / mouse | Gamepad |
|---|---|---|
| Move / sprint | WASD or arrows / Shift | Left stick |
| Jump | Space | A |
| Grab, drop, plug, flip a switch, reset a breaker | E or left click | X |
| Pick up / plug a cable end | F | B |
| Throw / let go of a taut cable (slingshot) | Q | Y |
| Orbit / zoom camera | Right-drag / wheel | Right stick |
| Survey the whole floor / reset camera | Tab / C | L3 / Back |
| Pause / restart | Esc / R | Start |

## Develop

| Command | What |
|---|---|
| `npm run build` | Strict type check + production build |
| `npm test` | Vitest: cable wrapping, electrical graph, grading, lunch job |
| `npm run smoke` | Playwright: smoke tests plus every level route and Lunch Rush rule |
| `npm run assets` | Rebuild Pip (`public/models/pip.glb` and `pip.blend`) with Blender 5.x (`$BLENDER` or PATH) |
| `node tools/perf.mjs` | Frame timing on the host GPU (`THROTTLE=4` emulates a mid laptop CPU) |
| `node tools/shot.mjs [level]` | GPU screenshots into `artifacts/` |
| `tools/debug/*.mjs` | Error catcher, pose logger, crops and scripted scene shots |
| `node tools/bench-review.mjs` | Prepare each station and capture desktop/phone benches; optional `BASE_URL` and `REVIEW_OUT` |

Browser tests open levels with `?manual`, which advances simulated time only when a
test asks, so routes are deterministic even under software rendering.

## Handoff material

| Path | What |
|---|---|
| `docs/HANDOFF_TO_CODEX.md` | Current state, Linux setup, where things live, what is open |
| `docs/screenshots/` | Screenshots of the current build |
| `docs/REVIEW_FIXES.md` | Codex continuation: merged review fixes, phone checks and remaining work |
| `AGENTS.md` | Hard rules, stack, done criteria (Codex reads this automatically) |
| `docs/GAME_DESIGN.md` | Current design (wins over older docs) |
| `docs/LEVEL_01_BIG_MEETING.md` | First level spec |
| `docs/LEVEL_02_LUNCH_RUSH.md` | Second level puzzle spec |
| `docs/BUILD_PLAN.md` | Milestones M0–M5 |
| `docs/RESEARCH_good_job_nintendo.md` | Research behind the design rules |
| `concept/01_CURRENT_*` | Target look/density; `9x_superseded_*` are rejected directions |
| `reference/render_kit/` | Working three.js toon scene code used for the concept frames |
| `reference/original_handoff/` | First-pass docs (older; co-op etc. is out of scope now) |
| `reference/agent_office_style/` | MIT-licensed toon material + renderer setup the look is based on |
