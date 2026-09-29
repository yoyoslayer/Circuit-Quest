# Circuit Crew: look-dev target

Frames: `meeting-overview.png`, `meeting-closeup.png`, `lunch-overview.png`, `before-after.png` (current build vs target).
Live page: `/mockups/look/look.html?shot=meeting-overview|meeting-closeup|lunch-overview`. Debug flags: `post=0`, `ao=0`, `bloom=0`, `grade=0`, `outline=0`, `fps=1`, `pr=1.5`, and camera overrides `yaw,pitch,zoom,fov,tx,ty,tz`.
Everything is plain three r186 `WebGLRenderer`. It reuses the game's `toon()`, `makeProp()`/`prefabs`, `meeting`/`lunch` level data and `pip.glb`.

| File | Contents |
|---|---|
| `post.js` | Renderer and post stack. Drop-in for `createRenderer` in `src/render/toon.ts`. |
| `room.js` | Slab, dressed walls, windows and light shafts, lamps, desk clutter, lighting rig |
| `actors.js` | Blobs, Pip poses, glossy hose cable, `glossyToon` |
| `textures.js` | Canvas textures: carpet tiles, planks, tiles, posters, clock, screens, backdrop |
| `meeting.js`, `lunch.js` | Scenes built from `src/levels/*.ts` |

## Renderer and post

```js
renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.type = PCFShadowMap;           // PCFSoftShadowMap was removed in r18x (the game currently gets a warning + fallback)
const effect = new OutlineEffect(renderer, {defaultThickness: .0036, defaultColor: [.13,.135,.2]});
const target = new WebGLRenderTarget(w, h, {type: HalfFloatType, samples: 4});   // MSAA keeps outlines smooth
const composer = new EffectComposer(renderer, target);
composer.addPass(new OutlineRenderPass(effect, scene, camera));   // scene + outlines
const ao = new ToonGTAOPass(scene, camera, w, h); ao.blendIntensity = .85;
ao.updateGtaoMaterial({radius:.55, distanceExponent:1.6, thickness:1.2, scale:1.25, samples:16});
ao.updatePdMaterial({lumaPhi:10, depthPhi:2, normalPhi:3, radius:6, rings:2, samples:16});
composer.addPass(ao);
composer.addPass(new UnrealBloomPass(new Vector2(w,h), .35 /*strength*/, .5 /*radius*/, 1.3 /*threshold*/));
composer.addPass(new OutputPass());               // ACES + sRGB happen here
composer.addPass(new ShaderPass(GradeShader));    // display-space grade, last
```

**OutlineEffect inside EffectComposer.** `OutlineEffect.render()` draws to whatever render target is bound. So the pass binds the composer's read buffer and lets it draw there:

```js
class OutlineRenderPass extends Pass {
  constructor(effect, scene, camera){ super(); Object.assign(this,{effect,scene,camera}); this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer){ renderer.setRenderTarget(this.renderToScreen ? null : readBuffer); this.effect.render(this.scene, this.camera); }
}
```

**`ToonGTAOPass`** subclasses `GTAOPass._overrideVisibility()` to hide sprites, additive cards, see-through glass and `userData.noAO` objects from the AO g-buffer. Without this, glow sprites and light shafts cast dark AO halos.

**`GradeShader`** runs after OutputPass with these settings:
- saturation 1.12, contrast 1.06
- split-tone: shadows `#3b4a8a`, highlights `#ffd9a8`, amount .07
- vignette .32 (softness .55), grain .018

**Bloom only catches deliberately hot emissives.** The threshold is 1.3 in linear HDR, so lit white paper never blooms. Hot materials use `MeshBasicMaterial` with `color.multiplyScalar(k)`:
- server LEDs: k=2.2
- current pulses: k=2.5
- bulbs: k=2.2–3
- oven window: k=1.6

## Lighting (`room.js#lightRig`)

| Light | Colour | Intensity | Position / notes |
|---|---|---|---|
| Hemisphere | sky `#e4ebff`, ground `#9c7f66` | .85 | Cool top, warm bounce |
| Ambient | `#fff4e6` | .18 | |
| Key (sun, shadows) | `#ffe2b8` | 1.75 | (-11,21,13). Shadow map 4096, radius 2.5, bias -.0006, normalBias .035, frustum ±20×±19 |
| Fill (no shadow) | `#9db8ff` | .45 | (16,9,8) |
| Rim (no shadow) | `#ffd6f0` | .35 | (6,12,-18). Pink edge on tops and backs |

Practical point lights all use decay 1.6:
- pendants: 4.5 / 6 m
- closet (green): 3.5 / 5 m
- oven: 5 / 5 m
- storeroom lamp: 12 / 8.5 m

Point lights on the toon ramp make hard-banded pools, which suits the style. Soft pools under lamps are **additive radial decals** (`lampPool`), not lights.

- **Window shafts:** one additive, double-sided quad per window (`windowShaft`), opacity .17–.2, plus a floor patch decal.
- **Backdrop:** a canvas `scene.background` with a vertical plum-to-navy gradient (`#4b4169` → `#2c2b4a` → `#191a2c`) and a warm radial glow behind the room.
- **Diorama slab:** the floor sits on a .5 m slab (`#3b3852`) with a soft drop-shadow decal.

## Camera (the game's own orbit model: `yaw`/`pitch`/`zoom` around a floor target)

