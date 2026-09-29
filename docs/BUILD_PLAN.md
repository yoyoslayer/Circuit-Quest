# Build plan (do in order; each milestone ends with build + tests + smoke screenshot + commit)

## M0 — Project setup
Vite + TS strict, three r186, Rapier compat, vitest, Playwright smoke test (`npm run smoke` saves `artifacts/smoke.png`). Toon renderer from `reference/render_kit/lib.js` ported to TS (`src/render/toon.ts`).

## M1 — Feel prototype (grey box) ← most important
One empty 20 × 20 m room, a few pillars/boxes, Pip capsule controller (WASD, jump, sprint), orbit camera (mouse/right-stick) with occlusion fade, grab/carry/throw physics boxes.
**The cable:** socket anchor → wrap-point rope → plug held by Pip. Length limit, spring pull-back, strain colours, wrap/unwrap, slingshot that flings boxes, plug snaps into a socket that lights a lamp.
Exit: dragging the cable around pillars and flinging boxes is fun for 5 minutes with no goal.

## M2 — Electrical sim
`src/sim/electrical.ts`: sources + breakers, cables + ratings, splitters, loads (steady + kick), capacitor at load end, water short. Unit tests for: closed loop powers load; open loop doesn't; overload trips; splitter sums; thin cable over-rating scorches; kick trips unless capacitor at load end.

## M3 — Level 01 Big Meeting
Prop prefab kit (see GAME_DESIGN "Rooms & props"), level data file, NPC blobs with reactions, boardroom goal, timer, damage/cost tracking, grade screen (icons), reset/retry. See `docs/LEVEL_01_BIG_MEETING.md` for acceptance.

## M4 — Juice pass
Sounds (cable hum by strain, tunk on wrap, snap, crashes, breaker clunk, cheer), particles (dust, sparks, confetti, paper flutter), camera shake on snaps, squash/stretch on Pip.

## M5 — Level 02 Lunch Rush
Implement `docs/LEVEL_02_LUNCH_RUSH.md` (supply carts, thick/thin cables, splitters, fridge thermometer, capacitor cart, puddle, swinging door, cleaner bots).

## Later (not now)
Level select/building hub, more floors, WebGPU renderer, controller remap/accessibility options, save data.
