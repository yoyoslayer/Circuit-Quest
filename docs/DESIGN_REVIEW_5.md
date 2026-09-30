# Design review 5: make the room the puzzle

The electronics rules are more developed than the game built around them. Many
jobs still ask the player to enter an interchangeable room, approach one board,
and repeat a sequence of selections. Changing the lights cannot fix that. The
next design must make the player observe, manipulate and test distinctive
equipment, with different applications of the same knowledge.

This review follows the owner's latest feedback and supersedes the old brief
where it demands hundreds of miscellaneous props, cables in every mode, mascot
coworkers or an always-wide third-person view. This pass rebuilds the hub and
Via workshop as a reference, and changes movement, workers, close camera views,
surroundings and mopping across the game. **The remaining station jobs have not
all been converted to room-scale puzzles.** Their concrete redesigns are below.

## What changed in the playable build

### HQ: circulation and quick departures

The old door collection becomes a 34 x 28 m reception with three circulation
wings. Partitions separate office, fabrication and facility routes; the front
opening connects them. Five purposeful movable props replace the loose prop
collection. A single departure screen shows the nearby job and the three wing
categories instead of fifteen tiny competing tickets. Wing headings sit at
their destinations, clear of the starting camera.

Approach an unlocked door: the leaf opens and an animated portal appears. Walk
through the threshold: the game loads that job automatically. E also enters.
An entry guard prevents repeated navigation; locked Rush doors remain locked.
Practice still uses the Workshop arch and does not record a medal.

Evidence: [reception](screenshots/review5/hub-play.jpg),
[layout](screenshots/review5/hub-survey.jpg),
[opening portal](screenshots/review5/portal.jpg).

### Via: five places, one workpiece, visible consequences

The foundry grows from 22 x 16 to 32 x 24 m. The central U-shaped aisle joins
five useful work areas: inspect, laminate, drill, plate, verify/dispatch. Shelves
and the enclosed stock annex provide storage rather than another office pod.
There are seven purposeful movable props, no delivery prerequisite crate and
no decorative copy of the machines the player actually uses.

The same sample follows Pip between machines. Operations require the correct
workplace; a player at inspection cannot remotely press, drill, plate or test.
The enlarged inspection fixture exposes copper layers, dielectric, layer pairs,
annular pads, an open hole and copper barrel. Fill, tent and cap have different
geometry; small packages have bodies and leads. The view is explicitly a
magnified cutaway, **not to scale**, so it does not present exaggerated layer
thickness or tool sizes as real specifications. Row-dependent magnification
keeps every selectable count (1?8) inside the sample without overlapping pads.

The press has a platen, supports and a moving lever. Pull its lever downward;
an incomplete drag does not run the process. The drill has interchangeable
mechanical bits and a distinct laser tool. Hold its feed wheel; an early release
cancels. The housing stays fixed while the spindle rotates and feeds. Lower the
bath basket to plate; bubbles give process feedback. P / D / L and a native
on-screen cycle button provide accessible alternatives. Pip remains in view,
with articulated arms aimed toward the current handle.

Verification happens at another table, against the customer's lamp, router,
BGA assembly, heat spreader or shield. These change with the order; their
feedback reflects the existing verdict. They are visual demonstrators, **not**
new RF, thermal or semiconductor simulations.

Five constraints reuse one skill differently: a through connection, a blind
radio connection, a buried inner connection, a filled/capped in-pad thermal
connection, and a row of ground stitches. The buried order makes process order
matter: sealing layers before making the required internal connection is not
equivalent to making it before lamination. Cost and manufacturing checks remain
in the pure rules engine rather than being replaced with scripted success.

Default text is the customer's desired outcome and current work area. Open
"Sample measurements" for numeric results or "Why these choices?" for the
reason behind layer span, tool size, plating, annular ring, finish and count.
The shop profile is labeled as shop values. A microvia process rule in this game
does not purport to describe every manufacturer's stackup and process.

