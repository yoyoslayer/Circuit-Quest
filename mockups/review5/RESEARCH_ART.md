# Review 5: art style research and rulebook (key `research-art`)

**Scope.** I studied the art direction and then compared the current build with it. Sources:

- `concept/` (all 6 images; `01_CURRENT_big_meeting_office.png` is the anchor);
- `mockups/look/LOOK.md` and the look frames `meeting-overview.png`, `meeting-closeup.png`, `lunch-overview.png` and `before-after.png`;
- `reference/render_kit/lib.js`;
- the renderer and model code in `src/render/toon.ts`, `kit.ts`, `post.ts`, `textures.ts`, `actors.ts` and `pipRig.ts`;
- `src/props/prefabs.ts`, `src/levels/clutter.ts` and `tools/create_assets.py` (the Pip model).

**Live captures.** 47 screenshots, all prefixed `research-art-` in `mockups/review5/shots/`. They were taken against the dev server at 127.0.0.1:4173 with `fullfx` on the host GPU. The scripts are in `mockups/review5/tools/research-art/` (`a.mjs`, `b.mjs`, `c.mjs`, `d.mjs`, `e.mjs`, `crop.mjs`).

**Levels shot.** I took start, survey (Tab), zoom-in and orbit views of meeting, lunch, arcade, garage, playground, lobby, observatory, qfn, spectrum and arcade-rush. On top of that:

- the arcade bench, idle and running;
- the Lunch Rush thick-cable drag and the oven plugged in;
- a soft-cel vs `?hardcel` A/B;
- pixel crops.

No console or page errors occurred, and `drive.audit()` reported no start overlaps on meeting, lunch, arcade, garage or observatory.

**Measurements.** I sampled pixels from the screenshots with PIL. Floor median luma (sRGB, 0–255):

| Concept | Value |
|---|---|
| 01 carpet | 152 |
| 01 wood | 156 |
| 04 concrete | 175 |
| 04 wood | 171 |

| Game | Value |
|---|---|
| Meeting carpet | 153 |
| Lunch wood | 193 |
| Playground | 209 |
| **Garage** | **222** |

**Outline colour on screen:** about `rgb(101,104,135)`, sampled on Pip's leg (crop `research-art-35-crop-pip-boots.jpg`).

---

## Part A: Art-style rulebook for Circuit Crew (3D models and rooms)

Every rule has a **Check**, so a reviewer or test can say pass or fail. "Game camera" means the default orbit at zoom about 26–36.5 m, FOV 30, 1440×900. "Bench close-up" means the station view after pressing E at a bench.

### R1. Palette

1. **Ink.** `INK #2b2d42` is the only near-black: outlines, tyres, chair frames, monitor bezels, plugs. Never use pure `#000`.
   - **Check:** `grep -rn "'#000'\|#000000" src` returns nothing.
2. **Surface families.** Every prop kind has a fixed colour family. A level may tint the accents, but never the family itself.

   | Kind | Allowed family |
   |---|---|
   | Cardboard `box` | Kraft only: `#c98f5a`, `#d7a56d`, `#e0b47a`. Tape is a lighter kraft. One coloured label patch at most. |
   | `cabinet`, `printer`, `cooler`, `glass` frame | Office neutrals: `#aab3c2`, `#dcdfe6`, `#f4efe6`, plus METAL `#9aa3b2` and DMETAL `#6b7385` |
   | `desk` top | `#f1ebe0` (office) or wood `#b98552` (lounge or boardroom) |
   | `chair`, `beanbag`, `sofa` (fabric) | Saturated fabric: `CHAIRC` plus `#e5484d` |
   | `bookshelf` frame | METAL or wood |
   | Books | Desaturated spines, about 25% below `CHAIRC` |
   | `plant` | Leaves `#4caf50` / `#6cc58a`; pot terracotta `#e07a4f` |
   | Hazard and "this is a job item" | Yellow `#ffc94d` / `#ffc629` with ink stripes |
   | Coworker blobs | `BLOBC`. **No other prop may use a BLOBC hue on a blob-sized rounded shape.** |

   - **Check:** a unit test over `makeProp()` for every `PropKind`, plus every level's clutter output, asserts that each mesh colour is inside its kind's family.
3. **Cable is the most saturated thing near Pip.**
   - Cable colours are the strain ramp (`#f5f1dc` → `#ffd451` → `#ff922f` → `#f34e56`), the thick cable's yellow with ink bands, and cyan pulses `#6fe9ff`.
   - No floor, rug or large prop within 3 m of a cable route may use the strain yellow, orange or red at more than 40% saturation.
   - **Check:** take a screenshot mid-drag. The cable pixels have the highest mean chroma in a 400×400 crop around Pip.
4. **Room accents.** One dominant floor family, one wall pair (upper wallpaper and lower wainscot) and at most two accent colours per room. The arcade's purple carpet plus confetti plus five pastel clutter colours breaks this.
   - **Check:** k-means with k=6 on the survey shot (HUD masked). The top 3 clusters cover at least 70% of the room pixels.

### R2. Values (readable, not bright: AGENTS rule 9)

1. **Floor brightness.** Median floor luma at the game camera is **140–185**. That is concept 150–175, with room for warm wood.
   - **Check:** the PIL median over a floor-only crop of the start shot.
   - *Fails today:* garage 222, playground 209, lunch wood 193.
2. **Three distinct values.** A frame shows floor (mid), walls (mid-light) and props (either side of the floor by at least 25 luma), so props separate from the floor without the rim light.
   - **Check:** take `?norim` shots. A prop's mean luma differs from the floor under it by at least 25.
3. **Darks are ink-blue, not black.** The split-tone shadow tint `#3b4a8a` stays.

### R3. Toon ramp

1. **Shading.** Use 3 readable bands (shadow, mid, lit) with soft edges no wider than 1/16 of the ramp. AGENTS rule 9 says "3-step ramp".
   - The current ramp `[92,96,120,168,196,226,246,255]` with LinearFilter (`src/render/toon.ts:9-13`) is a smooth gradient with about 6 visible steps. Either restore 3 plateaus, or amend AGENTS rule 9 and LOOK.md to name the soft ramp as the standard. Don't keep both.
   - **Check:** render a white sphere under the key light and sample luma along the terminator. There are exactly 3 plateaus, each at least 15% of the arc.
