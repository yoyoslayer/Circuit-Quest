# Circuit Crew — current game design (supersedes reference/original_handoff where they differ)

## Fantasy
You're Pip, a small maintenance tech in a chaotic office building. Each floor has one job ("get the projector on before the meeting"). The building is full of stuff, and you are allowed to make a mess getting it done.

## Core loop (per level, 5–10 min)
See the problem (dark screen, waiting coworkers) → find power (live outlet, supply cart) → drag cable through a crowded floor → deal with obstacles (length, pillars, doors, water, bots, overload) → plug in → machine runs → grade screen (time / damage / cost) → replay for a cleaner or faster run.

## Verbs
Move, jump, grab/release, carry (heavy items slow you), throw, **drag cable** (hold the plug end), plug/unplug, flip switch/breaker, push carts. Optional later: tool wheel (meter, pliers, mop).

## The cable (star mechanic) — required behaviour
- Anchored at a socket/reel; player holds the free end (plug).
- **Wrap points:** rope is straight segments between wrap points; when a segment hits an obstacle edge, insert a wrap point; remove it when the rope swings clear. (Classic "rope wrapping" technique: raycast each segment per frame.)
- **Length:** sum of segments ≤ max length. Beyond it the rope acts as a spring pulling the player back (and dragging light props the rope passes over).
- **Strain colour** by stretch ratio: white < 70 % < yellow < 85 % < orange < 97 % < red.
- **Slingshot:** when stretched past max and released (or when a wrap point snaps free), store elastic energy and fling any prop touching the segment. This is the main chaos source.
- Sagging catenary visual when slack; straight when taut.
- Cables have ratings (thin ≤3 bars, thick ≤10 bars). Over-rating: glow → smoke → scorched & dead.
- Cable in water = short → breaker trips (puff, click, needle slams).

## Electricity (sim/electrical)
Simple graph: sources (outlet, supply cart; each with a breaker limit in "bars"), cables (rating), splitters (sum of downstream), loads (steady draw + optional start-up kick), capacitor carts (absorb a kick only if placed at the load end). Deterministic tick; loads get on/off/brownout states; failures produce in-world feedback + an event log for replays/hints.

## Rooms & props
- Floors built from **prefab kits** stamped many times: desk pod (4 desks, chairs, monitors, keyboards, mugs, papers, plants), pillar, filing cabinet row, printer station, coffee bar, vending machine, water cooler, lounge (sofa, bean bags), ping-pong table, whiteboards, bookshelves, mail cart, bins, boxes, server racks, glass meeting room.
- Every prop: collider, mass, "damage value" (cost when broken/knocked), idle/hit sounds.
- NPC coworkers (blobs): sit, type, react (flinch, "!" bubble, duck, cheer). They are obstacles/audience, not partners.
- Cleaner bots patrol painted loops and snag floor cables (later levels).

## HUD (icons only)
Top-left: job badge with timer ring + grade icons (clock, broken cup, coins). Top-right: cable strain meter. Bottom: tool icons. Snap targets glow cyan; dotted ghost line hints the clean route after a delay.

## Look
Toon: `MeshToonMaterial` with 3-step gradient (90/185/255), outline thickness ~0.0034, colour #2b2d42; ACES tone mapping, exposure ~0.92; restrained additive glows. Working example: `reference/render_kit/lib.js` + `office.js` (open `office.html` via a static server).

## Level list (first two)
1. **Big Meeting** — `docs/LEVEL_01_BIG_MEETING.md` (build first).
2. **Lunch Rush** — `docs/LEVEL_02_LUNCH_RUSH.md` (power budget, surge + capacitor, sequencing).

## Design process rules (from research)
- Grey-box the cable feel before any art. If dragging the cable in an empty room isn't fun, stop and fix it.
- One new idea per level, taught learn → harder → twist → mastery.
- Build each level's clean path first, then add destructive shortcuts.
- Blind playtests; count laughs and "aha"s, not completion.
