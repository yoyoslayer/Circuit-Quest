# Circuit Crew: second-round art and feel review

I captured the current build on the host GPU with Playwright: Chromium with ANGLE/D3D11, 1440×900, plus a 390×844 phone pass. The captures cover the title, jobs, pause, result and fail screens, every level at default zoom, zoomed in, orbited and in survey, and mid-action (taut cable, release, crash, plug-in, win push-in). Every PNG named below is in this folder. Targets: `mockups/look/*.jpg` and `mockups/ui/*.jpg`.

**Verdict.** This is a big jump. Big Meeting at default and survey (`mt-default`, `mt-survey`) now reads as the `meeting-overview` target: dressed walls, windows and shafts, pods with clutter, blobs with personality, backdrop, slab and vignette. The UI screens are close to pixel-faithful to the mockups. It is **not "absolutely finished"** yet, for four reasons:
- The **payoff moments** (plug-in, lights on, win) are the weakest frames in the game.
- The **Playground** is still a blockout, and it is the level new players see first, on the title too.
- The cable's **hero behaviours** from the close-up target (twang, jitter, sparks, crowd alarm) aren't ported.
- A handful of **framing and clipping bugs** remain.

## 1. Scorecard (0–10 against target)

| Area | Score | Notes |
|---|---|---|
| Camera | 7 | Diorama default and eye-line zoom (`mt-zoomin`) work. Problems: on phone Pip spawns off-screen; the meeting win push-in frames a pendant lamp; the result card hides the payoff. |
| Lighting | 7 | The rig, shafts, server glow and pendants match the look. The Playground is flat. The "lights ON" beat never blooms. |
| Materials | 7 | Consistent toon, ink outlines and glossy hose. Up close the Playground concrete reads as grimy blotches (`pg-zoomin`). The Playground lamp is a black bowling ball on a stick. |
| Set dressing | Meeting 8 / Lunch 7 / Playground 3 | The Playground is 14 grid-placed boxes and chairs, 3 cones and 2 pillars (`pg-default`). |
| Characters & animation | 6 | Blob moods, "!" pops and cheering are good (`mt-crash`, `mt-win-pushin`). Problems: seated blobs are static; nobody reacts to a taut cable; Pip is seen from behind almost the whole game; the haul pose is subtle. |
| The cable | 6 | Thick, glossy, strain gradient, gold on connect. Problems: no twang arcs, jitter or sparks; a hockey-stick kink where it rises to the hand; it stays red after release; Lunch thin leads are pale hairlines. |
| VFX | 4 | Only cubes, flat confetti and ico dust. No plug-in flash, shockwave, freeze-frame, smoke, steam or impact stars. |
| UI/HUD | 8 | Plate, tallies (hidden until non-zero), strain bar and Lunch chain/breakers match `hud-*.jpg`. The world cues from UI.md (brackets, route dots, throw arc) aren't ported. |
| Menus | 7 | Jobs, pause, result and fail are near-mockup. Problems: the title backdrop is the empty Playground, Pip is hidden behind the logo tape, and the job thumbnails are stale. |
| Audio (inferred from code) | 5 | Everything is synthesised oscillators and noise (`render/audio.ts`), plus a sequencer loop. Plug-in is a beep; there are no material impacts or cable creak. |
| Performance feel | 9 | 60 fps at full quality (AO + bloom), about 2.8 ms render on this GPU, with adaptive quality. No console errors. |

## 2. Remaining gaps, in priority order

**P0.1 Make the payoff land** (`mt-plugin`, `mt-win-pushin`, `pg-plugin-flash`, `pg-result`)
- `Game.win()` sets the screen to `toon('#f9df88',{emissive,ei:.5})`. That is below the 1.3 bloom threshold, so nothing glows.
  - Use `hot()` from `render/actors.ts` (k≈2.2) with a slide texture (a chart; "no signal" before).
  - Add a `pointLamp` and a `lampPool`.
  - Playground: turn the sphere in `decor.ts playground()` into a real lamp with a shade, switch it to `hot` plus `glow`, and bump `view.sun` by 15%.
- `Game.interact()` plug branch: add a **90 ms hit-stop** (a `hitstop` timer that `frame()` checks before stepping), a star-flash billboard and a ring shockwave in `particles.ts`.
- `Game.updateCamera()` push-in:
  - Meeting: the camera looks down through the pendant (`decor.ts meeting()`, `pendant(...,12,-5.2)`). Use pitch about .45 aimed at the screen `(12.2,1.9,-9.8)`, or hide the pendants while `pushing`.
  - Offset the focus so the machine sits in one third of the frame, and dock the result tag in the other (`.result-screen` in `ui/screens.css`, e.g. `justify-content:flex-start`), as in `mockups/ui/result.jpg`.
  - Turn Pip to face the camera in a cheer pose.

