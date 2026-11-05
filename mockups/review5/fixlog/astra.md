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


Isolated lobby rerun: passed in 20.7 seconds on port 4191. Thus every selected assertion passed, with the original context-setup timeout retained above for traceability. No source changes were made between the combined run and this rerun.


## Stage 1 follow-up — progression consistency

| Entry | Change | Files | Verification |
|---|---|---|---|
| R5-285 | Every result returns to HQ as its primary action. The optional secondary action targets the next unfinished, unlocked, required job. | ui/screens.ts, ui/game-ui.ts | Markup tests and build; browser checks below. |
| R5-238 (owned portion) | Practice completion suppresses grade medals and the grade announcement; records remain untouched. Unlimited fuses/sub-job selection require station changes (Needs Claude). | ui/screens.ts | Markup test. |
| R5-078, R5-251 | Crew Gold rim on the HQ door medal; cabinet-count personal best is persisted and compared higher-is-better. | hub/lobby.ts, ui/store.ts, ui/screens.ts | Unit tests and build. |

Still delegated to Claude: station practice rules (free parts/fuses and sub-job selection), per-level limits and station gameplay changes previously listed. R5-112's remaining hollow-star presentation is handled with Stage 2's HUD work.

Stage 1 follow-up verification: production build passed; the expanded browser run finished with 23 passes (all 10 routes and all 10 layouts included) and three smoke timeouts, not failing state assertions. Exact output: tools/astra-grading/stage1-browser.log. Screenshot meeting-complete.png was inspected; the new HQ primary action is visible (the legacy capture occurs during entrance animation, so it is not proof of settled card layout). The concurrent unit rerun had two existing Arcade timeout failures; the subsequent single-worker rerun also exceeded the existing 30-second 500-cabinet stress-case limit. OS inspection showed only ~1 GB free physical memory, with two other worktrees running browser suites and several capture jobs. Their processes were left untouched. Further verification will run sequentially, with longer browser timeouts. No assertion failure is being waived as a pass.

Stage 1 owned implementation is ready for integration; remaining gameplay/threshold/teaching changes are explicitly delegated in Needs Claude above. Hollow provisional stars are in Stage 2. Human par timing remains unmeasured.

## Stage 2 — prompts, job card, and readable feedback

Merged `origin/claude/nifty-knuth-519jg0` through its models and colour merges before this pass. The model prerequisite now passes. The main checkout was not edited.

