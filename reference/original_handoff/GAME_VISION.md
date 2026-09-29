# Game vision and design rules

## Player fantasy

You are a junior maintenance crew member in **Circuit Crew**, an absurd research and appliance facility whose rooms are part workshop, part office, part mechanical toy. The manager requests outcomes (“Get the elevator carrying lunch again”), not equations. Every room contains props with physical affordances: rolling carts, levers, cords, sockets, breakers, fans, fluid valves, test probes, conveyer belts, shutters, glass walls and little customer windows. Experimentation is the normal way to discover the solution. Other crew members can join, hold objects, route a second cable and celebrate failures.

The building is enclosed and persistent, with a central atrium and short, visually distinct wings: Power Lobby, Kitchen, Packing Floor, Pipe Plant, Signal Tower, Via Foundry, Fabrication Bay and Archive. Doors unlock as systems are repaired. Players return to earlier rooms with new tools and find optional alternate solutions. The world can expand beyond an office into a roof antenna, loading dock and miniature factory without changing its coherent architectural language.

## Non-negotiable pillars

1. **The environment is the primary interface.** The majority of active mission time is walking, carrying, routing, stacking, measuring, aiming, opening, crossing, unplugging, reconfiguring and observing in 3D. Design target: roughly three quarters of a typical mission in the room, with brief close inspection and only occasional screen work. This is a playtest target, not a timer exposed to players.
2. **Make a prediction, then cause a visible result.** A struggling lamp flickers, a conveyor hesitates, a fan spins, a motor heats up, a signal display garbles. Probes and meters connect symptoms to quantities. No answer is accepted merely because a multiple-choice label was clicked.
3. **One physical problem permits more than one route.** A cart can bring the supply closer; a longer cable can reach around furniture; a safe barrier can prevent a dragged metal shelf from bridging rails. Alternate valid configurations receive different time/mess/efficiency scores, not a single prescribed path.
4. **Playful chaos is recoverable.** Loose objects collide, tangle and topple. Electrical failures trip a breaker or replace a cartoon fuse. One button isolates power; the crew can reset the room. No irreversible soft lock or punitive game over.
5. **Electronics stays truthful at the level taught.** Analogies are labeled, parameter assumptions are visible when needed, measurement reflects the actual model, and a later stage refines a simplified early lesson. Fun comes from making the right ideas actionable.
6. **The social layer is optional.** Solo players can perform every required action. Co-op provides simultaneous carrying, holding, testing and hilarious coordination; it never hides essential instruction behind voice chat.

## Moment-to-moment loop

**Notice** a problem in the room → **inspect** with eyes, hands or a tool → **predict** with a small diegetic marker or by choosing a plan → **move/configure** props → **energize/test** at a reachable switch → **read feedback** through motion, light, sound, meter and state → **refine** → **finish** when the machine sustains its job. A short end card names the actual principle and shows the successful arrangement alongside the measured values. Optional “why did this work?” expands to a concise explanation and a transfer challenge in a different room.

Tutorial information lives on labels, drawings on a maintenance clipboard, a buddy's brief dialogue, and the device's reaction. An optional accessibility overlay can show exact values, units, connection paths and subtitles. A single task never blocks completion because the player declines a text lesson.

## Interaction verbs and camera

WASD/stick move; orbit camera; jump/climb low props; one button grab/release; another rotate/aim; use to flip/push; tool wheel for cable reel, meter, probe, insulated pliers and clipboard. A held object's outline and socket highlight show fit. Large items have weight, wheels, collision and co-op handles. Tiny PCB parts use forgiving near-field snap and rotate increments on a physical board that still occupies the 3D world. Cable placement is path drawing from a plug while the player walks, with bend and length feedback. Cords are legible splines with physical anchors and simplified rope collision, not hundreds of simulated segments.

The camera sits at a three-quarter view, pulled back enough to see the local room and avatar. It avoids walls, fades obstructing geometry and briefly eases to a tabletop or meter when necessary. Players retain the sense that the board is in the room. Split screen must keep active props large enough; online camera positions are independent. The game never opens a browser tab for ordinary repair.

