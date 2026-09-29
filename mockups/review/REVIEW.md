# Circuit Crew art review: from blockout to *Good Job!*

Evidence: `artifacts/*.png` plus new 1440×900 GPU captures in this folder (`*-default`, `*-zoomin`, `*-zoomin-low`, `*-mid-orbit`, `meeting-title`).

## 1. Critique

**Verdict: the PO is right.** We match the concept *layouts* almost exactly (`meeting-default.png` vs `concept/01`). But those frames are render-kit floor plans, not a beauty target, so we faithfully shipped a blockout. *Good Job!* looks like a toy. We look like a level editor.

- **Camera & composition.** The default (zoom 38, FOV 40, pitch 0.83) frames the whole 33×20 m floor. Pip is about 40 px (4% of height), about 35% of the frame is navy void, and follow is 0.24, so you watch a map, not a character. *Good Job!* keeps the character at 10–15% of height with the room cropped past the frame, which feels bigger and fuller. The occlusion fade only raycasts to Pip, so orbiting puts a beige shell wall over half the room (`*-mid-orbit.png`). Low pitches show a room floating in a void.
- **Lighting & mood.** Hemisphere 1.0, ambient 0.25 and one sun at 1.6, identical on every level. The light is even, there is no AO, and props look pasted on. The ramp's dark band is neutral grey, so shadows are muddy, not colourful. There are no light pools or window shafts. "Dark" rooms are an 88%-opaque black plane laid over the storeroom (`lunch-runtime.ts` `dark`), which reads as a lid. No time of day, so no mood story.
- **Palette & value.** About 60% of the frame is cool mid-grey (carpet `#8fa3b8`, concrete `#b9c4c6`). Desks, partitions and walls share one pale-beige value band, so nothing pops. Chairs cycle through `CHAIRC`, which reads as confetti noise, not colour blocking. Hero yellow is wasted on clutter (mugs, bean bags, cabinet tops), so the reel, plug and supply cart get lost, and so does Pip's same-yellow hat.
- **Materials.** Every prop is a primitive with 5 cm bevels. The canvas textures don't show at play distance (the carpet pattern is 5% alpha, and the concrete dots read as dominoes). Walls are bare boxes with no baseboard, outlets, clocks, posters or doors, and windows are flat blue quads. Outlines at 0.0034 (about 1.5 px) turn into hairlines when zoomed out, so the toon look disappears.
- **Set dressing & story.** Meeting is a spreadsheet: 8 identical pods on a grid and 18 identical cabinets in a ruler line. Nothing is personal, and nothing says "meeting in 4 minutes". The Playground is 14 crates on bare concrete. Lunch Rush has **one** NPC, and the corridor is 40% of the frame, all empty planks. No steam, pans, trays or hungry queue.
- **Characters.** Pip reads well up close (`lunch-zoomin-low.png` is our best frame) but is a dot by default, and at 50° pitch you can't see his face. His realistic proportions (1.6 m against a 0.95 m desk) make the room feel empty. *Good Job!* uses chunky toy scale. Blobs have great shapes but only squash-scale. They don't type, blink, sip or watch the clock.
- **Motion & life.** Near-static. Only Pip, the target ring and one coffee puff move. LEDs don't blink, monitors don't flicker, plants don't sway, and nothing drifts.
- **VFX.** The particles are shrinking cubes. There are no flashes, smoke, arcs or steam. **The cable, the star, is the weakest visual:** a 6.5 cm, 5-sided tube that becomes a hairline at default zoom, with a colour tint as its only strain cue, and nothing flows when it's powered. Winning has no "lights ON" beat.
- **HUD & menus.** The HUD is the best part (cream pills, ink stroke, hard shadow) but reads as a website:
  - It uses the `system-ui` font.
  - Its thin line icons don't match the chunky panels.
  - The stats show `0 0 0` from the first second.
  - The strain bar is always on.
  - The toolbar has tiny `kbd` letters and covers the bottom of the play space.
  - The results card is static.

  There is no title screen, just a landing-page card (eyebrow, ®, tagline) over a live level.
