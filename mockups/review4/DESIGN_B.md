# Design review B: Arcade, Garage, Clockwork, Depot, Spectrum, and the three cable floors

This is a game-design and teaching review, not QA. Cosmetic items already in `mockups/review3/REVIEW_B.md` are left out. Evidence comes from the code at HEAD and the screenshots in `mockups/review3/b/` and `docs/screenshots/`.

**Verdicts at a glance** (worst first)

| Floor or station | Verdict | Severity |
|---|---|---|
| Depot | Redesign | High |
| Clockwork | Redesign | High |
| Arcade | Fix, part redesign | Medium-high |
| Lunch Rush | Fix | Medium |
| Garage | Fix | Medium |
| Spectrum | Fix | Medium |
| Big Meeting | Keep, small fixes | Low |
| Playground | Keep | Low |

---

## 08 Overheating Arcade

**What the player actually does**
- Carries a tray to the bench (cosmetic: it only unlocks the rack).
- Picks a power rating, then one of 14 E12 blocks. The rating is modal: it applies to the next pick.
- Clicks SERIES or ACROSS, flips the LED, and presses POWER.
- Waits a **10 s soak** (`logic.ts:37`), presses SIGN OFF, and repeats ×5.

**Teaching value**
- The content is the most correct in the set: R = (V−Vf)/I, P = I²R against the rating, polarity, the resistor-across-the-LED trap, base resistors and battery life.
- But the meter shows the current at once, so the winning strategy is to step ←/→ until the bar turns green. The formula sits only in the panel's fine print.
- **Wrong:**
  - A PTC fuse resets itself when it cools. Here it needs a RESET button, and the toast then says "A PTC fuse cools and conducts again once the fault is gone" (`station.ts:245`).
  - An LED a little over 20 mA "cooks" in about 2 s (`update`, `heat.led>1`). Over-current shortens an LED's life; it doesn't kill it on the spot.

**Metaphor:** none needed. The arcade framing is fine.

**Usability**
- 10 hotkeys (`station.ts:313`).
- The modal rating is a hidden rule.
- 50 s of dead soak time across the five cabinets.
- An 11-row side panel.

**Fun:** a menu puzzle. The only laugh is the TILT marquee.

**Verdict:** fix, with a partial redesign. Keep `logic.ts`. Replace the rack lookup and the soak.

**Redesign: "Candy Resistors"**
- Resistors are chunky props in bins, in just three values (100, 220 and 470 Ω).
- The cabinet's open back has a chain socket:
  - blocks snapped end to end add up (series);
  - blocks side by side in the wide slot share the current (parallel).
- So the player *builds* 320 Ω or 69 Ω instead of reading a list.
- What they see:
  - the marquee bulb's real brightness, plus a kid queue that cheers only when it's bright enough;
  - current as Lunch-style `Pulses` on the feed cable;
  - an overloaded block glows, smokes, then **pops out and ricochets across the arcade** (damage-graded);
  - a backwards LED: Pip lifts the giant two-legged LED and turns it round;
  - the fuse is a PTC disc that glows red and visibly cools.
- Escalation:
  1. One cabinet.
  2. Four cabinets on one strip: a coworker's "fix" across one LED dims the whole row.
  3. The battery handheld: a day-night time-lapse shows the battery draining, and the win is the dimmest LED a far-away kid can still see.
- The soak is replaced by "a kid plays it for 3 s".

## 09 Robot Garage

**What the player actually does**
- Carries the robot to the stand.
- Picks one of 5 parts, clicks one of 4 sockets, and flips polarity or the ground route.
- Presses PULSE, reads the scope and toast, then TEST.
- Watches the robot drive its route at the end.

**Teaching value**
- The physics is excellent: an implicit coil-and-node solver, diode vs zener vs TVS stop time, "a capacitor doesn't fix it", and star ground.
- The player never works it out, though. After the first failed pulse, the prompt prints the fix:
  - "a flyback diode across the motor, band toward +12 V" (`logic.ts:76`);
  - "Flip the GROUND lever" (`logic.ts:80`);
  - shown by `station.ts:398`.
- **Hidden rule:** a zener only gives a high clamp when it is flipped *and* in series with a diode (`logic.ts:89-92`). The hint says only "a zener in breakdown", so a lone zener behaves like a plain diode and confuses players.

**Metaphor:** honest. But the only evidence is a V-against-µs scope plot, which most players can't read.