2. **One material function.** Every lit surface uses `toon()` or `glossyToon()`. Standard or Phong materials never appear.
   - **Check:** traverse the scene. Every mesh material is `MeshToonMaterial`, `MeshBasicMaterial` (unlit decals, screens, hot emissives only) or a whitelisted shader.
3. **Gloss is reserved for hard plastics:** cable, hard hat, gloves, boots, lamp shades, fridge, bots and the supply post (LOOK.md §Materials). Fabric, wood, paper and cardboard are never glossy.

### R4. Outlines

1. **Colour.** The on-screen outline luma must be **≤ 70**, aiming for about `#34364c`. Today `OutlineEffect` `defaultColor [.13,.135,.2]` (`toon.ts:77`) renders as about `rgb(101,104,135)` (luma about 105). That reads as a pale grey-blue halo, not ink.
   - **Check:** sample the darkest 2% of pixels on Pip's silhouette edge in a zoom-in crop.
2. **Thickness.** 2–3 px at 1440×900 at the game camera.
   - **Check:** the edge-profile width in a crop.
3. **Which meshes get outlines.**
   - *Always:* every prop, character, cable, fixture, bench part and interior wall edge cap.
   - *Never:* unlit decals, screens, glow sprites, light shafts, floor markings, labels, and big flat wall faces (`decor.ts:17-19`, which avoids hull stripes).
   - The outline must not draw on transparent faces less than 30% opaque, except the frame of the glass partition.
   - **Check:** traverse the scene and list meshes with `outlineParameters.visible===false`. Each must belong to one of the "never" groups.
4. **Small parts.** No outline on parts thinner than 1.5 px at the game camera (papers, tape, labels). Pass `false` for shadow and outline on them.

### R5. Bevels and rounding (chunky, soft)

1. **Edge radius.** Every box-like prop part has an edge radius of at least **6% of its smallest dimension**, with a 1.5 cm minimum, unless it is paper-thin (< 3 cm). The kit's `box()` caps the radius at 2.5 cm (`kit.ts`, `box`), so a 0.6 m crate gets a 2.5 cm radius (4%). Raise the cap to `Math.min(.06, m*.1)`.
   - **Check:** a unit test over the `cached` geometry keys `box:`/`rbox:`, verifying radius ≥ 0.06·min(w,h,d) where min > 0.03.
2. **No sharp extrusions.** Extruded shapes such as the `bridge` and `wedge` prefabs (`bevelEnabled:false`) get `bevelEnabled:true` with `bevelSize .02` and `bevelSegments 2`.
3. **Smooth round parts.** Cylinders and spheres use at least 24 segments. The kit already doubles them.
4. **Characters have no hard corners.** Pip's boot soles are bevel `.03` on a `.03` half-height cube (`tools/create_assets.py:71`), which reads as a square slab. Characters are built from spheres, capsules and tori only.

### R6. Proportions and scale (stylised, consistent)

1. **Reference heights.**

   | Element | Height (m) |
   |---|---|
   | Pip | 1.75–1.80 (`create_assets.py`: helmet top about 1.76) |
   | Standing blob | 1.05–1.15 |
   | Seated blob head top | about 1.4 |
   | Desk | 0.95 |
   | Chair seat | 0.5 |
   | Door | 2.2 |
   | Wall | 3.0 |
   | Interior half-walls | 1.0–1.2 |
   | Cabinet | 1.6 |
   | Supply cart | 1.3 |

   - **Check:** `tools/inspect.mjs` (or the `gallery` tool) prints the bounding boxes of `makeProp(kind)` and the actors. Each is within ±10% of the table.
2. **Small props are oversized for readability.**
   - Mugs, plugs, splitters and anything Pip handles are 1.2–1.5× real size. Mugs are 0.16×0.2 m.
   - Books stay below 0.34 m tall and are thin.
   - Nothing handheld may be smaller than 8 px at the game camera.
3. **One character language.**
   - Coworkers are blobs: a capsule body, eye whites, a pupil, glints and optional accessories (`actors.ts:28-55`).
   - Pip is the only humanoid.
   - **No other humanoids.** The arcade's human "kid" (`src/stations/arcade/station.ts:225-231`) breaks this rule.
   - **Check:** grep the stations for `sphere(` heads with `'#f2c49b'` skin outside `create_assets.py`.

### R7. Silhouettes must read as the object (a 26 m squint test)

At the game camera, shrink each prop to its silhouette plus one fill colour. A first-time viewer must name it. These are the required read cues:

| Prop | Must read as | Required cues |
|---|---|---|
| beanbag | beanbag (slouched sack) | Pear or teardrop body taller at the back. A visible seat dent in a darker shade. A pinched top or seam. A slight lean. A fabric colour that is never a BLOBC hue. Never two stacked even lobes (that reads as macarons or blobs). |
| sofa | sofa | Back, two arms, seat cushions split in two or three |
| bookshelf | shelf of books | Frame with uprights. 10–14 thin spines per shelf with varied heights, one leaning, and a gap. Never uniform bricks. |
| box | cardboard | Kraft colour, tape strip, flap seam |
| vending | vending machine | Header sign band, glass window with rows of goods, coin/button panel, dispense flap at the bottom |
| supply cart | power supply | Gauge in a housing, not a bare board. Bolt decal. Socket pair. Wheels and handle. |
| lamp (floor) | lamp | Shade, a visible warm bulb or underside glow, and a weighted base |
| plant | potted plant | Leaf clusters of at least 4 lobes plus a pot rim |
| cable | thick hose | Radius 0.085–0.10 m. The thick cable has 0.32 m ink bands. It never reads as a line. |

- **Check:** a "silhouette sheet" per prop rendered with `?norim&post=0` (the gallery tool), reviewed against this table.

### R8. Minimum detail level

