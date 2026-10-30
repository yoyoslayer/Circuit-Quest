# Circuit Crew progress

Scope: milestones M0–M5 in `docs/BUILD_PLAN.md`. How to play and develop: `README.md`.

## Status by milestone

| Milestone | State | Evidence |
|---|---|---|
| M0 Project setup | Done | Strict TS + Vite, three r186, Rapier, Vitest, Playwright; `npm run build` clean |
| M1 Feel prototype | Done, pending a human feel check | Cable playground; `tests/routes.spec.ts` (plug-in, slingshot) |
| M2 Electrical sim | Done | `src/sim/electrical.ts`, 7 unit tests |
| M3 Big Meeting | Done, pending blind test | 312 physics props, three solutions each played by a browser test |
| M4 Juice | Done | Sounds, particles, shake, squash/stretch, coworker reactions |
| M5 Lunch Rush | Done | Intended solution + 9 rule tests in `tests/lunch-*.spec.ts` |

Verification on the last commit: `npm run build` and `npm test` (142 unit tests) pass,
and `npm run smoke` passes (see below for the latest browser-suite count). Browser tests run twice in a row with
identical results (simulation is deterministic in `?manual` mode).

## Visual and UI overhaul (after product-owner feedback)

The first complete build played correctly but looked like a blockout. A design pass
followed, with the artefacts kept in `mockups/`:

- `mockups/review/REVIEW.md`: art-direction critique and prioritised plan.
- `mockups/look/`: rendered target frames in real three.js, built from the game's own
  props and levels, plus `LOOK.md` (renderer, lighting, post, camera numbers).
- `mockups/ui/`: HTML mockups and `UI.md` design system; `mockups/ui/impl/` shows the
  implemented screens.

What is now in the game:
- **Rendering:** toon + outlines inside an EffectComposer (`src/render/post.ts`) with
  ambient occlusion, bloom for hot emissives and a colour grade; a warm key / cool fill
  / pink rim rig; gradient backdrop and diorama slab. Quality steps down automatically
  on slow machines (`Game.adaptQuality`); `?lowfx` forces the cheap path.
- **Camera:** FOV 30; zoomed out it frames the floor like a diorama, zooming in drops
  to Pip's eye line; Tab surveys the floor; a push-in on the machine on success.
- **Rooms:** dressed walls (wallpaper, wainscot, rail, cap) that fold away when the
  camera swings behind them, windows with blinds and light shafts, carpet tiles, rugs,
  posters, pendants and lamp pools, closet LEDs, per-desk clutter and live monitor
  screens, a deadline clock whose red hand sweeps the meeting.
- **Characters:** personality blobs (accessories, moods, startled faces, sweat drops,
  typing, breathing); Pip walks, leans, carries and hauls a taut cable over the shoulder.
- **The cable:** a glossy hose with a strain gradient toward Pip's hand, gold when
  connected, current pulses when live; Lunch cables glow when overheating and scorch.
- **UI:** Fredoka type, title screen, jobs board with saved best grades, contextual
  HUD, Lunch objective chain with fridge thermometer and breaker dials, pause,
  stamped result tag and a failure tag; phone layout with a virtual stick.
- **Audio:** procedural music per level, room tone, coworker gibberish, foley.

A second review (`mockups/review2/REVIEW2.md`) drove the payoff pass: plug-in hit-stop,
flash and shockwave; the projector slide and the playground street lamp light up and
bloom; the win camera frames the machine beside the docked result tag while Pip turns
and cheers; the title is a hero shot of Pip waving beside the logo (portrait-aware); the
taut cable jitters, sparks and twangs, and coworkers along it flinch; floor corner
brackets mark what E will grab; the idle hint is a line of flowing dots; smoke, stars and
steam; phones follow Pip fully. The Cable Playground got its own set (practice socket
wall, how-to poster, START tape, supply cage, trainees, clustered crates). Pip's hat
wobbles on a spring, seated coworkers type and glance around, and audio gained cable
creaks, glass smashes and light-prop clatter. Job thumbnails are regenerated from the
live scenes with `node tools/thumbs.mjs`.

## What works

**Pip and camera.** Rapier character controller: walk, sprint, jump, grab/carry/throw.
Heavy furniture (15 kg and up) is pushed along the floor rather than lifted. Pip is an
original Blender model (`tools/create_assets.py`) with a procedural walk cycle, carry and
plug-holding poses, jump stretch and landing squash. Player-controlled orbit camera with
zoom; zoomed out it frames the floor like a diorama, zoomed in it follows Pip. Walls and
pillars between the camera and Pip fade out.

