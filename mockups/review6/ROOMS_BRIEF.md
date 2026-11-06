# Bigger, roomier rooms (review 6)

Owner feedback (2026-11-06): "Make the rooms bigger and use more of them, it feels so tight in all of them."

## Target sizes

| Level | Now (width × depth, m) | Target |
|---|---|---|
| Station rooms: arcade, arcade-rush (shares arcade's room), garage, qfn, observatory, spectrum | 22 × 16 | 30 × 20 |
| Playground | 20 × 20 | 26 × 20 |
| Meeting, Lunch | 33 × 20 | 36 × 24 |
| Lobby | 30 × 20 | 34 × 24 |

AGENTS.md asks for floors of about 32 × 20 m with hundreds of props, so the station rooms are the furthest
from the brief.

## How

The shell (back and side walls, front and right lips, floor slab, windows, survey framing, player bounds,
respawn bounds and clutter bounds) already sizes itself from `level.width` and `level.depth`, centred on the
origin. Changing the two numbers moves all four edges outward. What does not move by itself is everything
placed at an absolute coordinate.

1. **Keep the job where it is.** The bench (station `table`/`stand`), the job items' start spots, the cable
   reel and the routes between them stay at their current coordinates unless spreading them out is the
   point. This keeps the cable puzzles, which depend on distances, the same.
2. **Move the wall-huggers out with the walls.** Anything that stands against the back wall (z ≈ -D),
   the left wall (x ≈ -W), the front edge (z ≈ +D) or the right edge (x ≈ +W) at an absolute coordinate
   moves by the same amount the wall moved. That covers machines, shelves, racks, plants, cabinets, wall
   sockets (including `stationCable.target` and the last points of `stationCable.route`), coworkers by the
   walls and props in `props`. Coordinates written as `W±…` or `D±…` already follow.
3. **Use the new space.** Do not leave an empty ring round the old room. Spread the furniture groups out so
   aisles are wider (at least 1.6 m on the main walks, the lanes `r` at least 1.1). Add a few new set
   pieces or clutter recipes that fit the room's story, and keep the clutter `max` about the same, so the
   density drops. "Hundreds of physics props" still holds.
4. **Floors and dressing.** Every `kit.floor`, wall band, tape line or rug that spans the room uses W/D or
   `l.width`/`l.depth`, so it covers the bigger room. Fix any that used absolute ends.
5. **Grading.** If the job's walking distance grows, raise its time par (`limits.time`) by the extra walk,
   about 1.5 s per extra metre on the main route, and say so.

## Done means

- `node node_modules/typescript/bin/tsc --noEmit -p .` and `node node_modules/vitest/vitest.mjs run` pass.
- The level's Playwright specs pass (`tests/station-<id>.spec.ts`, `tests/layout.spec.ts -g <id>` via the
  CLI, and the routes and objectives specs for playground and meeting). Update hard-coded walking
  coordinates in specs that point at things you moved, and only those.
- Screenshots at the default camera and in Tab survey (`node mockups/review6/tools/room-shot.mjs <prefix> <id>`
  needs a dev server; in a worktree run `node node_modules/vite/bin/vite.js --port <yours> --host 127.0.0.1`
  and change the URL in a copy of the tool) show a bigger room with nothing floating where a wall used to
  be, and no props inside walls.
