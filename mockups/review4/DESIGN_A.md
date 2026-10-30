# Design review A: Vias, QFN, Archive, Waterworks, Observatory

Scope: game design and teaching only. The cosmetic and layout items in `mockups/review3/REVIEW_*.md` are not repeated. Sources read: each station's `logic.ts`, `station.ts`, level file and tests, plus the review3 screenshots.

**Bottom line:** the simulations are mostly sound. QFN routing, the Observatory transfer function and the Waterworks nodal solver are good work. The player-facing loop is not:
- **The same shape everywhere:** fetch a crate, then a button menu at a bench.
- **The cable is switched off.** `src/game.ts:82` hides it and `:93` skips the cable sim whenever `station` is set. Every level has `obstacles:[]`.
- **Prompts that hand over the answer.**

---

## 1. Via Counter (`vias`)

**Verb loop**
- Carry the blanks crate (once, no decision).
- Read the order. Its title already names the via kind: "L2→L3 buried via" (`station.ts:94`).
- Click about 10 objects in a set order: layer tabs, PRESS, bit, DRILL, PLATE, pad, finish jar, ROW ±, TEST, SERVE.
- If the sample is sent back, read the toast, SCRAP, and repeat.

**Teaching value**
- Real content: buried vias are drilled and plated before lamination, microvias are lasered, aspect limit, annular ring = (pad − drill)/2.
- The best moment in the set: holes drilled before pressing show as misaligned in the cutaway (`station.ts:213-216`).
- But the player never has to *decide* the kind. The order names it, and the prompt recites the recipe: "Buried vias are drilled in the core, before pressing" (`station.ts:305`). What gets learned is the button order.
- **Wrong:** a *buried* via "under a heatsink" must be tented. `logic.ts:86` applies `covered` to every kind, `router` (`logic.ts:126`) is buried + covered, and `logic.test.ts:44` locks it in. A buried via has no exposed copper, and tenting is outer-layer solder mask.
- **Contradiction:** via-in-pad must be filled and capped here (`logic.ts:85`), while QFN accepts plain thermal vias in the exposed pad (EP) (`qfn/logic.ts:180,243`).
- **Stitching** is "+ five times" (`logic.ts:87`). Nothing about spacing or purpose.

**Metaphor:** the cutaway is honest. The service fiction is weak: the customer specifies the answer instead of a need.

**Usability**
- About 10 tools with a hidden order of steps. PRESS is right *before* drilling for some kinds and *after* for others.
- Small disc controls.
- Feedback comes from reading the panel's green and red rows, not from looking at the board.

**Fun:** drill and press animations, otherwise a recipe card. Rush is the same recipe, only faster.

**Verdict: REDESIGN the loop (High). Fix the buried-tenting bug now.**

**Redesign: "Layer Cake Foundry"**
- **Physical stack.** The board is four big carryable slabs (copper, prepreg, core). The drill press, plating dunk tank and hydraulic press are machines in the room. The order of work becomes Pip's route through the room.
- **Needs, not recipes.** Orders arrive with prop chips glued on the top and bottom faces. Drill through everything and a chip pops off and flies, and the customer flinches. "Buried" is inferred from what the player can see.
- **Pad washers.** Pad sizes are copper washers. Too thin a ring, and drill wander shows a torn crescent.
- **Sealed core.** Dunking an already-pressed core: the bath visibly can't enter, and the X-ray shows a bare barrel. The bench cutaway becomes the TEST X-ray.
- **Escalation over three jobs:**
  1. Through via: press, then drill (alignment).
  2. Parts on both faces: core → drill → dunk → press (sequential lamination).
  3. A BGA whose pitch is too tight for the mechanical bit: it physically won't fit between the bumps, so Pip goes to the laser (microvia).
  Rush becomes a conveyor of stacks that slide off a sprinting Pip.

---

## 2. Fabrication Bay (`qfn`)

**Verb loop**
- Carry the parts crate.
- MOVE and TURN the parts. The connector goes on an edge, mouth out.
- PEN: draw tracks along the dashed ratsnest. ERASE and UNDO fix mistakes.
- Board 3: LAYER, VIA, and four thermal vias in the exposed pad.
- CHECK, then SHIP.