- **Feedback.** Grab targets get a pale thin torus. Plug-in is a sine beep. Crashes have no hit-flash, freeze-frame or pop. Nothing sounds or looks *expensive*.

## 2. Plan

### P0: the look (about 70% of the perceived jump)

**P0.1 Camera** (`game.ts` `updateCamera`, `setupInput`)
- Set FOV to **34**. Default distance is **18** (Playground **15**) and the wheel range is **8–26**.
- Pitch defaults to **0.92 rad** and clamps to **0.50–1.20**. Follow is always **1.0**.
- Look-at target is Pip + (0, 0.8, 0) + **1.2 m** velocity lead, damped at `1-exp(-dt*5)`. Pip ends up about 13% of screen height.
- A **Tab/L3 survey toggle** eases to distance 34, pitch 1.05, looking at the room centre.
- **Cutaway:** a shell wall whose outward normal faces the camera (dot > 0.2) drops to a **0.9 m stub** with its trim cap. Stop raycasting only to Pip.
- On win, a **1.5 s push-in** to the machine (distance 9, pitch 0.7) before the card.

**P0.2 Kill the void.**
- Background: an inverted sphere with a gradient from `#34406b` down to `#1a1d2e`.
- A 0.6 m **floor slab edge** `#cfc6b4` with a `#5a5f7a` underside.
- Behind the windows: an unlit sky gradient `#bfe3ff` → `#ffe6c2`, three parallax skyline layers (`#7d9cc4`/`#6886b0`/`#5a77a0`), and 12 cm-deep frames.

**P0.3 Lighting per level** (`toon.ts`; add `setMood(level)`, delete the `AmbientLight`)

| | Sun (colour, intensity, position) | Hemisphere (sky/ground, intensity) | Cool fill (no shadow) | Exposure |
|---|---|---|---|---|
| Playground | `#fff0d8` 2.4 (-14,18,9) | `#dfe9ff`/`#9a8266` 0.8 | `#9fb4ff` 0.35 | 1.0 |
| Meeting (9:55 am) | `#ffe3b3` 2.6 (-16,14,-6), raking through the windows | `#d6e6ff`/`#8c6e55` 0.75 | `#8fa8ff` 0.4 | 1.0 |
| Lunch (noon) | `#fff4dc` 2.8 (-6,22,4) | `#e8f0ff`/`#a58760` 0.85 | `#a0b8ff` 0.3 | 1.05 |

- Shadows: fit the frustum to ±19 × ±12, `radius 3`, bias −0.0005.
- Window shafts: additive trapezoid cards `#fff1c9` at opacity 0.07, plus floor-pool decals at 0.12.
- Practical lights (lamp, oven, vending): an emissive part plus a pool decal. Real `PointLight`s only for 3–4 story lights per level.

**P0.4 Coloured ramp.** This is the biggest single "illustrated" win.
- Change the ramp to `[110,200,255]`.
- In `toon()`, patch `onBeforeCompile` so the lit colour is `mix(uShadowTint, 1, ramp)` with **`#6a5fa0`**: 45% in the low band, 15% in the mid band. Warm light with violet shadows is *Good Job!*'s signature.
- Add a rim term: `pow(1-NdotV,3)*0.25`, colour `#fff6e0`.

