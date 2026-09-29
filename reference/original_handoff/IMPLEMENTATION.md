# Implementation blueprint

## Prototype strategy

The first build must answer one question: **is rearranging a room to fix a circuit fun before any formal lesson appears?** Prototype West Wing Blackout with cubes and colored splines, then apply the art style. Do not begin with a giant factory, accurate PCB autorouter or full electromagnetic simulator. Build the smallest consistent behavior model that supports diagnosis and alternative solutions, with explicit limits.

Recommended first prototype: web/desktop Three.js + TypeScript if the team wants to reuse the Agent Office rendering approach and ship quickly in a browser. The source snapshot is a visual and scene-organization reference, not a physics/electronics framework or a ready game. A native engine is viable for robust rigid-body interactions and console ambitions. Make the engine decision after a two-week spike comparing camera, grab-and-drag, cable routing, multiplayer and platform goals; keep mission definitions in engine-neutral data. This document uses generic architecture, not a mandated stack.

## Systems and ownership

| System | Responsibility | First-slice behavior |
| --- | --- | --- |
| World/physics | avatars, collisions, pushable carts/shelves, doors, handles, constraints | simple rigid bodies; stable reset spawn; no precision physics for electrons |
| Interaction | ray/proximity selection, carrying, rotation, snap targets, tool use | one consistent input grammar, contextual affordance outline |
| Cable routing | movable endpoints, path, length, anchors, tug, safe/unsafe crossing | editable spline, finite spool length, plug polarity/port validation |
| Electrical graph | sources, nodes, loads, switches, wires, protection, measured values | deterministic DC resistive approximation + scripted startup transient |
| Devices | motor/lift/light/controller state driven by graph outputs | thresholds/hysteresis, animation and audio on sustained success |
| Mission state | goals, event triggers, hints, replay, reset, score | data-driven predicates, alternate valid solutions |
| UI/accessibility | meters, clipboard, captions, color-safe signals | overlay optional; no required color-only signal |
| Content tools | room editor, connection graph inspector, probe log | designers can create/check one mission without editing solver code |
| Multiplayer | authority, shared objects, co-op pings, reconnect | authoritative room/circuit state; solo-equivalent objective logic |

Separate **physical placement** from **electrical topology**. A cable physically reaches two ports and follows a visible route. When both ends make valid contact, it creates a graph edge with length-derived resistance and capacity. Moving an anchor changes route/length; exceeding limits disconnects visibly. The electrical solver never trusts render geometry as implicit connectivity. A metal shelf can bridge two exposed points only if the mission deliberately defines conductive collision contacts; avoid accidental invisible short rules.

## Electrical model, staged

**Phase A:** nodal DC solver for resistors, source internal resistance, switches, LEDs approximated with piecewise behavior, fuses/breakers, and meters. Evaluate on a stable tick after topology changes; use damping or an explicit convergence guard. Devices read terminal voltage/current and produce light, sound, motion and heat indicators. Provide deterministic “what caused it” logs to drive hints.

**Phase B:** capacitance and inductance represented with a time-stepped model or prevalidated simplified templates. Motor startup uses an authored current-versus-time profile; capacitor discharge/charge and voltage sag must conserve plausible energy within the model. Frequency missions use an appropriate AC/phaser or signal-processing model over specified bands, not the DC solver pretending to simulate radio propagation. The EM Observatory can use a separate bounded ray/occlusion and wavelength model, labeled accordingly.

**Phase C:** PCB and via checks use a netlist + layer/geometry rules, independent of room physics. Connection path, clearance, via layer span, annular ring and package orientation are validated before the board is installed. Close/short errors are reported at the visible location. Do not treat a visually noncrossing line drawing as proof of signal integrity or manufacturability. For actual board exports, use established EDA validation (e.g. KiCad DRC/ERC) and a reviewed rule profile.

The “safe simplified model” is a design contract: every device exposes its supported operating interval, fault behavior and explanatory text. If a mission requires a concept outside that interval, extend the model or change the challenge. Display the solver's assumed idealizations in the engineering view. Engineering claims get reviewed by an electronics educator and hardware engineer before publication.

## Example content contract (illustrative)

```json
{
  "id": "west_wing_blackout",
  "room": "west_wing",
  "initialObjects": [
    {"id": "supply_cart", "prefab": "cart_12v", "pose": "loading_dock"},
    {"id": "reel_a", "prefab": "cable_12v_8m", "pose": "corridor"},
    {"id": "shelf", "prefab": "movable_metal_shelf", "pose": "doorway"}
  ],
  "ports": [
    {"id": "cart_plus", "owner": "supply_cart", "netRole": "positive"},
    {"id": "cabinet_in", "owner": "breaker_cabinet", "netRole": "input"}
  ],
  "objectives": [
    {"metric": "west_lamp_on", "forSeconds": 10},
    {"metric": "lift_cycles", "atLeast": 1},
    {"metric": "breaker_tripped", "equals": false}
  ],
  "hints": ["inspect_dark_lamp", "probe_source_and_load", "inspect_open_loop"],
  "soloReachable": true,
  "resettable": true
}
```

