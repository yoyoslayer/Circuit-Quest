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

## Stage 3 — Pip and coworker animation

Prerequisite `ddfed31` is merged in Claude's branch and was merged into `astra/work` before this pass. Only `src/render/pipRig.ts`, `src/render/actors.ts`, new tests, and Astra's capture tools were edited for animation. **No game.ts edits or model exports were made.**

| Entry / brief goal | Change | Files | How checked |
|---|---|---|---|
| Pickup anticipation | Detect the change into carry/plug holding; a brief volume-preserving dip precedes settling into the existing grip. | render/pipRig.ts | Carry transition test and matched before/after capture. |
| Throw and slingshot follow-through | Preserve the models branch's release poses, then let the torso settle over another fraction of a second. | render/pipRig.ts | Before/after throw/release fixture views; finite-joint test. |
| Landing | Add a restrained shoulder/knee settle to the game's existing avatar squash, rather than replacing or doubling its full motion. | render/pipRig.ts | Landing/recovery unit test and visual before/after. |
| Bump / stop | A sudden grounded stop has a small balance-catching response. Optional `bumped` input supports explicit contact impulses. | render/pipRig.ts | Reaction/recovery test; bumped fixture. |
| Celebration / idle | Add celebration anticipation and bent-elbow softness; a long idle relaxes shoulders and eyes, and attention returns immediately when carrying resumes. | render/pipRig.ts | Tired-to-work and celebration tests, visual captures. |
| Failure (shared juice request R5-119) | Optional `failed` pose has lowered arms, a bowed head, and a single small settle instead of cheering. | render/pipRig.ts | Separate failure/celebration unit test and capture. Runtime field request below. |
| Coworker head motion | Faces and head accessories glance toward Pip independently of the torso, with head lag on the existing startled hop/happy bounce. Existing breath, typing, alarms and cheering are retained. | render/actors.ts | Independent-pose and neighbour-isolation tests; same one-mesh/zero-child count; idle/alarm/cheer captures. |
| Rendering cost / toon consistency | Pose only head vertex ranges before render upload; retain vertex colours, normals, one draw call, and identical geometry for toon/outline passes. Quantised settled poses do not upload again. | render/actors.ts | Unchanged settled-buffer version and finite-normal tests; runtime captures collect errors. |
| Hat stability | Integrate the hat spring in small steps so slow software-rendered frames do not destabilize it. | render/pipRig.ts | Low-frame-rate joint-finiteness test. |

Already fixed and intentionally retained from the models merge: R5-324's two-handed low cable pull, R5-337's new arm pivots/helmet/boots, R5-349's distance-based gait, R5-227's strain/air/win face, and the carry-width grip. No re-export of `public/models` was needed.

Capture tools: `tools/astra-animation/capture.mjs before|after` and `coworkers.mjs before|after`, with BASE on 4192 and SWIFT=1. They use explicit lowfx for matched pose comparisons, independently of the full-quality smoke checks. These are presentation fixtures, not evidence of completing a game route. The first default-30-second capture attempt timed out without a saved image; the explicit-lowfx/120-second capture completed with 12 before images and zero runtime errors. Before haul, landing, tired and alarm-coworker images were opened. After Pip images (12) completed with zero runtime errors; landing, tired and bump were opened and compared: the settle is small, eyes remain visible, and boots remain planted. Raw screenshots stay in ignored shots-full/; compact pose metrics and reproducible scripts are committed.

### Needs Claude — animation signals

- In `game.ts` `animateRig()`'s existing `rig.update({...})` call, add **`failed: !!this.failAt`**. The optional pose is implemented and tested, but the caller currently only passes `won:false` on failure; that cannot uniquely identify a failure.
- Optional stronger contact response: pass **`bumped: <a newly registered horizontal player-contact event>`**, clearing the flag after the pose receives it. The current grounded hard-stop response already handles moving into an obstacle; the explicit input adds reactions to impacts while stationary. Do not set it from every floor contact.
- R5-325 remains a shared Game/NPC bubble-placement item: bubble/sweat anchors should follow actual head height when ducked, not an arbitrary world y. No broad Game edits were made here.