## Room and progression structure

| Chapter | Space changed by player | Knowledge earned | Tool/possibility unlocked |
| --- | --- | --- | --- |
| 0: Arrival | Power Lobby, two dark rooms | closed loops, source/load, open/short, voltage versus current | grab, reel, switch, simple meter |
| 1: Daily Operations | kitchen, loading dock, lift | resistance, power, current limits, transient demand, capacitors | resistor bins, capacitor cart, watt/temperature displays |
| 2: Utilities | pipe plant, mechanical rooms | series/parallel, equivalent source/load, Thevenin/Norton intuition | adjustable valve rig, circuit analyzer |
| 3: Signals | tower, radio room | DC versus changing signals, filters, inductors, frequency and EM spectrum | coil rig, scope, antenna aim |
| 4: Manufacturing | foundry, fabrication bay | vias, layer connections, grounding and stitching, routing, QFN placement | drill/fill/cap stations, board fixtures, inspection camera |
| 5: Field Service | archive, scattered older rooms | datasheets, tolerance, part selection, clocks, integrated troubleshooting | document search, part scanner, transfer contracts |

The facility remains explorable between contracts. A successful job changes an actual state: a wing lights, a lift runs, food service opens, radio announcements become clear, an NPC route changes. Repeated contracts remix components, room obstacles and symptoms; they are not merely new numerical prompts.

## Mission pattern library

- **Carry and place:** move supply, load or component; weight and reach matter.
- **Route and untangle:** guide conductors through doors, around furniture and across safe bridges; avoid shorts, heat and cable limits.
- **Configure a machine:** throw breakers, adjust valves, set a source, arrange a filter or fit a safe part.
- **Coordinate timing:** start an oscillator or catch an intermittent fault while the machine cycles.
- **Inspect evidence:** use meter/scope/thermal camera or a datasheet clue to choose among plausible repairs.
- **Manufacture and validate:** take a job ticket, build a via or board, run in-world inspection and put it into a working device.

Each mission should combine at least two patterns and one visible room transformation. The first five minutes always include an amusing physical verb. The later explanation names the theory that the player has already used.

## Modes

| Mode | Structure | Scoring and learning |
| --- | --- | --- |
| Story Shift | Solo or cooperative, persistent rooms and character progression | Completion first; optional hint and explanation; no clock pressure |
| Open Lab | Any unlocked room with parts, switches and resettable experiments | No fail state; probes and values inspectable; saved setups |
| Service Contracts | Short randomized jobs built from tested templates | Accuracy, time, resource use and mess shown separately; no education penalty for trying |
| Crew Rush | Optional timed local/online co-op set of rooms | Cooperative score, safe resets, visual communication pings |
| Challenge Bench | A few deliberate close-up placement/routing and datasheet missions | Precision puzzle scoring; always connected to a device in the room |

No impostor/sabotage mechanic is necessary. The Among Us comparison supplies legible compact spaces, tasks and social movement, while the core is cooperative repair. If asymmetry is explored later, assign complementary tools and information, never secret betrayal required for education.

## Teaching and assessment philosophy

A concept is taught when the player can *transfer* it. A resistor mission in a lamp circuit is followed by a heater or motor control situation with different art and no “resistor” instruction. A mission objective is observable performance over several seconds, not possession of a keyword. After a failure, show the cause: current spikes, fuse trips, component heats, or voltage at load sags. Hints escalate: point to symptom → suggest a measurement → identify a class of fix → reveal one valid arrangement. Record which hints were used for adaptive guidance, never shame the player.

Check understanding through replayable changed conditions, not surprise quizzes. Introduce real units after the physical intuition, and put exact, calibrated values on instruments. Provide a toggle between “intuition” and “engineering view”; both operate the same simulation. Accommodate novices with generous tolerance and experts with an optional stricter specification. Treat wrong hypotheses as useful experiments.
