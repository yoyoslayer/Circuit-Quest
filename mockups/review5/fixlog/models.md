# Review 5 fix log: models, props and characters (B10)

Stopped early at the product owner's request. `npm.cmd test` (124 passed) and `npm.cmd run build` pass. The browser specs (`tests/layout.spec.ts tests/smoke.spec.ts`) were **not run**.

Scripts are in `mockups/review5/tools/fix-models/`:
- `gal.mjs`: prop sheets.
- `audit.mjs`: `g.audit` on every level.
- `play.mjs`: pins, chairs, carry and coworker checks.
- `pip.mjs`: Pip close-ups. Not run yet.
- `restart.ps1`: restarts the dev server.

Note: `vite.config.ts` ignores `**/.claude/**` for watching. A dev server run inside an agent worktree never sees your edits, so restart it after every change.

Shots are `shots/fix-models-*.jpg`. `before-a`, `before-b` and `before-backs` show the old props. `after-*` and `c-*` show the new props. `pins-*`, `seated-*`, `carry-robot` and `npc-bump` are in-game shots.

## Done

| ID | Change (files) | Verified |
|---|---|---|
| R5-083 (P1, partly) | New `pin` PropKind: a lathe bowling pin with red neck stripes and a cylinder collider (prefabs.ts). `pinsDown` now counts only pins that were tipped over (or shoved 1.2 m) while Pip was more than 1.1 m away, and the counted pins are kept in a set. Pins can't be grabbed (`nearest()`). The cone collar now hugs the cone (game.ts, prefabs.ts). | play.mjs: walking through the triangle gives pinsDown 0 and all pins stay upright. The slingshot route knocks down 2 (the pins are still placed as cones, see below). |
| R5-131 (P1) | Standing coworkers get a fixed capsule collider (r .34). Seated coworkers get no body. `audit()` skips coworker capsules (game.ts addNpc, audit). | Pip stops 0.68 m from the blob centre (`npc-bump`). audit .02 is unchanged. |
| R5-134 (P1) | Each seated coworker's chair is turned to the coworker's facing, so the backrest is behind them. A coworker faces the desk within 1.3 m, or the chair's own rotation when there is no desk (the boardroom). The body sits at y .47, .12 m forward of the backrest. Seated coworkers only look round ±0.6 rad (game.ts addNpc and the render loop). | `seated-close`, `seated-chair-taken`: backrests are behind the blobs. |
| R5-138 (P1) | Light carries are held level, with a yaw-only rotation that follows Pip's heading. They sit lower (centre about 0.97 m) and closer, at .42 + depth/2. Tall flat boards are carried edge-on. The Garage `robot` and Observatory `motor` carts are pushed upright on their wheels with the handle towards Pip (`heavy()` / `isCart()`). The rig's carry reach is now -1.25, with the grip from the item's width (game.ts carry, pipRig.ts). | Robot held: up 1.000, y .31 (`carry-robot`). The tray and box carry shots were not taken. |
| R5-147 (P1) | A seated coworker keeps a reference to its chair. If the chair is held, hidden, moved more than .35 m or tipped, the coworker is unseated: it yelps, drops to the floor and loses the seat offset. `snapshot().npcs` gives `{seated,y,x,z}` (game.ts). | play.mjs: after the chair is taken the coworker is unseated at y 0, and there is no hovering once its hop ends. |
| R5-149 (P1, model part) | Beanbag rebuilt as one "slumped" lathe sack: tall back, front pressed down into a seat, a dent, 3 seams, a tuft and a tab. The collider is a round cylinder (prefabs.ts). | `c-beanbag`, `c-beanbag-side`: side view reads as a beanbag chair. The last dent tweak was not reshot. |
| R5-151 (P1, model part) | Coffee machine rebuilt: cream tower, water tank, head with an ink panel and buttons, spout, metal drip tray with a cup, vented back. deskClutter variant 5 is a bare top with no keyboard or mouse (prefabs.ts). | `c-coffee`. |
| R5-225 | Throw: arms swing from overhead to forward with a forward pitch. Slingshot release: lean back, arms flail (pipRig, plus `thrownAt` / `releasedAt` in game.ts). | Not shot. |
| R5-227 (partly) | Hat tilted back .12. Face states: squint and tight mouth at the cable limit, wide eyes and O mouth in the air or after a slingshot, arcs and grin at the win. Brim overhang reduced and eyes enlarged in the GLB. | Not shot. |
| R5-248 | Bubbles at scale .45, popping to 1.2×. Only the 3 coworkers nearest the impact get a "!". A bubble within 80 px of Pip's head fades to .35 (game.ts). | Visible in `seated-chair-taken`. |
| R5-286 | `tools/gallery`: sorted by height, plus `yaw`, `box=1` (collider wireframes for every part), `dist` and `pitch`. | Not shot. |
| R5-292 (partly) | Monitor gets a compound panel-plus-stand collider and the beanbag a round collider. That clears the monitor+paper ×32 and beanbag+paper overlaps. | audit.mjs .02: meeting 51 → 19 and garage 2. Every other level is 0. The rest is cabinet+box (level data, below). |
| R5-293 (partly) | Prefab `collider` parts (box, cyl, cone, rcyl, compound) are built in addProp. Round colliders for bin, mug, plant, cone, pin, stool and beanbag. Compound colliders for lamp and monitor. Cart, dolly, supply and capcart handles pulled in 10 cm. Printer tray shortened. Coolbox handle laid flat. The controller filter and audit now handle multi-collider props. | audit, unit tests. |
| R5-308 | Sofa: feet, plinth, 3 seat and 3 back cushions, full-height arms, back seams. | `after-a`. |
| R5-311 | New `plaqueBoard()` in kit.ts: a board with thickness, text on both sides. The Arcade STOREROOM sign hangs under a header beam on posts. The Garage TEST STAND is on a board on its post. The Observatory ROOF RECEIVER is mounted on the rack face. All Spectrum signs are housed: TEA on a post, POD DOCK as a floor tag, QUIET ROOM sitting on the copper rail, HATCH and GLASS LAB moved in front of the door. QFN STOCK is wall-mounted. | `carry-robot` shows TEST STAND. The others were not shot. |
| R5-315 (Observatory part) | The light rail and lamps moved onto `kit.back`, with 3 brackets, so they cut away with the wall (observatory room.ts). | Not shot. |
| R5-316 (partly) | `pendant()`: default cord .35, ending in an ink ceiling canopy. The shade is exposed as `userData.shade`. | Not shot. |
| R5-324 | Haul pose: two-handed low tug-of-war lean with bent knees (no over-shoulder plug). | Not shot. |
| R5-325 | Alarm: a stretched hop, then a wobble (no squash). The sweat drop and "!" follow the head every frame. | Not shot. |
| R5-336 (partly) | Finished backs and sides for cabinet, printer, monitor, vending, cooler, coffee machine and the Arcade cabinets. Observatory rack: vents, ears, rear seams, cable gland. Gauge housing (kit.ts). | `after-backs` (old-code render, so reshoot). |
| R5-337, R5-350 | Pip GLB rebuilt (tools/create_assets.py, Blender 5.1): the ridge is now a low dome-following rib, soles are navy ellipsoids inside the boot, arms are slimmer at ±.43 with shoulder seams, back straps cross in an X over the shoulders, plus a back pocket and tag. The rig shoulder pivots moved to ±.43 / .48. | **Not visually checked.** `pip.mjs` failed because the server wasn't up. Run it first next session. |
| R5-338 (props) | Vending (header, cans behind glass, coin panel, flap, kick plate, side panels, vented back), cooler (lathe jug, taps, niche, tray, cup tube), printer (lid, output tray with sheets, panel and LED, drawer, vented back), ping-pong (lines, net posts, paddles, ball). | `after-a`. |
| R5-341 | Wedge and bridge are bevelled with creased normals. Bridge: hazard crown, slope ribs, channel arches. Wedge: striped back face. | `c-bev`. |
| R5-343 (partly) | Capcart: sleeve stripes with − marks, vent cross, +/− terminals, metal control box with charge lamp and socket plate. Strip: rocker switch and rating plate. Reel: wound-cable drum texture. | `c-cap`. |
| R5-344 | Floor lamp: open double-sided shade, rims, bulb, pull chain, cord. Garage work lamps: cup head with rim, inner face, bulb and swivel. | `c-bev`. The Garage lamps were not shot. |
| R5-347 (prefab) | New `stool` PropKind. | `c-beanbag`. |
| R5-349 | Gait: the cycle comes from the swing actually applied, with amplitude × √speed, clamped to .4–1.6. There is no run "flight" multiplier, so sprinting raises cadence and doesn't skate. | Not measured. |

