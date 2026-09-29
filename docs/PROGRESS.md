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

Verification on the last commit: `npm run build`, `npm test` (19 unit tests) and
`npm run smoke` (21 browser tests) all pass. Browser tests run twice in a row with
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

**No text needed to play.** The HUD is icons, rings and meters. Words appear only on the
intro card (title, level name, tagline).

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
- M3: a blind playtest (a new player finishes in under 5 minutes without text).
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
