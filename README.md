# Circuit Crew

A solo physics-comedy repair game: Pip drags springy power cables through crowded
office floors to get machines running. Truthful, simplified electricity; chaos is
graded, never punished with failure. Status and milestone notes: `docs/PROGRESS.md`.

## Play

```
npm install
npm run dev          # http://127.0.0.1:5173
```

The title screen leads to a jobs board: 00 Cable Playground, 01 Big Meeting, 02 Lunch
Rush. `?level=<id>` opens that job directly; `?lowfx` turns off the expensive effects.

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

Browser tests open levels with `?manual`, which advances simulated time only when a
test asks, so routes are deterministic even under software rendering.

## Handoff material

| Path | What |
|---|---|
| `docs/HANDOFF_TO_CODEX.md` | Current state, Linux setup, where things live, what is open |
| `docs/screenshots/` | Screenshots of the current build |
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
