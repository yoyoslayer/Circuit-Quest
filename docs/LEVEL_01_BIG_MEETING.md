# Level 01 — Big Meeting (first playable)

Concept image: `concept/01_CURRENT_big_meeting_office.png`. Layout source: `reference/render_kit/office.js` (coordinates are usable directly; metres, y up, z toward default camera).

## Goal
Power the boardroom projector before the meeting timer ends. Coworkers wait in the glass boardroom.

## Layout (≈33 × 20 m, one floor)
- **Server closet** (back-left, x −16..−11, z −11..−5.5): racks, UPS, **the only live outlet** (−11.4, 0.55, −7.8). Extension reel starts here.
- **Open plan** (carpet): 8 desk pods (32 desks, ~20 seated coworkers), 5 pillars ((−4.75,−2.9),(0.15,−2.9),(5.1,−2.9),(−4.75,4.2),(0.15,4.2)), cabinet row on back wall, printer station + paper boxes, whiteboards, mail cart, bins, plants.
- **Coffee corner** (front-left): counter, coffee machine, mugs, water cooler, vending machine.
- **Lounge** (front-right, wood floor): sofa, bean bags, coffee table, ping-pong table, bookshelf divider.
- **Boardroom** (back-right, glass walls, door gap x 11..13.8 at z −2): table, 8 chairs, 4 coworkers, dark projector; projector lead ends at the door (12.3, −2.25) = **snap target**.

## Numbers (tuning)
- Reel max length: 26 m. Straight-line outlet→door ≈ 24 m, but pods/pillars force wraps, so the clean route needs the **second reel** (found on the mail cart) joined via a **coupler** — or a chaos route: drag through desks and pull taut, flinging stuff.
- Meeting timer: 4:00. Grade thresholds: A ≤ 2:00 / ≤ 10 props damaged / ≤ $300.

## Solutions
- **Clean:** grab 2nd reel from mail cart, couple reels, route along the back aisle, around the pillars, through the boardroom door, plug in.
- **Chaos:** single reel, drag straight across pods, overstretch, let the slingshot clear a path; or smash the glass wall (big cost) to shorten the route.
- **Sneaky:** unplug the coffee machine's extension (it's live, fed from the closet) and reuse its cable — the coffee bar goes dark and coworkers groan.

## Must-feel moments
Taut cable humming and shaking; wrap around a pillar with a satisfying "tunk"; chairs/papers flung by the snap; coworkers flinching; projector clicking on with a cheer and confetti.

## Acceptance (M3)
- All three solutions possible.
- 300+ physics props on the floor at 60 fps on a mid laptop (use instancing/sleeping bodies).
- No text needed; a new player plugs the projector in < 5 minutes in a blind test.