**Teaching value: the best of the five.**
- "One layer can't cross" and "placement decides routability" (`logic.ts:79`) are both learned by doing.
- Decoupling is measured as the real copper path (`logic.ts:254`).
- **Gaps:**
  - Nothing about the QFN package itself: no leads, solder underneath, the EP as a heat path.
  - The decoupling loop shows only as the number "loop 4 · want ≤ 4".
  - The thermal-via count of 4 (`logic.ts:97`) is a magic number.

**Metaphor:** none needed. It is an honest teaching grid, and it is labelled.

**Usability**
- Nine modal tools (`station.ts:76-78`) for three gestures. A new player drags a pad while MOVE is active and never discovers PEN.
- Hidden rule: layer-2 tracks must start on a via (`logic.ts:147`).

**Fun:** yes. It plays like Flow Free, the "joined" bell is satisfying, and par invites replays. But after the crate the room contributes nothing.

**Verdict: KEEP the puzzle. FIX the input (Medium). ADD physical consequences (Medium).**

**Redesign: "Bench + Oven"**
- **Modeless input.**
  - Drag a part to move it; scroll or tap to rotate it.
  - Drag from a pad to draw a track; right-drag to erase.
  - Vias are push-pins dropped from a cup.
  - A track that hits a via continues on layer 2 automatically, and the board flips over to show it.
- **Board 2, decoupling.** On CHECK, the chip pulses current bursts. A far-away cap draws a long glowing loop on the copper, the status LED flickers, and a mini-scope shows the supply drooping. Move the cap closer and the loop shrinks.
- **Board 3, heat.** A thermal-camera toggle: the chip glows red and cools as vias drop in. The player stops at green, not at "4".
- **Room payoff.** SHIP means carrying the tray to the reflow oven. Sprinting jiggles parts off their pads (tombstoning comedy), and they need re-seating.

---

## 3. The Archive (`archive`)

**Verb loop**
- Carry the order tray.
- In an HTML terminal: search, open tabs, bookmark values, drag chips into 2–4 work-order slots (`archive-2b-doc-open.jpg`).
- Request the part; its bin lights up.
- Walk to the bin, carry the box to the rig, and watch the lamp and the toast.

**Teaching value**
- Excellent, correct ideas:
  - typical vs guaranteed vs recommended vs absolute max;
  - overvoltage lockout tripping below the absolute max (`logic.ts:248-251`);
  - the ordering suffix setting the temperature grade.
- But the player learns them by reading tables, or from the rig's rejection toast, which states the answer.
- **Misleading tier:** "Works reliably" is awarded for correct *citations* (`logic.ts:294-296`). That is paperwork, not reliability.
- **Weak case:** a ±1 % *status-LED* resistor (`logic.ts:195`). No LED needs 1 %, so "the meter calibrates" gets bolted on to justify it. Use a divider or reference where the percentage visibly matters.

**Metaphor:** literal. The problem is the medium, a web form.

**Usability**
- A full-screen DOM app: search, tabs, an evidence tray, drag targets, and Hide on M.
- Which row "governs" a slot can only be learned by failing.
- On a phone it is unusable (already flagged in review3).

**Fun:** low. The room part is a courier errand, and the payoff is a lamp.

**Verdict: REDESIGN (High).** This is the clearest "not informational in a playable way".

**Redesign: "The Torture Lab"**
- **Bags, not boxes.** Each bin is a bag of 20 samples. The room has test stations: a walk-in freezer, a heat hood, a supply cart with a big voltage dial, and a load bank.
- **Pour and watch.** Pip tips a bag into a hopper. All the samples run, and the failures pop, smoke or freeze into ice cubes and roll down a chute.
  - Typical = *most* survive. Guaranteed = *all* survive. The player sees the spread.
- **Tolerance.** Pour resistors through a Galton-board sorter. J parts make a wide heap, F parts a narrow one. A gate marks the job's window.
- **Absolute max.** Crank the dial: the fan runs, stops at the overvoltage lockout, and parts pop and fly past the absolute max. The dial is painted green (recommended), grey (typical) and red (absolute max).
- **The datasheet becomes one poster per part** with the same colour bands. "Citing" means slapping the matching coloured sticker on the order. No tables.
- **Escalation over three jobs:**
  1. The tolerance heap.
  2. The fan current limit: guaranteed min vs typical, with fans stalling on the load bank.
  3. The freezer grade: the suffix letter matches a stripe on the bag.

