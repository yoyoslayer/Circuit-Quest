# Fix log: colour, job language and set dressing (batch B9, all rooms)

Agent area `colour`. Scripts: `tools/fix-colour/` (`census.mjs` prop census per room: count, kinds, job-yellow
non-job props, cable lookalikes, `audit(.02)`; `shots.mjs` start/survey shots plus median floor luma;
`serve.ps1` restarts the port-4205 dev server, whose file watcher missed edits on this machine).
Census output after the fixes: `tools/fix-colour/census-after.txt`. Shots: `shots-full/fix-colour-<room>-start|survey.png`.

## Shared mechanism (src/levels/clutter.ts)

- **Colour families.** `ClutterOptions.colors` is now the level's *accent* list and dresses only fabric (chairs,
  beanbags) and mugs. Cartons always draw from kraft (`#c98f5a #d7a56d #e0b47a #b9875a`), cabinets from office
  neutrals, bookshelves neutral/wood, carts grey-blue. A level can override a family (`families`, used by QFN for
  periwinkle carts). Every colour within ΔE 25 of job yellow is dropped; fabric also drops anything within ΔE 15 of
  a coworker (BLOBC) hue, with a fallback fabric set. Exports `deltaE`, `nearJobYellow`, `palette`.
- **`parts` recipe** is now cartons, a cone and a bin: no reel or splitter in any clutter.
- **`lounge` recipe**: the paper moved clear of the beanbag (it touched at audit .02 in Arcade, Observatory, Playground).
- **`cabinets` recipe**: the stacked carton rests on the cabinet's top trim (y 1.92, was 1.9) and is turned a little.
- **New options** `jitter` (anchor wander, default .45 as before) and `fillSkip` (share of fill cells left empty) so
  the edge fill stops reading as a ruled row. Defaults keep the old layouts, so rooms that don't set them are unchanged.
- The random-number sequence is unchanged for rooms that don't opt in, so Playground keeps its layout apart from the
  `parts`/`lounge` changes.

## Entries