**P0.5 Post stack with OutlineEffect** (new `src/render/post.ts`)
```ts
class OutlineRenderPass extends Pass {   // replaces RenderPass
  constructor(private fx:OutlineEffect, private scene:Scene, private cam:Camera){super(); this.needsSwap=false;}
  render(r:WebGLRenderer, _w:WebGLRenderTarget, read:WebGLRenderTarget){
    r.setRenderTarget(this.renderToScreen?null:read); r.clear(); this.fx.render(this.scene,this.cam);
  }
}
composer = new EffectComposer(renderer, new WebGLRenderTarget(w,h,{type:HalfFloatType,samples:4}));
composer.addPass(new OutlineRenderPass(effect,scene,camera));
composer.addPass(ao = new GTAOPass(scene,camera,w/2,h/2)); // radius .45, distanceExponent 1.5, samples 12, blendIntensity .85
composer.addPass(new UnrealBloomPass(new Vector2(w/2,h/2), .35, .45, .92)); // only emissive >1 blooms
composer.addPass(new OutputPass());                   // ACES + exposure + sRGB
composer.addPass(new ShaderPass(GradeVignette));      // sat 1.12, contrast 1.06, vignette .28/.45
```
- `OutlineEffect.render` draws into whatever render target is current, so wrapping it works. Keep `renderer.toneMapping = ACES`. `OutputPass` applies it.
- Outline thickness goes to **0.0048** (about 2.2 px). Per-material `outlineParameters.color` = base × 0.35, pulled 30% toward INK. Tinted lines look inked, not stamped.
- **Phase 2 / WebGPU:** replace OutlineEffect with a depth + normal **Sobel edge pass** that reuses GTAO's normal/depth buffers. Line weight is uniform, intersections get caught, and there's no extra geometry pass. The fallback is an inverted hull (a BackSide `InstancedMesh` per batch that shares `instanceMatrix`).
- **Ship first, before GTAO:** instanced radial **contact-shadow decals** (`#2b2d42` at 0.3, 1.2× footprint) under every prop and NPC.

**P0.6 Palette and zoning**
- Reserve **job yellow `#ffc629`** and **socket cyan `#2fd4c4`** for interactive items only.
- Clutter recolours:
  - boxes `#c9925e`
  - mugs white/red/blue
  - bean bags `#e87a5d`/`#5b9cf0`
  - Pip's hat safety orange `#ff9f1c` with a white stripe
- **Pod colour blocking:** partition, chairs and mug accent share one colour per pod, rotating through coral `#ff7a6b`, mint `#4fcfa6`, lilac `#a98bf0`, sky `#5ba8f0`.
- Walls: cream `#f4e7cf` above a terracotta wainscot `#d9774a` at 0.9 m, with a `#7a4a33` baseboard.

**P0.7 The cable as hero**
- Radius **0.10** (thick **0.14**), 8 radial segments, length × 6 tubular segments.
- A UV stripe texture (dark band every 0.6 m) makes slack and pull visible.
- Strain: radius × (1 − 0.2·strain), ±2 cm jitter above 0.97, and sparks at the tightest corner when red.
- **Powered:** an emissive `#fff2a8` pulse at intensity 2.2 travels plug to load at 3 m/s.
- Plugs 1.6× with a rubber boot matching the supply colour.
- Plug-in: a 90 ms freeze-frame, a star-flash billboard, then a ring shockwave.

### P1: life, density, feel
1. **Toy scale.**
   - Pip visual 1.2×, head 1.35×, with dot eyes and a blink.
   - Desk tops 0.12, `rbox` radius ≥ 0.1. Mugs 1.4×, monitors 1.2×.
   - Blobs get nub arms.
2. **Break the grid.**
   - Pod yaw ±4°. Chairs ±25° yaw and ±0.25 m offset, with about 20% pushed out or tipped.
   - Each desk gets 3–5 of: lamp, photo, cactus, sticky notes, paper stack, snack, headphones.
   - Walls get outlets every 3 m, switches, a **deadline clock**, posters and an extinguisher. Floors get tape lines, a cable cover, rugs and stains.
   - Target **350+ props** in Meeting (about 220 now). Non-interactive dressing goes through `freeze()`.
3. **Story staging.**
   - Meeting: 8 boardroom blobs tapping in sync, a 1.3× boss in a tie, a "no signal" glyph on the screen, and a clock that turns red.
   - Lunch: a queue of 8+ tray-holding blobs with rumble shakes, oven steam and a menu board.
   - On win, the room lights come on (sun +15%, emissive windows, monitors on).
