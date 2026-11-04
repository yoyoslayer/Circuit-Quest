# Circuit Crew: design rules for review 5 (key `rulebook`)

These are the rules every review 5 reviewer checks the game against. Each rule is numbered **DR-NN** and has three parts:

- **Rule:** one line that can be checked.
- **Why:** the source. *AGENTS n* is a hard rule in `AGENTS.md`. *ART Rn* is a rule in `mockups/review5/RESEARCH_ART.md` Part A. *EXT* items are from `mockups/review5/research-external.md`. Concept art lives in `concept/`.
- **Check:** how to verify the rule in this build. That can be a screenshot through `mockups/review5/tools/cap.mjs`, a test in `tests/*.spec.ts`, or a code check.

Some rules also have a **Known:** line. It records what the research passes already saw, so reviewers can confirm the problem, or spot a regression, rather than rediscover it.

**Conventions**

| Term | Meaning |
|---|---|
| Game camera | Default orbit at 1440×900: zoom ≈ 26–36.5, FOV 30. |
| Close | `g.zoom(-1500)`, which clamps to 9. |
| Survey | Tab (zoom 44, `src/game.ts:366`). |
| Bench view | The station camera after pressing E at a bench. |
| Luma | Median sRGB luma, 0–255, measured on a crop. |

**Priority guide:**

| Priority | When to use it |
|---|---|
| **P0** | A rule break that blocks play: soft-lock, crash, a control that does nothing, a job that can't be finished. |
| **P1** | The break noticeably hurts fun, teaching or understanding. |
| **P2** | The break is polish. |

Each rule lists the category to file a finding under: fun, playability, teaching, clarity, model-detail, art-style, overlap or visual-bug.

**Hard rules digest** (AGENTS.md, do not relitigate):

1. Solo only.
2. Play by doing, with a minimal text HUD. The product owner allows an objective card plus a one-line key prompt.
3. Big, dense rooms with hundreds of props.
4. The cable is the star: finite length, wraps, strain shown white → yellow → orange → red, slingshot.
5. Clean solution first, chaos shortcuts second, and chaos is never a fail.
6. Good Job grading: time, damage and cost, with the overall grade the best of the three.
7. Forgiving interaction: a plug that looks in snaps in, and stuck items respawn.
8. Player-orbit camera with occlusion fade.
9. Toon look: 3-step ramp, dark outlines, ACES, restrained glow.
10. Electricity is truthful at the level taught.

---

## FUN

**DR-01: Every room has a tidy route and at least one chaos route, and both finish the job.**
- **Why:** AGENTS 5. Paladin's process was tidy puzzle first, destructive shortcuts second. Human: Fall Flat gives one obvious solution and one absurd one (EXT R-FUN-1).
- **Check:** every level, station rooms included, has a spec in `tests/*.spec.ts` that reaches `snap().won===true` by the clean route, and another that reaches it by a chaos route.
- **Known:** station rooms have `obstacles:[]` and no designed chaos shortcut (R4A, still true). Category: fun.

