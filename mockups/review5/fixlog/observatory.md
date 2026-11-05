# Fix log: Signal Observatory (batch R-observatory)

Branch: worktree branch, started from `claude/nifty-knuth-519jg0` @ 70728fb (the worktree had been cut from an old `main`, so it was reset to the lead's branch tip before any edit).
Scripts: `mockups/review5/tools/fix-observatory/` (`numbers.ts` tuning table, `01-check.mjs`, `02-dome.mjs`, `03-shutter.mjs`, `04-bench.mjs`). Shots: `mockups/review5/shots-full/fix-observatory-*.png` (not committed).

## Fixed

| ID | Pri | What changed | Files | Verified |
|---|---|---|---|---|
| R5-021 | P1 | Dome platform is a real 16 cm cylinder collider; 12 low (1.2 m) collider segments at r 2.45 around the back half of the shell (verifier's version). Telescope astronomer moved off the platform to (-3.4,-3.7). Occlusion: the lead's per-fragment see-through oval (B3) already cuts the shell, so no occluder registration was needed. | room.ts, levels/observatory.ts | 02-dome.mjs: walking from outside the back-right/back-left toward the inside stops at r≈2.74 (outside the shell); walking in through the open front lands on the step (y .96 vs .77). Shot 02: Pip visible through the shell from behind. |
| R5-022 | P1 | Knob drag is 0.12 m on the board per E6 step (≈30 px) and moves at most one step per 60 ms; each detent pulses the knob and plays a pitch-stepped tick. | station.ts | 04-bench.mjs real mouse drags from 100 nF: 40 px → 150 nF (1 step), 180 px → 1 µF (6 steps). |
| R5-043 | P1 | Elegant target fixed per job: `cheapest(job,{cartDistance:CART_SAFE})`, any setup at or below that cost is tier 3. Cart pickup capped at 6 m, so a far throw never makes the filter optional. Note text for a zero-cost best. | logic.ts, logic.test.ts | Unit tests: 1.5 µF + reroute is tier 3 at 4.5–17 m; no-filter SNR < 12 dB at 6–17 m either route. |
| R5-044 | P1 | Dome now has a slit on its back meridian (brass ribs), a sky strip behind it, and a brass shutter leaf driven live by `latchOk`: slides open when the latch holds, slams shut (thud, clatter, dust, astronomer startled) the moment a part starves it; the telescope tube lowers when shut. A dome-motor housing on the rim hums (jitter + ring pulse) while its whine is on the line (jobs 2–3). Gust: fitted whip starts as the 1.5 m rod, tips over in ~0.4 s toward −x with pale streaks at the tip. No rod-swap credit (verifier). `snapshot().station.shutter` added. | room.ts, station.ts | 03-shutter.mjs shots 30/32: sky strip visible when open, brass leaf + lowered tube when shut, "!" on astronomer. Spec: job 2 starts with shutter false; slotting the coil reopens it. Shot 13: flat 1.5 m whip clearly visible. |
| R5-045 | P1 | "At minimum" variant: the receiver line is now drawn on the floor from a jack on the ROOF RECEIVER rack to the bench end, by two routes (front past the cart bay, round the back), toggled with the lever, with cable clips. Rerouting now only helps while the cart is near the front route (−6 dB below 2 m from the rack, fading to 0 by 4.5 m); the route toast reports the actual dB change. Labels renamed "ROUTE: BY THE CART BAY / ROUND THE BACK". | station.ts, logic.ts, logic.test.ts | Unit test: reroute ≈ +6 dB at 1.4 m, < 1 dB at 7 m. Shots 06/22: lead continues off the bench end to the floor and rack. |
| R5-063 | P1 | `Job.minTier`: jobs 1 and 2 need a reliable decode. A lower tier on LOG is a near miss (toast "It decodes, but N dB leaves no margin…"), not a mistake, job stays open, no cost charged. Job 2 starts with the last engineer's 470 Ω in series if the slot is empty (latch 6.4 V, shutter shut). | logic.ts, station.ts, specs | Unit test: minTier, far-cart no-filter < tier 2, every single C < tier 2 in job 2. New spec 3: 680 nF logs as near miss (mistakes 0, job 0); a lone 3.3 µF does not finish job 2. |
| R5-064 | P1 | `filterCorner()` (LC f0 = 1/(2π√LC), RC with the real resistances). Both tags and the scope show one pair corner ("LC cuts > 1.6 kHz", one bold dashed line "LC corner 1.6 kHz"); per-part corners only when one slot is filled. Tags bigger (0.42 m, 384×192 canvas, 64 px second line) and use words/">" instead of arrows. "resonance boost" marked on the |H| curve and in the panel when the tone gain > 1.05. SHUNT sign moved right of its pad to clear the tag. | logic.ts, station.ts | Unit test f0 ≈ 1592 Hz. Shot 41: tags read "10 mH / LC cuts > 1.6 kHz", "1 µF / LC cuts > 1.6 kHz"; panel "111% (resonance boost)". Cap height ≈ 10 px at 1440×900, not the 14 px asked (see open questions). |
| R5-065 | P1 | Antenna failure no longer prints λ/4: "A 1.5 m whip is a poor match for 100 MHz: most of the signal reflects back down the line." Job asks describe the situation only. Test regex extended, plus checks over `JOBS[].ask` and for rack-label numbers. | logic.ts, logic.test.ts | Unit tests. |
| R5-066 | P1 | `switchOnText()` derives the caption from the simulated step (overshoot > 5 % → "rings"; final volts < latchMin → says how little reaches the latch, per cause). Duplicate toast on SCOPE removed; an info toast is retired when the parts change. Spec comment about "1 mH rings and boosts the whine" corrected. | logic.ts, station.ts, spec | Unit tests: 1 mH+1.5 µF no "ring"; 10 mH+150 nF "ring"; series L + shunt L "only … reaches the latch". Shot 10. |
| R5-115 | P1 | `garbleRate()` uses the judge's thresholds (0 % ≥ 12 dB, ≤ 12 % between 6–12 dB, mostly junk below) and garbles when the tone level < 50 %. Scope decode line colour uses every LOG check; "no signal" below 5 % level; after the last job the line holds the clean message. Panel failing rows use the red `bad` class; S/N row is only ok when the level also passes. `snapshot().station.decodedText` added. | logic.ts, station.ts | Unit tests; 04-bench: 68 µF shunt → S/N 19.2, level 0.07, decode "** %? ~* ?*~"; spec 3 asserts the red S/N row. |
| R5-124 | P1 | Prompt: antenna job → "Fit a whip from the rack", then "O Stand the whip up"; latch job with empty series → "Take a can"; "Turn the knob" only when some value of that can (other slot as is) reaches a reliable decode. LOG resets scope to SIGNAL and clears the knob slot. | station.ts, spec | Spec: after log 1 the prompt has no "Turn the knob"; after log 2 scope is 'signal' and the prompt contains "whip", then "Stand the whip up". |
| R5-180 | P2 (part) | Hover prompts for LOG, scope buttons, speaker and empty slots. (Pick boxes and key caps not done.) | station.ts | Code review. |
| R5-207 | P2 | Filter names for every pair (band-pass for C+C and L+L, high-pass 2-part / RL, divider). | logic.ts | Unit test. |
| R5-253 | P2 | Antenna factor floored at 0.01 (−40 dB); "no signal" on scope and panel below 5 % level; "TONE —" when the tone is under 0.1. | logic.ts, station.ts | Unit test (≥ −40 dB); shot 13 shows "no signal", "TONE —". |
| R5-282 | P2 (part) | Gust animates the whip over ~0.4 s sideways with pale streaks instead of dust balls. Mount not moved to the mast. | station.ts | Shots 12/13. |
| R5-305 | P2 | Flat whip lies toward −x over the low rod rack, away from the scope; lever moved to the front edge, clear of the "1.5 m" caption. | station.ts | Shot 13. |
| R5-306 | P2 | Real slit in the shell with brass ribs; the raised tube passes through it, lowered tube stays inside; trunnion pins join the fork arms (moved in to x ±0.27) and the tube. | room.ts | Shots 30/32. |
| R5-330 | P2 | Dish gets its own DoubleSide material clone. | room.ts | Code review. |
| R5-359 | P2 | Motor: ribbed body with 8 fins, end bells, shaft and pulley, terminal box, mounting feet. (No noise-ring decal.) | station.ts | Shots 04/22. |

Tests: `npm test` 103 passed (observatory logic 24, 8 new); `npm run build` OK; `tests/station-observatory.spec.ts` (3 tests, 1 new) — see the final report for the run result.

## Skipped

| ID | Why |
|---|---|
| R5-124 (sub 4) | Off-bench, `objectives.ts` falls back to "Grab the cart/chair" when the station returns null. **Needs shared change** in `src/ui/objectives.ts`: skip the nearest-prop fallback in station rooms when the current step points at the bench. |
| R5-044 (win shot) | Verifier wants `ObservatoryBench.winFocus` pointing at the dome. **Needs shared change**: `Station` has no `winFocus` hook and `game.winFocus()` (src/game.ts:490) always uses the bench table. Suggest an optional `winFocus?():T.Vector3` on Station (src/stations/types.ts) used by game.ts; the observatory would return (-6.1,1.6,-5.3). The shutter already stays open on win. |
| R5-045 (full rope) | Making the receiver line the real draggable rope needs the `src/game.ts:92/104` station gate opened (shared). Did the reviewer's "at minimum" variant instead. |
| R5-205 | P2, gallery text/colour redesign; not quick. |
| R5-206 | P2 design conflict: removing the green/red rows and the oracle "Log the decode" prompt contradicts R5-115's verify (S/N row must turn red) and R5-124's knob test. Needs a design decision. |
| R5-358 | P2 model rework (dish/prism), not quick. |
| Phone/touch | Out of scope (desktop only). |

## Open questions

1. **Tag legibility (R5-064):** the corner line is ≈10 px cap height at 1440×900, short of the 14 px target. Going further needs a ~0.6 m tag, which doesn't fit between the cans. Accept, or move the per-can numbers into a bigger strip along the board's front edge?
2. **Job 3 minTier:** left at 1 (a thin decode still finishes the antenna job), so the "Every decode reliable" bonus still means something. If all three jobs should need reliability, that bonus should be replaced.
3. **Reroute model:** rerouting now matters only while the cart is near the cart bay (it is an alternative to moving the cart, not an addition). This changes the job-1 balance: the intended path is cart ≥ 4 m + about 1.5 µF shunt.
4. **Pre-fitted 470 Ω in job 2:** fitted only if the series slot is empty at the end of job 1 (a player who used an LC filter keeps their coil).
5. Dev server note: assets under the `node_modules` junction get a 403 from Vite (outside `server.fs.allow`) in worktrees; only the Fredoka woff2, harmless.