---

## 4. The Waterworks (`waterworks`)

**Verb loop**
- Roll the wheel cart over.
- Press 1–5 to fit a load (valve, hose, wheels 2/6/12) and read two gauges.
- Do arithmetic, then turn four knobs and COMPARE.
- After the glass clears, set three more knobs (V_th, R_th, I_N) and CHECK.

**Teaching value**
- Thevenin is correct and well guarded (`logic.ts:11-17`). "Two numbers predict every load", shown by COMPARE across three wheels, is the right aha.
- But the player meets it as mental algebra: R = R_wheel·(P_open/P_wheel − 1) (`logic.ts:170`), or knob fiddling.
- The electrical step is transcription. The panel prints "Your carts read 9 kPa behind 1.5…" right beside the scale factors (`station.ts:431`).
- **Grading punishes good science:**
  - Elegant needs *exactly* two readings (`logic.ts:172,184`).
  - Readings cost credits (`logic.ts:224`).
  - Checking a third load is what an engineer should do.

**Metaphor: poor, and it breaks.**
- **Open system.** "A tank on the roof… a drain leak" (`logic.ts:234`) loses water; circuits are closed loops.
- **Wheels aren't resistors.** A water wheel extracts work and depends on its speed, closer to a motor's back-EMF (the code admits "modelled as a fixed restriction", `logic.ts:133`).
- **Pipe drop isn't linear.** Real pipes drop roughly as Q², but the player tunes as if the model were exact.
- **The short transfers badly.** Shorting the ports with a hose is harmless with water; with a real supply, it is the measurement you avoid.
- **Three representations of one idea:** water, then electricity, then a unit scale.
- **One good piece:** the flow cart (positive-displacement pump + bypass) is a fair picture of Norton.

**Usability:** 5 loads, 3 device selectors and 7 fine-step knobs (`logic.ts:203-211`). Which device sits on the ports is a hidden piece of state.

**Fun:** the glass reveal is a real moment. Everything before it is knob fiddling.

**Verdict: REDESIGN. Drop water (High).**

**Redesign: "The Black Box Closet"**
- **The box.** A locked closet with only two wall terminals.
- **Measuring with the cable.** Pip runs the cable from the terminals to room appliances (lamp, fan, kettle) under big wall-mounted voltmeter and ammeter faces. Brightness, fan speed and steam are the readings.
- **Building the stand-in.** On a cart: a battery-bank dial, plus a **resistance-wire reel**. Pull wire out and the resistance goes up, which is physically true. The reel's strain ring doubles as an ohm dial.
- **Side-by-side check.** Plug twin appliances into the closet and the cart. If they match, the closet doors burst open on an absurd tangle that the cart replaces. If they don't, one lamp is visibly brighter.
- **Escalation over three jobs:**
  1. Battery plus a divider.
  2. Twin batteries.
  3. A constant-current charger inside (Norton), then a kettle race: which kettle boils fastest? Maximum power transfer at R_load = R_th.
- **Grading.** Elegance comes from cart cost only; measuring is free.
- **Reuse:** the MNA solver (`logic.ts:72`), the cable, and the existing props.

---

## 5. Signal Observatory (`observatory`)

**Verb loop**
- Roll the motor cart away. A good physical lever on the noise.
- Click a module (6 fixed values), then a slot (series or shunt). Flip the ROUTE lever.
- Watch the scope, the spectrum and S/N; listen to the Morse; LOG.
- Job 3: click the 75 cm rod. Orientation starts upright (`station.ts:55`), so polarisation never comes up.

**Teaching value**
- True complex transfer function with real source and load impedances (`logic.ts:56-62`).
- Careful inductor wording. The series cap blocking the DC latch is a good lesson.
- The before/after spectrum and the audio are the best feedback of the five.
- **But values can't be reasoned about.** "Pick a higher cut-off" (`logic.ts:151`) asks for something the player can't set: they choose µF and mH with no visible cut-off, and brute-force about 42 combinations.
- **Prompts give it away:**
  - "swap the part that blocks DC" (`station.ts:332`);
  - "λ/4 = c ÷ f ÷ 4" (`station.ts:331`).