**P0.2 Phone framing bug** (`phone-meeting`)
- At 390 px wide, Pip spawns at the screen edge under the thumb zone. In `updateCamera` the follow is `.25+near*.9` whatever the aspect.
- Fix: raise `follow` to 1 when `camera.aspect<1`, or project Pip to NDC and shift `focus` when `|x|>.55`.

**P0.3 Cable hero behaviours** (`mt-strain-max`, `mt-drag-taut-zoom`)
- In `Game.drawCable()`:
  - Above strain .97, jitter the points ±2 cm and spawn `spark`s at `rope.bends.at(-1)`.
  - Add twang-arc sprites at the bite point.
  - Only feed strain into `hoseGeometry` while `holdingPlug` (`mt-release` stays red on a slack plug).
  - While strain > .9, call `alarm(point, 2.5)` for blobs near the cable, as in `meeting-closeup.jpg`.
- `cablePath()`: the rise to the hand is a hard L. Rise over about 1.8 m and add an intermediate control point.
- `lunch-runtime.ts`: thin leads are `radius .06` in near-white `#ecE8dc` on pale concrete. Use .075 and a stronger calm colour.

**P0.4 The Playground is a blockout, and it's the first-run title backdrop** (`title`, `pg-default`)
- `levels/playground.ts`: stop placing props in a `(i%5, i/5)` grid; use clusters with yaw jitter, stacks and pallets. Add 2–3 trainee blobs.
- `decor.ts playground()`: add a practice outlet wall, a tape "START" mark, a supply cage, and the warm morning shafts the brief asked for.

**P1.5 Title screen** (`title`, `phone-title`)
- `main.ts` loads `nextUnfinished()` and `game-ui.ts` shows it in survey, so first-time players get the empty Playground.
- Add a title camera pose in `updateCamera`: distance about 6, pitch .35, framing Pip and the reel beside the logo, not under it, with sparks every 2 s from the plug. That is the brief's "big Pip holding a sparking plug".

**P1.6 Stale job thumbnails** (`jobs`)
- `public/ui/thumb-*.jpg` predate the look port. The Playground card shows beige pillars and grey floor, not the hazard stripes and warm concrete.
- Regenerate them with a shot script after every decor change, or render them live from the scene at load.

**P1.7 World cues** (UI.md → game)
- `Game.render()` reticle: a `depthTest:false` torus that draws through Pip's body and reads as a waist-high hula-hoop (`mt-zoomin`, `mt-zoomin-orbit`). Replace it with floor-level corner brackets.
- The 35 s idle hint is a 1 px `LineDashedMaterial` you can barely see (`mt-idle-hint`). Use cyan dot sprites of about .12 m, flowing.
- Still missing: the throw arc with landing ring, and the phone off-screen pointer.

**P1.8 VFX kit** (`render/particles.ts`)
- Add stepped-alpha smoke puffs, impact stars, a crash hit-flash (instance colour pulse in `updateBatches`), and oven and coffee steam (currently grey ico "dust").

**P1.9 Lunch Rush polish** (`ln-default`, `ln-survey`)
- The vending machine shows its blank back: `decor.ts lunch()` puts the window on `z 8.88`, facing away from the camera. Rotate it or move it to the back wall.
- Bench blobs face away (`lunch.ts` yaw 3 and 3.4). Use about 0.2 so we see faces, as in `lunch-overview.jpg`.
- The storeroom darkness is still an 84% plane at y 2.72. It reads as a lid, and window shafts cut through it. Lower it to wainscot height or tint the room's lights blue-violet.
- There is no in-world fail beat before the card (`ln-fail`). Add a fridge alarm "!" and a steam puff, and hold for 1 s.

**P2** Visible desk idle for blobs (typing is .012 m), Pip hat spring, layered SFX.

## 3. Bugs and glitches

1. **Floating reel (all levels):** `Game` constructor `anchor.position.set(x,.6,z)`, but the reel prefab is .7 tall, so it hovers 0.25 m with no contact shadow (`mt-zoomin`). Use y = .35.
2. **Interpenetration (Meeting):** the plant prop at (-9,-8) sits inside the decor box stack at (-9.2,-7.9) (`decor.ts meeting()` "Floor clutter"), next to the reel (`mt-zoomin-orbit`).
3. **Playground clipping:** in the win shot the cable runs through Pip's legs (`pg-win-pushin`).
4. **Tuning question:** in Big Meeting the "drag the aisle, then sprint" route stalls at x≈9.8 with strain 1.05. The snap zone is about 24 m from the reel along the aisle, but the max length is 23.2. It only succeeds via the mail-cart extension. If the sprint route is meant to work, raise `length` or the snap radius.
5. **Covered in section 2:**
   - phone framing (P0.2)
   - push-in occlusion (P0.1)
   - red cable after release and the hand kink (P0.3)
   - the reticle drawn through Pip (P1.7)
   - Pip hidden under the title's logo tape (P1.5)
   - the vending machine and bench blobs facing away (P1.9)

No console errors or page errors in any run.
