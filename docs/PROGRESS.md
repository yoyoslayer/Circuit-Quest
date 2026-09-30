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

Latest build and unit verification: `npm run build` and `npm test` (150 unit tests)
pass. Browser coverage now has 57 checks; final results are recorded in
`docs/DESIGN_REVIEW_5.md`. Simulation is deterministic in `?manual` mode.

## Hands-on redesign (2026-09-29, validation continued September 30)

Review 5 supersedes the original clutter/cable/mascot requirements where they
conflict with the owner's latest direction. HQ is a larger three-wing reception,
with one departure display and automatic animated portal entry. The Via foundry
has five usable work areas, physical lever/feed/basket gestures and customer
hardware testing. A magnified cutaway shows layers, hole, barrel, pad and finish;
manufacturing explanations and measurements expand on request. Process rules
and cost judgments remain in the existing pure engine. Samples follow Pip
between stations; tools cannot operate remotely from the wrong work area.

Pip has a distance-driven planted gait with separate boot translation and bent
knees, plus procedural upper arms/forearms. Carry/work poses are improved but
not a finished contact-aware animation system. Coworkers are formal human
figures, with separate seated and standing geometry. Standing NPC collision
and walking animations remain open. Close orbit zoom has solid-world clearance;
first-person is not implemented. The exterior has road traffic, parked cars,
facades, crosswalks and street furniture, and remains stylized dressing.

The mop has a shaft and string head, stays at floor height, and needs held Space
or Scrub input to clean. Passive holding no longer consumes water or cleans.
Accepted cooler delivery parks beside the fridge instead of dropping into the
player's path. Dolly tipping is constrained; the clean route clears the door
before turning. Braced sprint pulling is tuned for the slower movement, retaining
Big Meeting's single-reel shortcut.

Actual all-room screenshots and interaction captures are linked in review 5.
The main remaining design work is converting the nine other station jobs to
distinct physical room loops, with Garage then Waterworks as the first two.
Via Rush needs batching before more throughput, and Big Meeting needs frame-time
optimization. These are not marked complete merely because the build passes.

## Player-feedback design review (2026-09-29)

Reviewed all 15 rooms in play, survey and close views. Fixed the actual cause of
Pip sliding: the animation pivots did not contain the nested GLB's meshes. Boot
movement now has a unit regression and an actual loaded-model browser check.
Desk, chair and monitor colliders match their visible parts; pod chairs face
their desks, and seated coworkers stand if their chair is removed or tipped.
NPC idle turning/vertical bobbing is reduced, and the overlapping Lunch Rush
lamp/bin spawn is separated.

The play camera follows Pip fully and starts closer. Four 3.6 m shell walls use
cutaways, default partitions are 2.8 m, and park/utility exterior dressing replaces
the void. Room wall palettes vary by wing. Job cards show one current step with
optional details; station order panels appear at the bench.

`docs/DESIGN_REVIEW_4.md` has comparison screenshots, findings, remaining defects
and room-specific architectural targets. This pass does not claim all phasing or
room repetition fixed: standing NPCs lack collision, several prefabs still use
box proxies, foreground obstruction and grounded foot planting need more work,
and most station layouts remain rectangular. These take priority over new modes.

## Codex continuation (2026-09-29)

Combined both Claude branches using Git history, preserving the shared changes
and completing the QFN, Archive, Waterworks, Observatory, Arcade and Garage review
round. Desktop and phone captures cover all eleven station routes; selected
screenshots and details are in `docs/REVIEW_FIXES.md`.

Portrait framing now includes the tool racks. Archive has usable phone Search,
Datasheet and Work order panes. The Via ROW stepper clears the order panel, and
Waterworks hover hints render subscripts correctly. Stand up now receives touch
input and works as a native button. Two new browser regressions exercise real
QFN tool taps and a complete cited Archive work order on a phone viewport.

Static station-room batching remains the next performance task (829–1,262 draw
calls in the capture pass). Shared button styling, reset consistency, Spectrum
floor-mark cleanup, other Rush modes and the capstone remain in `NEXT_STEPS.md`.
Physical phone and laptop playtests remain unverified.

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
| 03 | `vias` | Via Foundry | Through, buried, micro, via-in-pad and stitching vias; plating aspect ratio, annular ring and lamination order. `vias-rush` is a timed queue of generated orders. |
| 04 | `qfn` | Fabrication Bay | Placement before routing; no crossings on one layer; decoupling loop length; a second layer, vias and thermal vias. |
| 05 | `archive` | The Archive | Datasheets: typical vs guaranteed vs recommended vs absolute maximum; test conditions; ordering suffixes (the freezer twist). |
| 06 | `waterworks` | The Waterworks | Thevenin and Norton equivalents found by measurement at two ports, then named as a circuit. The pipe analogy is labelled. |
| 07 | `observatory` | Signal Observatory | RC and LC filters on a live scope; an inductor carries DC and opposes changes in current; a DC latch must hold; quarter-wave antenna (c = fλ). |
| 08 | `arcade` | Overheating Arcade | LED series resistor, P = I²R against the rating, polarity, the parallel-resistor trap, battery life, base resistor. |
| 09 | `garage` | Robot Garage | Inductive kickback, flyback diode vs zener or TVS clamp and stop time, polarity, why a capacitor doesn't fix it, star ground. |
| 10 | `clockwork` | Clockwork Kitchen | Internal RC vs resonator vs crystal; integer dividers; accumulated timing error; temperature drift; clock-line noise. |
| 11 | `depot` | Delivery Depot | Voltage, current and power with trucks that are never used up; open socket vs closed loop; rail drop; short and breaker; meter-only transfer. |
| 12 | `spectrum` | Spectrum Delivery | Propagation through brick, glass, metal, mesh and smoke; mirrors; detector matching; link margin; c = fλ. |

Each station has:
- rules as pure functions with unit tests;
- a solver that proves every job is solvable and defines the elegant answer;
- a physical first step in its room;
- works / reliable / elegant tiers and three bonus goals;
- a full browser playthrough plus a recoverable-mistake test.

The stations were built by parallel agents from one brief and reviewed on screenshots
before merging.

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