### Questions for the product owner

- None blocking. These motions affect presentation only; electricity, grade rules, camera control, collider placement and required items are unchanged.

Stage 3 final verification: **164 unit tests pass**, production build passes. The first browser batch passed 14/16; Meeting layout and the second navigation in the render-quality smoke check exceeded the original five-second ready wait. The first isolated rerun also exceeded Vite's 60-second cold-start allowance. The Astra-only config in `tools/astra-review/playwright.config.ts` gives cold startup 180 seconds and assertions 30 seconds on this shared host; it retains the original software renderer, viewport, routes, and state assertions. Both isolated checks then passed (2/2, 2.9 minutes). Exact outputs are in `tools/astra-animation/stage3-browser*.log`. The full-toon coworker tracking/no-runtime-error test passed in the initial batch. After coworker captures (idle/alarm/cheer) also completed without runtime errors; idle/alarm were inspected. The celebration capture was inspected separately: face visible, hands clear the helmet. No FPS claim is made from screenshots.

## Stage 4 — route and readability regression coverage

Merged Claude through 3bd3d3e before this stage.

| Entry / goal | Change | Files | Verification |
|---|---|---|---|
| B5 idle and clean grading | Idle Rush saves D; actual clean Playground finishes with three As; practice saves nothing. | tests/astra-grading.spec.ts, astra-ui.spec.ts | Idle rerun and both clean/practice cases pass. |
| B5 chaos | New physical single-reel shortcut regression, with state diagnostics. | tests/astra-chaos.spec.ts | Known failure below; no state is forged to win. |
| B6 all eight required routes | Added target-name checks on Meeting/Lunch and pickup/carry checks for all five station routes, supplementing Playground's complete prompt sequence. Ran the five existing full clean station specs. | tests/astra-cable-prompts.spec.ts, astra-bench-budget.spec.ts | Meeting and all five full station routes pass; Lunch final physical failure below. |
| R5-008 | Lunch carry instructions now describe E's actual drop action; plug destinations name the lamp/strip; Meeting's switch names the projector. | ui/objectives.ts, objectives.test.ts | Browser regression found/fixed the shared lamp/projector mistake; 166 unit tests pass. |
| R5-102 / 242 / 247 | Hide duplicate job card at desktop benches, restore panel font to 14 CSS px, hide station panels/toasts while walking. | ui/ui.css | All five initial bench font checks now pass; captures generated. Word counts remain failing below. |

Checks: **166/166 unit tests pass**, production build passes. Initial browser batch: 22/31 pass, including all 15 smoke/layout checks and all five existing full station clean routes. Corrected rerun: 2/9 pass (Meeting and idle Rush); five word-budget failures and two physical-route failures remain. Logs: tools/astra-coverage/stage4-*.log. The bench cap is the review's 25 words outside the monitor, tightened from the initial draft's 35; no canvas-height or all-state text-budget claim is made. The initial Arcade bench capture was inspected and confirmed duplicated text and small labels.

### Needs Claude — known failing regressions