Evidence: [workshop](screenshots/review5/workshop-survey.jpg),
[inspection](screenshots/review5/inspection.jpg),
[press](screenshots/review5/press.jpg), [drill](screenshots/review5/drill.jpg),
[bath](screenshots/review5/plating.jpg),
[copper cutaway](screenshots/review5/copper-section.jpg),
[customer hardware](screenshots/review5/hardware-test.jpg). The
[eight-via geometry preview](screenshots/review5/eight-via-preview.jpg) checks
maximum row spacing; it is not presented as a valid one-via lamp order.

Educational grounding: layer spans distinguish through, blind and buried vias;
drill pairs are tied to the stackup, and tenting, plugging and filling/capping
are different treatments. See [Altium's via overview](https://resources.altium.com/p/pcb-via),
[drill-pair documentation](https://www.altium.com/documentation/cstu/via) and
[IPC via-treatment overview](https://resources.altium.com/p/IPC-vias).
Actual fabrication capability must be confirmed with the manufacturer.

### Locomotion and work animation

The earlier repair made the nested GLB meshes respond to animation, but swinging
rigid legs still looked like shuffling. The new gait uses **distance traveled**:
a stance foot tracks backward by the body's traveled distance, then lifts and
returns during swing. Boot position is separate from hip rotation; thigh and
shin segments bend toward the knee. Unit checks cover the planted-foot relation
and two-bone lengths. Walk and sprint speeds are reduced to 2.8 / 4.8 m/s.
Stopping keeps the feet at their current positions and lowers a swinging foot
instead of snapping both boots together. Extra body wobble while moving is gone.

Arms now have separate upper/forearm segments; carry and work poses bend the
elbows. Machine work aims the right glove toward the handle. Light objects sit
closer and lower; the carried Via sample is smaller than the inspection model.
This is a procedural stylized rig, not a full contact-aware character system:
turning, slopes and exact grips for every prefab still need animation work.

Evidence: [successive rendered walking frames](screenshots/review5/walk-sequence.jpg).
The HUD is hidden only for these foot-inspection frames. The capture tool also
records local WebM footage; videos are not committed.

### Mopping: an action with a tool

The bucket-shaped prop is replaced with a shaft, grip and flat string head, with
matching compound colliders. Holding a mop while standing by a spill no longer
cleans automatically. Hold Space to scrub, or use the Scrub button on touch or
controller. Water is consumed only while actively scrubbing near the spill.
The head stays near the floor and sweeps sideways; Pip uses a work-arm pose.
This is a meaningful improvement to tool use, not a claim that Lunch Rush's
entire fetch-and-cook sequence has been redesigned.

Evidence: [active mopping](screenshots/review5/mopping.jpg).
The cable dolly is also constrained against tipping. Its clean route parks it
fully past the swinging doorway before turning toward the kitchen.

### Workers, camera and surroundings

Coworkers are stylized humans in suits, collars and ties, with separate head,
hair, face, arms, trousers and shoes. Glasses vary by worker. The seated mesh is
different from the standing mesh, and changes to standing if its chair is
removed. No agent-harness mascot accessories are restored. Standing workers
still lack collision and a leg gait; that remains an interaction defect.

The wheel can zoom to 3.5 m; default station exploration starts closer. Via
has work-area-specific close cameras that retain the worker. Hanging fixtures
are moved clear of inspection sightlines. A solid-world ray limits close camera
distance: it now stays in front of the Arcade cabinet and Spectrum wall that
previously filled the entire screen. There is **no complete first-person
mode** in this pass. Enclosed rooms are allowed; the stock annex has a roof
using occlusion fade, not a mandate to expose every room as a cutaway.

The exterior now has facade windows and entrances, roof equipment, curbs,
sidewalks, crosswalks, parked cars and animated road traffic. It establishes
occupied surroundings and scale. It remains stylized, non-interactive dressing;
it is not a realistic explorable outdoor level.

## Every room needs its own playable verb and structure

The survey includes all 15 current rooms in play, survey and close views. Apart
from Via/HQ, most layouts still concentrate the problem on one bench. Different
wall colors and new human models do not make those jobs distinct. The following
is the next design specification, **not a list of features already shipped**.

Evidence: [all-room layout sheet](screenshots/review5/all-rooms-survey.jpg)
and [all-room close-camera sheet](screenshots/review5/all-rooms-close.jpg).
The earlier captured camera obstructions were corrected and these sheets
regenerated. All 45 individual views and physics reports remain in the ignored
local `artifacts/design-review/review5-final/` directory.

| Room | Useful spaces and manipulation | Reasoning and variation |
|---|---|---|
| HQ | Reception, three wings, automatic portal thresholds; implemented reference | Choose the next job quickly; navigation must not become a fetch puzzle. |
| Playground | Supply rack, movable cable guides, two visible loads; open training floor | Show slack, strain and load response immediately. Apply routing to a dry route, a short reach and a wet hazard rather than repeat one plug task. |
| Big Meeting | Audience floor, ceiling projector on an adjustable arm, presentation rack, service alcove | Diagnose the absent image or overloaded supply; reposition or share loads. The scene should change when the presentation works. |
| Lunch Rush | Wash lane, prep counter, cooking line and serving pass | Scrub physically, park the cart, operate a cooking control. Vary spill location and simultaneous load demand; don't add more identical carried ingredients to make it longer. |
| Via Counter | Inspect, press, drill, plate, customer test table; implemented reference | Choose span, process order, ring, finish and count from different customer constraints. The cutaway and actual device give causal feedback. |
| Via Rush | Same vetted tools, incoming tray and dispatch lane | Add sensible batch planning and order priority before increasing throughput. Fifty unnecessary room crossings are not difficulty. |
| QFN | Component trays, magnifier/reflow bench, powered test fixture | Rotate recognizable leadless packages, inspect pin-1 marks and pad faces, place using clearance/thermal constraints. Test a sensor board and a power board with different failure clues. |
| Archive | Document drawers, reading desk, physical test chamber | Compare guaranteed limits against tempting absolute maxima; adjust supply/load/temperature in the chamber. Resolve conflicting evidence rather than copy one number into a field. |
| Waterworks | Accessible inlet/outlet manifolds, valves, gauge taps and separate load bay | Manipulate a network, measure an equivalent source, then predict two different loads. Label the water analogy explicitly; avoid implying hydraulic behavior is literally electrical behavior. |
| Observatory | Motor-noise source, scope bench, filter sockets, window-side antenna | Measure noise, adjust a filter and aim/locate the receiver. Reuse signal knowledge for conducted noise and a blocked radio path with distinct measurements. |
| Arcade | Two open-back cabinets, resistor trays, LED/lens test rack | Read resistor bands and LED polarity, compare brightness/current/heat under different supply budgets. A repaired cabinet lights and runs visibly. |
| Garage | Motor rig, flyback protection sockets, scope, short robot track | Diagnose switching kickback on the scope; install protection and test motion. Apply the same protection knowledge to a changed load or braking case. |
| Clockwork | Crystal/RC modules, trim control, conveyor timing gates, warm enclosure | Observe drift and accumulated timing error, choose/trim the source, then validate under changed temperature. Show missed timing gates, not just an answer panel. |
| Depot | Source cabinet, load terminals, V/I/P meters, physical delivery lane | Measure before setting limits; use the same power relationship for motor start and sustained payload. Visible bottlenecks and meter traces distinguish the cases. |
| Spectrum | Emitters, reflectors, receivers, material barriers and a corridor | Aim and move room objects to build a working path; change medium, obstruction and range. Keep optical reflections distinct from the simplified RF propagation model. |

Start with **Garage**, then **Waterworks**: both already have rules worth exposing
through distinct physical equipment. Do not add another mode before validating
one of these complete room loops with players. Reuse the workplace interface
introduced for Via, but do not clone its process order or tool gestures blindly.

## Gates for the next implementation

**Interesting decisions before errands.** Each order needs a changing constraint,
a plausible alternative and observable consequences. A useful trip carries a
measurement or decision to another tool. If walking adds no information or
choice, shorten it. A larger room should contain purposeful spaces, not longer
empty routes; target short transit between related operations.

**Teach goals, not recipes.** State the desired outcome and two or three relevant
constraints. Give initial visible clues and one optional explanation. On failure,
point to the observed cause and let the player revise one choice. Escalate hints
on request. Verify that a first-time player can infer the next useful test without
knowing the developer's intended sequence; this still needs blind human testing.

**Components must explain themselves.** Show functional faces: terminal screws,
pins, polarity, pin-1, actual jaws, bit tips, barrels, pads, valves and meters.
Label manufacturing diagrams as magnified when needed. Avoid cylinder stand-ins
that claim to teach an unseen internal structure. Keep a few context tools on
each bench; a tool that appears operable should operate or clearly be storage.

**Contact and animation are acceptance criteria.** Review walk, sprint, turn,
stop, carry, put-down, press and scrub in motion. Check planted boots against a
floor marker, grips against the specific prop and gloves against actual handles.
An animated joint angle alone is not evidence that the rendered character walks.
Formal coworkers still need grounded walking and collision-aware circulation.

**Readable architecture and cameras.** Give each room a floor plan with a clear
work lane, storage, service area and sightlines. Use enclosed walls/roofs where
they help. Close views need tested occlusion and limits; first-person would need
near-plane handling and visible hands, not merely hiding Pip and moving a camera.
Inspect defaults and orbit angles, especially behind lamps, machines and signs.

**Flicker and physics are separate checks.** Avoid coplanar decorative layers,
duplicate machine housings and transparent sheets on opaque faces. Match rendered
solids to colliders, let bodies settle, inspect doorway behavior and distinguish
intentional spindle/bubble animation from stationary furniture motion. The old
survey's clipping and generic-prefab issues are not all closed by this pass.

**Performance must be measured.** The detailed surroundings and work machines
add draw calls. Batch static dressing and cull/merge distant facades before more
room detail. A full-effects screenshot with no errors does not prove a stable
frame rate on the player's GPU. Preserve low-effects mode and test a sustained
interactive route on representative hardware.

## Verification and remaining limits

Validation on September 30: the production build passes, and all 150 unit
tests in 19 files pass. The complete browser suite passed all 57 checks in
26 minutes. Final Via diagram spacing, returned-order wording and order-marker
fixes were followed by a focused rerun: all six Via/Rush/workshop checks passed
in 3.6 minutes. The all-room
full-effects survey captured 45 views across 15 rooms with zero browser errors
and no settled props retaining angular velocity. Browser tests advance
deterministic manual time; they prove rules and scripted routes,
not first-time comprehension or enjoyment. Visual evidence is from the actual
full-effects renderer, not concept art. `tools/experience-review.mjs` reproduces
the reference interactions; `tools/design-review.mjs review5-final` reproduces
the all-room survey (Vite at port 4174).

An isolated real-GPU check at 1440 x 900 with full effects measured HQ at
280.6 fps (p95 frame 5.5 ms), Via at 251.2 fps (5.7 ms) and Big Meeting at
208.4 fps (6.0 ms), using an AMD Radeon RX 9060 XT. These are four-second
stationary samples after a 2.5-second warmup with other QA browsers closed,
not a sustained moving playthrough or a low-end hardware guarantee. Earlier
concurrent-browser samples were much slower, so do not treat either sample as
proof that frame-time work is finished. Reproduce with
`BASE_URL=http://127.0.0.1:4174 Q='&fullfx' node tools/perf.mjs lobby vias meeting`.

Specific regression coverage adds remote-operation rejection, incomplete lever
and drill gestures, completed gestures, active-versus-passive mopping, grounded
mop position and phone controls/explanations. Existing Via playthroughs now walk
between the appropriate work areas. The hub route uses the new wing entrance;
Lunch's route clears the doorway before turning the cart, and its alternative
cooler route parks the shelf away from the fridge. Arcade pickup approaches the
stock tray closer rather than grabbing a nearby reel. Big Meeting's single-reel
check uses the service aisle instead of first wrapping the cable around desk
pods; it still verifies that walking falls short and braced sprint stretches it.
Those route updates
follow the changed layout and movement; they do not bypass colliders or remove
electrical/manufacturing checks.

Open limits: nine other station puzzle designs still focus on a bench; Rush
needs batching to avoid excessive travel; formal NPCs do not have collision or
walking legs; carrying and handle contact need more prop-specific animation;
first-person is only permitted/planned; the exterior is stylized dressing;
general collision, z-fighting and frame-time audits remain necessary. The
reference redesign needs a human fun/comprehension playtest before its pattern
is copied to other rooms.