| ID | What changed (files) | How it was verified |
|---|---|---|
| R5-101 (P1) | Prefab defaults: mug `#f4efe6`, beanbag `#e07a4f`; desk-clutter pencil, sticky notes and lamp no longer yellow (`src/props/prefabs.ts`, colour constants only). Clutter palette filter (above). Level props recoloured: Arcade chairs/desk chair (`#ffd84d` → peach/sky), Garage chair and cart, QFN chair and cart, Observatory chair, beanbag given a colour, Spectrum chair and carton, Lunch kitchen NPC (`#ffc94d` → `#a7d3f0`), Lunch dining chair (`decor.ts`), lobby mug. Job items now wear job yellow: Arcade resistor tray, Observatory motor cart, Spectrum receiver pod. | `census.mjs`: non-job props within ΔE 25 of job yellow went from Lunch 13, Arcade 16, Garage 17, QFN 2, Observatory 18, Spectrum 7 to **0 in every room I own** (Meeting still 6, see below). New unit test `src/levels/palette.test.ts` (prefab defaults, hand-placed props, clutter palettes). Start shots: the parts crate, tray, pod and motor cart are the yellow masses. |
| R5-104 (P1) | `parts` recipe has no reel/splitter (clutter.ts). Garage: reel → red oil drum, cable dolly → parts trolley. Arcade: storeroom reel → carton. QFN keeps `parts` (now cartons). | `census.mjs` lookalikes: Garage 4, QFN 8, Arcade 1, Playground 2 → **0**. Unit test: cable-shaped props only appear with an id, in every room. |
| R5-154 (P1) | Floors darkened: Garage concrete `#dcd8ce` → `#a49e92`; QFN planks `#e2c28f` → `#c8a06a`, machine-bay tiles → `#d9d6ee/#b3afe0`, bench rug darker; Spectrum hall tiles → `#d9d2c4/#cdd5dc`, lab lino → `#c9dbe8/#b8cfe0`; Observatory planks → `#c99a63`; Arcade carpet `#6a5480` → `#8f7aa6`; Lunch concrete/tiles/wood (`decor.ts` lunch floors). | Median floor luma in the new start shots (`shots.mjs`): Lunch 158/169/144, Arcade 150/151, QFN 150/183, Observatory 176/165, Spectrum hall in band by eye (crop hit the case). Garage measured 194/168/186 at `#b9b3a6`, then darkened again to `#a49e92` (not re-measured; the garage mood light, toon.ts, is the rest of the cause). Lobby floor not done (hub file). |
| R5-155 (P1, partly) | Lunch: the 10-box storeroom grid is five hand stacks/strays at odd angles; the 8 mugs + 8 papers row is 5 mixed-colour mugs and 3 turned slips at jittered spacing. Observatory: second `reading` recipe replaced (lamps 10 → 2, beanbags 13 → 3). QFN/Garage/Arcade/Observatory/Spectrum/Lobby: fill jitter and skip so edge cartons don't line up. Bookshelf books desaturated. | Census: Observatory lamp 10 → 2. Shots: no grid in the Lunch storeroom. Meeting raft/cabinet run and prefab variants not done (other owners). |
| R5-157 (P1, partly) | Spectrum lanes r 1 → .8 (1.6 m wide, DR-16), step 1.5, more recipes, seed 9; Lunch max 260, step 2.1, more recipes and less litter. | Props: Spectrum 68 → 85; Lunch 137 → 117 but with litter down from 67 to 43 and boxes/bins/plants/beanbags up (the bots' loop and cable lanes keep the corridor clear on purpose, per the verifier). Spectrum spec re-run (below). Still short of DR-67's 250. |
| R5-158 (P1) | Clutter families (above): cartons kraft in every room, cabinets neutral, carts grey-blue. Hand-placed cartons recoloured to kraft in Arcade (pink), Garage (teal), QFN (lilac, green), Spectrum (red, blue). Arcade clutter no longer places cones (`cones` → `plants`, fill cone → bin). | Unit test: every clutter carton colour is in the kraft set; fabric is ≥ ΔE 15 from every coworker hue. Shots: no mint/lilac/pink cartons. |
| R5-159 (P1) | Lobby gets clutter (`src/levels/lobby.ts`): lounge, plants, crates, cooler, reading, bins and a cart, with a lane from the spawn to every door and the Workshop, a 1.9 m apron at each door (approach and leaf sweep) and a clear plaza round reception. | Props 15 → 116, `audit(.02)` 0. `tests/lobby.spec.ts` door walks (below). Cable toy and physical bonus not done (game.ts/hub, not my files). |
| R5-339 (P2, colour part) | Book palette desaturated and yellow removed; bookshelf frames drawn from neutral/wood instead of the level accent. | Unit test (prefab/palette). Geometry (book sizes, back panel, overhang) is the models agent's. |
| R5-312 (P2) | Keep-out lanes: Garage stand + bench back; QFN machine apron + bench ring; Observatory gallery + bench view; Spectrum ladder foot. | Shots: QFN pick-and-place and oven clear; Garage stand clear. `audit(.02)` 0 in every room. |
| R5-050 (P1, partly) | Spectrum room decor: the floor stripes and wall rail band show only Visible in its real hue; the invisible bands are greyed false-colour tints (`src/stations/spectrum/room.ts`). | Spectrum start shot: one green stripe, the rest muted. The beams, beacon, map ray and band keys are in station.ts (not mine), see below. |

`audit(.02)` is empty in all nine rooms (it was 6 in Arcade, 1 in Observatory, 2 in Playground before).
Prop counts: Lobby 116, Lunch 117, Arcade 122, Garage ~104, QFN 113, Observatory 124, Spectrum 85, Playground 109, Meeting 310.

## Verification status (stopped early at the coordinator's request)
- `npm.cmd test` (130 tests, incl. the new palette test) and `npm.cmd run build` pass.
- `census.mjs` (my own load of every room, `audit(.02)`) shows zero overlaps in all nine rooms.
- Browser specs, one run (`layout`, `smoke`, `station-garage`, PW_PORT 4205, machine loaded by five other agents):
  12 passed, 4 failed — `layout` playground, garage, observatory and `smoke` "office contains over 300 props".
  The smoke failure is a `page.screenshot` 60 s timeout in the Meeting (not a count/assert failure). The three layout
  failures' details were cut from the log; a rerun was stopped when wrap-up was called. **Next session: rerun
  `npx.cmd playwright test tests/layout.spec.ts --reporter=line` first.** If they are real overlaps (the spec uses
  audit .04 after load, census used .02 after 0.2 s of physics), likely suspects are the Garage hand-placed parts trolley
  that replaced the dolly at (9.3, 4.1) and the turned dock cartons, the Observatory motor cart colour change (none
  geometric) / new `cabinets` recipe, and the Playground `parts`/`lounge` recipe changes. If they are timeouts, rerun alone.
- Not run: `station-spectrum` (lanes narrowed to r .8), `lunch.spec`, `lobby.spec` (new hub clutter). Run these next.

## Partly done — what remains
- R5-154: Garage floor re-measure after `#a49e92`; Lobby floor and lighting moods are shared changes (below).
- R5-155: prefab variants and Meeting layouts (other owners).
- R5-157: Lunch/Spectrum still under DR-67's 250 (117 / 85).
- R5-050: beams and wave-screen caption in station.ts (shared change).

## Skipped
- R5-155 Meeting box raft and cabinet run (meeting.ts, Meeting agent); box size/label variants, lamp variants, bookshelf
  book variety, plant variants (prefab geometry, models agent); kitchen counters without keyboards (needs a desk variant
  that skips `deskClutter`, prefab builder).
- R5-157 Playground density (playground.ts, Playground agent).
- R5-159 hub cable toy and physical bonus (game.ts / src/hub).

## Needs shared change
- **Meeting (meeting.ts / decor.ts meeting())**: chairs use CHAIRC, which includes `#ffc94d` (meeting.ts:15) — pass a
  meeting palette without it; lounge beanbag `#ffc94d` (meeting.ts:29) → `#c4553b`; the 32 desk mugs now default to
  off-white (prefab), give them `['#f4efe6','#e5484d','#3f7fd6','#6cc58a'][n%4]`; coffee counter cups/fruit and lounge
  pendant yellow (decor.ts:136-137, 154/161-163). The palette test lists Meeting chairs/beanbag as a known exception
  (`KNOWN` in palette.test.ts); drop it once fixed.
- **Playground (playground.ts / decor.ts playground())**: trainee NPC `#ffc94d` → `#c8a6f0`; cage reels `#ffc94d`
  (decor.ts:112) → `#b9b2a4`; drop the green glow on practice socket k===2 (decor.ts:99).
- **src/render/kit.ts**: remove `#ffc94d` from BLOBC and CHAIRC (e.g. `#f6a07a`), so no blob or chair defaults to job yellow.
- **src/hub/lobby.ts:52-54 (R5-154)**: terrazzo ring `kitchenTiles('#d8ccb3','#c6b597',6)`, rug `rug(…,'#4fbdb4','#bfe3db')`
  (measured 219/211 now); pendant shades teal.
- **src/render/toon.ts:64 (R5-154)**: garage mood key 2.15 → 1.85, hemi .74 → .8, exposure 1.02 → .97; spectrum hemi .76 → .65.
- **src/stations/spectrum/station.ts (R5-050)**: draw the radio/microwave/thermal/NIR hall beam, beacon and map ray as a
  pale dashed beam with a band-coloured end marker (only Visible solid green), and add "invisible bands shown in false
  colour" next to "ribbon not to scale" on the wave screen.
- **src/stations/qfn/room.ts:36-37**: crane legs/beam yellow → `#e5733a` or PERI; stock-shelf bins drop YEL.
- **src/stations/arcade/room.ts:116**: storeroom shelf stock pastel blocks → kraft cartons.
- **src/props/prefabs.ts builders (models agent)**: mop wringer yellow on non-job mops (garage); box size/label variants
  (the collider must follow the size); desk variant without `deskClutter` for the Lunch counters.

## Open questions
- Hub density target: I used ~115 props; the product owner hasn't ruled on a hub exemption (L7).
- Lunch at 117 props is under DR-67, but most open floor is the bots' loop and the cable crossings, which must stay clear.