**Usability**
- **16 hotkeys** (`station.ts:303`).
- Polarity is explained in words ("band on the left").
- The sockets are named after topology (ACROSS MOTOR, ACROSS SWITCH, AT CONTROLLER).

**Fun:** the drive-off at the end is the only toy, and it comes after the learning.

**Verdict:** fix (medium). Stop printing answers, and make the spike something you see.

**Redesign: "Kickback"**
- The motor switch is a big wall **knife switch** that Pip yanks open.
- With no current path, a fat arc jumps the blades. The lights flicker, and the robot's head does a dizzy reboot (spinning eyes), forgets its route and wanders off.
- Current shows as cable pulses. With a diode fitted, the pulses **keep circling the motor-and-diode loop** after the switch opens and fade slowly: the concept, made visible.
- The diode is a prop, plugged across the motor with two short springy leads (reusing the rope). If it's backwards, the fuse bangs and everyone ducks.
- Escalation:
  1. Stop the reboots.
  2. Stop line: with only a diode, the loop fades slowly and the robot **coasts past the line into the shelving**. A zener makes it fade fast.
  3. Cargo: the head dims and resets on every start. Pip **drags the controller's ground cable** to the battery post (a literal star ground).
- The scope becomes a wall replay of the last event, not a required step.

## 10 Clockwork Kitchen

**What the player actually does**
- Rolls the shelf over and carries the dough.
- Picks INT RC or a module, then turns the DIVIDER "until the tick reads 1.000 kHz". The prompt says exactly that (`station.ts:365`).
- Toggles ROUTE and presses RUN BELT: three trays come out golden, raw or burnt.

**Teaching value**
- **Wrong stakes.** The oven's "10 min bake, ±0.2 %" (`logic.ts:50`) is 1.2 s on a loaf of bread, so precision feels arbitrary. Crystals matter for communication (UART/USB baud) and for long-running clocks.
- **Watch crystal taught wrongly.** `logic.ts:100` says "no whole-number divider gives exactly 1 kHz". Real firmware counts 1024 ticks per second: 32.768 kHz = 2¹⁵ was chosen for power-of-two division, and it is *the* timekeeping part. Players learn to distrust it.
- The divider is arithmetic with the answer printed (÷4000 and ÷16000 are decoys).
- The choice of source is a table lookup: ±1 %, ±0.5 % or 30 ppm against the spec.
- The one real "watch it happen" moment is the replay where tray 3 burns as the board warms.

**Metaphor:** a bad mapping.

**Usability:** 11 hotkeys, and percent/ppm jargon.

**Fun:** press RUN and watch three trays.

**Verdict:** redesign (high).

**Redesign: "Hand-off Kitchen"**
- Two belts, each with its own controller. Belt A flips a pancake onto belt B's plate once a beat.
- With a 1 % mismatch, the plate drifts a little further on every flip. After about 40 flips the pancakes miss and splat on the floor, the chef and the cat. Accumulated error you can see and laugh at.
- Escalation:
  1. A 10-flip rush: the internal RC is fine, and "elegant" means no part at all.
  2. The 200-flip lunch shift: Pip carries a crystal over and snaps it into the controller in the room.
  3. The oven warms belt B's board: the RC holds cold and fails hot. The mixer also throws sparks along the clock cable, so Pip **drags the cable away** from it.
- Bonus: the wall clock loses 4 minutes a day. A watch crystal with ÷32768 is the right answer.

## 11 Delivery Depot

**What the player actually does**
- Brings two carts over.
- At the bench:
  - clicks THIN or HEAVY for the FEED and RETURN rails;
  - raises or lowers the bay barriers;
  - nudges the source **in 0.1 V steps from 0 to 24 V** (`logic.ts:31`) toward 12 ± 0.25 V (`logic.ts:41`);
  - steps the probe across 6 points and presses DISPATCH.
- The prompts dictate every move: "lower bay 2's barrier", "Tune the source until the lamp reads 12 V" (`station.ts:506-510`).

**Teaching value**
- The solver underneath is good: open loop vs closed loop, rail drop, short circuit and breaker.
- The surface piles up metaphors:
  - trucks;
  - *rails*, meaning both railway track and power rail;
  - road height;
  - barriers;
  - device "carts" in "bays";
  - a "crossover rail" that is really a short.