1. **At the game camera (zoom 26–36 m).** Every prop shows **2 to 4 distinguishing features** (R7 cues). Every station or fixture shows at least 6. No visible face larger than 0.5 m² may be a flat single colour without a decal, panel line or trim (vending front, cart sides, walls).
   - **Check:** step through the survey shot and list props. Each has at least 2 cues.
2. **At zoom-in (9–12 m) and orbit.** Every prop has a finished **back and underside**, because orbit is player-controlled (AGENTS rule 8). Gauges, screens and signs have housings, not bare planes.
   - **Check:** retake each level at zoom −1500 plus a 180° orbit. No bare black boards or open-backed planes.
3. **At the bench close-up (station view 5.6–7 m).**
   - Every part the player touches is outlined, rounded and labelled by colour and shape first.
   - Text is at least 14 px. Today the meter caps such as "LIGHT" and "LED HEAT" are about 9 px (`research-art-36-arcade-bench.jpg`).
   - The bench body shows trim and panel splits. The arcade bench passes this.
   - **Check:** measure text cap heights in the bench screenshots.

### R9. Textures and decals

1. **Canvas textures** are for floors (carpet tiles, planks, kitchen tiles, concrete), wallpaper, posters, screens, keyboards and hazard stripes (`textures.ts`). There are no photo textures and no noise maps on props: props are flat colour plus geometry.
2. **Decals** are unlit planes (`flat()` / `decal()`) set 0.5–1 cm off the surface, with no outlines, and always **mounted**: on a wall, board, door or prop face. A decal never floats in the room (see F8).
3. **Text decals.**
   - World text exists only as signage that belongs in the world: door plaques, a station's own screen, posters.
   - Each is at least 14 px at the camera where it matters, or it is pictogram-only.
   - No sentences on walls. The observatory banner "Not every band… X-rays and gamma rays damage liv…" (`research-art-34-observatory-lounge.jpg`) fails.
   - **Check:** list every `label(`, `plaque(`, `cachedLabel(` and `labelTexture(` call with its mount parent.
4. **Floor texel density:** one texture tile is 2–4 m. Grout and plank lines must stay visible at 36 m (contrast at least 8 luma).

### R10. Characters

1. **Pip** has these silhouette features, which must stay readable from any orbit angle:
   - yellow hard hat with a brim;
   - round face with eyes, cheeks and smile (visible from the front at zoom ≤ 20);
   - blue overalls with straps and a brown belt;
   - white mitts;
   - ink boots with rounded soles.

   No part may form unintended shapes: the helmet ridge must not read as "cat ears" from behind (`research-art-34-crop-pip-back.jpg`), and the soles must not read as a plinth or skates (`research-art-35-crop-pip-boots.jpg`). Arms read as arms, with a shoulder notch, rather than merging into a wide cape (`research-art-03`, `-15`).
2. **Blobs.**
   - One body capsule per blob.
   - Mood sets eyes and mouth; alarm adds the "!" bubble and sweat.
   - Accessories come from the fixed list.
   - Seated blobs sit on chairs.
   - Nothing about a blob may be reused as a prop shape.
3. **Held items.** Carried items sit in front of the chest, held level by both mitts. Never vertical beside the head (`research-art-46-crop-arcade-tray-kid.jpg`). Never intersecting the helmet or head.
   - **Check:** at the carry pose, the item's bounding box doesn't intersect the bounding sphere of Pip's head (r 0.3 at y 1.4).

### R11. Lighting and glow limits

1. **One rig per level** from `MOODS` (`toon.ts:47-58`): warm key, cool fill, pink rim, hemisphere and ambient.
2. **At most 4 real point lights per level, including station lightUp lights** (LOOK.md §Performance). Fake other pools with `lampPool` decals.
   - **Check:** `scene.traverse` counts `PointLight` ≤ 4.
   - *Fails today:*

     | Level | Point lights | Source |
     |---|---|---|
     | Garage | 7, +1 on lightUp | `src/stations/garage/room.ts:104-113` |
     | Arcade | 5, +1 | `arcade/room.ts:117-124` |
     | Observatory | 5, +1 | `observatory/room.ts:79-109` |
     | Spectrum | 5 | `spectrum/room.ts:144-146` |

3. **Bloom only on deliberately hot emissives**, made with `hot(color,k)` where k is 1.6–3 and the threshold is 1.3. Lit paper, walls and floors never bloom.
   - **Check:** take a `bloom=0` vs default diff. Only LEDs, pulses, bulbs, oven window and marquees change.
4. **Glow sprites** have opacity ≤ 0.5 and are ≤ 1.5× the size of their source object, except station "power-on" moments. They never cover Pip.

### R12. Grounding

1. **Contact.** Every resting prop touches the floor or its support. Its visual bottom is within 1 cm of its collider bottom, and nothing hovers or sinks.
   - **Check:** extend `drive.audit()` to report `|visualMinY − colliderMinY| > .01` per prop, and also decor that overlaps props. Decor meshes are not audited today, which is how the Lunch Rush wall rack ends up with crates through it (F11).
2. **Shadows.** Every prop casts a shadow-map shadow except paper and decals. GTAO stays on at quality 2.
3. **No visual parts outside the collider by more than 3 cm.** Where a round visual sits in a box collider (beanbag, plant, bin, cone), shrink the collider to the visual, or use a cylinder or ball collider, so nothing rests on invisible corners.

### R13. Scale consistency and density (AGENTS rule 3)

1. **Prop count.** A floor of about 32×20 m has 250 or more props, and every 4×4 m cell that Pip can walk in has at least 3 props.
   - **Check:** a heat-map from the snapshot prop positions.
   - Spectrum's open centre (`research-art-25-spectrum-start.jpg`) is thin.
2. **Clusters, not confetti.** Group clutter in themed clusters (`clutter.ts` recipes), keep 1.2 m lanes and job routes clear, and place no more than about 12% of props as lone singles.
3. **Variety.** No recipe makes up more than 25% of a room's clusters. The observatory repeats `reading` twice, which gives about 7 unlit floor lamps (`research-art-21-observatory-start.jpg`).