- **R5-102:** Initial bench HTML counts after hiding the duplicate card: Arcade **32**, Garage **34**, QFN **62**, Observatory **69**, Spectrum **52** (target <=25). All shared HTML font checks now pass. In station updatePanel/draw methods, remove duplicated live-value rows and shorten asks/toasts as specified in Stage 2. Arcade still repeats Current on the panel and monitor; retain the measured value on the monitor. QFN must retain one short layer/crossing constraint. Monitor text and duplicate values in canvas require station edits; CSS cannot establish their actual cap height.
- **R5-164 / chaos:** On the single-reel route Pip ends at (10.155,-1.585), strain 1.036, with four bends around standing coworkers. F releases without connecting: strip draw remains zero, so the projector never trips/wins. Reconcile the new coworker cable obstacles with the intended sprint shortcut in Game.simulateCable / Meeting reel tuning. Retain a clean route and a meaningful stretch; do not disable all coworker obstacles. The final diagnostic checks strip draw (the projector load is correctly off before its switch).
- **R5-196 / Lunch:** The early-fridge clean route reaches a baked tray on the lift, capDocked=true, charge=6.7, lift enabled but off. Thin-1 changes from cap to a null end at t=102.53; it is nicked and lying at (7.43,1.2), leaving no lift feed. Prevent a bot detaching the freshly docked capacitor feed before a readable warning/recovery window, or add protected routing feedback at that crossing. See full snapshot/events in stage4-rerun.log. All named interaction checks preceding the final won assertion pass.

Skipped: station canvas text edits, physical cable acceptance and bot/runtime changes are outside ownership. These failing tests remain visible and are not marked skip/expected-failure.

### Questions for the product owner

None blocking. Human clean-run pars and first-time-player testing remain unmeasured. Stage 4 is finished under the brief's explicit known-failure handoff option; these are not claimed as passing gameplay outcomes.

## Stage 5 — remaining owned usability work and final audit

Synced Claude through ebac18c before this stage. The sole merge conflict was the served-row assertion: retained separate label/value assertions, preserving both branches' intent. Shared code was taken from Claude; station mains leads remain visible/usable in GameUI.

| Entry | Change / disposition | Files | Verification |
|---|---|---|---|
| R5-174 (controls), R5-265 | Pause lists Shift dash, Tab/View/L3 survey, Esc/B stand-up, right-drag orbit, wheel zoom and C/RS recenter. Compact paper tiles, readable map, visible pause badge and a scrollable body on shorter desktop windows. Reused the existing retry glyph for recenter. | ui/screens.ts, screens.css | New settings browser checks; settled pause capture inspected. Gameplay assists are a shared dependency below. |
| R5-249 | Muted/Sound on label follows persisted audio state. Keep the fixed Mute audio label plus aria-pressed, per verifier correction. Completion thud/tone plays with reduced motion; card shake remains suppressed. | ui/game-ui.ts, screens.ts | Reload/mute and reduced-motion browser tests pass. |
| R5-250 | Arrows sit outside a clipped tag lane; selected card stays centred. | ui/screens.css | Rectangle separation check passes; settled Jobs capture inspected. |
| R5-274 (owned part) | HQ title gives the door rule; the job card repeats it for four seconds on arrival, then says Enter plus the job name. | hub/lobby.ts, ui/screens.ts, objectives.ts | New HQ card browser case passes. Existing return-at-door session handling is preserved. |
| Station integration | New budget tests now physically plug the bench in. Spectrum uses the side approach; QFN returns via the same safe route as the existing clean spec. | tests/astra-bench-budget.spec.ts | Budget checks remain strict and report known station copy failures. |
| R5-078 / 220 integration | Idle Rush test observes the new grace period and then waits the actual remaining shift; zero cabinets still records D. | tests/astra-grading.spec.ts | Updated idle regression passes. |
| P2 inventory audit | Scanned all 218 P2 entries; ownership uses the complete entry path set, not only Fix. Stop at the report footer; include asset/tool paths so model work cannot appear UI-only. | tools/astra-review/inventory.mjs, p2-inventory.json | Reproducible inventory plus dispositions for every strict owned-only candidate. |

### Skipped / already fixed