**The cable.** Finite length; wraps the corner the end is dragged past and unwraps only
when straightening sweeps across nothing (`src/sim/cable.ts`, unit tested, including
the "doorway lines up" case). Strain colours white → yellow → orange → red, a hum that
rises with strain, a pull-back spring, light props dragged along a taut rope, and a
slingshot: stretch past the reel's length at a sprint and let go (Q), or have a taut rope
whip off a corner, and props lying along it fly. Forgiving plug snapping.

**Electricity.** Sources with breakers, cables with ratings that heat and scorch,
splitters that sum downstream draw, loads with start-up kicks, capacitor carts that only
help at the load end, and wet cables that short. All in `src/sim/electrical.ts`.

**Level 00 Cable playground.** An empty 20 × 20 m room with two pillars, boxes, a reel
and a lamp socket. The reel is 19 m (17 m could not reach round any pillar).

**Level 01 Big Meeting.** 33 × 20 m open-plan floor with 312 physics props (desk pods,
monitors, mugs, papers, bins, cabinets, printer, vending machine, lounge, glass
boardroom), 24 blob coworkers, a server closet with racks and the one live outlet.
- Solutions, each covered by a test: clean (couple the second reel from the mail cart
  for 37 m), chaos (the single 23 m reel only reaches if Pip sprints and overstretches it,
  dragging props along), and sneaky (borrow the coffee machine's 30 m extension; the
  coffee corner groans and the machine stops steaming).
- Coworkers duck and show "!" at nearby crashes and cable snaps and bounce when the
  projector comes on. The timer ring goes red after 4:00 and the boardroom gets
  impatient, but lateness only lowers the time grade.
- After 35 s a dotted ghost line traces the clean route round walls and pillars.
- Grades: time / damage / repair cost, overall = best of the three.