### R14. Camera, occlusion and the diorama

1. **Occlusion fade (AGENTS rule 8).** Any mesh between the camera and Pip's head, chest or feet fades to an opacity of 0.25 or less within 0.2 s. That covers walls, half-walls, pillars, server racks, shelves, cabinets, vending machines and heavy carts. Use a dithered (screen-door) fade so sorting stays stable.
   - **Check:** a scripted orbit sweep of 8 yaws × 2 zooms per level, counting the visible Pip pixels in the `pipRing` mask region. At least 70% must be visible.
2. **Cutaway walls follow the camera.** The wall faces between the camera and the room are cut to 0.9 m. The others stay 3 m with their windows and posters, so an orbit never shows a "stage set" of low lips facing the void.
3. **Frame.** Use the backdrop gradient, the 0.5 m slab and the vignette from LOOK.md. The room must fill at least 70% of the frame width at the default camera.

### R15. The cable (AGENTS rule 4, art side)

1. **Radius.** Thin 0.085 and thick 0.10–0.12, with 10 or more radial segments and the glossy toon material.
2. **Strain.** It is shown along the length with vertex colours: calm at the reel, red at the hand. Live cables carry 0.55 m cyan pulses.
3. **Attachment.** The cable always ends in Pip's glove (`pipRig.hand`). It never passes through Pip's body. In `research-art-18-playground-close.jpg` the reel lead runs through Pip's legs, because the cable rises from the reel to a hand at hip height without wrapping around Pip.
4. **Anything that follows the cable** (the thick-cable dolly) trails along the cable path at 2 m or more and never parks between the camera and Pip (F2).

---

## Part B: Gaps between the concept and the current game (findings)

Priorities: P0 blocks play, P1 hurts fun, teaching or understanding noticeably, P2 is polish.

### What already matches (re-checked, no regression)

- **Meeting.** The survey (`research-art-02-meeting-survey.jpg`) matches the LOOK target (`mockups/look/meeting-overview.png`) closely:
  - camera and framing;
  - backdrop, slab and vignette;
  - two-tone walls with windows and blinds;
  - carpet with walkway;
  - pillars with posters;
  - desk clutter;
  - blob moods and the boardroom glass.
- **LOOK.md pitfalls are fixed:**
  - the bookshelf colour index now wraps (`prefabs.ts:123-125`);
  - the swing doors stand upright (`research-art-39-lunch-thick-cable-close.jpg`).
- **The arcade bench close-up** (`research-art-36`, `-37`) is chunky, rounded, colour-coded and readable. The LED glow is restrained. It is the best close-up in the game.
- **The Lunch Rush thick cable** (`research-art-38`, `-40`) reads as the hero the way concept 04 shows it: yellow with ink bands, white pulses, a glossy tube.

---

### F1. P1 · playability / visual-bug. Occlusion fade only covers pillars, so walls, racks, shelves and heavy props hide Pip

- **Evidence:**
  - `research-art-04-meeting-zoomin-orbit.jpg`: the server racks and the closet half-wall cover about 45% of the frame; Pip is half hidden.
  - `research-art-08-lunch-zoomin-orbit.jpg`: the yellow supply cart's gauge board and body sit in front of Pip.
  - `research-art-12-arcade-zoomin-orbit.jpg`: the storeroom half-wall cuts Pip off at the waist.
  - `research-art-24-qfn-close.jpg`: the parts shelf sits in front of Pip, and only the hat shows.
  - `research-art-39-lunch-thick-cable-close.jpg`: the thick-cable dolly sits in front of Pip.
- **Code:**
  - `src/game.ts:110-113`: only `game.box(...,fade=true)` meshes join `occluders`.
  - `src/levels/decor.ts:55`: only pillars are pushed.
  - `src/game.ts:387-388`: a single ray to `p.y+.4`.
