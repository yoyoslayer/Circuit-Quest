# Fix log: colour2 (shared level-data, decor and colour changes from colour.md and models.md)

Branch `worktree-agent-a6f1f658df4769f01`, reset to `claude/nifty-knuth-519jg0` @ 7c668fb. Ports 4201 (Playwright) and 4211 (vite).
Shots: `mockups/review5/shots-full/fix-colour2-*` (before/after start and survey for meeting, playground, garage and lobby,
plus close shots from `tools/fix-colour2/detail.mjs`). ΔE helper: `tools/fix-colour2/de.mjs` (CIE76, same maths as clutter.ts).

| Entry | Change (files) | Verified |
|---|---|---|
| Job yellow, BLOBC/CHAIRC (R5-101, colour.md) | `render/kit.ts`: `#ffc94d` → `#f6a07a` in BLOBC and CHAIRC. No coworker or chair default can wear job yellow. | New unit test in palette.test.ts (BLOBC + CHAIRC never near job yellow). Shots: meeting/playground coworkers |
| Meeting chairs and mugs | `levels/meeting.ts`: pod chairs use a local palette `['#e5484d','#2f5fb8','#4f7d6a','#c4553b']` (no job yellow, every entry ≥ 23 ΔE from BLOBC, so a seated blob reads against its chair). Desk mugs cycle `['#f4efe6','#e5484d','#3f7fd6','#6cc58a']` per desk. CHAIRC import dropped. | palette tests; meeting after shots |
| R5-134 chairs face the desks | `meeting.ts`: chair `rotation: dz<0?0:Math.PI` (the backrest is at local −z). Matters for the 10 empty chairs; game.ts already turns the 22 seated ones. | meeting-pods shots |
| R5-292 / R5-149 beanbags | meeting lounge beanbags `#ffc94d` → `#c4553b` (23 ΔE from BLOBC) and `#5b9cf0` (a BLOBC colour) → `#2f5fb8` (25 ΔE). `#3f7fd6` from models.md is only 11 ΔE from `#5b9cf0`, so I didn't use it. lobby.ts `#b392f0` → `#4f7d6a`; arcade.ts pink `#ff7eb6` → `#e0457f` (was 12.8 from `#f78fd0`); observatory.ts `#8b7be8` → `#7a6ae0` (was 14.1 from `#b392f0`). clutter fabric was already filtered, and the FABRIC fallback is all ≥ 23. | New unit test: every hand-placed beanbag ≥ 15 ΔE from every BLOBC entry |
| R5-151 coffee desk | `meeting.ts`: coffee desk `variant:5`. | build; meeting-coffee shot |
| R5-149 stacked boxes | meeting.ts cabinet-top boxes y 1.9 → 1.95; clutter.ts `cabinets` recipe y 1.92 → 1.95; lounge paper dz .9 → .95; reading paper dz .6 → .8. | layout.spec |
| Reel on mail cart | `meeting.ts`: extension reel y 1 → 1.03. | layout.spec, routes.spec |
| Meeting decor yellow | `decor.ts` meeting(): coffee-counter cup `#ffc94d` → `#c4553b`; fruit `#ffc94d` → lime `#9bd35a`; lounge pendant → teal `#4fbdb4`; the closet cable-spaghetti yellow tube → green (a yellow cable means "job item"). | meeting-coffee / meeting-lounge shots |
| R5-329 pillar extinguisher | `decor.ts` pillar(): the canister now hangs in a DMETAL wall bracket with an INK strap, a valve lever, a hose curving down and a white label, all in one group. (The closet extinguisher was already fixed on the branch.) | meeting-pillar shot |
| R5-156 win lamp | `decor.ts` playground(): lit bulb `hot('#fff0c0',3)` → `hot('#fff0c0',1.4)`; halo `glow(…,2,.5)` → `glow(game.root,…,1.2,.4)`; point lamp 10 → 6 (distance stays 9: the light reaching the room is the payoff). | playground-lamp-lit shot |
| R5-317 posters off windows | `decor.ts`: playground 'graph' moves to the pier at (6.6, 1.75), scale .8. Lunch: 'plant' to the pier at x −9.5 (scale .7); 'graph' past the last window at x 16.1 (scale .6); side-wall 'sun' to local −1.4 and 'bolt' to local −2.5, apart from each other and clear of the rack (z 3.3–6.7) and the cork board. | lunch-sidewall / lunch-backwall shots |
| Playground pins | `playground.ts`: `pin-*` props are `kind:'pin'` (the bowling-pin prefab, default `#fffaf0`). game.ts counts pins by id (`pin-` prefix), so the pins bonus is unchanged. | routes/objectives specs; playground-pins shot |
| Playground trainee | `playground.ts`: NPC `#ffc94d` → `#c8a6f0`. | playground shots |
| R5-347 arcade stools | `arcade.ts`: the 10 cabinet chairs become `kind:'stool'`, 1 m out from each cabinet's centre (about 0.5 m in front of the deck's front edge): back row z −5.9 (the reviewer's figure), except the pinball (z −5.0) and claw (z −5.3) cabinets, whose tells stand in front of the deck (the first layout run caught both overlaps); right wall x 8.7, left wall x −8.9. The desk chair stays a task chair. | layout.spec arcade + arcade-rush pass; arcade-stools shot |
| R5-154 lighting | `render/toon.ts` MOODS: garage key 2.15 → 1.85, hemi .74 → .8, exposure 1.02 → .97; spectrum hemi .76 → .65. | garage floor luma (median, 3 crops) 175/167/168 → 166/158/158 |
| R5-154 lobby | `hub/lobby.ts`: terrazzo `kitchenTiles('#d8ccb3','#c6b597',6)`, rug `rug(…,'#4fbdb4','#bfe3db')`, pendant shades teal `#5ED6CC`. | lobby crops 219/211 → 202/194 |
| qfn crane | `stations/qfn/room.ts`: a `CRANE='#e5733a'` constant on the overhead crane legs, caps and hazard-striped beam, and on the pick-and-place gantry; the yellow stock-shelf bin → `#e9e6f5`. | build; qfn survey shot |
| arcade storeroom | `stations/arcade/room.ts`: the shelf stock is kraft cartons (`#c98f5a/#d7a56d/#b9875a`) with a white label, not pastel blocks. | arcade-store shot |
| palette.test KNOWN | Removed the Meeting exception and added the two tests above. | `npm test` |

## Test results
- `npm.cmd test`: 134/134. `npm.cmd run build`: OK.
- Playwright (PW_PORT 4201): layout, smoke, routes and objectives specs, 27 tests in all. All pass except `routes.spec.ts:36 meeting single reel only reaches when overstretched at a sprint` (Pip ends 2.27 m from the door, the test wants > 2.3). **It fails the same way at the branch tip 7c668fb with none of my changes (2.272)**, so it predates this batch. `smoke.spec.ts:33` (R5-143) timed out once in the full run and passed on rerun.
- Playground pins bonus: pins are tracked by id (`pin-` prefix) in game.ts, so `kind:'pin'` doesn't change the count. The routes and objectives specs for playground pass.
- The lit-lamp detail shot didn't catch the lamp clearly (the camera framed it badly), so R5-156 is checked in code only: shade ×1.4 (barely over the 1.3 bloom threshold), glow 1.2 m at .4 (DR-66).

## Skipped / already done on the branch
- **Playground cage reels `#b9b2a4`:** the cage reels are already `#c9a66b`/`#8a8fa6` (not yellow) at the branch tip, so I left them.
- **Green glow on practice socket k===2:** no longer in the code. The practice-wall loop has no glow, and the only remaining glow is the live wall outlet the reel plugs into, which is meant to glow.
- **R5-315:** already done at the tip. The blade signs are built on `parent` (= `kit.side` for side doors), and the done glow is a child of the lamp inside the door frame `f`.
- **R5-316** (lounge pendant shade on occluders) and the "meeting coffee cord": not in this batch's list.

## Needs shared change
- **prefabs.ts deskClutter:** skip the keyboard and mouse when `v===5`, so the coffee desk's `variant:5` leaves the top clear for the machine (R5-151 verifier correction). Until then variant 5 is v5 dressing.
- **objectives.ts NAMES:** `stool:'stool'`, `pin:'pin'` (models.md).

## Open questions
- Lobby terrazzo is still at median luma ~202 with the colours colour.md gave (DR-54 band 140–185). The next step would be about `#c4b89f`/`#b3a385`, but I kept the values I was given.
