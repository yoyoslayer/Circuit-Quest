# Design review 4: movement, space and readability

2026-09-29. Reviewed the running game after the player reported sliding, floating
NPCs, intersections, poor camera visibility, short walls, repetitive rooms and
too much text. The game has working puzzles, but successful scripted solutions
were not enough evidence that its presentation was ready. This review treats
spatial clarity and believable movement as core gameplay requirements.

## Method and limits

Captured all 15 routes at 1440×900 in the default play view, Tab survey view and
closest mouse-wheel view, both before and after the fixes. The capture script
advances eight simulated seconds before inspecting furniture, then another four
seconds to check its resting state. The manual driver exposes real physics body
velocities, actual meshes attached to the rig, chair support and camera position.
Screenshots use the normal visual effects; browser route tests use the cheaper
software renderer. This is a code and visual review, not a blind human playtest.

Reproduce with Vite running on 4174:

```powershell
node tools/design-review.mjs after
# One room: node tools/design-review.mjs after meeting
```

Full captures and diagnostics are in the ignored `artifacts/design-review/`
folder. Selected comparison shots and a complete room survey are checked in.

## Findings and fixes

| Priority | Finding and cause | Current result |
|---|---|---|
| P0 | Pip slid because the rig searched only direct children of the glTF scene. The actual meshes live inside its `Pip` group. Legs and arms were empty joints; pose-number tests could pass while the character remained rigid. | Fixed: collect nested mesh parts before building the rig. Tests now check boot meshes, not only angles. |
| P0 | Furniture collision did not match its appearance. Desks, chairs and monitors were full cuboids, including visibly empty space. Small items and chair legs could catch on invisible surfaces. | Fixed for these three prefabs with compound colliders matching the tabletop, legs, drawer, seat, back and monitor stand. A physics test proves a desk supports an object above while leaving the space below empty. Other prefabs still need individual audits. |
| P1 | Coworkers were positioned at a constant seated height. Removing the chair left its occupant suspended; cheering added more vertical displacement. | Fixed: track each chair's actual height. The coworker stands if the chair is carried, displaced or tipped. Removed hovering celebration/typing motion and continuous idle turning. Added visible feet to standing blobs. |
| P1 | Office pod chairs faced outward. Their backrests pointed toward the work surface. | Fixed: flipped the pod chairs, plus the two Fabrication Bay desk chairs. Archive reading chairs and boardroom seating already face their tables. Loose chairs elsewhere remain deliberate movable clutter. |
| P1 | The camera started far away and partially focused on the room centre, making Pip and nearby interactions small. | Fixed: play view follows Pip fully and starts closer. Tab still surveys the room, with right-drag orbit and wheel zoom retained. Foreground furniture can still obscure Pip at extreme angles; a better obstruction response remains open. |
| P1 | Front/right walls were only 0.32 m lips; interior walls were often 1.35 m visually while their collision extended to 2.6 m. The office floated over a gradient. | Fixed: full 3.6 m walls on all four sides, camera-facing upper sections cut away; default interior walls are 2.8 m with matching collision height. Added pavement, roads, distant buildings and park/utility-yard dressing. Explicit low partitions remain low. |
| P1 | HUD repeated the goal, future steps, bonuses, prompt and station instructions at once. | Fixed: one current step and a compact goal by default, with a Job details button for the full list and bonuses. Station order panels wait until bench mode. Long bench explanations still need station-specific reductions. |
| P1 | A portable lamp and bin spawned at the same point in Lunch Rush. | Fixed: separated their authored positions. This is a confirmed placement error, not an exhaustive intersection audit. |
| P2 | Room props and floors vary, but most station wings share a 22×16 rectangle, centre bench, rear feature and scattered front-room clutter. | Partly improved: shell palettes distinguish the library, labs, workshop and kitchen; exterior dressing distinguishes park and utility wings. Architectural layouts are still repetitive. Color changes alone do not complete this item. |
| P2 | Idle objects appeared to rotate or jitter. | Eight- and twelve-second diagnostics found zero linear/angular prop velocity in the sampled resting rooms. NPC idle turning was real and is removed. Furniture shapes and out-of-bounds rotation resets are improved. Continuous spin after specific collisions is not ruled out by this sample. |

Before/after default views:

| Room | Before | After |
|---|---|---|
| Big Meeting | [Camera and long card](screenshots/review4/meeting-before.jpg) | [Closer follow and compact card](screenshots/review4/meeting-after.jpg) |
| Fabrication Bay | [Duplicated panels](screenshots/review4/qfn-before.jpg) | [Task panel waits for the bench](screenshots/review4/qfn-after.jpg) |
| HQ | [Large job list](screenshots/review4/lobby-before.jpg) | [Compact goal](screenshots/review4/lobby-after.jpg) |

## Room-by-room art and layout review

These are the remaining design decisions, not claims that the rooms have already
been rebuilt. Prioritize navigable space and silhouettes over adding more clutter.

