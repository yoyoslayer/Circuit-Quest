# Mission catalogue

Each brief defines an outcome, a physical space, actions, system checks and the knowledge it teaches. Values here are prototype examples, not real equipment specifications. Final educational content needs electrical review and tuning.

## 01 — West Wing Blackout (vertical slice)

**Situation:** The lift and two corridor lamps are dark. A breaker cabinet, supply cart, spare fuse, two cable reels, metal shelving and portable meter are scattered over connected rooms. A locked door can be reached through the lift once restored.

**Play:** Push the cart where its cable reaches. Unwind a cable by walking around shelves; raise/shift one shelf or route over a cable bridge; fit the appropriate fuse; plug the supply into the distribution rail; test lamps and lift separately. A wrong loop or exposed conductor near metal trips a clearly labeled breaker with a harmless puff. One solution uses a longer route; another moves furniture and the cart. The final load combination must remain on for ten seconds.

**Learns:** A complete loop is required; voltage is available potential difference at the source/load; current requires a closed path and changes with load; a short offers an unintended low-resistance route. **Probe:** two nodes of the dark lamp, then the source, then source current. **Failure feedback:** current arrow surges toward the short, cable flashes, breaker flips; open circuit shows source voltage but no lamp current. **Transfer:** restore a freezer in a new room with the switch on the other side of the load. **Co-op:** one moves the cart, one guides the reel and watches the cabinet.

## 02 — The Hall of Too Many Lamps

**Situation:** A party room has an LED wall, dimmer rack and shelves of current-limiting resistor blocks. Some channels glow too bright and warm; others are dark.

**Play:** Carry color-coded but numerically labeled blocks to socket strips along the wall. Inspect supply and LED forward voltage in engineering view; insert a series limiter, then power and compare light, temperature and ammeter. Loose strips can be moved to shorten cords. A parallel resistor across the LED is visually tempting but wasteful and may not protect it. **Check:** brightness in band and simulated current under rating, sustained for ten seconds. **Learns:** series resistance limits current; power dissipated in the resistor; polarity matters for LED. A later conveyor warning beacon transfers the idea with different form factor. No actual explosion; an overcurrent channel trips and needs reset.

## 03 — Lunch Lift Brownout

**Situation:** A lunch lift starts a motor; nearby lights dip and a controller reboots. A wheeled capacitor bank, undersized cable, alternate power route and clamps sit in the storage room.

**Play:** Start the lift and watch the voltage meter dip during startup. Roll a capacitor module close to the controller's supply terminals and connect correct polarity; shorten/upgrade the feed or move the source as alternative remedies. The module must be sized for the permitted voltage and safely discharged before handling in expert mode. **Check:** controller stays above its threshold during several starts. **Learns:** a capacitor stores charge and can supply a brief transient locally; it does not create energy or replace a supply. The long-term lift power still comes from the source. **Variant:** a too-small bank helps only briefly; a too-long wire causes enough drop that the capacitor alone cannot fix it.

## 04 — The Supply Delivery Dock

**Situation:** Animated supply trucks queue at a narrow loading lane; a belt represents charge flow, while an elevated tank/ramp indicates electrical potential. These are teaching props inside a functioning distribution room, with a real meter overlay available.

**Play:** Move barriers, connect lamps and motors to rails, then adjust source potential and load resistance while physically tracing loops. A high voltage at an open socket does not mean trucks are moving. With a short, the belt races and the breaker trips. **Check:** two devices receive their required voltage and safe current simultaneously. **Learns:** voltage is potential difference, current is rate of charge flow, power is energy transfer rate. The truck analogy is explicitly imperfect: trucks are not “used up” at loads, nor is voltage a number of trucks. **Transfer:** use a meter in a non-metaphorical room.

## 05 — Pressure Plant Rescue (Thevenin and Norton)

**Situation:** A pipe wall feeds a fountain through a maze of tanks, constrictions and faucets. The far machine only exposes two terminals/ports. A meter, adjustable restriction and temporary load sit beside a heavy moveable pump.

