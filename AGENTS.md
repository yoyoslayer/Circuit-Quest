# AGENTS.md — Circuit Crew (build brief for coding agents)

You are building **Circuit Crew**: a solo, third-person, physics-comedy repair game in cartoon office/facility floors. The player (Pip) grabs, carries, throws and **drags springy power cables** to get machines running. Think *Good Job!* (Nintendo/Paladin) with truthful, simplified electricity.

Read in this order: `docs/GAME_DESIGN.md` → `docs/LEVEL_01_BIG_MEETING.md` → `docs/BUILD_PLAN.md` → `concept/01_CURRENT_big_meeting_office.png`. Everything in `reference/` is background, not instructions.

## Hard rules (decided by the product owner — do not relitigate)
1. **Solo only.** No co-op, networking, accounts or lobbies. Keep code free of them.
2. **Play by doing, not reading.** HUD = icons, rings, meters. No floating world labels. No tutorials made of text. *Product-owner override:* a short objective card and a one-line key prompt are shown (see docs/PROGRESS.md).
3. **Big, dense rooms.** A floor is ~32 × 20 m with **hundreds of physics props** (desks, chairs, monitors, mugs, paper, plants, cabinets, boxes, printers, bins…). Only a few are needed for the job; all can be bumped, knocked over, carried or thrown.
4. **The cable is the star.** Finite length, wraps around obstacles, visibly strains (white → yellow → orange → red), and **slingshots** props when pulled taut then released or snapped.
5. **Clean solution first, chaos shortcuts second.** Every level must be solvable tidily; destruction is allowed and graded, never a fail.
6. **Grade like Good Job:** time, damage count, repair cost. Overall grade = best of the three. Chaos is never punished with failure.
7. **Forgiving interaction:** if a plug *looks* in a socket from the camera, it snaps. Stuck required items auto-respawn to a safe spot.
8. **Player-controlled orbit camera** (reviewers' #1 Good Job complaint was no camera control). Occlusion fade for walls/pillars.
9. **Readable, not bright.** Toon look (3-step ramp + dark outlines), ACES tone mapping, restrained glow. See `reference/render_kit/lib.js`.
10. **Electricity stays truthful at the level taught** (loops, overload, surges, capacitors). Numbers in docs are tuning values, not real specs.

## Stack
- TypeScript + Vite, `three` r186 (`WebGLRenderer` + `OutlineEffect` for now; WebGPU/TSL `toonOutlinePass` later — `OutlineEffect` is WebGL-only).
- Physics: `@dimforge/rapier3d-compat`.
- Tests: `vitest` for pure logic (electrical graph, cable length/wrap math, grading); a Playwright smoke test that loads the game and screenshots it.
- Audio: WebAudio, procedural/simple samples; no licensed assets without a license file.
- Keep game rules in engine-agnostic modules (`src/sim/*`), rendering in `src/render/*`, props as data-driven prefabs (`src/props/*`), levels as data (`src/levels/*.ts`).

## Definition of done per milestone
See `docs/BUILD_PLAN.md`. Each milestone: `npm run build`, `npm test` and the smoke screenshot pass; commit with a clear message; update `docs/PROGRESS.md` (create it) with what works, what doesn't, and how to play.

## Repo etiquette
- Small, focused commits. Don't commit `node_modules`, build output or large binaries.
- Don't delete `docs/`, `concept/` or `reference/`.
- If a design rule blocks you, write the question in `docs/PROGRESS.md` and pick the simplest option that keeps the hard rules.
