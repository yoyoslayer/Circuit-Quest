# Handoff to Codex (from the Claude Code session, 2026-09-29)

Codex built M0–M2 and started M3. Claude Code then finished M3–M5 and did two rounds of
visual and design work at the product owner's request. This file is where to start. After
it, read `docs/NEXT_STEPS.md` (the ordered to-do list at the stopping point) and `docs/PROGRESS.md` (what works, decisions taken, what is still unverified).

Codex has continued this handoff: both Claude branches are integrated, the review
round and phone fixes are verified, and `docs/REVIEW_FIXES.md` records the changes,
50 browser checks and screenshots. `NEXT_STEPS.md` now lists the remaining work.

The latest player-feedback pass is `docs/DESIGN_REVIEW_5.md`: the rebuilt hub,
spatial Via workcells, active mopping, planted gait, articulated arms, formal
human workers, close camera clearance and occupied surroundings. It includes
a distinct physical puzzle plan for every room and explicit remaining limits.
Read it before adding modes. Review 4 retains the earlier collision audit.

## State in one paragraph

The game has 15 levels.
- **The HQ lobby** (bare URL). A walkable atrium with a door per job and a Workshop arch
  for practice runs.
- **Three cable floors:** Cable Playground, Big Meeting and Lunch Rush.
- **Eleven station jobs** played at benches in their own rooms:
  - Via Counter, plus Via Rush;
  - QFN bench, Archive, Waterworks and Signal Observatory;
  - Overheating Arcade, Robot Garage, Clockwork Kitchen, Delivery Depot and Spectrum
    Delivery.

The product owner asked for these in the third pass. The audit, the decisions and the
station pattern are in `docs/EXPANSION_PLAN.md`; the table in `docs/PROGRESS.md` says
what each station teaches.

Unit tests cover every station's rules and solver. Each job has a browser playthrough in
`?manual` mode. On-screen objective text is a product-owner override of the original
"no text" rule (AGENTS.md rule 2). Screenshots are in `docs/screenshots/`.

## Setting up on Linux

```sh
npm ci                                   # node_modules is not committed: it holds OS-specific binaries
npx playwright install --with-deps chromium
npm run build && npm test && npm run smoke
npm run dev                              # http://127.0.0.1:5173
```

- `npm run smoke` starts its own Vite server on port 4187. It renders with SwiftShader, so
  it needs no GPU.
- `tools/shot.mjs`, `tools/perf.mjs`, `tools/thumbs.mjs` and `tools/debug/*` expect a dev
  server on 4173 (`npx vite --host 127.0.0.1 --port 4173`). They pass Windows GPU flags,
  which Chromium ignores on Linux.
- `npm run assets` rebuilds Pip with Blender 5.x. It uses `$BLENDER`, then the Windows
  install path, then `blender` on PATH. Only needed if you change `tools/create_assets.py`:
  `public/models/pip.glb` (the model the game loads) and `pip.blend` (the Blender source)
  are committed. A Blender re-export is not byte-identical to the committed model, so run
  `npm run smoke` after rebuilding.
- `dist/` is not committed: `npm run build` recreates it in about 2 s.

## Where things live

| Area | Files |
|---|---|
| Game loop, player, cable, grab/throw, switch and power-strip steps | `src/game.ts` |
| Lunch Rush rules (oven, fridge, breakers, lift, bots, water) | `src/lunch-runtime.ts`, `src/levels/lunch.ts` |
| Level data (layout, props, coworkers, switch, deadline) | `src/levels/*.ts`, types in `src/levels/types.ts` |
| Electrical sim, cable wrapping, grading | `src/sim/` |
| Pip model and rig | `tools/create_assets.py` (Blender), `src/render/pipRig.ts` |
| Toon look, lights per level, post effects | `src/render/toon.ts`, `src/render/post.ts`, `src/render/kit.ts` |
| Coworkers, particles, audio | `src/render/actors.ts`, `particles.ts`, `audio.ts` |
| HUD, screens, objectives card and key prompts | `src/ui/` (`objectives.ts` holds the cable floors' steps; stations supply their own `job`) |
| Station framework and bench mode | `src/stations/types.ts`, `src/stations/index.ts`, bench code in `src/game.ts` (search `atBench`) |
| Each station | `src/stations/<id>/` (`logic.ts` + tests, `station.ts`, `room.ts`), `src/levels/<id>.ts`, `tests/station-<id>.spec.ts` |
| HQ lobby and Workshop | `src/hub/lobby.ts`, `src/levels/lobby.ts` |
| Browser tests and their drive helpers | `tests/*.spec.ts`, `tests/navigation.ts` |
| Design reviews, mockups, QA pass | `mockups/review`, `mockups/review2`, `mockups/ui`, `mockups/look`, `mockups/qa/QA.md` |

The test hook: in `?manual` mode, `window.__circuitCrew` exposes `snapshot()` and
`drive.walkTo()` / `drive.advance()`. Time only moves when a test advances it.

## Adding a station

Follow "How to build a station" in `docs/EXPANSION_PLAN.md`. Registering the level adds its lobby
door automatically.

## Adding a step to a cable level

1. Add the mechanic in `src/game.ts`, or `src/lunch-runtime.ts` for Lunch Rush.
2. Add the step to `JOBS` in `src/ui/objectives.ts`. Give it `done(g)` and, optionally,
   `at(g)` for the marker position.
3. If the step uses a new key, add a prompt in `promptFor()`, or in `promptAt()` for
   Lunch Rush.
4. Update the level's route in `tests/routes.spec.ts` or `tests/lunch.spec.ts`.

## Still open

- **Human checks this environment cannot do:** whether the cable feels fun, a blind
  playtest, and 60 fps on a real mid-range laptop. Details in `docs/PROGRESS.md`
  under "Not verifiable here".
- **Not built yet** (BUILD_PLAN's "not now" list): a level hub beyond the job board, more
  floors, a WebGPU renderer, remapping and accessibility options, and save data. Only best
  grades and the mute setting persist.
- Rush mode for the other stations. Only the via counter has one, as `vias-rush`.
- Co-op is deliberately out of scope (solo only).
- Anything new the product owner asks for: they review from screenshots and a zip, so
  send visuals with each change.

## Git

- `main` on `github.com/yoyoslayer/Circuit-Quest`: the combined, verified game.
- `claude/nifty-knuth-519jg0`: Claude's published stopping point, including the
  product owner's research notes.
- `claude/review-fixes-wip`: the unfinished review round, now integrated.
- `codex/finish-review-fixes`: the local continuation branch used for integration
  and the verified phone/UI follow-up.
