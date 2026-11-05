# Level 01 — Big Meeting (first playable)

Concept image: `concept/01_CURRENT_big_meeting_office.png`. Layout source: `reference/render_kit/office.js` (coordinates are usable directly; metres, y up, z toward default camera).

## Goal
Power the boardroom projector before the meeting timer ends. Coworkers wait in the glass boardroom.

## Layout (≈33 × 20 m, one floor)
- **Server closet** (back-left, x −16..−11, z −11..−5.5): racks, UPS, **the only live outlet** (−11.4, 0.55, −7.8). Extension reel starts here.
- **Open plan** (carpet): 8 desk pods (32 desks, ~20 seated coworkers), 5 pillars ((−4.75,−2.9),(0.15,−2.9),(5.1,−2.9),(−4.75,4.2),(0.15,4.2)), cabinet row on back wall, printer station + paper boxes, whiteboards, mail cart, bins, plants.
- **Coffee corner** (front-left): counter, coffee machine, mugs, water cooler, vending machine.
- **Lounge** (front-right, wood floor): sofa, bean bags, coffee table, ping-pong table, bookshelf divider.
- **Boardroom** (back-right, glass walls, door gap x 11..13.8 at z −2): table, 8 chairs, 4 coworkers, dark projector; the power strip's spot by the door (12.3, −2.25) = **snap target**.

## Numbers (tuning)
- Reel max length: 26 m. Straight-line outlet→door ≈ 24 m, but pods/pillars force wraps, so the clean route needs the **second reel** (found on the mail cart) joined via a **coupler** — or a chaos route: drag through desks and pull taut, flinging stuff.
- Meeting timer: 4:00. Grade thresholds: A ≤ 2:00 / ≤ 10 props damaged / ≤ $300.

## Solutions
- **Clean:** grab 2nd reel from mail cart, couple reels, route along the back aisle, around the pillars, through the boardroom door, plug in.
- **Chaos:** single reel, drag straight across pods, overstretch, let the slingshot clear a path; or smash the glass wall (big cost) to shorten the route.
- **Sneaky:** unplug the coffee machine's extension (it's live, fed from the closet) and reuse its cable — the coffee bar goes dark and coworkers groan.

## The load budget (the electricity taught here)
- The **power strip** (found on the printer stand) must be set at the boardroom door first. It is the visible hub: the reel's plug seats in its inlet end, and the **tea urn** (2.5 A), **fan heater** (2 A) and **projector** (1 A) cords each end in a plug head in one of its outlets. Each carries a small rating plate.
- A **load board** on a stand beside the strip shows the live current ("4.5 A") and a stacked bar: one segment per plugged, switched-on load, against a thick **5 A** line. While the breaker is open it reads 0 A, the segments turn to hatched ghosts of the demand, and a red TRIPPED tag and lamp light, so unplugging a load still visibly shrinks the bar.
- The strip's breaker is **thermal** (`src/sim/thermal.ts`): switching the projector on with both loads plugged in puts 5.5 A on it; the strip hums, the board flashes past the line and the loads flicker for about 2 s, then it trips. Real breakers take minutes at 1.1x; the dwell is compressed as game tuning (DR-36). Above 3x it trips at once.
- On the trip: a clack, sparks and a smoke column at the strip, a tall red flag pops up beside its reset switch, and one sentence names the cause ("The strip cut out: everything plugged into it added up past its limit."). A repeat trip with nothing unplugged double-buzzes and says "Still too much on the strip."
- Pulses on the cable and the cords mean current, and only that: they run as soon as the reel feeds the urn and heater, and stop when the strip trips (the cable turns dull gold).
- The projector shows its own state: a rocker, and an LED (off / amber = switched on, no power / green = running). A projector on an overloaded strip doesn't count as running until the load is under the limit.
- Fix: unplug the urn or the heater (the boardroom groans), then press E right at the strip to reset it. Reading the board first and unplugging before switching on wins with no trip.
- DR-36 framing for the clean route: two heavy-duty site reels joined by a rated inline coupler, feeding a strip with its own breaker (office rules forbid daisy-chained extension leads).

## Chaos target
A **tower of supply cartons** stands at the aisle end by the boardroom (8, −2.35), beside the cable's route. A slingshot (overstretch at a sprint, then Q), a dragged cable or a shove brings it down with confetti (`MeetingStrip.towerDown()`). Its cartons don't count as damage.

## Must-feel moments
Taut cable humming and shaking; wrap around a pillar with a satisfying "tunk"; chairs/papers flung by the snap; coworkers flinching; projector clicking on with a cheer and confetti.

## Acceptance (M3)
- All three solutions possible.
- 300+ physics props on the floor at 60 fps on a mid laptop (use instancing/sleeping bodies).
- No text needed; a new player plugs the projector in < 5 minutes in a blind test.
