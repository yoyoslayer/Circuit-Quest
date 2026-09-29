# Handoff to Codex (from the Claude Code session, 2026-09-29)

Codex built M0–M2 and started M3. Claude Code then finished M3–M5 and did two rounds of
visual and design work at the product owner's request. This file is where to start. After
it, read `docs/PROGRESS.md` (what works, decisions taken, what is still unverified).

## State in one paragraph

All three levels are playable end to end: Cable Playground (tutorial), The Big Meeting and
Lunch Rush. The build, 19 unit tests and 23 browser tests pass. Each browser test plays a
level's route through deterministically in `?manual` mode. The latest product-owner request
has been delivered in full: higher-poly art, better lighting, a better Pip rig, more steps
per level, and on-screen objective text. The text overrides the original "no text" rule;
see AGENTS.md rule 2 and `docs/PROGRESS.md`. Screenshots of the current build are in
`docs/screenshots/`.

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
| HUD, screens, objectives card and key prompts | `src/ui/` (`objectives.ts` holds each level's steps and bonus goals) |
| Browser tests and their drive helpers | `tests/*.spec.ts`, `tests/navigation.ts` |
| Design reviews, mockups, QA pass | `mockups/review`, `mockups/review2`, `mockups/ui`, `mockups/look`, `mockups/qa/QA.md` |

The test hook: in `?manual` mode, `window.__circuitCrew` exposes `snapshot()` and
`drive.walkTo()` / `drive.advance()`. Time only moves when a test advances it.

## Adding a step to a level

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
- Anything new the product owner asks for: they review from screenshots and a zip, so
  send visuals with each change.

## Git

- `master`: Codex's last state.
- `claude/finish-circuit-crew`: the local branch this work was done on.
- `claude/nifty-knuth-519jg0` on `github.com/yoyoslayer/Circuit-Quest`: the published
  branch. It also carries the product owner's research notes, merged in.