| Room / evidence | Assessment and next change |
|---|---|
| [HQ](screenshots/review4/lobby.jpg) | Door colors help, but there is too much signage and the reception board competes with the doors. Organize wings into distinct alcoves and leave the central arrival route clear. |
| [Playground](screenshots/review4/playground.jpg) | Pillars support cable play. Random office chairs dilute the training-yard identity; replace some with cable racks and keep the route legible. |
| [Big Meeting](screenshots/review4/meeting.jpg) | Strongest actual zoning: server room, pods, glass boardroom and lounge. Desk pods are repetitive; vary two islands and separate clutter from aisle edges. |
| [Lunch Rush](screenshots/review4/lunch.jpg) | Kitchen/storage/lift zoning is meaningful. The dolly, cables and doorway compete in a narrow transition. Author a proper parking area for the heavy reel and review every carried-object route. |
| [Via Counter](screenshots/review4/vias.jpg) | The counter and queue provide identity. Front-room random chairs and rugs feel inherited; turn the stock area into a compact shipping aisle. |
| [Via Rush](screenshots/review4/vias-rush.jpg) | Reusing the same counter is appropriate for this mode. Show queue pressure through characters and machine activity, with less dependence on the clock and text. |
| [Fabrication Bay](screenshots/review4/qfn.jpg) | Back machines have useful silhouettes. The foreground is another generic lounge. Introduce inspection lanes and a side stockroom, keeping the crate-to-bench path open. |
| [Archive](screenshots/review4/archive.jpg) | Bookshelves, lamps and warm wood are distinctive. Turn shelves into walkable stack aisles with a clear service desk; preserve the working phone terminal. |
| [Waterworks](screenshots/review4/waterworks.jpg) | Pipe/network apparatus is distinctive but visually dense. Use a service trench or maintenance bay and separate the measurement work area from background machinery. |
| [Observatory](screenshots/review4/observatory.jpg) | The dome is a strong landmark. Remove the generic lounge arrangement and use a raised observation zone with a safe route around the dome. |
| [Arcade](screenshots/review4/arcade.jpg) | Cabinet rows and color communicate the setting. Arrange play aisles around a service nook rather than a repair bench floating in the middle. |
| [Garage](screenshots/review4/garage.jpg) | Robots and charging bays work. Tire stacks and the rolling door should anchor an actual service aisle; reduce isolated chairs in the work area. |
| [Clockwork](screenshots/review4/clockwork.jpg) | Kitchen surfaces and breakfast counter read well. The centre bench still breaks the kitchen workflow. Move repair operations beside a prep island, preserving tool visibility. |
| [Depot](screenshots/review4/depot.jpg) | Loading trucks and brick are good landmarks. Connect shelving, staging and dispatch into a directional floor plan. Remove decorative paths that suggest unavailable exits. |
| [Spectrum](screenshots/review4/spectrum.jpg) | Existing material test rooms offer more spatial variety than most stations. Fix the beam/floor marks showing through the bench view and review glass depth/collision consistency. |

## Next acceptance gates

1. **Remaining intersections:** audit every prefab's rendered bounds and collision,
   static dressing against movable props, shelf stock, cables through furniture,
   glass and alpha surfaces. Standing NPCs still have no collision bodies; Pip
   can pass through them. Give them forgiving avoidance or movable collision,
   then rerun all job routes. Do not label all phasing fixed yet.
2. **Camera:** orbit while carrying bulky objects, at doorways and behind shelf
   rows. Pip, the held item and the next interaction must stay visible. Wall
   cutaways should read as intentional architectural sections, not disappearing
   geometry. Review the new exterior from rotated views as well as survey shots.
3. **Movement:** the rig now moves real parts, but the straight-leg cycle is still
   stylized and has no foot planting or knees. Review a recorded walk/run/carry/
   blocked/jump sequence; add grounded foot placement if it still skates visually.
4. **Architecture:** rebuild one station as the standard before changing all ten.
   Archive aisles and Garage service bays are good candidates. Use distinct paths,
   ceiling/lighting treatment and major silhouettes; keep interaction areas clear.
5. **Text:** retain short goals and control prompts. Replace repeated instructional
   prose with visible machine states; put explanations behind an optional details
   affordance. Check phone and bench layouts after each station change.
6. **Performance:** the full-effect room capture still reports roughly 534–1,221
   draw calls. Batch room dressing and measure frame time on actual laptop hardware.
   A screenshot and sleeping props do not demonstrate smooth real-time gameplay.

## Verification

- Production build and 144 unit tests pass.
- New browser checks verify real boot movement, idle furniture stability, four
  full-height walls, a chair removal recovery and the expandable job card.
- All 15 rooms captured before and after, without page errors.
- A broad physics-settings change initially jammed the Lunch Rush dolly. Restored
  its original physics settings; the complete intended Lunch Rush route passes.
- The 52-check browser run passed 50 checks initially. Two focused corrections
  were required: sample the walking cycle's peak rather than an arbitrary neutral
  frame, and route the mail-cart cable through the aisle instead of a desk pod.
  Both corrected checks passed in the final focused rerun: all 52 checks are
  verified across the full run and rerun. Cable length and completion requirements
  were unchanged.

The review is complete; the larger collision, architecture, camera and animation
backlog above remains explicit. Automated completion should not be reported as
finished visual polish.