4. **Animation.**
   - Blobs: vertex idle bob (0.03 m, 1.3 Hz, per-instance phase), blinks, typing flutter, head-track within 4 m, and a "!" pop that overshoots (0 → 1.3 → 1 over 0.25 s).
   - Pip: an 8° run lean, spring-driven hat bounce (k 120, d 10), a **cable-pull pose** (lean back 18°) above strain 0.7, stride dust puffs, and a carry waddle.
5. **Ambient motion:** blinking server LEDs (`uTime`), monitor hue drift, plant sway, 60 dust motes in the shafts, blind-stripe shadows.
6. **VFX kit:** toon smoke (3-step alpha), 60 ms jagged arcs, impact stars, glass shards, steam, puddle ripples, a surge ring on the breaker, scorch decals.
7. **HUD.**
   - Bundle **Fredoka** locally. Icons become filled duotone, 30 px, 2.5 stroke.
   - Stats stay hidden until non-zero, then pop with a bounce.
   - The strain ring appears only while the plug is held, anchored above Pip.
   - The toolbar is replaced by contextual button-glyph bubbles over the nearest target.
   - Timer ring goes to 5 px, turning coral in the last 30 s.
   - Results: the medal **stamps in** (2 → 1 scale, 12° rotation, thud), sub-grades count up, and letters sit in colour chips (A `#ffc629`, B mint, C sky, D coral) over a slow orbit of the working machine.
8. **Title screen.**
   - A dedicated scene: Pip close-up (distance 5, FOV 30) at a sparking outlet, with a slow orbit.
   - A logo where a cable draws both C's (SVG stroke animation).
   - An **elevator-panel** level select: lit floor buttons 00/01/02 with grade stamps beside them.

### P2: polish
- Per-level `LUTPass` (morning: warm highlights and teal shadows).
- Photo mode with `BokehPass`.
- Breakables: a 3-frame hit-flash and a coin glyph pop.
- Sampled material thuds, a glass smash, muzak, cable creak.
- Split Meeting into half-walled "bento" sub-rooms.

## 3. Target look (artist brief)

**Global.** Toy-scale toon diorama: bevels ≥ 0.1 m, tinted ink outlines about 2 px, violet-tinted 3-step shadows, warm key and cool fill, soft AO under everything. Colour is saturated in zones and accents, calmer on big surfaces. Yellow and cyan mean "job". Every surface carries one layer of story.

**Playground (00).** A sunny training bay.
- Warm polished concrete `#d8cdb8` with `#ffc629` lane lines.
- Hazard-striped pillars, pallets, cones and a practice wall of outlets.
- The hero is a big dead lamp that blooms warm when lit, with long morning shafts across the floor.

**Big Meeting (01).** 9:55 am, sun raking through the back windows.
- Blue carpet tiles `#4f7fb8`/`#5b8cc4`, colour-blocked pods, cream and terracotta walls, a wall clock.
- A blue-lit server closet with blinking LEDs and cable spaghetti.
- A honey-wood boardroom `#d39a5b` with frosted glass bands, an impatient crowd and a big boss.
- A mustard-rug lounge `#f2b541`. Desks cluttered, chairs askew.

**Lunch Rush (02).** Noon, hot and hectic.
- Kitchen: mint and cream checker `#6cc3b4`/`#f4ecd8`, stainless `#c9d1db`, oven glow `#ff9a3c`, steam, hanging pans, tray stacks.
- Corridor: warm planks `#e2b477`, a blue bot lane, a hungry queue with trays.
- Storeroom: dim **blue-violet** (`#2d3561`, hemisphere 0.15) with one warm lamp pool when lit. Never a black lid.
- Lift room: steel `#7d8aa3` with hazard stripes, and the winch as hero.

**Title.** Night gradient behind a big Pip holding a sparking plug. A cream `#fff4dc` cable-drawn logo with ink stroke and gold C's. An elevator-panel level select. Idle: a spark every 2 s, and Pip blinks and adjusts his hat.

**HUD.** Cream `#fff6e6` pills, 3 px ink `#2b2d42` stroke, 5 px hard shadow, Fredoka numerals, duotone icons. Everything contextual. The lower third stays clear during play, and results use stamped medals over the working machine.