- Strict owned-only candidates: R5-162 locked-door rattle/padlock/flash was already fixed in merged lobby; R5-198 desktop fail cause is Stage 2 (phone work excluded); R5-251 campaign rewards is Stage 1; R5-255 Rush served row is Stage 1; R5-266 practice is Stages 1–2; R5-324 low two-hand haul is retained by the models merge and Stage 3. R5-174 controls are now done; actual gameplay assists require shared hooks. No independent owned P2 implementation remains beyond that dependency.
- R5-227 / 337 are implemented by the models merge and Stage 3, with model exports outside ownership. R5-233's Follow the robot and R5-269/271's failing-reading classes/START trace are already present in Claude's station code. R5-247's visible panel/toast leakage while walking is fixed in shared CSS; stale toasts after bench setup changes remain station-owned.
- R5-252/300 canvas sign cap height still needs render/labels.ts; board support and row arrangement already exist. Actual canvas glyph height is not proven by CSS.
- The new perf log requests rigid Pip mesh merging (P1 R5-026). That is a separate animation-performance follow-up, not a remaining P2 UI entry; Stage 5 does not edit the Stage-3-only rig files. Preserve all animated pivots and glossy material classes when integrating it.

### Needs Claude — current dependencies (supersedes historical route failures)

- **Resolved by latest merge:** the Lunch bot crossing fix in lunch3 makes the new early-fridge route win. The new single-reel Meeting chaos regression also wins at this integrated tip. The historical Stage 4 snapshots remain in the log for traceability.
- **Still failing:** station HTML word budgets, target <=25. Current verified counts: Arcade 32, Garage 34, Observatory 69, Spectrum 52; QFN's final route rerun is recorded below. All measured shared HTML font checks pass. Shorten each station's updatePanel asks, remove monitor-duplicated rows, keep QFN's one layer/crossing constraint, and cap fault toasts at 14 words. Do not remove the sole measured value or hide the taught electrical constraint. These checks sample initial bench state, not every fault/pass toast.
- **R5-174 / DR-23:** gameplay assists need shared Game/station support before truthful UI toggles can be connected. Add a run-level assists state with extra time, a longer cable limit, and a station-step skip; expose a station-owned skip operation that follows its normal transition rather than forging won. Apply extra time to the actual Rush/Lunch timers, and cable length to the rope's physical maximum. Preserve grades; latch an assisted-used flag even if toggled off later. Then wire the three pause toggles and the Assisted result tag. A comfort setting would not satisfy these gameplay requirements, so no inert or misleading assist controls were added.
- **Animation signals:** still pass optional failed:!!this.failAt into animateRig's rig.update. An optional newly registered horizontal bump flag can enhance stationary-impact reactions; do not use floor contacts. Coworker bubble anchors and remaining rigid-part performance merging need shared integration as described in Stage 3/perf logs.
- **Other historical shared items:** human par tuning; actual canvas 14-pixel cap height and repeated monitor values; station toast clearing on setup changes; real PTC behavior/disclosures and campaign documentation remain in their owners' files. This pass does not claim those are all resolved.

### Questions for the product owner

No blocking questions. HQ's short rule is shown on each arrival, so returning players also get context. Human timing/first-time-player studies remain unmeasured. The five assigned stages have reached their owned-file stopping point; Stage 4 uses the explicitly authorized known-failure handoff. Full game completion is not claimed.

Verification before final commit: 171 unit tests pass and production build passes. Initial 30-check browser run: 24 passed, six failed (three measured word budgets, two test approach mistakes after the new cable integration, and the obsolete idle-wait duration). Corrected rerun: 4/5 passed; only Spectrum's word budget remains. Settled pause and Jobs captures were opened after fixing the stretched tiles and waiting for card entrance animation. Capture server 4192 was stopped via its own session. Final QFN/result audit follows below.

Final Stage 5 audit: the corrected QFN return route reaches the bench. Four net pad-count labels inherited a station-specific 13 px rule; the owned desktop CSS override now makes that final font check pass. QFN still measures **62 words** and fails only the strict 25-word budget. Final initial-state budgets are **32 / 34 / 62 / 69 / 52** for Arcade / Garage / QFN / Observatory / Spectrum. All five are explicitly failing regressions awaiting station-copy changes, not expected-failure skips.