- **Why it matters.** The orbit camera is a hard rule (AGENTS 8) because Good Job's main complaint was losing the character. Today, orbiting to see a cable route often hides Pip and the plug, and the player loses track of where the cable end is.
- **Rule broken:** AGENTS 8 and rulebook R14.1.
- **Fix:**
  1. Add a `fadeable(mesh)` helper in `src/game.ts` that clones the material once, marks it, and pushes the mesh to `occluders`. Call it from:
     - the decor wall builder (`decor.ts:48`: interior and closet walls, both the plain faces and the caps);
     - the server racks and closet in the meeting decor;
     - the arcade storeroom half-wall (`arcade/room.ts`);
     - the Lunch Rush room walls;
     - every prop whose `prefabs[kind].size[1] >= 1.2`: cabinet, vending, bookshelf, dolly, supply, capcart, whiteboard, glass, cooler, plant (`game.ts` prop spawn).
  2. Cast 3 rays (Pip's feet at y .2, chest at .9 and head at 1.5) and union the hits.
  3. Fade to `.25` with `material.alphaHash=true` (three r186 supports alpha hash on toon), not `transparent`, so the outline pass and sorting stay correct.
  4. Lerp at `1-exp(-dt*12)`.
- **Verify:** retake `research-art-04`, `-08`, `-12`, `-24` and `-39` with the same script calls (`a.mjs`, `b.mjs`, `d.mjs`). Pip's full body must be visible behind faded geometry. Add a Playwright check to `tests/layout.spec.ts`: orbit 8 yaws and assert that a raycast from the camera to Pip's chest hits no mesh with opacity above 0.3.

### F2. P1 · visual-bug / playability. The thick-cable dolly tails Pip at 1.3 m and parks in front of him

- **Evidence:**
  - `research-art-39-lunch-thick-cable-close.jpg`: the reel flange covers Pip's torso, and Pip looks fused with the dolly.
  - `research-art-38-lunch-thick-cable-drag.jpg`: the same from the default camera, on the doorway.
- **Code:** `src/lunch-runtime.ts:237`. While the thick cable is held, `if(d>1.3) dolly.setLinvel((p-pos)*4)` steers the dolly straight at Pip's position. Walking away from the camera, which is the normal direction into the kitchen, puts it between the camera and Pip. It also rams through the swing door gap with Pip.
- **Why it matters.** The thick cable is the level's "heavy" lesson. If the player can't see Pip and the plug at the critical doorway, the door-pinch hazard can't be read.
- **Rule broken:** R15.4, R14.1 and AGENTS 4 (the cable is the star, and it should be visible).
- **Fix:**
  - Steer toward a point **2.2 m back along the cable**: the point at arc length `L-2.2` of the current `cablePoints.thick` polyline, not Pip's position.
  - Only steer when farther than 2.6 m from that point.
  - Cap the speed at Pip's walk speed.
  - Add the dolly to `occluders` (F1).
- **Verify:** rerun `d.mjs` and retake `research-art-39`. The dolly must trail behind on the corridor side, and Pip must be fully visible in the doorway.

### F3. P1 · art-style. The arcade play-tester is a realistic human kid in a world of blobs

- **Evidence:**
  - `research-art-35-arcade-counter-kid.jpg` and the crop `research-art-46-crop-arcade-tray-kid.jpg`: a peg-person with an orange tee, brown hair and blue legs standing at the pinball cabinet.
  - `research-art-09-arcade-start.jpg`: the same figure behind the counter.
- **Code:** `src/stations/arcade/station.ts:225-231` builds cylinder legs, a cylinder body, a skin sphere head and a hair cap.
- **Why it matters.** The cast language is "Pip plus blobs" (concepts 01, 03, 04 and 91). A tiny human makes Pip look like a giant, and the kid reads as a toy, which breaks the world.
- **Rule broken:** R6.3 and R10.2.
- **Fix:**
  1. Replace the kid with `blob('#ffb38a','happy',['cap'])` from `src/render/actors.ts`, scaled `.72`, standing at the same spot. Keep the hop, mash and slump animation by animating the blob group's `position.y`, `scale` (squash) and `rotation.z`.
  2. Show the arms as the blob's own capsules. Hide `kidArms`, or rotate the merged blob as a whole.
  3. Swap moods when the cabinet goes dark: use `alarm` or `sleepy` geometry, the same as `game.ts:129` does for coworkers.
- **Verify:** retake `research-art-35`. Only blobs and Pip are on screen. Run `tests/station-arcade.spec.ts`, which still passes because the kid is visual only.

### F4. P1 · art-style / clarity. One clutter palette for every kind gives pink cardboard, brown beanbags and teal bookshelves

- **Evidence:**
  - `research-art-09-arcade-start.jpg` and `-11`: the boxes are pink, teal, lilac and blue, and the beanbags are pastel. The whole floor is one mid-value pastel field, and the job items (tray, reel) don't pop.
  - `research-art-17-playground-start.jpg`: the beanbags are cardboard-brown and read as bread loaves.
  - `research-art-24-qfn-close.jpg`: a teal shelf.
  - `research-art-25-spectrum-start.jpg`: red, yellow, pink and blue boxes read as toy blocks or gifts.
  - `research-art-13-garage-start.jpg`: a yellow cabinet stack.
- **Code:**
  - `src/levels/clutter.ts:61` (`colors=o.colors??FLOOR`) and `:75`: every recipe picks from the same list for boxes, beanbags, cabinets, chairs, bookshelves, carts and mugs.
  - The level arrays: `arcade.ts:29`, `garage.ts:31`, `lunch.ts:18`, `observatory.ts:25`, `qfn.ts:25`, `spectrum.ts:34`. Playground passes none, so `FLOOR` browns are used.
- **Why it matters.** Silhouettes and colour families are how a player recognises "a box I can kick" versus "a seat" versus "a job part" at 26 m. When cardboard is pink and beanbags match the blobs, the room turns to noise. The yellow job highlight family (wedge, reel, strip) also gets diluted by yellow clutter.
- **Rule broken:** R1.2 and R1.4.
- **Fix:**
  - Change `ClutterOptions.colors` to `Partial<Record<PropKind,string[]>>` (keep `string[]` as an "accent" fallback), and resolve per kind:

    | Kind | Colours |
    |---|---|
    | `box` | `FLOOR` kraft always, with the level accent only on the label patch (add a `label` colour to the box prefab, `prefabs.ts:56`) |
    | `beanbag`, `chair` | Level accents filtered to remove BLOBC hues (ΔE > 15 from each BLOBC) |
    | `cabinet` | `['#aab3c2','#dcdfe6','#f4efe6']` |
    | `bookshelf` | `[METAL,'#b98552']` |
    | `cart` | `['#5f8fa8','#9aa3b2']` |

  - Keep the arcade's pastel identity in the floor, cabinets, rugs and marquees, not in cardboard.
- **Verify:** retake all the start and survey shots. Run the k-means check from R1.4 on `research-art-10`. Add a unit test in `tests/` that runs `clutter()` with the level options and asserts the box colours are all in `FLOOR`.

### F5. P1 · model-detail / silhouette. Beanbags don't read as beanbags

- **Evidence:**
  - `research-art-11-arcade-zoomin.jpg`: teal, pink, yellow and lilac shapes made of two even stacked lobes (macaron or jelly).
  - `research-art-12`: the same from the side.
  - `research-art-17`: a brown beanbag reads as bread.
  - `research-art-22-observatory-close.jpg`: a lilac one.
  - `research-art-20-lobby-close.jpg`: a purple squashed blob that looks like a coworker lying down.
- **Code:** `src/props/prefabs.ts:130-136` is a base sphere `(1,.48,1)` plus a back lobe `(1.12,.72,.78)`, a torus seam and a small dent.
- **Why it matters.** Rule 3 wants hundreds of recognisable office things. Beanbags are the arcade's main clutter (`arcade.ts:13` plus the `lounge` recipe, used three times). Lumpy pastel blobs next to pastel blob NPCs confuse the "who is a person" read, and in Good Job the comedy comes from recognisable props.
- **Rule broken:** R7 (beanbag row) and R1.2.
- **Fix** (`prefabs.ts` beanbag case):
  - **Body.** Make it a lathe: `T.LatheGeometry` with a teardrop profile, bottom radius .45, waist .40 at y .25, top .22 at y .55, tilted back 0.35 rad around x. That gives one continuous slouched sack, not two lobes.
  - **Seat dent.** A darker, flattened sphere (`.24`, scale `(1,.15,.9)`) at the front, y .32.
  - **Top.** A pinched tuft (`ConeGeometry(.06,.1,8)`) at the top.
  - **Seams.** 3 seam lines (thin tori segments) running from the top down the back.
  - **Variety.** A random yaw and a lean of ±0.08 rad per instance (via `variant`).
  - **Physics.** Keep `size [.9,.6,.9]`, but use a cylinder collider (R12.3).
  - **Colour.** Per F4.
- **Verify:** render a silhouette sheet with `tools/gallery` at the 26 m and 10 m camera. Retake `research-art-11`. A viewer should say "beanbag" without being told.

### F6. P2 · art-style. Outlines are pale grey-blue and thin, not ink

- **Evidence:**
  - `research-art-35-crop-pip-boots.jpg`: the outline pixel is about `rgb(101,104,135)`.
  - `research-art-34-crop-pip-back.jpg`: Pip's outline reads as a light halo.
  - Concept 01 and 03 edges are darker and crisper.
- **Code:** `src/render/toon.ts:77`, `new OutlineEffect(renderer,{defaultThickness:.0036,defaultColor:[.13,.135,.2]})`. The colour is linear, so it shows up as about `#64667c` after output.
- **Why it matters.** Dark outlines are half of the toon identity (AGENTS 9) and separate props from pale floors, especially in the garage and playground. Today the cool rim light (`toon.ts:22-35`) is doing that job.
- **Rule broken:** R4.1 and R4.2.
- **Fix:**
  - Set `defaultColor:[.035,.037,.07]` (about `#34364c` on screen) and `defaultThickness:.0045`.
  - If the hull stripes on big walls come back, keep `plain()` (`decor.ts:19`) for wall faces.
  - Compare at 1440×900 and 1920×1080. Thickness is relative to viewport height, so check that 1080p gives 2–3 px.
- **Verify:** sample the darkest 2% of Pip's edge in a retake of `research-art-30-meeting-pip-front.jpg`. Luma must be 70 or less.

### F7. P1 · art-style / readability. Garage and playground are washed out (floors about 210–222 luma) and over-lit

- **Evidence:**
  - `research-art-13-garage-start.jpg` and `-14`: the floor, walls and many props are all near white, and the yellow job items sit on a white field.
  - `research-art-17-playground-start.jpg`: the first level a player sees.
  - Measured floor medians are garage 222 and playground 209, against concept 150–175.
- **Code:**
  - `src/stations/garage/room.ts:66` uses `TX.concreteFloor('#dcd8ce')`.
  - The garage has 7 point lights plus 1 more on lightUp (`room.ts:104-113`).
  - `MOODS.garage` key 2.15 and hemi .74 (`toon.ts:64`), against LOOK.md's key 1.75 and hemi .85.
- **Why it matters.** "Readable, not bright" (AGENTS 9). Pale floors erase contact shadows and AO, so props look pasted on. The yellow job highlights lose contrast in the garage, where they matter most.
- **Rule broken:** R2.1, R2.2 and R11.2.
- **Fix:**
  - **Garage floor:** `concreteFloor('#b9b3a6')` plus a darker painted bay rectangle (`#a9b3b8`) under the work area.
  - **Playground floor:** take it down by the same ΔL of about −0.12 in the playground room file.
  - **Garage lights:** keep the bench lamp and the stand lamp only. Make the corner floor spots `lampPool` decals with `hot` bulbs (no `PointLight`), and fold the lightUp light into an emissive.
  - **`MOODS.garage`:** `key 1.9`, `exposure .97`.
- **Verify:** retake `research-art-13` and `-17`. The PIL floor median must be in 140–185. Count `PointLight` ≤ 4 per level with `scene.traverse` in a `tests/layout.spec.ts` assertion.

### F8. P2 · visual-bug / clarity. The arcade "STOREROOM" plaque floats in mid-air

- **Evidence:** `research-art-09-arcade-start.jpg` and `-10`: a purple pill hangs at head height in front of the cabinet row, with nothing holding it. `-11` shows it cut by the HUD.
- **Code:** `src/stations/arcade/room.ts:115` is a `PlaneGeometry(1.5,.36)` at `(-7.6, 2.1, 2.8)` with no backing and no parent surface.
- **Why it matters.** AGENTS 2 bans floating world labels. It also reads as a UI glitch.
- **Rule broken:** R9.2 and R9.3.
- **Fix:**
  - Mount it on the storeroom doorway header. Add an `rbox(1.6,.42,.06)` backing in `PLUM` with two DMETAL brackets, placed flush on the half-wall cap, and parent the plane to it.
  - Or replace the text with a pictogram: a box icon in the shared `glyph()` style.
- **Verify:** retake `research-art-09`. The sign is attached to geometry from every orbit angle.

### F9. P2 · model-detail. Pip: plinth-like soles, cat-ear helmet ridge, arms merge into a cape

- **Evidence:**
  - `research-art-35-crop-pip-boots.jpg`: grey rectangular soles stick out past the boots, so he seems to stand on skates or a plinth. Also visible in `-16`, `-20` and `-46`.
  - `research-art-34-crop-pip-back.jpg`: from behind, the ridge ends poke up as two "ears".
  - `research-art-03-meeting-zoomin.jpg` and `-15`: the arm ellipsoids sit flush with the torso, so the upper body reads as one wide blob.
- **Code:** `tools/create_assets.py:71` (`cube Boot{n}Sole (.13,.21,.03) bevel .03`), `:63` (`HelmetRidge (.035,.24,.035)` at z 1.72) and `:74` (`Arm{n}` at x ±.39, scale `.11/.12/.27`, overlapping the torso at .34).
- **Why it matters.** Pip is on screen 100% of the time. These read as modelling errors in close-ups and on every orbit.
- **Rule broken:** R5.4 and R10.1.
- **Fix** (in `create_assets.py`, then regenerate `public/models/pip.glb`):
  - **Soles:** `sphere('Boot{n}Sole',(s*.17,-.08,.04),(.14,.235,.035),grey)`, a rounded pad entirely under the boot.
  - **Ridge:** shorten it to `(.03,.17,.03)` at z `1.70`, or drop it and add a raised band torus around the dome.
  - **Arms:** move to x ±.42, scale `(.10,.11,.25)`, with a small navy shoulder seam torus at the joint so there is a visible notch. Update `pipRig.ts:38` arm pivots `±.39` → `±.42`.
- **Verify:** use the `tools/debug/rig.mjs` gallery of Pip from 8 yaws, then retake `research-art-30` and `-34`.

### F10. P2 · model-detail. Books are giant uniform candy bricks

- **Evidence:** `research-art-31-meeting-lounge.jpg` (the shelf is the most saturated, biggest element in frame), `research-art-24-qfn-close.jpg` and `research-art-34-observatory-lounge.jpg`.
- **Code:** `src/props/prefabs.ts:123-125`: 7 identical `box(.14,.34,d*.7)` per shelf in full `CHAIRC`-style colours.
- **Why it matters.** It doesn't read as books. It steals saturation from the cable (R1.3) and looks toy-like next to the more detailed desks.
- **Rule broken:** R7 (bookshelf row) and R1.2.
- **Fix:**
  - 10–14 books per shelf. Width `.05–.09`, height `.22–.34` (seeded by k and y), depth `d*.75`.
  - Leave one gap and lean one book at 0.25 rad.
  - Add a darker spine band (`box(w*1.01,.03,.01)`) at about 70% height.
  - Desaturate the palette 25% (`books` array).
  - Use `box()`, which already rounds the corners.
- **Verify:** retake `research-art-31` and `-24`.

### F11. P2 · overlap (PLAUSIBLE). The Lunch Rush power-room wall rack is decor with no collider, so crates sit through and around it

- **Evidence:** `research-art-44-crop-lunch-shelf.jpg`. Crates are stacked at the rack's plank heights with the planks passing behind or through them, and several upper crates look unsupported.
- **Code:**
  - `src/lunch-runtime.ts:129`: the rack's planks at y 1 and 2.1 are decor only (`decorRoot`, no `solid()`).
  - Clutter `fill` places crates along the walls (`lunch.ts:18`, `fillBand`).
  - `drive.audit()` only tests props against colliders, so decor overlaps are invisible to it.
- **Why it matters.** The concept's storeroom racks read as "shelves holding boxes". This reads as clipping, which undermines the physics fantasy: you'd expect to knock those boxes off.
- **Rule broken:** R12.1.
- **Fix:**
  - Add `solid(game,3.4,.08,.5,...)` for each plank (rotated π/2, at x -16.1, z 5) and the uprights.
  - Then either place 4–6 real `box` props on the planks at `y:1.04` and `y:2.14`, or add the rack footprint to the clutter keep-out.
  - Extend `game.audit()` (`src/game.ts:486`) to test props against `decorRoot` mesh AABBs.
- **Verify:** extend `audit` and run it on lunch (it should report nothing), then retake `research-art-05` and its crop.

### F12. P2 · visual. Orbiting reveals the "stage set"

- **Evidence:** `research-art-08-lunch-zoomin-orbit.jpg`, `-12`, `-16-garage-zoomin-orbit.png` and `-22`. Facing the front of the room, the far side is a low lip with the void behind it, so the room reads as unfinished.
- **Code:** front walls are built low for the default camera (the decor wall builder in `decor.ts` and the room files). The heights don't respond to camera yaw.
- **Why it matters.** The camera is player-controlled (AGENTS 8). Half the orbit angles show a stage set, not a diorama.
- **Rule broken:** R14.2.
- **Fix:**
  - Build all four outer walls at full height (3 m) with windows and posters.
  - Tag each with its outward normal.
  - Each frame, set the wall's upper section visible only when `dot(normal, cameraDir) > 0.2` (the wall faces away from the camera), and otherwise show only the 0.9 m lower band plus the cap. This is the classic dollhouse cutaway.
- **Verify:** retake `research-art-08` and `-16`. The far walls are full height with dressing.

### F13. P2 · art-style (rule conflict). The toon ramp is an 8-stop smooth gradient, not the 3-step ramp

- **Evidence:** `research-art-41-meeting-ramp-default.jpg` vs `research-art-42-meeting-ramp-hardcel.jpg`. At the game camera they are nearly identical. Up close the blobs and Pip shade smoothly (`research-art-30`), more like soft plastic than cel.
- **Code:** `src/render/toon.ts:9-13`.
- **Why it matters.** AGENTS 9 and LOOK.md say "3-step ramp". The code silently diverged, so reviewers can't tell which is the standard.
- **Rule broken:** R3.1.
- **Fix:** pick one.
  - (a) Keep the soft look but make it banded: `[100,100,100,178,178,178,240,255]` with LinearFilter, which gives three plateaus with soft edges.
  - (b) Amend AGENTS rule 9 and LOOK.md to say "soft 3-zone ramp", and record the values.
- **Verify:** a sphere test render, sampling plateaus as in R3.1.

### F14. P2 · model-detail. Vending machine and supply-cart gauge are unfinished from behind and up close

- **Evidence:**
  - `research-art-43-crop-lunch-vending.jpg`: a red slab with a sticker grid, with no header sign, coin panel or dispense flap.
  - `research-art-08-lunch-zoomin-orbit.jpg`: the vending back is plain, and the yellow supply cart's gauge is a bare black board from behind.
  - Concept 01 shows a vending machine with a panel and a keypad.
- **Code:**
  - `src/props/prefabs.ts:126-128` (vending).
  - `src/render/kit.ts:108` (`Gauge.mount` is an ink `box(.7s,.46s,.06)` plus a decal plane, with no housing).
- **Rule broken:** R7 (vending and supply rows) and R8.2.
- **Fix:**
  - **Vending:**
    - a header band `rbox(w*.9,.22,.05)` in a lighter shade with a glyph;
    - a glass window with three shelf strips;
    - a side panel with a coin slot and 6 buttons;
    - a dispense flap `rbox(w*.5,.18,.04)` in INK at y `-h/2+.25`;
    - a back panel line and a vent decal.
  - **Gauge:** wrap it in `rbox(.78s,.54s,.14,.06)` in the cart colour, tilted back 0.35 rad, with a rounded hood lip.
- **Verify:** retake `research-art-08` and `-43`.

### F15. P2 · art-style. Floor lamps are unlit mushrooms, and the observatory has about 7 of them

- **Evidence:**
  - `research-art-21-observatory-start.jpg`: white discs on sticks all over the floor.
  - `research-art-34-observatory-lounge.jpg`: a big plain cone shade with no bulb or glow.
- **Code:**
  - `prefabs.ts:157-159` (`lamp`: base, pole, shade; no bulb).
  - `observatory.ts:25` lists `reading` twice in the recipes.
- **Rule broken:** R7 (lamp row) and R13.3.
- **Fix:**
  - Add a bulb `sphere(.07)` with `hot('#ffe6b0',1.8)` under the shade, and a `lampPool` decal at the base (no light).
  - Give the shade a rim torus and a cord.
  - Limit `reading` to one recipe slot per level.
- **Verify:** retake `research-art-21`.

### F16. P2 · art-style. Carry pose: the tray is held vertical beside the helmet

- **Evidence:** `research-art-46-crop-arcade-tray-kid.jpg`. The resistor tray is tilted about 70° at Pip's right ear while it is "carried", so the blocks would spill.
- **Code:** `src/game.ts:331`. Held props are driven to a point `ahead` of Pip with no orientation target for flat items.
- **Rule broken:** R10.3.
- **Fix:**
  - For kinds with `size[1] < .2` (tray, paper, strip, bridge, splitter), drive the rotation toward level (quaternion slerp, k .2/frame) and the position to chest height y 1.0, 0.55 m in front.
  - In `pipRig.ts`, add a `carrying:'tray'` pose with both arms forward at x -1.2.
- **Verify:** retake the arcade carry (`c.mjs` up to `-35`).

### F17. P2 · clarity. The objective marker is a flat unlit triangle

- **Evidence:** `research-art-03-meeting-zoomin.jpg` (a big flat yellow wedge beside Pip, no outline or depth), `-18` and `-24` (it overlaps the "STOCK" sign).
- **Code:** the `game.ts` hint and reticle (`game.ts:436`).
- **Why it matters.** It's the one piece of world UI and it doesn't share the toon language. At zoom-in it's the biggest flat shape on screen.
- **Rule broken:** R4.3. Icons are fine (AGENTS 2), but they should be styled.
- **Fix:**
  - Make a chunky 3D chevron: `ExtrudeGeometry` with depth .08, bevel .02, `toon('#ffc94d')`, outlined, and a slow bob.
  - Scale it with camera zoom so it stays 24–32 px.
  - Hide it when it overlaps a sign: offset it 0.4 m toward the camera.
- **Verify:** retake `research-art-03` and `-24`.

### F18. P2 · density. Spectrum's centre is thin, and the arcade is over-dense noise

- **Evidence:**
  - `research-art-25-spectrum-start.jpg`: a large empty white floor between the bench and the storeroom.
  - `research-art-10-arcade-survey.jpg`: about 220 clutter items of uniform size and value, plus confetti, and nothing reads as a cluster.
- **Code:** `spectrum.ts:34` (`step 2.1`, but the lanes eat the middle) and `arcade.ts:29` (`max 220`, `fill:['box','box','cone','litter']`).
- **Rule broken:** R13.1 and R13.2.
- **Fix:**
  - **Spectrum:** add 2–3 hand-placed clusters, such as a test-equipment cart and a mail cart with crates, at about (−1,1) and (3,−1), clear of the beam lane.
  - **Arcade:** cut the confetti decal density by 50%, use `max 170`, and put cones only near the storeroom (a cordon) instead of scattering them.
- **Verify:** use the cell-count heat-map check (R13.1) on the snapshot positions.

---

## Biggest concept → game gaps (summary, ranked)

1. **Losing Pip on orbit (F1, F2).** The concept frames assume a fixed camera. The game gives the player orbit control but fades only pillars.
2. **Colour families (F4, F5, F10).** The concept keeps cardboard kraft, fabric saturated and blobs unique. The game recolours every kind with one level palette, so pink boxes, brown beanbags and teal shelves dilute the reads.
3. **Values (F7, F6).** The concept floors sit at mid value with ink outlines. The garage and playground are near white, and the outlines are pale.
4. **Character language (F3, F9).** The concept has only Pip and blobs. The arcade adds a human. Pip's soles, ridge and arms show modelling artefacts in close-ups.
5. **Stage-set walls and floating signage (F12, F8).** These are fine from the concept angle and break on orbit.

## Screenshot index (all looked at)

| Group | Shots |
|---|---|
| Starts / views | `research-art-01…04` meeting (start, survey, zoom-in, orbit); `05…08` lunch; `09…12` arcade; `13…16` garage; `17,18` playground; `19,20` lobby; `21,22` observatory; `23,24` qfn; `25,26` spectrum; `27,28` arcade-rush |
| Close-ups | `30` Pip front; `31` meeting lounge; `32` boardroom; `33` meeting max zoom-out; `34` Pip-back crop / observatory lounge; `35` arcade counter + kid / boots crop; `36,37` arcade bench idle and running |
| Cable and mid-solve | `38,39,40` lunch thick-cable drag, close and oven plugged |
| Ramp A/B | `41,42` |
| Crops | `43` vending; `44` lunch rack; `45` arcade east wall; `46` tray and kid; `47` observatory chair and beanbag (inconclusive, not reported) |

Note: two scripts each wrote a `34` and a `35` (`-34-crop-pip-back`, `-34-observatory-lounge`, `-35-crop-pip-boots`, `-35-arcade-counter-kid`). The full names are unique.