- The truck picture has **no mechanism**. Truck speed only displays the solved current (`station.ts:440-443`), and nothing in it says *why* a thin rail lowers the lamp's voltage. You can't predict anything with it.
- It also reinforces a known misconception: charges carrying energy parcels from source to load.
- "Elegant" means within 10 % of a hidden solver's waste (`logic.ts:208`).

**Metaphor:** a bad mapping, as the product owner suspected.

**Usability:**
- A tangle of beams and leads (`depot-2-bench.jpg`).
- A 240-position knob.

**Fun:** none. A spreadsheet with trucks.

**Verdict:** redesign (high).

**Redesign: "Two-Wire Warehouse"**
- Drop the trucks: the cable is already an honest model.
- Every device has two sockets. Pip drags a red *go* cable and a black *return* cable from the supply cart. The meter is a carried prop with two springy probe leads.
- Escalation:
  1. A lamp with only the red cable stays dark, and the meter shows 12 V across the empty black socket. Add the return and it lights: the closed loop, learned by hand.
  2. Lamp and motor at the far end of the hall. The long thin cable glows warm, the lamp is visibly dim, and the meter reads 10.6 V at the lamp. Fixes: a thick cable, moving the cart closer, or unplugging the heater on the same splitter.
  3. A metal shelf has fallen across both wires and the breaker bangs. Pip probes along the run to find where the voltage collapses, then lifts the shelf off.
- The trucks can stay as an optional overlay toggle.

## 12 Spectrum Delivery

**What the player actually does**
- Carries the pod to a pad, and stands mirrors on fixed marks A/B/C. They aim themselves (`logic.ts:178`).
- At the desk, picks a band and then its one matching detector (redundant).
- Sets 1, 10 or 100 mW, toggles the hatch, and presses SEND.