**Play:** Repair the fountain physically by moving sections of pipe, opening valves and matching a replacement source. The puzzle initially allows trial and observation. Later contracts ask the player to make a compact replacement for the inaccessible pipe network: measure open-port pressure, measure with a known test load, and set an equivalent pressure source plus series restriction. Flip the rig into a current-source presentation with parallel restriction to demonstrate equivalent external behavior. Compare gauge behavior as the load changes. **Check:** at least two different test loads produce matching port behavior within tolerance. **Learns:** from a pair of terminals, a linear network can be represented by Thevenin voltage + series resistance or Norton current + parallel resistance, with I_N = V_Th/R_Th. The pipe analogy introduces intuition; the game then shows actual electrical terminals and equations. **Guardrail:** water flow and voltage analogies are scoped to steady-state linear cases; water storage/viscosity is not asserted as universal circuit physics.

## 06 — Whispering Radio Tower

**Situation:** A rooftop receiver plays an intermittent, garbled Morse-like pattern while nearby motors inject noise. Heavy coil frames, filter cartridges, ground strap reels and a movable antenna stand occupy an open tower room.

**Play:** Walk a portable scope to source and receiver. Move a motor away, reroute the signal cable, place a series inductor in a low-pass path or arrange an LC filter from provided modules, and compare the scope and audio. Cable placement around machinery matters. A DC-fed latch must still work. **Check:** target signal decodes with an adequate signal/noise margin while latch behavior remains within spec. **Learns:** an inductor resists changes in current; reactance grows with frequency in the ideal model, and a filter depends on topology, source/load and frequency. It does not simply block every AC signal while magically passing every DC condition. **Transfer:** smooth ripple in a machine room with a different filter geometry.

## 07 — Spectrum Observatory

**Situation:** A dark dome has a rotating transmitter, sliding antenna, metal shutters, tinted barriers, thermal lamps and visible light projectors. Hidden emitters reveal their presence through different sensors.

**Play:** Carry sensors, aim reflectors, open/close shutters and choose matching receiver modules to send a message across the dome. An obstacle that blocks visible light may not block radio the same way; a shield and antenna orientation alter reception. A movable wavelength/frequency model stretches and compresses a wave ribbon as the player changes a dial. **Check:** obtain a message across two environments with the correct sensing and shielding choices. **Learns:** all electromagnetic bands are related by frequency and wavelength (c = fλ in vacuum), with different interaction and safety contexts. **Guardrail:** do not suggest all bands are safe to stand beside; exaggerated scale is labeled. Optional world map shows radio, microwave, infrared, visible, UV, X-ray and gamma relative order. No flashcard gate.

## 08 — The Unclocked Kitchen

**Situation:** Conveyor ovens burn trays because a controller lacks a stable timing reference. A blinking wall beacon and several clock module cases sit on rolling shelves.

**Play:** Time the oven cycle by watching belt motion; fit a compatible oscillator module into an accessible panel, route the clock line clear of an interference source, then check phase and cycle count on a scope mounted to the oven. Adjust divided clock setting so the belt gate and heating cycle coordinate. **Check:** three consecutive trays are correctly cooked and ejected. **Learns:** a controller needs a timing reference, which may be internal or external; a crystal/oscillator provides stable timing when the design calls for it, while firmware and clock division determine actions. The player does not attach a crystal to every appliance by default. **Variant:** a drifting module works briefly, then causes accumulated timing error.

## 09 — Via Café / Foundry

**Situation:** Requests arrive through a window, but the player works in a walkable miniature fabrication line. Each order names a functional need, layer pair and manufacturing constraints. A customer may need a ground connection near a noisy chip, a blind escape via from an outer layer, or a filled-and-capped via under a pad.

