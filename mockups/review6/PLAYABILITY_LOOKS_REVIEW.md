# Circuit Crew: playability and looks review (review 6)

Read-only deep review. No project files were edited. Every finding cites file:line, and the numbers come from the code as read. Line numbers were re-checked for the key claims with a grep of `src/`. Items that the verifier recorded as refuted are listed in section 4 so the owner can see what was ruled out.

Key files: `src/levels/decor.ts`, `src/hub/lobby.ts`, `src/render/portal.ts`, `src/render/toon.ts`, `src/game.ts`, `src/levels/dressing.ts`, `src/lunch-runtime.ts`, `src/stations/garage/room.ts`, `src/stations/spectrum/room.ts`.

Note on duplicates: five of the input findings (doors-1, shells-1, routes-1, lens-1, looks-1) describe the same root cause and are merged into P0-1 below. Three (doors-10, shells-2, looks-5) are merged into P1-1. Three portal-texture findings (doors-4, looks-3, lens-6) are merged into P1-3 and the side-wall blur item (doors-5) is in the split section.

---

## 1. The owner's four complaints

| # | Complaint | Root cause | Evidence (file:line) |
|---|-----------|------------|----------------------|
| 1 | Rooms look weird, no roofs | No room has a ceiling or roof mesh. Shell walls stop at 3 m with a cap, and nothing spans the top. The camera looks down from about 9 m at the default framing, so the open top dominates. Pendant lamps hang in air above the wall tops in some rooms. The front and right edges have no wall at all, only a 0.34 m lip. | `src/levels/dressing.ts:49-50` ("the rooms have no modelled ceiling and the camera looks in from above"). `src/levels/decor.ts:32` (`h=3`), `:36-38` (cap at h+.07 and h+.16). `src/game.ts:707` (`pitch=clamp(.68-.24*near+this.pitch,.3,1.25)`), `:780` (`homeZoom` returns 22 for a level, 23 for the hub). `src/render/lens.ts:13-14` (FRAME[42]=1.11, so lensScale is about 0.775). Camera height at zoom 22 is about 17 m times sin(0.55 rad), roughly 9 m. Pendants: `src/hub/lobby.ts:71` (y=2.8, canopy about 3.43 m), `src/stations/qfn/room.ts:119` (y=2.7), `src/levels/dressing.ts:52-56`. Front and right edges: `src/levels/decor.ts:71-72` (lip box .32 m tall, cap at .31). The walls are only built for back and left (`decor.ts:77`). |
| 2 | Door portals look like blurry holes | The far-end picture is the level's menu thumbnail (800x500 landscape, 1.6:1) stretched over a 1.7 x 2.3 m portrait opening, so it is squeezed about 2.2x. The sample has no crop or cover-fit, and the lobby loader sets no anisotropy. The side walls add a mip-bias-4 average tint. The leaf hides at `open<.25` so the opening is seen mostly as the picture. | `src/render/portal.ts:35` (uv = h/uSize + .5, no crop), `:36` (far-end `texture2D(uView,uv)`), `:58` (side walls `texture2D(uView,vec2(.5,.5),4.)` at 25% depth weight). `src/hub/lobby.ts:25` (plain TextureLoader), `:107` (portal 1.7 x 2.3). Thumbnails: `public/ui/thumb-*.jpg`, 800x500. Shared images: lobby and playground both use `thumb-playground.jpg`, arcade and arcade-rush both use `thumb-arcade.jpg` (`src/ui/screens.ts:9-16`). |
| 3 | Pip cannot walk through the doors; doors are thin | Each back and side wall is one full-length solid box with no gap at any door slot. The door is a painted portal on the wall face, with no collider. Entry is E-only within 1.5 m, then a full page navigation. The leaf is 8 cm thick, against a 25 cm wall, and has no collider. | `src/levels/decor.ts:41` (`solid(game,normal[0]!==0?thick:length,h,normal[0]!==0?length:thick,x,h/2,z)`), called at `:77` with `l.width`=30 and `l.depth`=20 (`src/levels/lobby.ts:15`). `src/hub/lobby.ts:88-128` (door() adds only visuals), `:92-93` (approach at z+1.1, x+1.1), `:96` (frame at z .14), `:107` (portal plane at .05 more). Wall face is at thick/2 = .125 (`decor.ts:32`). Pip capsule: `src/game.ts:119` `capsule(.45,.32)`, so 0.64 m wide. Entry: `src/hub/lobby.ts:171` (near, 1.5 m), `:173-175` (interact calls enter), `:179-184` (`location.href=?level=`). Leaf: `src/hub/lobby.ts:112` `rbox(1.66,2.26,.08,.03)`. Free-standing arches with a real collider (`:95`) are never used for the nine levels (`:79-80`). |
| 4 | Other things that hurt playability or readability | (a) The see-through oval cuts the cable and raised props when zoomed in. (b) The orbit camera has no collision, so it can sit inside a pillar at minimum zoom. (c) Door keep-clear lanes in the lobby do not match real doors. (d) Several collider and visual size mismatches. See section 2. | `src/game.ts:761-763` (oval radius from Pip's on-screen height), `src/render/toon.ts:51-63` (discard inside the oval), `src/render/actors.ts:138` (hose is a MeshToonMaterial with no exemption). Zoom clamp `src/game.ts:277`, `:281` (9..38). No camera ray test: `src/game.ts:698-736`, `:726-728`. |

---

## 2. Confirmed findings, ranked

### P0

**P0-1. Lobby back and side walls have no door openings, so doors cannot be walked into.** (merges doors-1, shells-1, routes-1, lens-1, looks-1)
- Evidence: `src/levels/decor.ts:41` builds one 3 m x 0.25 m collider per shell wall, spanning the full length (30 m for the lobby back wall at z=-10, 20 m for the side wall). `decorate()` calls this at `:77` before the hub `dress()`. A grep for removeCollider, removeRigidBody and setEnabled finds nothing in the door path. The only collider in `door()` is the free-standing arch at `src/hub/lobby.ts:95`, which is not used. The shell cutaway (`src/game.ts:733-735`) scales only the visual group, not the collider.
- Player impact: Pip walks up to a framed, lit doorway and stops about 0.6 m short of it, on the drawn wall face. Only E works. This is the owner's complaint 3 exactly.
- Fix: split the back and side shell colliders around each door slot (slot positions are at `src/hub/lobby.ts:31-32`, 1.7 m clear between posts at x=±0.95, `:105`). Add a lintel collider at about 2.42 m. Move the portal and leaf flush with the wall face. Decide whether doors are walk-through (a sensor just inside the frame calls enter(), E kept as fallback) or E-only, and then make the collider and the prompt match. Remove the "walks through" wording at `src/hub/lobby.ts:172`.
- Note: the verifiers say the wall blocks Pip before the 1.5 m E zone is reached only in the sense that Pip stops at the wall face. E still works from that point, so this is an expectation mismatch, not a progression block.

### P1

**P1-1. No roof in any room; open-topped dioramas with a camera that looks down.** (merges doors-10, shells-2, looks-5, lens-5)
- Evidence: `src/levels/dressing.ts:49-50`; `src/levels/decor.ts:32`, `:36-38`; `src/game.ts:707`, `:780`; `src/render/lens.ts:13-14`. Verifier correction: the default camera at zoom 22 is about 9 m up, and a 3 m roof would sit far below it. Design intent is documented as a diorama framing in `docs/PROGRESS.md` (lines about 34-40) and `mockups/look/LOOK.md`, so this is a look decision the owner has not accepted, not an oversight.
- Pendants float above the wall tops: `src/hub/lobby.ts:71` (canopy about 3.43 m), `src/stations/qfn/room.ts:119` (about 3.33 m). Decor pendants at `src/levels/decor.ts:217/223/251` (y 2.3-2.35) sit just under the 3.14-3.18 m cap line but still hang in air.
- Fix: pick one. (A) Keep the diorama and add a visible cornice or rim along the wall tops, so the open top reads as intentional. (B) Add a per-room ceiling plane at about y 3.2 that folds away with the same test the walls use (`src/game.ts:729-735`). Either way, mount pendants on the chosen ceiling or drop canopies to the wall-top line. Also lower the default pitch (for example to about 0.4 rad) and compare screenshots.

**P1-2. Front and right room edges have no walls, only a 0.34 m curb, and the default camera looks through the open front.**
- Evidence: `src/levels/decor.ts:71-72` (lip box .32 m, cap to .34 m). Only back and left get `shellWall` (`decor.ts:77`), and only those fold (`src/game.ts:733`). Lobby is 30 x 20 m (`src/levels/lobby.ts:15`), so 50 m of its 100 m perimeter is open at floor level. The default lobby yaw is .4 and zoom 23 (`src/game.ts:780-782`), so the camera sits near the open front edge.
- Fix: give front and right edges a low wall matching the shell wainscot and rail, or frame the edge with a lower camera. Pair with P1-1.

**P1-3. Door picture is a squashed menu thumbnail, not the destination room.**
- Evidence: `src/render/portal.ts:35-36` maps the whole texture onto the plane with no crop. `src/hub/lobby.ts:107` (1.7 x 2.3 m, aspect 0.74). `src/hub/lobby.ts:25` loads `thumbUrl(id)` with no crop. Thumbnails are 800x500 (aspect 1.6), so the squeeze is about 2.2x horizontally. The CSS crop values in `src/ui/screens.ts:9-18` apply only to the CSS card, never to the portal. The far-end sample has no bias and gets minified in x, which adds the soft look. Two doors show the same picture (arcade and arcade-rush, `screens.ts:15-16`).
- Also: the depth fog and darkening make the far end and closed doors read dark (`src/render/portal.ts:57`, `:60-62`).
- Fix: cover-fit or crop the image to the 0.74 aspect in the shader (or ship a portrait corridor image per level, about 256 x 320). Use LinearMipmapLinear with anisotropy 4 to 8, and show a flat wing-colour fill until the texture loads (`portal.ts:74` sets uHasView before the image exists). Give arcade-rush its own image.

**P1-4. Doors are E-to-enter with a full page reload, not a walk-through.**
- Evidence: `src/hub/lobby.ts:171` (1.5 m radius, pure distance check), `:173-175` (interact calls enter), `:179-184` (veil, then `location.href=?level=`). Only the E key reaches interact (`src/game.ts:288`, `:331`). The threshold strip at `src/hub/lobby.ts:110` (1.9 x 0.04 x 0.5) is visual only.
- Fix: either a real walk-through trigger inside the frame that calls enter() (keep E as fallback), or keep E-only and make the frame and portal read as a sign. Pick one and make the prompt and the geometry agree.

**P1-5. Pip's cable-visibility hole grows as the camera zooms in and cuts the cable.**
- Evidence: `src/game.ts:761` (Pip on-screen height), `:763` (`seeThrough.z = tall*.78`). `src/render/toon.ts:51-63` discards fragments inside r<.72 and dithers .72-1.0, when the fragment is nearer than Pip and above y .14. The cable uses `glossyToon` (`src/render/actors.ts:138`, a MeshToonMaterial) with no exemption, and `src/game.ts:140` does not exempt it. Only the plug (`game.ts:123`) and Pip's avatar (`game.ts:244-245`) are exempt. Zoom 9 Standard gives a hard core about 185 px in radius (about 370 px across horizontally on a 1080 px buffer). Verifier note: the default zoom gives a much smaller hole. The worst case is zoomed-in play with cable between camera and Pip.
- Fix: cap the oval radius (about 0.35 of screen height), fade it with zoom, and exempt the cable and held items from the discard (a second define, or cut props only).

**P1-6. Orbit camera has no collision, so at minimum zoom it can sit at pillar height inside geometry.**
- Evidence: `src/game.ts:698-736`, offset set at `:726` (`distanceTo*lensScale`), lerp at `:728`. The only Raycaster is pointer picking (`src/game.ts:317`). Zoom min 9 (`src/game.ts:281`). At zoom 9, pitch .44 rad (default), camera about 3.0 m above the focus and about 3.8 m above the floor. Pitch can drop to .30 rad, where the camera is about 2.9 m up. Pillars are 3 m (`src/levels/decor.ts:55`, `:64`). Verifier correction: the see-through oval does handle a pillar between camera and Pip, so the problem is only when the camera itself is inside a solid. The `occluders` array (`src/game.ts:75`, pushed at `:165`, `decor.ts:47-48`, `:55`) is written but never read, so the fade the comments promise does not happen.
- Fix: a Rapier castRay from Pip toward the camera, pulling the camera in to just before the first hit, with a smooth return. Drive the oval and the occluder fade from the same ray.

**P1-7. Lobby doors: thin, pale leaf that hides before it swings** (the leaf-visibility part is split, see section 3; the thinness part is confirmed).
- Evidence: `src/hub/lobby.ts:112` (8 cm leaf, cream `#fffaf0`), `src/levels/decor.ts:32` (wall 25 cm), `src/levels/decor.ts:16` (WALL_UP `#efe2c8`). Leaf hidden at `src/hub/lobby.ts:193` (`visible=d.open<.25`), with the swing at `open*1.25` rad, so about 18 degrees.
- Fix: make the leaf at least 0.15 m, in the wing colour rather than cream. Keep it visible until about 80 degrees, then hide. Add a collider for the leaf while shut, as the lunch door does (`src/lunch-runtime.ts:234`, `:416`).

---

### P2

**P2-1. Spectrum ladder and "ROOF HATCH" sign lead to a roof that is not modelled.** (shells-5, both verdicts confirmed)
- Evidence: `src/stations/spectrum/room.ts:198` (2.9 m ladder rails), `:199` (plaque at y 2.75 reads "ROOF HATCH"), `:6` and `:190` (comments describe a rooftop hatch). Nothing above 3 m exists. The ladder is decor only, with no collider.
- Fix: add a roof hatch as part of P1-1, or remove the plaque and shorten the ladder to a wall-mounted sign.

**P2-2. Garage dock roller door looks like a door and never opens.** (doors-11, first verdict confirmed; see split)
- Evidence: `src/stations/garage/room.ts:112-116` (box meshes, no solid(), no animation). The back wall is a full collider (`src/levels/decor.ts:41`, `:77`). The robot stops about 2.2 m short of the door (`room.ts:74`, route ends at z -5.6 in `room.ts:19`).
- Fix: make it read as a fixed dock (remove the frame and lamp that suggest a passage) or make it an openable door with a collider.

**P2-3. Lobby door leaf and frame thickness mismatch** (routes-4, both verdicts confirmed).
- Evidence: `src/hub/lobby.ts:112` (8 cm leaf), `:105` (frame posts 0.26 m deep), `src/levels/decor.ts:32` (wall 0.25 m). No leaf collider in `door()`. The leaf also disappears at `:193`.
- Fix: as P1-7.

**P2-4. Interior walls collide to 2.6 m but look 1.35 m tall.** (shells-6, split, see section 3.)

**P2-5. Lunch swing-door visible leaf is 8 cm, collider is 20 cm.** (looks-8, split, see section 3.)

**P2-6. Lobby directory board collider runs from the floor to 2.8 m.** (routes-5, split.)

**P2-7. Cutaway comment says stub is 0.9 m; code is about 1.06 m.** (shells-7, split.)

**P2-8. Lobby clutter keep-clear lanes do not match the real door slots.** (looks-7, split.)

**P2-9. Side walls take a mip-bias-4 average tint.** (doors-5, split.)

---

## 3. Split findings (confirmed in one verdict, refuted in the other)

For each, both verdict reasons are given in short form. The owner should decide which half to act on.

| ID | Sev | Claim | Verdict A (confirmed) | Verdict B (refuted) |
|----|-----|-------|-----------------------|---------------------|
| doors-5 | P2 | Side walls sample at mip bias 4 (`src/render/portal.ts:58`) | Code is accurate: a single centre sample at mip 4 (about 50 x 31 texels), blended at up to 25% by depth. | Not a player-visible problem: it is a flat tint of the mean colour, not a blurred picture. The blur the owner sees is more likely the squashed far-end image (P1-3). |
| doors-6 | P2 | Leaf vanishes at about 18 degrees mid-swing (`src/hub/lobby.ts:193`) | Numbers are right: 0.3125 rad, far edge about 0.51 m into the corridor. | The leaf is behind the portal plane for most of its swing (`lobby.ts:106`, plane at z .05), so the pop is hard to see. Timing: the open value reaches .25 in about 0.11 s. |
| doors-7 | P2 | Leaf 0.08 m inside 0.25 m wall | Mechanism holds for the lunch door: visible leaf 0.08 m, collider 0.2 m, wall 0.3 m (`src/lunch-runtime.ts:232-234`, `src/levels/lunch.ts:39-40`). | The lobby leaf is not embedded in the wall: it sits about 0.1 m proud of the face, and the real blocker is the wall collider (P0-1), not leaf thickness. |
| doors-9 | P2 | 1.0 m invisible collider above a 0.34 m lip (`src/levels/decor.ts:71-72`) | Geometry is right: 1.0 - 0.34 = 0.66 m gap, both edges. | The visible lip blocks the capsule at floor level (autostep 0.25 m, `game.ts:120`). The invisible band only matters for jumps or props near the front or right edge. Narrow edge case. |
| doors-11 | P2 | Garage dock door is decor only (`src/stations/garage/room.ts:112-116`) | Premise confirmed: no solid, no animation, the back wall blocks. | Player would not hit it in play: the robot parks about 2.4 m from the wall and the keep-out lanes keep the floor clear. A readability nit, not a P2 playability issue. |
| shells-4 | P1 | Pendants hang from nothing above the wall tops (`src/levels/dressing.ts:52-56`, `src/hub/lobby.ts:71`) | Canopies at about 3.43 m (lobby) and 3.33 m (QFN) sit above the 3.14 m cap top. | Only about 0.15-0.25 m above the cap, with a 0.012 m cord and a canopy about 0.2-0.3 m across. A known design choice (`dressing.ts:49-50`). Real issue is the missing ceiling (P1-1). |
| shells-6 | P2 | Interior wall collides to 2.6 m, looks 1.35 m (`src/levels/decor.ts:44-49`) | Mismatch is real: `solid(game,w,2.6,d,x,1.3,z)` at `decor.ts:49` against visible top about 1.35 m. | Pip cannot reach the top: capsule peak is about 1.49 m (apex of a 7 m/s jump, gravity 18), so he never bumps the invisible top. Thrown props can, which is a narrower minor issue. The strip is intentional per `decor.ts:20`. |
| shells-7 | P2 | Cutaway stub comment says 0.9 m (`src/game.ts:729`) | Comment is wrong: the lower band is `decor.ts:35` (1.06 m) and the folding group pivots at 1.06 (`decor.ts:34`). | No player impact: 0.16 m is not visible in play. Documentation only. |
| routes-5 | P2 | Board collider from floor to 2.8 m (`src/hub/lobby.ts:67-68`) | Numbers are right: board drawn from 1.15 to 2.8 m, collider solid to 2.8 m. | The under-board gap is behind the reception desk (`lobby.ts:62-63`, desk top about 1.1 m), a dead slot with no route. Cosmetic. |
| looks-4 | P1 | Door reads as a flat cream panel that vanishes; frame blends into wall | Leaf is 8 cm cream (`lobby.ts:112`), hides at open .25 (`lobby.ts:193`), so the swing never reads. | Frame is wing-coloured (`lobby.ts:103`, `:105`), not cream. The swing is about 18 degrees before hiding, not zero. The title-sign plate at `lobby.ts:114` covers the lintel gap. |
| looks-7 | P2 | Clutter keep-out lanes target door positions that do not exist (`src/levels/lobby.ts:11`) | Verified: lanes use six back doors at x=-11.6+4.64k and side z -5.5, -0.9, 3.7. Real slots are at `src/hub/lobby.ts:31-32`. Doors at x=4.1 and -9.1 are not covered. | Only a single cone (`clutter` seed 8) landed within 1.5 m of any door, about 0.8 m from x=0.8, and the E zone is distance-based, so props cannot block it. Code-correctness nit; fix the stale comment at `levels/lobby.ts:10`. |
| looks-8 | P2 | Lunch leaf collider is 0.2 m, visible leaf 0.08 m (`src/lunch-runtime.ts:232-234`) | Mechanism holds; the thick collider is deliberate per the comment at `:233`. | Collider is only live while the door is shut (`:416`, disabled at angle .5), and the overhang is about 6 cm per face. Negligible. |
| lens-6 | P1 | Far-end squashed thumbnail plus mip-4 side wall blur | Far-end squeeze is real (`portal.ts:35-36`, `lobby.ts:107`, thumbs 800x500). | Side-wall bias 4 cannot cause the blur (single averaged tint at most 25%). The far-end minification is the real cause. |
| lens-2 (listed under refuted in input) | n/a | Occlusion fade not implemented (occluders never read) | Confirmed independently by the lens-4 verdict: `src/game.ts:75` pushed at `:165`, `decor.ts:48`, `:55`, never read. | Refuted in input summary; the refutation reason was not relayed. Treat the fade gap as real (see P1-6) until the owner sees the lens-2 reason. |

Items confirmed by both verifiers and kept in section 2: P0-1, P1-1, P1-2, P1-3, P1-4, P1-5, P1-6, P1-7 (thinness part), P2-1 (spectrum ladder), P2-3 (leaf thickness, routes-4), and lens-4 (camera collision, both confirmed).

---

## 4. Refuted findings (appendix)

Refuted by both verifiers in the input summary. The relayed data gives the verdict tags only, so no reasons are reproduced here.

| ID | Title |
|----|-------|
| doors-3 | Most portals sit closed and fogged, which reads as a blurry hole |
| doors-8 | Door positions and clutter clear-lanes disagree; an approach may be blocked |
| routes-2 | Clutter keep-out lanes point at non-existent door positions; one cone 0.81 m from a real door approach |
| routes-3 | Door "corridor" shows a UI card thumbnail, stretched and fogged to 75% when closed |
| routes-6 | Front and right room lips have a 1.0 m collider but a visible lip of about 0.34 m |
| routes-7 | Reception desk and directory board form a 4 m block on the spawn-to-door axis; walks 30-40% longer |
| lens-2 | Occlusion fade required by AGENTS.md is not implemented (see the note in section 3) |
| lens-7 | Job target ring sits on the 0.14 m floor exception line; socket cut when nearer than Pip |
| looks-2 | Closed doorway reads as a dark fog hole, not a room |
| looks-6 | Key light and tone curve push pale surfaces toward white |

Note: `doors-8`, `routes-2` and `looks-7` cover the same clutter-lane issue. Verdicts disagree on severity: looks-7 is split (confirmed on the mismatch, refuted on impact), while doors-8 and routes-2 are refuted outright.

Corrections the verifiers raised against the input (for the owner's record): camera height at zoom 22 is about 9 m, not the 8 m first estimated (`lens-5`), and about 16 m at zoom 26 in one verifier's estimate. The lobby zoom default is 23 (`src/game.ts:780`), not 22. The lobby front edge lip is at `src/levels/decor.ts:71`, not `:69-73` as one verifier cited.

---

## 5. Suggested fix order

1. **P0-1, door walkthrough.** Cut the back and side shell colliders around the nine door slots (`src/hub/lobby.ts:31-32`), add lintel colliders at about 2.42 m, and move the portal and leaf flush to the wall face (`src/hub/lobby.ts:96`, `:107`). Decide walk-through versus E-only and make the prompt, the geometry and `src/hub/lobby.ts:172` agree. Verify by walking Pip into each door in the built game (the existing test `tests/lobby.spec.ts` only presses E).
2. **P1-3, door picture.** Cover-fit the thumbnail to 0.74 aspect in `src/render/portal.ts:35`, set anisotropy on the loader at `src/hub/lobby.ts:25`, show a wing-colour fill until loaded, and give arcade-rush its own image. This addresses the "blurry hole" complaint directly.
3. **P1-7 and P2-3, leaf.** Make the leaf 0.15 m with a wing colour, add a shut collider, and hide it only past about 80 degrees (`src/hub/lobby.ts:112`, `:193`).
4. **P1-1 and P1-2, roofs and open edges.** Decide the look: a cornice and rim, or a per-room ceiling that folds with the cutaway. Fix pendant mounts and the open front and right edges together (`src/levels/decor.ts:71-72`, `src/levels/dressing.ts:52-56`). Compare screenshots at default and Close zoom with a lower default pitch (`src/game.ts:707`).
5. **P1-5, see-through oval over the cable.** Cap the oval radius, fade it with zoom, and exempt the hose from the discard (`src/render/toon.ts:51-63`, `src/render/actors.ts:138`).
6. **P1-6, camera collision and occluder fade.** Add a Rapier castRay from Pip to the camera and read the `occluders` list or remove it (`src/game.ts:698-736`, `:75`).
7. **P1-4, E-to-enter.** Settle the interaction model (see step 1) and make the frame and portal read as the chosen model.
8. **P2 cleanup.** Spectrum ladder and plaque (`src/stations/spectrum/room.ts:198-199`), garage dock door (`src/stations/garage/room.ts:112-116`), lobby clutter lanes (`src/levels/lobby.ts:11`), board collider (`src/hub/lobby.ts:67-68`), interior wall collider (`src/levels/decor.ts:49`), stale cutaway comment (`src/game.ts:729`), lunch collider (`src/lunch-runtime.ts:234`).