| | yaw | pitch | zoom | fov | target |
|---|---|---|---|---|---|
| Game today | .12 | .83 | 38 | 40 | Pip × follow |
| **Proposed home/default** | .14 | **.68** | **36.5** | **30** | room centre +(0.2, 0, 1.0) |
| Close-up (zoom-in end) | .42 | .44 | 10 | 34 | near Pip, y .7 |

- **Default camera:** FOV 30 at zoom 36.5 frames about 30% tighter than today, with less perspective distortion. The lower 39° pitch shows the back and left walls as real walls with windows and posters, not thin rims.
- **Zoom range:** suggest 9–38. Lerp pitch .68 → .44 and target y 0 → .7 as zoom goes 36 → 10, so zooming in also drops to Pip's eye line.

## Materials and props

- **`glossyToon`**: `MeshToonMaterial` plus a hard, stepped Blinn highlight in view space, added through `onBeforeCompile` (5 lines, before `opaque_fragment`). It reads as glossy plastic while staying toon. Used for the cable, hard hat, lamp shades, fridge, bots and supply post.
- **Cable**:
  - Tube radius .10, 12 radial segments.
  - The strain ramp (`#f5f1dc` → `#ffd451` → `#ff922f` → `#f34e56`) is baked into **vertex colours along the length**: calm at the reel, red at Pip's hand. This beats one flat colour.
  - The thick cable uses 0.32 m ink bands.
  - Current pulses are 0.55 m emissive slugs (1.18× radius, k=2.5, cyan `#6fe9ff`) plus a small halo sprite.
  - Wrap corners come from a rounded polyline (`roundedPath`). The end attaches to Pip's glove bone.
  - Comic "twang" arcs sit at the bite point.
- **Blobs:** moods (calm, happy, sleepy/blink, and alarm: big eyes, "O" mouth, arms up, turned to face Pip), glints, blush, accessories (tufts, bun, sprout, headphones, glasses, tie, cap, mug in hand), and reactions (`bangTexture` "!", sweat drop, "zz").
- **Pip** is posed from `pip.glb` with the game's own pivots: lean .3, stride -.8/+.6, right arm hauling over the shoulder (x +2.45), left arm thrown forward (x -1.35).
- **Set dressing:** two-tone walls (wallpaper, wainscot, rail, baseboard, thick cap), windows with blinds, posters, clocks, corkboard, trimmed pillars, carpet tiles with island rugs and a walkway runner, and per-desk clutter: screens, keyboards, notes, lamps, cable tails. See `room.js#deskClutter`. The Lunch Rush storeroom uses a dark overlay with a lamp-shaped hole instead of a flat 88% black sheet.

## What made the biggest difference (in order)

1. **Camera:** lower pitch and narrower FOV. The walls and people become readable, and it reads as a diorama, not a floor plan.
2. **Lighting contrast and colour:** warm key with cool fill and pink rim, plus the practical lights. Surfaces now have three distinct values, and the room has warm and cool zones.
3. **Clutter and personality:** screens, keyboards, papers, blob moods and reactions. Most of the "life" comes from here.
4. **The cable as hero:** thickness, gloss, strain gradient and pulses. It's now the most saturated thing on screen.
5. **Backdrop gradient, slab and vignette:** frame the room instead of letting it float in a flat void.
6. **GTAO:** subtle but grounds desks, chairs and blobs. Bloom and grade are polish.

**Tried and rejected:** fluorescent ceiling fixtures hanging over the back desk row. They read as floating shelves from the gameplay angle and hide the back wall. Pendants over the boardroom and lounge work.

## Performance (measured)

Setup: this machine, Chromium with ANGLE/D3D11, 1440×900, pixel ratio 1. Numbers are the median `render()` time with `gl.finish()` over 90 rAF frames. Every variant held 60 fps (vsync).

| Variant | ms/frame |
|---|---|
| Big Meeting overview, full stack | **5.4** (p90 6.1) |
| No post (OutlineEffect to canvas) | 3.7 |
| GTAO off | 3.8 (so **GTAO costs ~1.6 ms**, the main cost) |
| Bloom off | 5.4 (bloom and grade too small to measure) |
| Pixel ratio 1.5 | 5.5 |
| Lunch Rush overview | 3.4 |
| Close-up | 3.3 |

- **Draw calls:** about 2.5k per frame in the meeting overview with post. That counts the shadow map, the OutlineEffect hull pass (which doubles the scene) and the GTAO normal pass.
  - Static decor is `freeze()`-merged, as in the game.
  - The 30 blobs are unmerged (about 20 meshes each). In the game, merge each blob variant like `blobMesh` does.
- **Lights:** 8–9 lights. Every point light adds per-fragment cost to every toon material. Keep 4 or fewer real point lights per level and fake the rest with decals.
- **Cheaper AO:** if needed, run GTAO at half resolution or drop to `samples:8`.

## Pitfalls found

- **OutlineEffect straight to the canvas with a *texture* `scene.background`:** sprites, decals and transparent glass render as dark boxes. The composer path above is fine, and so is a Color background.
- **Missing post addons in `optimizeDeps.include`:** two Vite servers sharing `node_modules/.vite` produced "504 Outdated Optimize Dep" for the post addons. Add them to `optimizeDeps.include` in `vite.config.ts`.
- **Game bug, `prefabs.ts` bookshelf:** `books[(k+Math.round(y*5))%6]` goes negative for the bottom shelf. That gives undefined colours (the console "color undefined" warnings) and white books.
- **Game bug, `lunch-runtime.ts buildDoor`:** `rbox(1.45,2,.08).rotateX(π/2)` lays the swing-door leaves flat, floating at 1.05 m. Drop the `rotateX` to make them upright, as in the mockup.