**DR-02: Chaos is never a failure. Only a mistake in the taught concept can end a job early, and it always offers a one-key retry.**
- **Why:** AGENTS 5 and 6. Juul, *The Art of Failure*: players accept failure they caused and understood.
- **Check:**
  - List every fail path (grep `fail`/`retry` in `src/`; Lunch's spoil and burn are at `src/lunch-runtime.ts:285-286`). Each must be caused by an electrical or sequencing decision.
  - Script a run that knocks over every reachable prop, then solves cleanly. It must still reach `won`. Category: fun / playability.

**DR-03: Something funny or physical happens within the first 30 s of a room, without the player looking for it.**
- **Why:** Good Job reviewers praised the slapstick. Paladin prototyped the core action first (EXT R-FUN-3).
- **Check:** from spawn, script `walk` to the nearest prop, then E, then throw (Space), or a cable sprint followed by Q. Before `snap().time` reaches 30, expect `fastestProp > 5`, or `alarmed > 0`, or a spark or confetti burst in the screenshot. Category: fun.

**DR-04: The world reacts to chaos. A coworker within 3 m of an impact or a spark shows the alarm pose (the "!" bubble and sweat) within 0.5 s.**
- **Why:** reviewers' complaint that Good Job's coworkers barely react (EXT R-FUN-4).
- **Check:** throw a prop onto a desk next to a blob, `advance(.5)`, then check that `snap().alarmed ≥ 1` and that the bubble is visible in the screenshot (`src/game.ts:430`). Category: fun.

**DR-05: The cable is the star in every playable room. Each job involves at least one physical cable act: drag, route, wrap, plug or slingshot.**
- **Why:** AGENTS 4.
- **Check:** `snap().rope.maxLength > 0` and a cable is visible at the game camera on every level.
- **Known:** the cable is not simulated or drawn in station rooms or the lobby (`src/game.ts:104`). Decide per room whether a bench lead or a room cable counts. If neither exists, file P1 fun.

**DR-06: The slingshot is discoverable and has a reward in reach.**
- **Why:** AGENTS 4. Good Job's "electronics as slingshots" is its signature moment.
- **Check:**
  - The Q prompt appears when strain > 0.97 (`src/ui/objectives.ts:79`).
  - Each cable room has a fling target within reel length plus 2 m of a plausible route, such as the Playground pins.
  - A scripted overstretch then Q moves at least one target prop more than 1 m. Category: fun.

**DR-07: Each grading axis is tuned per room. A clean run can earn an A on every axis. Standing still or pure wrecking can't earn A on all three.**
- **Why:** AGENTS 6. Good Job reviews found "best of three" odd when wrecking still earns an A (EXT R-FUN-7).
- **Check:**
  - Every level passes its own `limits` to `grade()`; the default is 120 s / 10 / 300 (`src/sim/grade.ts:3`).
  - The clean spec's time is within `limits.time`.
  - The result card shows which axis earned the grade.
- **Known:** Lunch uses the 120 s default, which its clean run can't meet. Category: fun.

**DR-08: Room lengths are even. No clean solve takes more than 2× the median clean solve.**
- **Why:** Good Job reviews complained about uneven stage length (EXT R-FUN-5).
- **Check:** record `snap().time` at `won` for each clean spec, then compare against the median. Category: fun.

**DR-09: No dead time. No walk longer than 8 s passes nothing interactive, and no locked wait is longer than 3 s.**
- **Why:** EXT R-FUN-6; Overcooked's lesson is to keep tasks readable at a glance.
- **Check:** time the longest `walkTo` leg and the longest locked wait in each spec. The arcade play-test soak is 3 s (`HOUSE.soak`). Category: fun.

**DR-10: Every room has a bonus a chaos player can chase, and the bonus goal can be found in the world.**
- **Why:** AGENTS 5 and 6. The Playground pins are the model.
- **Check:** each `bonuses` list in `src/ui/objectives.ts` has at least one physical or chaos bonus, and its target is visible in the survey shot. Category: fun.

**DR-11: Success and failure moments are juicy and keep Pip in frame. They have flash, sound and a short hitstop, and the win push-in frames Pip together with the working machine.**
- **Why:** "Juice it or lose it" and Screenshake (EXT); QA 10 reported that Pip was missing from the win shot.
- **Check:** take a win screenshot after `won`. Pip and the machine both sit inside the centre 70% of the frame (`winFocus`, `src/game.ts:398`). Category: fun / visual-bug.

## PLAYABILITY

**DR-12: The camera never hides Pip.**
- **Rule:**
  - Any mesh taller than 1.2 m between the camera and Pip's feet, chest or head fades to opacity ≤ 0.25 within 0.2 s.
  - That covers walls, half-walls, racks, shelves, cabinets, vending machines, carts and the dolly.
- **Why:** AGENTS 8; ART R14.1. Good Job's #1 complaint was the camera.
- **Check:** sweep 8 yaws (`g.orbit(±200…)`) at zoom 9 and zoom 38 per level. At least 70% of Pip's pixels stay visible.
- **Known:** only pillars are occluders (`src/levels/decor.ts:55`), and there is one ray to `p.y+.4` (`src/game.ts:387-388`); ART F1. P1 playability.

**DR-13: The current step's target is never hidden. From any orbit it is visible, its occluders fade, or the marker draws over them.**
- **Why:** EXT R-PLAY-1; Good Job reviewers said "the camera hides objectives".
- **Check:** use the same sweep as DR-12, but at the `at()` point of the current step (`src/ui/objectives.ts`). Category: playability.

**DR-14: A plug that looks seated snaps in, and the snap zone is signposted before release.**
- **Why:** AGENTS 7.
- **Check:**
  - Drop a plug 0.3 m and 1.2 m short of its socket. Both connect (the snap radius is 1.6 m with strain < 1.12, `src/game.ts:205`).
  - A magnet or highlight cue shows from about 2 m out. Category: playability.

**DR-15: Required items can't stay stuck anywhere. An id'd item that has been unreachable for 6 s respawns with a puff, whether it is high up, wedged, inside a collider or behind furniture.**
- **Why:** AGENTS 7; The Sixth Axis noted items getting stuck in Good Job.
- **Check:** shove each required item into a corner behind a cabinet at floor level, `advance(10)`, then confirm it is back near `home`.
- **Known:** respawn only fires above y 2.1 m, or below y −3, or out of bounds (`src/game.ts:339-342`). An item wedged at floor level never returns: P0 if a required item can wedge.

**DR-16: Clutter never blocks the clean route. Keep 1.2 m lanes, and clutter adds less than 1 m of detour to the spec route.**
- **Why:** EXT R-PLAY-4; ART R13.2; The Sixth Axis complained of "too many physics props in the way".
- **Check:** replay the spec's `walkTo` legs with clutter on and with it off, using the same seed. Compare the path length and confirm there is no extra stall. Category: playability.

**DR-17: No false affordances. A grabbable prop that looks like a job item (a reel, splitter, plug or cable) only appears where it is part of the job, or it looks clearly different.**
- **Why:** AGENTS 2, play by doing (the player learns from what the world offers); Untitled Goose Game's easy-to-read goals.
- **Check:** in each level's start and survey shots, count reel-like and splitter-like props that aren't job items.
- **Known:** the `parts` clutter recipe adds extra reels and splitters to the Playground (`src/levels/clutter.ts`). Category: clarity / playability.

**DR-18: Grab selection prefers the job item. When a required item is within 0.4 m of reach of the nearest junk prop, E or F takes the required item.**
- **Why:** AGENTS 7; the Good Job reviews' "finicky controls" complaint.
- **Check:** stand between a mug and the job item. The prompt and the grab cue name the job item. `nearest()` currently sorts by reach only (`src/game.ts:192`). Category: playability.

**DR-19: Every key prompt is a real action at that moment, and the key does what the prompt says. A key never toggles something off while the player is trying to retry.**
- **Why:** EXT R-CLAR-4, EXT F6.
- **Check:**
  - Walk every prompt state and press its key.
  - Arcade: power, then trip, then fix the chain, then P. The run should end with `snap().station.live===true`, not POWER OFF. Category: playability.

**DR-20: Retrying is cheap: under 3 s from a failure message to the next possible input, with no menu in between.**
- **Why:** EXT R-PLAY-6; Juul.
- **Check:** time from the fail card (Lunch spoil or burn, a bench fuse trip) to the first accepted input. Category: playability.

**DR-21: The survey (Tab) shows the whole room, with every wall and the goal, at 16:10 and on a phone in portrait.**
- **Why:** AGENTS 8; QA 7, where the survey cropped part of the room.
- **Check:** take the survey shot at 1440×900 and at 390×844 for each level. Survey zoom is a fixed 44 (`src/game.ts:366`). Category: playability.

**DR-22: Controls are consistent across rooms.**
- **Rule:**
  - The same key means the same verb everywhere: E grab/use, F plug, Q let go, Space throw, Tab survey, Esc stand up.
  - Orbit and zoom work in every room. Zoom clamps 9 to 38.
  - No game key acts while a menu is open.
- **Why:** EXT, the Totally Reliable Delivery Service lesson about janky controls; QA 1 and 14.
- **Check:** use a key matrix per level and check the bench views, the workshop picker and pause. Category: playability.

**DR-23: Solo assists exist and never block grading: more time, a looser cable limit, and skipping a station step. Assisted runs are marked as such.**
- **Why:** AGENTS 1 (solo); Moving Out's assist mode (EXT R-PLAY-5).
- **Check:** the pause menu offers the assists, and an assisted run still reaches `won`. Category: playability (P2).

**DR-24: Performance holds at ≥ 50 fps on the host GPU and ≤ about 250 draw calls at the game camera in every room.**
- **Why:** AGENTS 3, dense rooms; LR15 (Lunch was 1090 draw calls, now about 175).
- **Check:** `snap().fps` and `snap().drawCalls` at start and in the survey per level. Category: playability.

**DR-25: No soft-locks.**
- **Rule:**
  - Every required item, door, bench and socket is reachable.
  - A destroyed or cut required part is replaced or recoverable.
  - No order of actions leaves the job unfinishable without a retry.
- **Why:** AGENTS 5 and 7.
- **Check:** for each room, cut or scorch every cable, wedge every required item, and close the door on the cable (Lunch). The job must still be completable, or a retry must be offered. P0 if not.

## TEACHING

**DR-26: The mechanic is the concept. Every electrical idea is taught by a physical act (routing, plugging, chaining, flipping, docking), never only by picking a value from a list or reading.**
- **Why:** Habgood & Ainsworth 2011: children learned more, and chose to play about 7× longer, when the maths was the mechanic. Also AGENTS 2.
- **Check:** list each concept per room from the specs next to the act that teaches it. Flag any concept with no act. Category: teaching.

**DR-27: Each job adds one new idea and reuses the previous one, in this order: loop/switch, then length/route, then load budget, and so on.**
- **Why:** Turing Tumble (EXT R-TEACH-3).
- **Check:** make a table of the new idea per job and the reused idea per job, from `docs/` and the specs. No job introduces more than two new ideas at once. Lunch's 7-step chain is a likely break. Category: teaching.

**DR-28: Failure shows its cause in the world first (a spark, scorch, flicker or groan at the faulty part), then one sentence names the physical cause.**
- **Why:** Juul; EXT R-TEACH-2; LR4.
- **Check:** take every failure screenshot about 0.5 s before the message, then with the message. The cue sits at the faulty part, and the sentence names the part and the cause. Shots `research-external-04` and `-08` pass. Category: teaching.

**DR-29: Moving glowing dots mean "current is flowing" and nothing else. They appear only on a closed, live loop.**
- **Why:** EXT M2 (the "electricity flows to the device" misconception) and R-TEACH-4.
- **Check:** grep every moving-bead effect. Take a meeting screenshot after 40 s idle: no moving dots before the plug is in.
- **Known:** the idle route hint at `src/game.ts:100` uses 40 cyan flowing dots on an open circuit. P1 teaching.

**DR-30: Current is not used up and doesn't arrive part by part.**
- **Rule:**
  - Pulses move at the same speed before and after a load.
  - They start everywhere in the loop at once.
  - A resistor placed before or after the LED gives the same reading.
- **Why:** EXT M1 and M4 (Küçüközer & Kocakülah: 38% think current is used up).
- **Check:**
  - Crop the pulse spacing on both sides of a load.
  - Put the arcade chain block on the + side and then the − side. `snap().station.reading` is identical.
  - Check frame 1 after power-on. Category: teaching.

**DR-31: Every displayed number is the simulation's own value, and the bench lets the player predict before testing: inputs (V, R) show before power, results after.**
- **Why:** EXT R-TEACH-5; the PhET circuit simulator.
- **Check:** compare the monitor text with `snap().station`, before and after P. Category: teaching.

**DR-32: Every stand-in is labelled as one. Abstract units such as Lunch "bars" are tied to something real, and false colour and scale are disclosed.**
- **Why:** EXT R-TEACH-6; LR12 ("bars never map to amps or watts").
- **Check:** look for "not to scale" (spectrum ✓) and "false colour" captions. Bars carry a unit hint, such as 1 bar ≈ 1 A at 230 V, or a stated "load units". Category: teaching.

**DR-33: Hazards follow real cause and effect. An undamaged insulated cable in water doesn't short; exposed metal does (plugs, splitters, the reel, scorched cable).**
- **Why:** AGENTS 10; EXT M9 and F1.
- **Check:** in `tests/lunch-rules.spec.ts`, a cable crossing a puddle with both ends dry stays live, and a splitter in a puddle trips.
- **Known:** any segment over a puddle counts as wet (`src/lunch-runtime.ts:207-208`). P1 teaching.

**DR-34: The wording is physically right everywhere: in code strings, docs, the card and toasts.**
- **Rule:**
  - Volts are "across", current is "through".
  - A capacitor *supplies* a start-up kick; it doesn't "absorb" or "eat" it.
  - A fuse protects the wiring.
  - A short is a low-resistance path, not "to ground".
  - Star ground is a shared return.
- **Why:** AGENTS 10; EXT M6, M7, M8 and M11; LR11.
- **Check:** grep `absorb|eats? the|flows to|to ground|pressure` in `src/` and `docs/`. `docs/GAME_DESIGN.md:23` and LEVEL_02 step 6 are known fails. Category: teaching.

**DR-35: Invisible bands are never shown in visible hues unless labelled "false colour". All bands travel at the same speed, and radio is never presented as sound.**
- **Why:** EXT M10 and F3.
- **Check:** in spectrum and observatory screenshots with each band selected, only Visible has a real hue; the others are neutral, or a "false colour" caption is present (`src/stations/spectrum/logic.ts:48-52`, `src/stations/observatory/room.ts:32-38`). Category: teaching.

**DR-36: Every hazard or failure rule in `src/sim/*` and `src/stations/*/logic.ts` has a one-line comment giving its real-world justification and noting that its numbers are tuning values.**
- **Why:** AGENTS 10; EXT R-TEACH-7.
- **Check:** grep each `trip|pop|burn|spoil|short` rule for an adjacent comment (`src/stations/arcade/logic.ts:4` is the model). Category: teaching (P2).

**DR-37: Hidden rules are shown by the world before the player can fail them.**
- **Rule:**
  - Order constraints, such as the meeting coupler before the reel, show in the shape of the parts.
  - Range tricks, such as sprinting to overstretch, get a visible hint.
  - Invisible wiring, such as the Lunch hard-wired feed post, is drawn.
- **Why:** Twinfinite: nothing explains the mechanics. R4B; M8, M9 and LR13.
- **Check:** take a blind-play screenshot at each constraint. The constraint can be read without having failed first. Category: teaching / clarity.

**DR-38: Grades and bench tiers reward understanding, not trial and error. "Reliable" and "elegant" tiers need the right margin, not a lucky value, and brute-force cycling through parts costs credits.**
- **Why:** Zachtronics' "solved once it works, metrics after" (EXT); AGENTS 6.
- **Check:** script a brute-force sweep at the arcade bench. It must not reach "elegant" without being charged parts cost (`limits.cost`, `src/stations/arcade/station.ts:107`). Category: teaching.

## CLARITY

**DR-39: Goals say *what*, never *how*. Objective cards name an object and a place, never the tool, the method or the part value.**
- **Why:** the Untitled Goose Game to-do list; EXT R-CLAR-1; R4B and LR8.
- **Check:** read every `steps[].text` in `src/ui/objectives.ts`. Known method text: "with the doorstop", "(or bridge it)", "(oven and lamps)" (`:42-44`). Category: clarity.

**DR-40: No more than about 25 words on screen outside the bench monitor, and story or flavour lines fade after 4 s.**
- **Why:** AGENTS 2 (as overridden by the product owner); Mayer's seductive-details research.
- **Check:** count the words in the start shot and the bench shot.
- **Known:** the arcade bench (`research-external-03-arcade-bench.jpg`) shows about 45 words. P1 clarity.

**DR-41: Each value is shown once. The same number or spec never appears on two HUD panels, or on the HUD and the monitor at once.**
- **Why:** Mayer's redundancy principle (EXT R-CLAR-3).
- **Check:** bench screenshots.
- **Known:** "Red LED on 5 V: 12–20 mA" is on both the left and right cards (`research-external-03`). The garage's 77 V appears three times (`research-external-08`).

**DR-42: The job card's current step and the key prompt agree. The prompt and marker point at the current step's object, not the nearest prop or a later step.**
- **Why:** AGENTS 2 (the card and prompt are the only text); L2.
- **Check:** take the start shot per level.
- **Known:** at the Meeting start the card says "Fetch the power strip…" while the prompt says "F Pick up the plug" (`research-art-01-meeting-start.jpg`; `src/ui/objectives.ts:81`). P1 clarity.

**DR-43: Pip, the held item and the current goal are the three highest-contrast shapes in the frame.**
- **Why:** EXT R-CLAR-5; ART R2.
- **Check:** convert the start and mid-solve shots to greyscale. Those three have the largest local contrast against their surroundings. Category: clarity.

**DR-44: The objective marker reads at the game camera.**
- **Rule:**
  - At least 24 px tall, outlined, with a lit or 2-tone shade.
  - It bounces, sits above any clutter, and points at the current step's target.
- **Why:** ART F17; AGENTS 2 (icons and rings).
- **Check:** crop the marker in the start shots; measure its height and check for an outline. Category: clarity.

**DR-45: Job items share one visual language (yellow `#ffc94d`/`#ffc629` with ink stripes, plus the `#ffd84a` grab cue), and no decorative clutter uses it.**
- **Why:** ART R1.2; AGENTS 2.
- **Check:** list the props within 25 ΔE of job yellow in each start shot. All of them are job items. Category: clarity / art-style.

**DR-46: Cable state reads without text.**
- **Rule:**
  - Strain shows along the length (white → yellow → orange → red) and the hum rises.
  - The spool's remaining length reads at the game camera.
  - A live cable carries pulses.
- **Why:** AGENTS 4; ART R15.2; P4.
- **Check:** crop the cable mid-drag at strain about 0.5 and about 1.0, and crop the spool at the default zoom. Category: clarity.

**DR-47: Every device shows its state on the device itself: on, off, tripped, overloaded, warming. Examples are the lamp lit, a flashing breaker reset, a gauge needle, a sad-food icon. All read at the game camera.**
- **Why:** AGENTS 2 (icons and meters, not text); PhET's "visible" lesson.
- **Check:** take a shot per state per device. A first-time viewer can name the state without the HUD (hide the HUD with CSS through `g.page`). Category: clarity.

**DR-48: All text the player must read is at least 14 px cap height at 1440×900, on HUD, bench and signage.**
- **Why:** ART R8.3 and R9.3.
- **Check:** measure in bench crops.
- **Known:** the arcade meter caps such as "LIGHT" and "LED HEAT" are about 9 px (`research-external-03`). P2 clarity.

**DR-49: No floating world labels and no sentences on walls. World text is mounted signage only: plaques, a station's own screen, posters.**
- **Why:** AGENTS 2; ART R9.3.
- **Check:** list every `label(`/`plaque(`/`labelTexture(` call with its parent mount.
- **Known:** the observatory banner sentence (`research-art-34-observatory-lounge.jpg`); the floating "STOREROOM" sign (`src/stations/arcade/room.ts:115`). Category: clarity.

**DR-50: One name per thing, one spelling everywhere. The card, prompt, bench, docs and result card use the same noun ("practice", "power strip", "reel").**
- **Why:** L3 (practice/practise); "Grab the thing" fallbacks (`src/ui/objectives.ts:83`).
- **Check:** grep `practise|thing'` and compare the nouns in `NAMES` with the step text. Category: clarity (P2).

## MODELS & ART STYLE

**DR-51: Each prop kind keeps its colour family.**
- **Rule:**
  - Cardboard is kraft; cabinets and printers are office neutrals.
  - Fabric (chairs, beanbags, sofas) is saturated.
  - Books are desaturated; plants are green in terracotta pots.
  - A level may tint the accents, never the family.
- **Why:** ART R1.2 and F4; concept `01_CURRENT_big_meeting_office.png`.
- **Check:** a unit test over `makeProp()` and each level's clutter output, plus survey shots: no pink or teal boxes, no teal shelves. Category: art-style.

**DR-52: Blob hues (`BLOBC`) on rounded blob-sized shapes belong only to coworkers. No prop reads as a coworker, a lying blob, a macaron or bread.**
- **Why:** ART R1.2, R7 and F5; P5.
- **Check:** beanbag close-ups at zoom 9 and at the game camera (`research-art-11`, `-17`, `-47`). The beanbag is a pear-shaped sack with a seat dent and a seam. Category: model-detail.

**DR-53: The cable is the most saturated thing near Pip, and a room uses one floor family, one wall pair and at most two accent colours.**
- **Why:** AGENTS 4; ART R1.3 and R1.4.
- **Check:** compare mean chroma in a 400×400 crop around Pip mid-drag. Run k-means (k=6) on the survey: the top 3 clusters cover at least 70%. The arcade confetti carpet is a known fail. Category: art-style.

**DR-54: Values are readable, not bright.**
- **Rule:**
  - Median floor luma at the game camera is 140–185.
  - With `?norim`, props differ from the floor under them by at least 25 luma.
  - The darkest tones are ink-blue, never `#000`.
- **Why:** AGENTS 9; ART R2; concept floors measure 152–175.
- **Check:** use PIL on floor crops of the start shots.
- **Known:** garage 222, playground 209, Lunch wood 193; ART F7. P1 art-style.

**DR-55: The toon ramp is one declared standard: 3 readable bands. Today the default is an 8-stop soft gradient (`src/render/toon.ts:13`) and `?hardcel` gives the 3-step ramp. Either restore 3 plateaus, or the product owner amends AGENTS 9.**
- **Why:** AGENTS 9; ART R3.1 and F13.
- **Check:** sample luma across the terminator of a white sphere. Expect 3 plateaus, each covering at least 15% of the arc (`research-art-41` vs `-42`). Category: art-style (P2, needs a product-owner decision).

**DR-56: Outlines are dark ink.**
- **Rule:**
  - On-screen outline luma ≤ 70 (about `#34364c`), 2–3 px at 1440×900.
  - Every prop, character, cable and fixture is outlined.
  - Decals, screens, glow, shafts, floor marks and big flat wall faces are not.
- **Why:** AGENTS 9; ART R4.
- **Check:** take the darkest 2% of edge pixels in a Pip crop. Today the colour is `defaultColor [.13,.135,.2]` with thickness `.0036` (`src/render/toon.ts:77`), which shows as about rgb(101,104,135). Category: art-style.

**DR-57: Only `toon()` and `glossyToon()` are used for lit surfaces, with `MeshBasicMaterial` for unlit decals, screens and hot emissives. Gloss is only for hard plastics: cable, hat, mitts, boots, shades, fridge, bots, post.**
- **Why:** AGENTS 9; ART R3.2 and R3.3.
- **Check:** traverse the scene through `g.page.evaluate` and list material types per mesh. There must be no Standard or Phong materials, and no glossy fabric, wood or paper. Category: art-style.

**DR-58: Everything is chunky and soft.**
- **Rule:**
  - Box parts have an edge radius ≥ 6% of their smallest dimension (minimum 1.5 cm) unless paper-thin.
  - Extrusions such as the wedge and bridge are bevelled.
  - Round parts have 24 or more segments.
- **Why:** ART R5; EXT R-MOD-3 (stylised prop practice).
- **Check:**
  - A unit test over the kit's `box:`/`rbox:` geometry keys; the kit's radius cap of 2.5 cm is a known fail on crates.
  - In zoom-9 crops, every box shows a lit chamfer. Category: model-detail.

**DR-59: There is one scale, measured against Pip.**
- **Rule:**
  - Pip is 1.75–1.8 m and a standing blob is about 1.1 m.
  - A desk is 0.95 m, a door 2.2 m, a wall 3.0 m, a cabinet 1.6 m.
  - Handheld and gameplay parts are 1.2–1.5× real size.
  - Nothing handheld is smaller than 8 px at the game camera.
- **Why:** ART R6; the Animal Crossing furniture scale grid (EXT R-MOD-2).
- **Check:** use `tools/debug/gallery.mjs` (read-only use) or the snapshot bounds. Each kind must be within ±10% of the table. Category: model-detail.

**DR-60: There is one character language. Pip is the only humanoid; everyone else is a blob (capsule body, eyes, glints, accessories). There are no realistic humans.**
- **Why:** ART R6.3 and F3.
- **Check:** grep `'#f2c49b'` skin tones and `sphere(` heads outside `tools/create_assets.py`.
- **Known:** the arcade play-tester kid (`src/stations/arcade/station.ts:225-231`, `research-art-35-arcade-counter-kid.jpg`). P1 art-style.

**DR-61: Every prop passes the silhouette squint test at the game camera, using the cue table in ART R7: beanbag, sofa, bookshelf, box, vending machine, supply cart, lamp, plant, cable.**
- **Why:** ART R7; EXT R-MOD-1; the Untitled Goose Game's clean silhouettes.
- **Check:** render with `?norim`, flat-fill each prop, and get a first-look naming. Each prop is named correctly. Category: model-detail.

**DR-62: Detail meets a minimum.**
- **Rule:**
  - Each prop shows 2 to 4 distinguishing cues at the game camera.
  - Each station or fixture shows at least 6.
  - No visible flat single-colour face is larger than 0.5 m² without trim, a panel line or a decal.
- **Why:** ART R8.1.
- **Check:** list the props in the survey and close shots and tick off their cues. The vending machine slab is a known fail (`research-art-43-crop-lunch-vending.jpg`). Category: model-detail.

**DR-63: Every model has a finished back and underside, because the player orbits. Gauges, screens and signs have housings, never bare boards or open-backed planes.**
- **Why:** AGENTS 8; ART R8.2 and F14.
- **Check:** take zoom-9 shots with a 180° orbit (`g.orbit(±700)`) per level. The supply-cart gauge back is a known fail (`research-art-08`). Category: model-detail.

**DR-64: Pip reads cleanly from every angle.**
- **Rule:**
  - Hat with brim, face, overalls with straps and belt, white mitts and rounded boots are all present.
  - No "cat ear" helmet ridge, no plinth soles, and the arms don't merge into a cape.
- **Why:** ART R10.1 and F9; the Pip model at `tools/create_assets.py:63,71,74`.
- **Check:** Pip crops from front, back and side at zoom 9 (`research-art-34-crop-pip-back.jpg`, `-35-crop-pip-boots.png`). Category: model-detail.

**DR-65: Carried items sit level in front of the chest, held by both mitts. They are never vertical beside the head, and never intersect the head or helmet.**
- **Why:** ART R10.3 and F16; the carry target at `src/game.ts:331`.
- **Check:** at the carry pose, the item's bounding box doesn't intersect a sphere of radius 0.3 around Pip's head at y 1.4. Crop the arcade tray carry (`research-art-46`). Category: visual-bug / art-style.

**DR-66: Lighting is restrained.**
- **Rule:**
  - One mood rig per level and at most 4 point lights, station light-ups included.
  - Bloom only on deliberately hot emissives.
  - Glow sprites have opacity ≤ 0.5, are ≤ 1.5× their source, and never hide Pip or the part being taught.
- **Why:** AGENTS 9; ART R11; EXT R-MOD-5 and F4.
- **Check:**
  - Count `PointLight`s by scene traverse. The garage has 7 (+1), the arcade and observatory 5 (+1), spectrum 5.
  - Diff with `bloom=0`.
  - Take garage PULSE shots at +0.1, +0.4 and +1.0 s. The switch outline stays legible. Category: art-style.

**DR-67: Rooms are dense, clustered and varied.**
- **Rule:**
  - A 32×20 m floor holds at least 250 props, and every walkable 4×4 m cell has at least 3.
  - Clutter forms themed clusters, with no more than about 12% lone singles.
  - No recipe makes up more than 25% of a room's clusters.
- **Why:** AGENTS 3; ART R13.
- **Check:**
  - Make a heat-map from `snap().items` and the prop positions; check the survey shots.
  - Spectrum's thin centre, the observatory's repeated `reading` lamps and the arcade's noise are known.
  - The lobby has 15 props: the product owner must decide on a hub exemption. Category: art-style.

**DR-68: Textures are flat-colour canvases on floors, walls, screens and posters only. Props are colour plus geometry. Floor tiles are 2–4 m and their lines stay visible at the game camera (contrast at least 8 luma).**
- **Why:** ART R9.1 and R9.4; R2's note that concrete reads as grimy blotches.
- **Check:** zoom-9 and game-camera floor crops per level. Category: art-style (P2).

**DR-69: Detail only where it carries information. No noisy decal fields, confetti or pattern at the game camera that competes with the job items.**
- **Why:** EXT R-MOD-4; the counterpoint to "juice it or lose it", that too much polish buries information.
- **Check:** in the arcade survey (`research-art-10`), the job items and the bench are still the first things a viewer names. Category: art-style.

## VISUAL BUGS

**DR-70: Nothing interpenetrates at rest. `g.audit(0.02)` reports zero overlaps at start on every level, and decor (shelves, racks, box stacks) has colliders so the audit can see it.**
- **Why:** ART R12.1; M2 and F11.
- **Check:**
  - `g.audit(.02)` for all 10 levels.
  - Crop the Lunch wall rack (`research-art-44`) and the meeting decor stacks (`src/levels/decor.ts:167,190`). Category: overlap.

**DR-71: Every resting prop is grounded. Its visual bottom is within 1 cm of its collider bottom, and round props (beanbag, plant, bin, cone) have round colliders, so nothing rests on invisible corners.**
- **Why:** ART R12.1 and R12.3.
- **Check:** zoom-9 crops of stacked and tumbled props after a throw sequence. No hovering or sinking. Category: overlap.

**DR-72: Nothing floats. Every sign, decal, poster and badge is mounted on a wall, board, door or prop face, 0.5–1 cm off it.**
- **Why:** ART R9.2 and F8.
- **Check:** orbit 90° and 180° around every sign. The arcade "STOREROOM" sign (`src/stations/arcade/room.ts:115`, `research-art-09`, `-10`) is a known fail. Category: visual-bug.

**DR-73: The cable never passes through Pip or through solid props. It ends in Pip's glove (`pipRig.hand`) and wraps around obstacles instead of clipping them.**
- **Why:** AGENTS 4; ART R15.3; P3.
- **Check:** take a zoom-9 Playground close-up while holding the plug (`research-art-18-playground-close.jpg`; the lead runs through Pip's legs), plus a win push-in shot. Category: visual-bug.

**DR-74: Anything that follows Pip (the thick-cable dolly, a carried load) trails at 2 m or more along the cable path and never parks between the camera and Pip.**
- **Why:** ART R15.4 and F2.
- **Check:** take a Lunch thick-cable drag through the kitchen door, at the default camera and orbited (`research-art-38`, `-39`). The dolly follow distance is 1.3 m (`src/lunch-runtime.ts:237`). P1 visual-bug.

**DR-75: Cutaway walls follow the camera direction. Only the wall faces between the camera and the room drop to 0.9 m, so orbiting never shows low lips facing the void.**
- **Why:** AGENTS 8; ART R14.2 and F12.
- **Check:** orbit shots at 4 yaws per level (`research-art-08`, `-12`, `-16`, `-22`). Category: visual-bug.

**DR-76: Darkness, fog and volume effects are not flat planes that props or lamps poke through.**
- **Why:** LR1 (R1, R2 and QA 12, never fixed).
- **Check:** take Lunch storeroom shots at the game camera and orbited. The lid is a plane at y 1.5 with opacity 0.8 (`src/lunch-runtime.ts:64-66`), and the lamp shade at 2.2 m pokes through it. Category: visual-bug.

**DR-77: There is no z-fighting, flicker or shimmer on decals, floor marks, rugs or overlapping faces at any orbit or zoom.**
- **Why:** ART R9.2.
- **Check:** take two screenshots 0.1 s apart at zoom 9 while orbiting slowly over floors and walls. Diff them for flicker. Category: visual-bug (P2).

**DR-78: Faded occluders keep stable sorting and outlines. There is no outline ghost of a faded wall, and no prop popping in front of a half-faded mesh.**
- **Why:** AGENTS 8; ART F1 (use alpha-hash or dither).
- **Check:** take zoom-9 shots while an occluder is mid-fade (`advance(.1)` after the orbit). Category: visual-bug.

**DR-79: Particles and effects stay bounded.**
- **Rule:**
  - Smoke and steam fade out and never stack into solid balls.
  - Flashes near a taught part last no more than 120 ms.
  - Effects never block Pip for more than 0.3 s.
- **Why:** M7 (snowball steam); EXT F4; AGENTS 9.
- **Check:** coffee-corner close-up; Lunch oven and burn states; garage arc frames. Category: visual-bug.

**DR-80: Every level loads and plays with zero console or page errors, and every review script closes its browser.**
- **Why:** playability baseline (P0 if a crash).
- **Check:** `g.close()` returns `[]` for each level's start, survey and solve script. Category: playability.

---

### Re-check list (fixed earlier; confirm there is no regression)

- Bookshelf colour wrap (`src/props/prefabs.ts:123-125`).
- Swing doors upright.
- Lunch vending machine faces +z.
- Meeting interior walls fade at a low orbit (QA 5).
- Lunch kitchen/corridor wall fade (LR7).
- Window shafts softened (QA 4).
- A cut cable no longer shows the gold meter (LR6).
- The strip snaps within 2.6 m (M10).
- The capacitor is wired inline and docks (LR9).
- No recharge while tripped (LR10).
- Tab and R act only during play (L6).
- No `?level=lobby` Jobs-board reopen on reload (L5).
- Lobby blade signs and Workshop arch facing forward (L1).
- Title hero shot (P7).
- Spool and pins exist (P4).

Each one maps to the DR rule named in its source row. If one has regressed, file it under that rule with the prefix "REGRESSION".
