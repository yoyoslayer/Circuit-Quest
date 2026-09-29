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

Verification on the last commit: `npm run build`, `npm test` (18 unit tests) and
`npm run smoke` (20 browser tests) all pass. Browser tests run twice in a row with
identical results (simulation is deterministic in `?manual` mode).

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
- Solutions, each covered by a test: clean (couple the second reel from the mail cart),
  single-reel overstretch, and sneaky (borrow the coffee machine's extension; the coffee
  corner groans and the machine stops steaming).
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
- **Spoiled lunch.** Letting the fridge spoil ends the job with a retry card. The spec
  calls for this; it is the only failure state, and chaos alone never causes it.

## Later (per BUILD_PLAN "not now")

Level select hub, more floors, WebGPU renderer, controller remapping and accessibility
options, save data.
