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

Play opens the **HQ lobby**: approach a job's door to open a portal, then walk into it
to enter the job automatically. E also enters. Doors show your best medal,
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

**Via workshop:** inspect the customer requirements, then carry the same sample
between the inspection bench, laminate press, drill press, plating bath and
customer-hardware tester. Walk to each machine and press E. Pull the press lever
down, hold the drill feed wheel, or lower the plating basket with the mouse.
P / D / L and the on-screen cycle button offer alternatives. Select layers, pads
and finish at inspection; TEST and SEND are at the hardware table. Esc steps away.
Measurements and the explanation of each manufacturing choice expand on demand.

**Mopping:** grab the mop, walk onto the spill and hold Space to scrub. On touch
or gamepad, the jump control becomes Scrub while holding the mop. Holding it alone
does not clean. Mouse-wheel zoom now permits a close view of the work.

The job card shows the current step; **Job details** expands the full checklist and
bonus goals. The camera follows Pip; **Tab** switches to a survey of the whole room.

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
| `node tools/design-review.mjs after` | Capture all 15 rooms in play/survey/close views, with rig and physics diagnostics (default port 4174) |
| `node tools/experience-review.mjs` | Capture hub portals, rendered walk frames, each Via work area and active mopping (default port 4174) |

Browser tests open levels with `?manual`, which advances simulated time only when a
test asks, so routes are deterministic even under software rendering.

## Handoff material

| Path | What |
|---|---|
| `docs/HANDOFF_TO_CODEX.md` | Current state, Linux setup, where things live, what is open |
| `docs/screenshots/` | Screenshots of the current build |
| `docs/REVIEW_FIXES.md` | Codex continuation: merged review fixes, phone checks and remaining work |
| `docs/DESIGN_REVIEW_4.md` | Movement, collisions, camera and room-design review, fixes and before/after evidence |
| `docs/DESIGN_REVIEW_5.md` | Current hands-on redesign, evidence, limitations and a distinct puzzle plan for every room |
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