**Play:** Carry a panel onto a drill press; select drill diameter; move it to plating, fill and cap stations as required; set the layer span on a mechanical fixture; inspect the cutaway with a magnifying arm; place ground stitching locations along a board edge when requested; put the finished board into a visible appliance before serving it. Queues are relaxed in Story and fast in Crew Rush. **Check:** fabricability rules pass, correct net and layer span conduct, annular ring meets the job's minimum, fill/cap matches assembly need, and a test device works. **Learns:** barrel, pad, annular ring, drill, plating, layer span, fill/cap; through, blind, buried and microvias as manufacturing structures; ground and stitching describe connection/use, not separate drilling families. An incorrect ring tears during cartoon inspection; a missing ground stitch gives visible noise in a test fixture. **Guardrail:** chosen min ring and aspect ratio are fab-profile dependent; label them as profile values, not universal constants.

## 10 — QFN Cargo Maze

**Situation:** A palm-sized IC is represented on an oversized physical PCB fixture in Fabrication Bay. Component crates, decoupling capacitors, thermal pads, trace ribbon dispensers and a crowded rack fill the room. Players can climb around the board and use a small gantry crane.

**Play:** Move capacitors near the intended power pins/return, rotate and snap footprints, then lay trace ribbons and vias. The puzzle is spatial like reverse car parking: short, clean critical paths win, but a crossing on one copper layer is impossible without a legal layer change. The overhead inspection camera is an optional brief view; the actual board remains in the room. **Check:** netlist connectivity, clearance, layer, polarity and simple path-length/loop-area proxy all pass. An LED test rig runs when the board is installed. **Learns:** placement precedes routing; decoupling effectiveness depends on current loop/return and physical proximity, not just a capacitor existing anywhere; QFN pad access and thermal connection constraints. **Variant:** one layer routes cleanly only after relocating a crate; two layers permit a via with cost. **Guardrail:** the exact fabricated layout must later pass a real DRC and electrical review; visual art is illustrative.

## 11 — The Archive Detective

**Situation:** A replacement part is missing from a machine. The player can pull physical boxes and catalogs, scan part labels, turn a computer in the archive and inspect an in-world datasheet. The search occurs while the machine, socket and test rig remain visible nearby.

**Play:** Read the machine symptom and identify what is actually needed: rated voltage, resistance/tolerance, package, pinout, manufacturer part number or typical application layout. Search document headings and tables, compare a candidate against an absolute maximum and recommended operating range, carry the selected box back and test the repair. A misleading “typical” number creates a plausible failure that can be diagnosed. **Check:** selected part fits and works across the specified operating range. **Learns:** index/navigation, package versus electrical rating, pin numbering, revision, typical versus guaranteed conditions, absolute maximum versus normal use. **Important:** a bare resistor's ohms are a part specification, not invariably a number derivable from any arbitrary datasheet image. Use authored, licensed or original fictional datasheets with consistent data. **Mode:** one of the few deliberate desk-computer moments; still a complete room task, not a generic browser quiz.

## 12 — Grand Reopening (capstone)

**Situation:** A storm leaves kitchen, tower and lift interacting badly. Players have a limited stock of safe parts and many ways to prioritize work.

**Play:** Survey faults, isolate branches, reroute supply, stabilize controller during motor startup, fix a noisy signal and replace a failed board from the foundry. Doors and moving carts create a shared physical logistics puzzle. The order of repairs changes which routes become available. **Check:** all three services run together for a full duty cycle; each branch remains in rating. **Learns:** transfer and systems thinking across multiple concepts. **Scoring:** separate completion, safety, cost, time and mess; readable replay of what the player changed. Solo route never requires simultaneous switches; co-op can divide work.

## Mission authoring contract

Each new mission specifies (1) a visible job, (2) a broken initial state, (3) two or more meaningful physical actions, (4) at least one diagnostic observation, (5) a causal simulation check, (6) recoverable failure, (7) a no-hint learning target, (8) a later transfer instance, and (9) solo and co-op routes. If a task can be completed by picking an answer inside a fullscreen window without touching the room, it needs redesign or belongs in the small Challenge Bench subset.