## Needs shared change (level data and other owners' files)
- **playground.ts:18**: `kind:'cone'` → `kind:'pin'` for the `pin-*` props. Optionally move the triangle onto the overstretch line, e.g. x 0.5–1.6, z 7.6–8.8 (R5-083).
- **meeting.ts:15**: chair `rotation:dz<0?0:Math.PI`. game.ts already turns the seated chairs, so this only matters for spec data. Coffee desk `variant:5`. Box y on cabinets 1.9 → 1.95. Reel y 1 → 1.03. Beanbag colour `#5b9cf0` → `#3f7fd6` (R5-134, R5-151, R5-292, R5-149).
- **clutter.ts**: cabinets recipe box y 1.95. Lounge paper → dz .95, reading paper → dz .8. Beanbag colours must be more than 15 ΔE from every BLOBC entry (R5-292, R5-149).
- **lobby.ts:7**: beanbag colour off BLOBC. hub/lobby.ts: parent the blade signs to `kit.side` and the glows to the door frame (R5-315).
- **arcade.ts:12/138**: cabinet chairs → `kind:'stool'`, placed 0.9 m in front of each deck (R5-347). arcade station.ts: replace the human play-tester with a small blob (R5-371).
- **objectives.ts NAMES**: add `stool:'stool'` and `pin:'pin'`. The heavy prompt in game-ui.ts / objectives.ts should use `game.heavy(p)`, not `mass>=15`, so robot and motor say "push it".
- **lunch-runtime.ts:54**: the cap port lift should sit on the capcart's new socket plate (local +x .75, y ≈ +.1 above the body centre). Pass `stem:true` to `Gauge.mount` for the supply-cart gauges (R5-343, R5-338).
- **decor.ts**: put the lounge pendant shade (`pendant().userData.shade`) on `game.occluders` with a cloned transparent material (R5-316). Move posters off the windows (R5-317). The meeting coffee cord.
- **types.ts / lunch.ts**: `NpcSpot.seated` plus crowd spots on the benches. In game.ts use `seated=p.seated??(meeting&&!standing)` with a seat height parameter (R5-348).
- **toon.ts:77**: outline colour about [.035,.037,.072], thickness .0055, plus a Pip override of .007 in `buildAvatar` (R5-375).
- **garage station.ts**: bench doors and scope back. **spectrum station.ts**: dispatch desk panels. **qfn station.ts**: bench detail. **decor.ts**: meeting racks and lunch oven/pots (rest of R5-336).

## Skipped
- **R5-226 (bench mitts):** a station camera feature, out of scope.
- **R5-258:** needs the colour owner (BLOBC) or an overalls colour change in the GLB.
- **R5-342:** needs the product owner to restate the DR-59 scale rule first. Resizing the strip and plug also touches meeting-strip.ts and snap offsets.

## Left to do next session
1. Run `pip.mjs` and check the new GLB and rig from every angle: arms, soles, ridge, back straps, haul, throw, carry and face. Revert `public/models/pip.*`, `tools/create_assets.py` and the `this.arms` pivots in pipRig.ts if they look wrong.
2. Run `tests/layout.spec.ts tests/smoke.spec.ts` (PW_PORT=4206) plus the routes, garage, observatory and spectrum specs. Carry, colliders, coworker capsules and pins all changed.
3. Reshoot the beanbag after the last dent tweak, plus the backs and the signs in each room.

## Open questions
- Coworker capsules make the standing coworkers solid. Is that OK for the Lunch crowd and the Lobby receptionist paths?
- Pins counted only when Pip is more than 1.1 m away: is that too strict for a hand-thrown box?