Across the 30-case final selection and corrected reruns, **25 unique checks pass** (all gameplay routes, idle D, clean three-A, practice isolation, settings, animation, smoke and layouts), and **five bench word-budget checks fail**. The final QFN-only run confirms the font fix independently. Latest production build passes; unit suite is **171/171**. Exact output: tools/astra-finish/{browser,rerun,qfn-rerun,qfn-final,unit,build}.log. Raw captures remain ignored as required; reproducible specs, compact status and logs are committed. All authorized owned work is at its stopping point; shared-file dependencies above remain open.


## Follow-up — five bench budgets and animation (2026-11-05)

The user explicitly asked to resolve the five remaining bench checks and improve animation. This authorizes the necessary station and game integration edits in the isolated `astra/work` worktree; the main/Claude worktree is untouched. This section supersedes the five-copy-failures and unwired-failure-input handoff above.

- Arcade: remove duplicate chain/current/hottest readings from HTML; retain a readable numeric target, parts receipt and battery endurance. Longer story moves to paused notes.
- Garage: remove duplicate wiring/part descriptions; retain the current job's graded stop spike, brake release or start sag and the brake's actual 2 ms requirement.
- Observatory: leave signal/noise, tone and filter information on the scope/cans; retain cart distance, relevant latch voltage and parts.
- Spectrum: leave path, band, power and measured margin on the physical LINK monitor. The playthrough observes actual canvas text to verify that information survives removal of the duplicate HTML.
- QFN: joined-pad counts during routing; cost/par, worst bypass loop, temperature and grade after connection. Keep the physical edge/orientation requirements in shorter prompts and full ratio explanations in paused notes.
- Animation: wire the real Lunch failure into Pip's existing failure pose, start victory hops with anticipation using event time, bend the knees, and kick the hat spring gently on landing. Unit checks cover clock-independent entry and settling; gameplay test lets the unpowered fridge spoil naturally.

The first browser pass exposed QFN's longer connector prompt (27 words) and an interrupted Garage route from a live reload. The prompt was shortened without dropping edge/orientation requirements; subsequent runs use stable source. The new failure-pose test initially approached the fridge through a wall; its route now passes through the doorway. These were test/development issues, not hidden skips.

Pause integration: expose each station’s full notes in a native details element inside the pause menu. The former HUD profile CSS was ineffective because pausing hides that entire layer. Each budget route now opens its actual Bench notes and checks that the content is visible.

Verification tooling: `PW_PREVIEW=1` uses the built game and bundled Fredoka font, avoiding the shared node_modules junction’s dev-server font denial. Use a single merged object in defineConfig: multiple config arguments concatenate web servers and started duplicate servers. No dependencies were installed.

Test corrections: wait for Pip’s initial failure dip to settle before checking the resting squash. Observatory’s over-filtered message can have high S/N while its absolute level is too low; verify low level, garbled decode, and actual scope text rather than requiring low S/N. The monitor observer must be installed before navigation.

Final verification: production build passes; 173 unit tests pass. Across focused runs, 15 unique browser checks pass: five entry/working bench budgets (plus selected QFN and all five pause notes), five full station completions, Observatory fault recovery, real Lunch failure pose, full-render coworker animation, clean three-A result, and smoke. The final six-case production run and QFN scrolled-notes capture pass without skips. Entry budgets are 18 / 10 / 25 / 19 / 13 words; working budgets are 21 / 16 / 25 / 19 / 11. Ready QFN boards use 11 / 15 / 21 words. All measured shared HTML labels are at least 14 CSS px. Twelve animation presentation captures report no runtime errors; landing, cheer and failure poses and the production QFN ready-board/expanded-notes captures were inspected.

Evidence: tools/astra-finish/bench-{unit,build,playthroughs,production-final,notes-final,notes-qfn,animation}.log and summary.json. Earlier failed runs remain for traceability; the corrected final runs supersede them. The sampled budgets cover steady bench states after transient feedback clears; remaining canvas legibility/duplicates and transient-toast budgets are not claimed complete.