- **Job 3 is one click.** The filter carries over from job 2 (`tests/station-observatory.spec.ts:32`).

**Metaphor:** none needed. The big miss: **cable routing is a bench lever** (`station.ts:170`) in a game whose star is dragging a cable.

**Usability**
- Pick-then-slot with S/H/R/O/L/T. Series vs shunt means nothing without knowing the topology already.
- Tone level and S/N are two separate pass bars, and a filter can pass S/N while killing the tone.

**Fun:** hearing the Morse clean up is a real toy. The rest is a parts menu.

**Verdict: FIX (Medium-High).** Keep the scope and the audio. Move the decisions into the room and onto continuous controls.

**Redesign: "Noisy Neighbours"**
- **The real cable.** The receiver line *is* the draggable cable, from the roof mast to the decoder. Noise sources are props (motor carts, a robot vacuum, the fridge compressor, a hair-dryer coworker), each pulsing faint rings.
  - The wall scope updates live as Pip drags the cable.
  - Coupling comes from the distance between each source and the rope's segments (`sim/cable.ts` `segmentDistance`).
- **Clip-on filter cans.** Series cans clip inline on the cable; shunt cans clip from the cable to a ground rail. Each has **one cut-off knob** whose line sweeps across the live spectrum. The value (µF, mH) shows under the knob, so part values get tied to frequency through use.
- **Job 2.** A series cap makes the dome shutter slam shut on the telescope. No prompt.
- **Job 3.** Pip carries whips up a ladder to the mast, and the beacon bleep grows as the length gets close. The rods are unlabelled; the mast has a metre ruler. Gusts knock rods flat, so polarisation is found by accident.

---

## Cross-cutting patterns

- **The cable is off in all five stations** (`game.ts:82,93`), against AGENTS rule 4.
- **The rooms are scenery:** 25–49 props against rule 3's "hundreds". The only room verb is one fetch errand (crate, crate, tray, cart, cart), with no decision and no chaos shortcut (rule 5).
- **The bench is a menu:** 8–12 click targets plus a panel, a toast and a prompt. Concepts are picked from lists, not manipulated.
- **Prompts are recipes** (`vias/station.ts:305`, `observatory/station.ts:331-332`, `waterworks/station.ts:466`). Learning becomes reading the prompt or the post-failure toast.
- **Discrete magic values** (µF menus, pad sizes, 0.25 knob steps) breed brute force, not intuition.
- **"Works reliably" means something different at each station:** ring margin (vias), paperwork (archive), compare count (waterworks), decoupling and heat (QFN), S/N (observatory).
- **Experiments are graded as damage.** Send-backs count toward `damage` with `limits.damage:1` (for example `vias/station.ts:55`), and measurements cost credits. That is the opposite of Good Job!'s "mess around and see".
- **Failure is a sentence, not an event.** Only the vias cutaway and the garbled Morse *show* a mistake.

## Top 3 changes

1. **Move each station's core decision into the room, using the cable and grab/carry/throw:**
   - route the signal cable around noise props;
   - the black-box closet with the wire reel and twin appliances;
   - carry the layer stack through the machines;
   - pour sample bags into test chambers;
   - carry the board tray to the oven.
   Turn the cable on for stations, add obstacles, and give each room one chaos shortcut. The bench becomes the inspect or X-ray view.
2. **Make every failure a visible physical event, and delete the recipe prompts.** The shutter slams, the drilled part flies, the heap spills outside the gate, the twin lamp glows brighter. Keep only a one-line "why" afterwards. Orders state needs, not answers.
3. **Use one continuous control per concept, tied to a live visual:**
   - a cut-off knob sweeping the spectrum;
   - wire length as ohms;
   - the sample spread as a heap;
   - a heat-cam for thermal vias;
   - a drawn decoupling loop.
   "Reliable" should mean physical margin only. Make measurements free, and stop counting experiments as damage.

**Quick fixes now:**
- Drop tenting for buried vias (`vias/logic.ts:86`, `logic.test.ts:44`).
- Reconcile the via-in-pad rule with QFN.
- Rename Archive tier 2 to "Documented".
- Start the observatory rod flat or random.
- Stop a third waterworks reading from costing the elegant tier.