**Level 02 Lunch Rush.** Power room, dark storeroom, kitchen, lift room and corridor.
- The intended solution (wedge, mop, thick feed via Supply B, fridge time-battery,
  capacitor at the winch, bridges on the bots' line, conveyor before lift) is played
  end to end by `tests/lunch.spec.ts`.
- Each rule has its own test in `tests/lunch-rules.spec.ts`: thin-cable scorch, door cut
  and repair cost, leak short plus breaker reset, cable bridge over the leak, lift kick
  trip, dark storeroom, bot snag, cooler-box alternative, spoilage retry.
- In-world feedback only: supply-cart needle gauges and a flashing reset button, bake
  dial, fridge thermometer and sad-food warning, glowing/scorched cables with smoke,
  sparks on plug-in and shorts, lamps that light the room.

**Look.** Toon renderer (3-step ramp, dark outlines, ACES), with prop models and set
dressing ported from `reference/render_kit` so the floors match the concept frames.

**On-screen objectives (product-owner override).** The product owner found the
wordless HUD made the goal hard to read and asked for "a bit of text on the screen
saying what to do". This overrides the AGENTS.md rule "no text needed to play".
`src/ui/objectives.ts` adds:

- a job card (top left) with ordered steps that tick off with a bell, and three
  bonus goals per level that show on the result card;
- a prompt pill above the action bar naming what the key in reach does
  ("F Plug in", "E Grab the power strip", "Q Let go to slingshot the cable");
- a bouncing marker over whatever the current step needs.

Lunch Rush has seven steps, so its card shows only the done count, the current step
and the next one.

## Art, lighting, rig and extra steps (second product-owner pass)

- **Higher poly.** Kit boxes are rounded and bevelled, cylinders and spheres have
  twice the segments, and the coworker blobs are smoother. Pip is rebuilt in Blender
  (`tools/create_assets.py`) with 43 named parts: nose, ears, glints, cheeks, lamp
  on the hard hat, cuffs, soles, thumbs, belt, pocket and badge.
- **Lighting.** Soft-cel ramp (`?hardcel` restores the 3-step ramp), soft PCF shadows,
  a warmer key, a cool fill, a pink rim and a warm-ground hemisphere per level.
- **Rig.** `src/render/pipRig.ts` replaces the part-swing animation. It gives Pip:
  - hips, torso, head and hat pivots;
  - a stride and arm swing that lengthen when running;
  - a torso counter-twist and a lean into turns;
  - poses for carrying, hauling a taut cable, jumping, cheering and waving;
  - a head that glances at the nearest usable thing;
  - blinks, and a hard hat on a spring.
- **More steps.** Both office levels now end with a wall switch: plugging in powers the
  load, then Pip switches it on (E). In Big Meeting the boardroom socket is dead
  until Pip carries the power strip from beside the printer to the boardroom door; it
  snaps into place there.

## Stations, the HQ lobby and the Workshop (third product-owner pass)

The product owner pointed out that many rooms and ideas from the brainstorm and the
original mission catalogue were missing. The audit, the decisions and the pattern every
station follows are in `docs/EXPANSION_PLAN.md`.

**HQ lobby** (`src/hub/lobby.ts`, the bare URL):
- Every job is a door in its wing colour, showing its number, name and best medal.
- A lamp over the door lights once the job is done.
- Via Rush stays locked until the Via Counter is finished.
- The **Workshop** arch practises any station with `&practice`, which is never recorded.

**Bench mode** (in `src/game.ts`): walk to the bench and press E. The camera eases onto the
tabletop, the station takes the pointer and keys, and E or Esc steps back.

| # | Station | Room | What it teaches |
|---|---|---|---|
| 03 | `arcade` | Overheating Arcade | LED current from the chain (I = (V − V<sub>f</sub>) ÷ R); blocks in a row add, side by side they share; P = I²R per block; polarity; the across-the-LED trap; battery life; base resistor. `arcade-rush` generates cabinets for three minutes. |
| 04 | `garage` | Robot Garage | Inductive kickback, flyback diode vs zener or TVS clamp and stop time, polarity, why a capacitor doesn't fix it, star ground. |
| 05 | `qfn` | Fabrication Bay | Placement before routing; no crossings on one layer; decoupling loop length; a second layer, vias and thermal vias. |
| 06 | `observatory` | Signal Observatory | RC and LC filters on a live scope; an inductor carries DC and opposes changes in current; a DC latch must hold; quarter-wave antenna (c = fλ). |
| 07 | `spectrum` | Spectrum Delivery | Propagation through brick, glass, metal, mesh and smoke; mirrors; detector matching; link margin; c = fλ. |

Each station has:
- rules as pure functions with unit tests;
- a solver that proves every job is solvable and defines the elegant answer;
- a physical first step in its room;
- works / reliable / elegant tiers and three bonus goals;
- a full browser playthrough plus a recoverable-mistake test.

The stations were built by parallel agents from one brief and reviewed on screenshots
before merging.

## Fourth pass: layout, camera, models, Arcade Rush (2026-10-29)

- **Review fixes merged.** The `claude/review-fixes-wip` branch (QFN, Archive, Waterworks,
  Observatory, Arcade, Garage) was run, screenshotted at each bench and merged. Every
  station's result-card cost is now in credits, the same unit its bench panel shows.
- **Layout audit.** `drive.audit()` (manual mode) lists every prop, standing coworker and Pip's
  spawn that starts buried in a wall, fixture or another prop. `tests/layout.spec.ts` runs it
  on all levels. It found about 60 overlaps (bins and papers inside desk pods, chairs inside
  pillars, mugs inside desks, splitters inside the storeroom wall, coworkers inside tables and
  chairs, boxes inside shelving); all are fixed.
- **Camera.** A lens option in the pause menu: Close (32°), Standard (42°, the new default) and
  Wide (54°). Wider lenses move the camera in, so perspective reads stronger while the room
  stays framed; bench views keep exactly their tuned framing on every lens
  (`src/render/lens.ts`). The walk camera now starts closer (floors 22, HQ 23, stations 18.5,
  Playground 17) and keeps Pip near the centre instead of tucked under the job card.
  `tools/debug/lens.mjs` screenshots each lens.
- **Models.** The plain props got real detail:
  - carton with tape and a label;
  - beanbag with a back and a seam;
  - bin with paper in it;
  - mop bucket on casters;
  - coolbox with latches and a handle;
  - cabinet with drawers;
  - mug with a handle;
  - mail cart with a parcel shelf and push bar;
  - splitter with a socket face;
  - wedge with grip ribs;
  - task chair with armrests, gas lift and casters.

  Props stay instanced, so the extra parts cost a few draw calls in total, not one per copy.
  `tools/gallery/` renders every prop under the game's look; `tools/debug/gallery.mjs`
  screenshots it.
- **One RESET control.** Garage (and the cut Depot) use `resetButton()` in
  `src/stations/shared.ts`: a red dome that pops up, glows and pulses a ring when tripped. The
  Arcade's fuse now resets itself (see below).
- **Arcade Rush** (`arcade-rush`, locked until the Arcade is done): three minutes of generated
  LED cabinets with a 4-second soak each. Every generated cabinet starts broken and is
  fixable reliably from the rack (unit-tested over 300 seeds). The HUD clock counts down and
  the result card shows the count, as in Via Rush.

## The cut (2026-10-30, product owner's choice)

Two design reviews (`mockups/review4/DESIGN_A.md`, `DESIGN_B.md`) found most stations were menu
puzzles whose prompts handed out the answer, and four rested on misleading metaphors. The product
owner chose to cut and deepen. **Kept (8 rooms):** Playground, Big Meeting, Lunch Rush, Overheating
Arcade (+ Arcade Rush), Robot Garage, Fabrication Bay (QFN), Signal Observatory, Spectrum Delivery,
renumbered 00–07. **Cut:** Via Counter and Via Rush, the Archive, the Waterworks, the Clockwork
Kitchen and the Delivery Depot. Their code, tests and thumbnails are deleted; they remain in git
history before this commit if any idea is worth salvaging.

## Deepening the kept rooms (2026-10-30)

**Overheating Arcade: candy resistors.** The old bench was a menu (pick a value from a 15-block
E12 rack, pick a power rating, press RESET). Now:

- **Bins.** Four bins of chunky blocks: 47, 100, 220 and 470 Ω. Every block is a ¼ W part, and
  each value has its own candy colour and real colour bands.
- **Chain socket.** The socket has three positions. Blocks in a row add. Two blocks side by side
  in one position share the current, so they come out smaller than either block and each runs
  cooler. The rhythm pad (blue LED on 3.3 V) cannot be solved with any single block; it needs
  47 ‖ 47.
- **Live bench.** The circuit stays live while you work, so every change shows on the meter at
  once and restarts the play test.
- **Failures you can see.**
  - The PTC fuse trips, glows red and conducts again by itself after it cools. There is no
    RESET.
  - An overloaded block pops off the board and the bench cuts out.
  - An LED over its rating flickers white-hot and can't pass the play test. Far over its rating,
    it pops and a spare goes in.
- **Messages.** They say why something failed, never the fix. Prompts are short action labels.
- **Meter.**
  - Readouts: current, chain resistance and the hottest block's power.
  - Bars: light against the band (with a gold ★ zone), LED heat, and block heat against the 60 %
    house margin.
  - A play-test strip.
- **Play test.** A kid at the cabinet plays it (3 s, 2 s in rush). The kid hops while it works,
  throws their arms up when it passes and slumps at a dark screen.
- **Panel.** It shows the chain as a sum, e.g. `220 + (47‖47) = 244 Ω`.

Keys at the bench:

| Key | Action |
|---|---|
| 1–4 | Take a block |
| A / S / D | Chain position (place, or take a block out) |
| X | Across the LED |
| F | Flip the LED |
| P | Power |
| Enter | Sign off |
| Backspace | Put the block back |

`tools/debug/bench-arcade.mjs` screenshots the bench.

## Performance

Host: Radeon RX 9060 XT, 1440 × 900. `THROTTLE=4 node tools/perf.mjs` emulates a
mid-range laptop CPU:

| Level | Unthrottled p95 | 4× CPU throttle p95 | Draw calls |
|---|---|---|---|
| Big Meeting | ~3 ms | ~13 ms | 176 |
| Lunch Rush | ~3 ms | ~15 ms | ~175 |

Static decor is merged per material; props are instanced by part; coworkers are one
mesh each. Not yet measured on a real integrated-GPU laptop.

## Not verifiable here

- M1 exit: "dragging the cable around pillars is fun for 5 minutes" needs a human.
- M3: a blind playtest (a new player finishes in under 5 minutes).
- 60 fps on real mid-range laptop hardware (only CPU throttling was emulated).

## Decisions taken without the product owner

- **Kitchen feed post.** The kitchen has a fixed feed post hard-wired to the oven and
  both lamps, instead of the player placing a splitter there. The splitters exist and
  work elsewhere.
- **Kitchen door.** The double-action door swings away from whoever pushes through. A
  doorstop dropped near it jams beside the open leaf; cable bridges dropped near the
  bots' line snap onto it (forgiving interaction).
- **Bots' loop.** Moved so the corridor feed to the lift crosses it twice ("two cable
  bridges on the bots' line"), while the kitchen feed clears it.
- **Burning tray.** A baked tray waits on the oven door. If the oven stays on, it smokes
  and beeps from 60 s and burns at 90 s; switching the oven off or taking the tray stops
  the clock. The spec gave no time, and 45 s was shorter than the intended solution's
  own detour.
- **Big Meeting reel is 23.2 m, not 26 m.** The aisle between the pod rows is nearly
  straight (24.7 m against 24.3 m as the crow flies), so at 26 m the single reel reached
  cleanly and the coupler was pointless. At 23.2 m walking falls short and only a
  sprinting overstretch reaches.
- **Spoiled lunch.** Letting the fridge spoil ends the job with a retry card. The spec
  calls for this; it is the only failure state, and chaos alone never causes it.

## Later (per BUILD_PLAN "not now")

Level select hub, more floors, WebGPU renderer, controller remapping and accessibility
options, save data.
