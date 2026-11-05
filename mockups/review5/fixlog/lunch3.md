# Fix log: lunch3 (Lunch clean route: lift feed pulled off the capacitor cart)

## The bug
`tests/lunch.spec.ts` ("intended Lunch Rush solution delivers the tray upstairs") failed at its last expect: `job.done` false. The lift ran ~2 s and stopped, and `thin-1` (the lift feed) had lost its far plug.

## Cause (measured)
`mockups/review5/tools/fix-lunch3/mkdbg.cjs` makes a copy of the spec that logs `thin-1` every 0.1 s of game time after the lift is switched on (ports, rope strain and length, `nicked`, bot positions and `snag`, cable points). Result:

| step | thin-1 ports | strain | nicked | bots |
|---|---|---|---|---|
| 0.1 s | a,cap | 0.857 | false | (0.08, 1.2) · (12.92, 5.4) |
| 0.2 s | a,cap | 0.857 | false | (0.16, 1.2) · … |
| 0.3 s | **a,** | 0.417 | **true** | (0.24, 1.2) **snag: thin-1** · … |

So it is a cleaner bot snag, not strain (0.86, well under the 1.25 pull-out), not the lift car, not docking (the cart had been docked for ~10 s). `nicked:true` and `snag:'thin-1'` only come from the bot code.

Why there: the feed's path is supply A (−13, 3) → the kitchen wall's end (8.12, 0.42) → the cart. That straight segment crosses the bots' loop at a shallow 7° angle: in through the west edge at z 1.53, out through the bottom edge at x 1.74, and in between it lies 0–0.33 m inside the bottom edge. The old snag test was "any cable segment within 0.35 m of the bot's centre", so the cable was catchable along ~5.7 m of the bottom edge (x −1…4.6). Bridges cover 1.15 m round themselves; the spec's bridges (west edge at z 1.8, bottom edge at x 1.5 and 3.6) left a gap at x ≈ −0.4…0.4, and the bot caught the feed at x 0.24. The previous agent's guess was right about the place. Moving one bridge just moved the gap, because covering a 5.7 m near-parallel run takes a near-solid row of bridges. A player would not do that: they put a bridge where the cable crosses the line.

## Fix (game)
`src/lunch-runtime.ts`: a bot now catches a cable only where **its own path crosses the cable**. Each bot remembers its last position (`Bot.last`), and `crosses(cable,last,pos)` tests the cable's segments against a thin box (±0.04 m) round that step (`segmentHits`). A cable lying along the line still counts. The bridge check (`bridgeNear(pos)`), the 1.2 s grace after plugging, the drag and the nick are all unchanged. So the rule players can read is: bridge each place where your cable crosses the bots' path.

`tests/lunch.spec.ts`: now uses two bridges, one per crossing (west edge, and bottom edge at x 1.5, which snaps to the line and covers the x 1.74 crossing), instead of three. The comment says why. This checks that the obvious placement works.

## R5-302 (seat the Lunch crowd)
- `src/levels/types.ts`: `NpcSpot.seated?:boolean`.
- `src/game.ts` (coworker spawn only): `seated=p.seated??(this.level.id==='meeting'&&!p.standing)`.
- `src/levels/lunch.ts`: the two corridor-bench coworkers sit on the benches at (−4.2, 9.45) and (−2.6, 9.45), `seated:true`, facing the room (yaw π±). The benches already have colliders (decor.ts), and seated coworkers have no capsule and are skipped by the audit. The pink coworker had already been moved off the dining chair (lunch fix log).

## Checks
- `npm.cmd test`: 137/137 passed.
- `npm.cmd run build`: passed.
- Browser (PW_PORT 4205): `tests/lunch.spec.ts` + `tests/lunch-rules.spec.ts` 11/11 passed (including "cleaner bots snag a live cable lying across their line", which still snags with no bridges); `tests/layout.spec.ts` + `tests/smoke.spec.ts` 15/15 passed.
- R5-302 shot: `mockups/review5/tools/fix-lunch3/bench.mjs` → shots-full/fix-lunch3-bench.png. Both coworkers sit on the bench seats (body y 0.47, `seated:true`), facing the kitchen.

## Needs shared change
None.

## Open questions
- The capacitor reports `atLoad:false` once the feed is gone. That is correct (no feed means no charging). It was a symptom, not a cause.
