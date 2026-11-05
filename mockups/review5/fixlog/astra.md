# Astra review work

Branch: astra/work. Isolated checkout: C:/Users/yousi/Circuit-Quest-astra.
The main checkout had an in-progress merge when this work started and was not modified.

## Stage 1 checkpoint — grading and progression

| Entry | Change | Files | Verification |
|---|---|---|---|
| R5-078 | Rush result grades work served (10/6/3 cabinets for A/B/C), with a one-letter excessive-damage penalty; zero cabinets is D. Ordinary best-of-three grading is preserved. Crew Gold requires all A axes and all three stars in one run. | sim/grade.ts, ui/game-ui.ts, ui/screens.ts | 135 Vitest tests pass, strict production build passes; browser idle-shift test passed, smoke/layout suite running at this checkpoint. |
| R5-078, R5-251 | Persist actual single-run mastery without synthesizing it from separate stat minima or star unions. HQ bonuses are distinct: finish required jobs, three Crew Gold jobs, collect 15 stars. Jobs shelf marks mastery. | ui/store.ts, hub/lobby.ts, ui/screens.ts, ui/screens.css | Grade and persistence unit tests, production build. |
| R5-243 (owned portion) | Rush result text says Cabinets fixed rather than Orders served. First grade row counts cabinets, not elapsed time. | ui/game-ui.ts, ui/screens.ts | Production build and idle-shift browser check. |

Already present / skipped: previous-best rows and record.old (R5-099); pause bonus descriptions (R5-112/R5-251); B-or-better locks and optional Rush exclusion in store/lobby (R5-126); conveyor objective (R5-038); live kitchenFed predicate (R5-114); mail-cart reach exception (R5-181, FIXED.md). None were reimplemented.

Stage 1 remains partial. Further review entries and visual checks remain; stages 2–5 have not been completed. Do not interpret this checkpoint as full project completion.

### Needs Claude

- R5-033/R5-035: arcade/logic.ts and station.ts are outside ownership. Apply verifier-corrected story bands (handheld .003–.009, star .003–.005; hopper .006–.012, star .006–.008), pairwise-distinct best chains; Rush starts must judge tier 0, symptom-only stories, no consecutive best-chain repeats, later combined faults and battery/base jobs. Add corresponding station-owned logic tests.
- R5-069: sim/lunch.ts/runtime: begin fridge warming after first kitchen entry or cable pickup, or allow roughly four minutes idle. No campaign reorder was attempted.
- R5-078: gradeRush is exported for optional reuse by a station grade hook. The owned GameUI.won currently normalizes Rush grades before recording/rendering; no shared game.ts/station type changes were made. If adding Station.grade(), use this function, count eligible served cabinets, and retain result/saved grade consistency.
- R5-078/R5-084/R5-221: tune Level.limits and station limits from human runs; route cable floors through Level.limits in game.ts. Keep bench waste/energy distinct from room repair cost, or give explicit breakage allowance. Do not silently exempt all job items from damage.
- R5-079/R5-085: remaining station physical/chaos acceptance changes belong to station files. Accept resting thrown deliveries per-frame using the verifier's speed/distance checks; do not remove global impact costs.
- R5-220: Rush clock still starts on entering the room. Start at first bench activation or preload the tray and spawn at the stand; HUD should say ready before the clock starts.
- R5-243: update current campaign and electrical lesson documentation outside Astra's file allowlist; retain historical PROGRESS entries.

### Questions for the product owner

- Human-time grade pars remain unmeasured; use existing limits until clean playtest timings exist.
- Rush's work-based overall grade is a mode-specific exception needed for the explicit zero-cabinet-below-A goal. Ordinary jobs keep AGENTS rule 6.

Browser verification note: the initial lobby layout test timed out during browser.newContext setup (120 seconds), before its audit assertion. Other room layout tests have passed so far. The smoke title screenshot was visually inspected; no visual claim is made for the new mastery treatment yet. Models prerequisite: merge-base --is-ancestor ddfed31 origin/claude/nifty-knuth-519jg0 returned 1; Stage 3 is deferred until that commit is merged.


Completed browser run: 15 passed, 1 failed in 9.4 minutes. The sole failure was the lobby browser-context setup timeout described above; the idle Rush regression, all nine non-lobby layout checks, and all five smoke checks passed.