| Entry | Change | Files | How checked |
|---|---|---|---|
| R5-008 | Shared E carry prompts say what pressing E does: put the named item down. Job IDs keep names such as robot, parts crate, and resistor tray. | ui/objectives.ts | Unit cases and physical clean-route UI checks. Station-specific acceptance remains below. |
| R5-102, R5-242 | Shared desktop HTML label floor is 14 CSS px. Rush's count appears once as the first graded row, not a duplicate caption. | ui/ui.css, ui/game-ui.ts | Build; dedicated bench budgets in Stage 4. Canvas glyph height is not proven by a CSS check. |
| R5-103, R5-109 | Keep the existing outlined, depth-independent marker and destination targeting; raise it relative to elevated Pip when close. | ui/objectives.ts | Browser regression checks. |
| R5-105, R5-107 | A completed-step flash no longer leaves the previous object's sentence on screen. Ordered latching is preserved; station `(E)` suffixes are removed in the shared adapter. | ui/objectives.ts | Actual Playground progression at 0.1 s after each action; legacy objectives specs. |
| R5-112 | Keep/time bonuses are hollow provisional stars during play; achievement stars light when earned. Hover gives the goal. Final results still evaluate actual conditions. | ui/objectives.ts, ui/ui.css | Unit cases and browser assertion of zero earned stars at spawn. |
| R5-114, R5-091, R5-038, R5-279 | Fridge safety is explicit, oven feed must actually be live while baking, safety steps can reopen, and the conveyor step is retained. Once baked, the completed feed step does not prevent sequencing power away. The chill bonus avoids an unexplained percentage. | ui/objectives.ts | Predicate unit tests, shared browser regressions; full Lunch gameplay remains owned by Claude. |
| R5-198 | Both Lunch fail cards name the cause in eight words or fewer. No invented duration is printed. | ui/screens.ts, ui/screens.css | Pure markup cases. |
| R5-245, R5-250, R5-273 | HQ/LED/QFN casing is retained, ordinary BIG becomes Big; practice spelling is consistent. HQ gets its home icon, absent gamepads are hidden, title includes survey/pause keys, and irrelevant hub pause tallies/Jobs button hide. | ui/screens.ts, hub/lobby.ts, ui/*.css | Unit cases, build, smoke, visual result inspection. |
| R5-262 | Recovering an unplugged floor plug takes priority over an unpowered lamp-switch prompt. | ui/objectives.ts | Regression unit case. |
| R5-272 | Hide F's cable button in station rooms and HQ; retain Q because carried props can be thrown. | ui/game-ui.ts, ui/ui.css | Build/browser startup. |
| R5-223, R5-254 | Rush ring follows its three-minute countdown; final 30 seconds receive a restrained red clock and a quiet tick. | ui/game-ui.ts, ui/ui.css | Build; countdown presentation uses existing rushStatus data. |
| R5-280, R5-366 | Every prefab kind has a readable name enforced by a complete Record and a data-coverage unit test. | ui/objectives.ts | Type check and unit test. |
| Lunch gauge truth | Fractional draw fills fractional budget pips (1.5 no longer appears as two full bars). | ui/lunch-hud.ts | Source/build inspection. |

Verification: all 19 selected browser checks passed in 9.7 minutes on port 4191. Exact log: `tools/astra-ui/stage2-browser.log`. Settled `artifacts/astra-clean-result.png` and `astra-practice-result.png` were opened and inspected: cards fit, the clean route has three As, practice has no medals, and Pip/the lamp remain visible. Unit/build final rerun is recorded below. The new lobby-reward test initially imported browser-only rendering; it now tests the pure `campaignProgress()` used by the real lobby, so it does not require DOM globals.

### Skipped / already present

- R5-107's ordered step latching and R5-103's depth-independent outlined arrow were already fixed; retained.
- R5-135 and all phone-only portions are deferred, per desktop-only scope.
- R5-174's added pause controls and comfort assists are handled in Stage 5.
- R5-183's world plaques, R5-242's canvas label dimensions, and R5-252's labelTexture font sizing belong to Claude's files, not this pass.

### Needs Claude — exact B6 shared changes

- **R5-008:** use the same landing predicate for prompt and delivery acceptance: QFN crate acceptance from Pip within 2.6 m of stand/side table; Arcade tray from the actual delivery predicate (tray within 2.6 m or Pip within 2.2 m). Far-pad Spectrum E says put the pod/mirror down, never carry it. Shared normalization handles imperative Carry/Bring/Roll/Move, but cannot repair a station's misleading Set prompt near a failed snap zone.
- **R5-102:** Arcade `updatePanel` should retain Chain/Parts and remove Current/Hottest block when the monitor already prints them. Hide station panels while walking. Keep station toast copy within 14 words. Remove duplicate live values from other station panels/monitors at their draw/update methods. Bench word-budget failures from Stage 4 will identify exact remaining text. Do not remove the taught measured value altogether.
- **R5-183 / R5-242:** Garage scope stop time axis 0–2 ms and slow-motion badge; Observatory tuned-values/not-to-scale tags; QFN teaching-grid disclaimer; Spectrum band disclosure. Enlarge/stabilize canvas label glyphs to 14 actual pixels at 1440×900 (CSS cannot fix those textures).
- **R5-109:** keep each held station item's step target at its destination, not its position in Pip's hands; this adapter preserves station `at()` functions. Garage footprint cue and station labels remain station-owned.
- **R5-252 / R5-300:** `render/labels.ts`: expose fixed font-size/wrapping to `signPlate`/`labelTexture`; then each door/directory label can share cap height instead of auto-shrinking. Existing board row order/supports and lamp/plate separation were already fixed.
- **Juice shared list:** Lunch runtime should expose/use its oven burn-warning state in the HUD (warning constant is BURN_WARNING=60); use the shared plug flash/trip sounds and hitstop at the runtime call sites listed in juice.md. Those calls are not in Astra's files.

### Questions for the product owner

- No blocking design questions. Desktop HTML's 14 CSS px minimum is independently testable; actual 3D cap height remains a station render/camera task, not a claim made by this pass.

Stage 2 final verification: **155 unit tests pass**, strict production build passes, **19/19 browser checks pass**. This also rechecked the earlier new-test import failure and the existing Arcade stress-test timeouts successfully. Selected browser run used port 4191; capture server for Stage 3 is reserved on 4192.