This is schema intent, not executable production content. In production, mission goals should use typed predicates and each object/prefab should have authored limits, locatable ports and validation. The world editor should show graph connectivity, geometry reach, interactable radius and possible fail states in one debug view.

## Player state and feedback

The core feedback ladder is **body/environment → tool → text**. A stall is visible and audible; the meter supplies quantity; short text resolves the generalization afterward. Distinguish open, short, overload, reversed polarity, undervoltage and wrong part with different visual patterns and sound cues. A tripped breaker stays tripped until the player isolates the cause and resets it. Objects respawn to safe marked locations if stuck behind a wall. “Reset room” restores the starting topology; “undo last connection” repairs a mistaken plug without resetting the entire puzzle.

Store a compact event history: interaction, port connection, measured state, breaker trips and goal transitions. This supports a player-friendly replay and analytics: where novices tried a wrong assumption, whether they tested before placing, and which hints enabled transfer. Do not score people on reading speed or require memorized jargon. Add optional pause-anywhere, reduced motion, subtitles, scalable labels, contrast patterns, remappable controls and hold/toggle alternatives.

## Co-op and authority

For network play, the host/server owns object poses at stable intervals, graph topology, device states, mission state and scores. Clients predict their own movement and show temporary grip feedback; connection commits are validated centrally against distance, matching port, cable length, permissions and power safety state. A carried object has a single authority token; two players holding a heavy object form a shared constraint with an explicit grab handle. Late join receives a snapshot and event tail. Mission clocks can pause on reconnect. Co-op pings mark a port or meter reading for another player. Avoid designing tasks that require speech or synchronized reflexes; heavy props can be moved solo with a slower trolley.

## Data and authoring pipeline

Define reusable prefabs for sources, loads, meters, cables, fuses, plugs, via machines, PCB footprints and room props. Every prefab has visual affordances, physical bounds, ports, electrical model, sound states, localization IDs and a “reason for failure” map. Missions instantiate prefabs and modify parameters. Build an editor validation command that checks missing localization, unreachable port, impossible cable length, absent solo route, unresettable prop, unbounded voltage/current, and a route to each goal. Human playtesting is still essential for fun and conceptual clarity.

For PCB exercises, maintain authored netlists and rule profiles; tiny geometry uses deterministic grid/snap logic to avoid hand precision becoming the lesson. Package a reference “known good” solution and at least one alternate solution per mission. Designers can opt into a soft path-quality grade, but correctness comes from topology and rules. A `decoupling_loop_estimate` may be used for teaching, with the simplification disclosed rather than presented as measured EMI performance.

## Work plan with exit criteria

| Milestone | Deliverable | Exit criterion |
| --- | --- | --- |
| 0: Paper + graybox | room map, interaction prototype, electrical assumptions | three novice testers can state what failed and propose a physical action |
| 1: West Wing vertical slice | one polished 10–15 minute mission, solo and two-player | two distinct successful routes; recoverable failure; no required full-screen panel |
| 2: Mechanics suite | resistor wall, lift brownout, pipe room and signal filter grayboxes | metrics reflect component/connection changes; misconceptions found in playtests corrected |
| 3: Manufacturing | via line and QFN floor fixture | parts, nets and layer checks are stable; board works in a room device |
| 4: Campaign/content | archive, observatory, clock, capstone, modes | measured transfer challenges across different art contexts |
| 5: Release quality | performance, accessibility, localization, classroom tools | independent educational review; controller and co-op tests; save/reset integrity |

Suggested vertical slice order: implement avatar and camera → grab/carry and object reset → port and cable snap → graph solver with probe → responsive lamps/lift/breaker → authored mission and hints → co-op authority → final toon treatment/audio. A successful slice is fun with gray boxes. That is the greenlight gate for full production.

## Acceptance tests worth automating

- Closed loop illuminates load, open loop yields no load current, deliberate short trips breaker.
- Moving a supply beyond cable reach visibly disconnects and graph edge disappears.
- Goal remains valid across at least two authored layouts; changing arrangement cannot bypass electrical check with only a visual trigger.
- Undo/reset cannot strand the player or leave a “ghost” electrical connection.
- Capacitor mission responds to capacitance, wiring location and startup transient in the expected direction; it does not sustain an unpowered load indefinitely.
- Via layer/annular/fill checks and QFN netlist/clearance checks reject authored bad boards and accept good alternatives.
- Two-player joins/reconnects preserve one authoritative object and circuit state.

## Scope and risks

The main risk is promising a general-purpose physics-plus-SPICE-plus-EDA simulator. Scope the solver to educational cases and explicitly authored devices, expand only as needed. The second risk is turning every task into an isolated screen puzzle: track active world interaction minutes in playtests and rewrite any chapter that drifts into a string of terminals. The third is chaos obscuring cause; separate physical comedy from electrical diagnosis with strong instrumentation, replay and quick reset. The fourth is teaching an attractive but wrong analogy; have domain experts review tutorial language, datasheets and challenge solutions.
