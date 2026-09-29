# Circuit Crew progress

Scope: all milestones M0–M5 in BUILD_PLAN.md. Original documents remain intact; reference material is background only.

## M0 — Foundation
TypeScript strict, Vite, pinned Three.js r186, Rapier, toon renderer, Vitest, and Playwright scaffolded. Verification pending.

## Remaining
M1 cable playground; M2 electricity; M3 Big Meeting and all three routes; M4 feedback; M5 Lunch Rush. No gameplay milestone is claimed complete yet.

## Current playable implementation
- Rapier capsule movement, jumping, sprint, grab/carry/throw, orbit/zoom and occlusion fade.
- Cable geometry wraps pillars and nearby furniture, unwraps, changes strain colour, pulls the player back, stores energy, and throws touching props when released under strain.
- Blender-created original Pip model: reproducible source generator plus local `.blend` and `.glb`.
- Big Meeting layout currently has 313 rigid-body props, instanced prop rendering, NPC reactions, timer/damage/cost and best-category grades.
- Electrical simulation has 7 passing tests, including closed returns, splitters, overload, scorch, short recovery, capacitor placement, and start ordering.
- Browser checks pass for startup, actual key-driven movement/jump/plug pickup/release, and 313-prop office loading.

Controls: WASD/arrows move; Shift sprint; Space jump; E grab/drop/snap; F grab/drop cable; Q throw/release; right-drag orbit; wheel zoom; Escape pause; R restart. Use `?level=meeting` for the office; default is the cable playground while development continues.

Outstanding verification: end-to-end projector completion and all three routes; dynamic cable corner regression checks; M1 five-minute human feel assessment; M3 blind-test requirement; 60 fps on mid-range laptop. Headless Chromium measured ~13.5 fps at 1440×900, so performance is not accepted. M4 is partial (sound, particles, reactions); M5 not yet implemented. The full project is not complete.

M0 verified: npm run build, npm test (13 tests), npm run smoke passed. Initial WebGL screenshot saved to artifacts/smoke.png. npm audit reports zero vulnerabilities after updating Vitest. Blender generated public/models/pip.blend and pip.glb from tools/create_assets.py.