**Teaching value:** good, physical ideas (radio through brick, a hole smaller than λ/2, a mesh cage, smoke scattering). Three things are wrong:
- `logic.ts:10-11` uses 10 log d "for wide LED beams, not lasers". That's backwards: a wide beam still spreads by the inverse square. Use 20 log d everywhere and give the optical bands a higher gain constant.
- `logic.ts:141,188` lets sunlight swamp only visible light. Sunlight is strong in the near IR too (that's why TV remotes fail in the sun), so the game teaches "dodge the sun with NIR".
- "Body heat" as the example for thermal IR (`logic.ts:48`) implies messages carried by body heat.

**Metaphor:** honest. This is the best room-scale station.

**Usability:**
- Auto-aimed mirrors remove the fun part, which is aiming.
- dB margin is abstract.
- Three menus (band, detector, power) for one decision.

**Fun:** the drawn beam is the toy, but you can't play with it.

**Verdict:** fix (medium).

**Redesign: "Bounce House"**
- The transmitter is a carryable tripod blaster, and the mirrors are props Pip **places and rotates freely** (2D ray reflection, drawn live in the band's colour).
- Radio shows as rings that pass through brick, while the mesh cage visibly rings and reflects them.
- Detector heads are props snapped onto the pod.
- Escalation:
  1. The brick storeroom.
  2. Into the sunny lab through the hatch. Visible light and NIR are both swamped, so Pip pulls the blinds down.
  3. Smoke plus mesh, with coworkers walking through the beam. Pip routes around the tea queue.
- Failure: the beam dies at the obstacle, and the pod plays sad static.

## 00 Cable Playground

**What the player actually does:** grab the plug, drag it round two pillars, plug into the lamp and flip the switch. Optionally, sprint, overstretch and release with Q to fling crates.

**Teaching value:** cable feel, and that a switch closes the loop. Enough for a tutorial.

**Usability:** the reel's remaining length is invisible until the cable strains.

**Fun:** yes. The slingshot is the best toy in the game.

**Verdict:** keep.
- Add a spool that visibly empties as the cable pays out, since Big Meeting depends on judging length.
- Add a fling target, such as a set of cone "pins".

## 01 Big Meeting

**What the player actually does**
- Fetches the power strip to the boardroom door.
- Drags a 23 m reel across 33 m of office, getting the extra reach by one of:
  - the coupler and second reel;
  - a sprint overstretch;
  - stealing the coffee reel.
- Plugs in and flips the switch.

**Teaching value:** no electricity at all. The circuit can't fail (supply 5, reel 3, load 1; `game.ts:92`). That's fine for a cable floor, but nobody should claim it teaches electricity.

**Hidden rules**
- The coupler must go on before the reel; the wrong order only buzzes (`game.ts:224`).
- The sprint overstretch is undiscoverable.
- The strip must sit within 1.4 m of the door and below 0.6 m (`game.ts:233`).

**Fun:** good. The coffee-corner groan is the best "sneaky" beat in the game.

**Verdict:** keep, with small fixes.
- The reel physically can't mate without the coupler, so the order explains itself.
- The strip by the door already carries the kettle and a heater. Plug the projector in and the closet breaker trips; unplug the kettle and the boardroom groans. A one-beat lesson in load budget.

## 02 Lunch Rush

**What the player actually does**
- Wedges the door, mops or bridges the leak, and lights the storeroom.
- Hauls out the capacitor cart, runs the thick cable to the kitchen, and juggles the fridge and the oven.
- Carries the tray, then powers the conveyor before the lift.

**Teaching value**
- The best content in the game: power budget, overload, start-up surge, a capacitor at the load, sequencing, and the fridge as thermal storage.
- The job card prints the "aha" moments: "Park the capacitor cart next to the lift winch" and "Power the conveyor first, then the lift" (`objectives.ts:47-48`).
- **Wrong:**
  - The capacitor works by a 2 m proximity check with no wiring (`lunch-runtime.ts:218`).
  - It recharges while its supply is tripped, which means from nothing (`sim/electrical.ts:27-28`).
  - `GAME_DESIGN.md:23` says capacitors "absorb" a kick; they *supply* it.
  - "Bars" never maps to amps or watts.

**Usability:** the 7-step chain, and the invisible hard-wired kitchen post.

**Fun:** real. The burning tray, the door cutting the cable and the bots snagging it are all good comedy.

**Verdict:** fix (medium).
- The job card shows goals, not methods. Each hint appears only after its failure (the first lift trip shows the capacitor icon).
- The capacitor cart becomes an inline pass-through with a 2 m lead to the winch, so its placement follows from the wiring.
- It charges only while connected to a live supply.

---

## Cross-cutting patterns

1. **The bench is a menu.** Every station is pick part → pick slot → RUN → read a paragraph. The room step is a fetch quest unrelated to the concept.
2. **The cable, the star mechanic, is in none of the ten stations.** The best toy in the game never teaches anything.
3. **The answer is printed.** Examples:
   - Garage `j.hint`;
   - Clockwork's "until 1.000 kHz";
   - the Depot prompts;
   - the Lunch checklist.
   
   The learning happens in toasts and 10-row panels, not in cause and effect.
4. **9-16 hotkeys per bench**, each station with its own grammar for pick, fit, flip and reset.
5. **The evidence is numbers** (mA, dB, ppm, µs). Physical cues (glow, smoke, arcs, NPC reactions) are secondary.
6. **"Elegant" is a hidden solver's verdict.** The player can't see the target.
7. **Metaphors pile up** (Depot) **or point at the wrong stakes** (Clockwork).

## The three highest-impact changes

1. **Move the circuit off the bench and into the room, wired with the cable.**
   - Use draggable two-ended leads and carryable parts (resistors, diodes, crystals, mirrors), reusing `Rope`, `Pulses` and grab/carry.
   - The bench becomes an instrument (a meter or scope replay), not the playfield.
   - Start with the Depot ("Two-Wire Warehouse") and the Garage ground run, since both map directly onto Lunch Rush's tech.
2. **Show the quantity, then explain the failure in one line.**
   - Current shows as pulse speed and brightness. Heat shows as glow, then smoke, then the part popping out. A spike shows as an arc and a dizzy robot. Drift shows as missed hand-offs.
   - Delete every prompt and step that names the fix. After a failure, give a one-line *why* plus a replay.
   - Show the elegant target as a visible bar.
3. **Fix the truth bugs and the two bad frames.**
   - Truth bugs:
     - PTC RESET (`arcade/station.ts:245`);
     - LEDs dying in seconds;
     - watch-crystal reasoning (`clockwork/logic.ts:100`);
     - ±0.2 % bread (`clockwork/logic.ts:50`);
     - optical 10 log d (`spectrum/logic.ts:10`);
     - visible-only sunlight (`spectrum/logic.ts:188`);
     - the proximity capacitor that recharges from nothing (`lunch-runtime.ts:218`, `sim/electrical.ts:27-28`).
   - Replace the Depot trucks and the Clockwork cooking stakes.
