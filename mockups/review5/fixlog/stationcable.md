# Fix log: stationcable (R5-079: a cable act and a physical bonus in every station room)

Branch `worktree-agent-afa15e38577f6ab6b`, reset to `claude/nifty-knuth-519jg0` @ b5000a3. Ports 4204 (Playwright) and 4214 (vite).
Scripts: `mockups/review5/tools/fix-stationcable/` (`plug.mjs` start/carry/survey shots per station, `chaos.mjs` the chaos
bonuses with real walking, `tune.mjs` throw-distance tuning, `explore.mjs` fixed-collider dump, `restart-vite.ps1`).
Shots: `mockups/review5/shots-full/fix-stationcable-*` (not committed).

## What was built

**The flag.** `Level.stationCable?:{anchor,length,target,route,plug?}` (`src/levels/types.ts`). A station level that sets it
plays the existing rope: the game takes the lead's anchor/target/length as the level's, and `Game.cabled`
(`!hub && (!station || stationCable)`) replaces the `station||hub` / `!station&&!hub` gates for the reel, plug, socket,
ring, cable sim, cable drawing, slingshot recoil, plug pick-up and reticle (`src/game.ts`). Stations without the flag
are unchanged (none are left today; the lobby never has one). `route` is the clean walk from the loose plug to the
socket; each level also uses it as a clutter lane (r .8, so clutter still lies near enough to slingshot).

**Truthful bench power.** The bench is a load on the lead: in a cabled station `stepLead()` closes the circuit's lead
only while the plug is seated and ticks it, so the existing current pulses run along the seated (teal) cable only when
the bench is drawing. `Game.benchLive()` is the hook stations read; `Game.benchDead()` is what a station calls before it
powers or tests: when unplugged it buzzes, sparks the reel, blinks the reel's new pilot lamp fast and pulses a ring on
the loose plug, and returns true (the station refuses, with a one-line toast, and counts no mistake). The reel's pilot
is a slow red blink while dead and steady green once live. Pulling the plug out of the wall (E/F at the socket) just
drops power: the arcade's lever clacks off (no mistake), everything else simply refuses its next test.
`Game.leadStep()` gives each station a job-card step ("Plug the bench's lead into the wall socket"), and
`Game.leadPrompt()` the walking pill ("F Pick up the bench's plug"; held plug → the existing Plug in / slingshot pills).
The cable also wraps the room's own fixed fixtures now (`fixedBoxes()` reads the station's solid colliders once, after
the room is built; the sim adds those near the cable or holding a bend), so it never passes through a bench or cabinet.

| Room | Lead (reel → socket, length) | What the cable goes round | Gated act | Physical/chaos bonus (replaced) |
|---|---|---|---|---|
| Arcade + Rush | bench right end (2.6, −1.5) → back-wall socket under the bolt sign (−2.2, −7.6), 10.5 m | the bench's back corner, then behind the bench past the prize pyramid | `power` (and a pulled plug powers the cabinet off) | **Knock the prize pyramid over**: ten real (asleep) gift-box bodies stacked 4-3-2-1 on the floor in front of the prize shelf (`arcade/room.ts`); 3+ knocked off their spot. Replaced "Every cabinet reliable" (implied by the ★ bonus). Rush replaced "Fuse tripped no more than once". A beanbag now waits behind the bench as ammo (a lob arcs high, so a throw from ~6 m or a barge is what works). |
| Garage | bench left end (−2.75, −1.3) → left-wall socket past the tyre stack (−10.55, 5.75), 12.5 m (bolt sign moved there) | across the robot's painted route, bending round the tyre stack | `pulse`/`test` | **Bowl the parcel stack off the robot's route**: a 2+1 parcel stack on the route by the lead's line (`levels/garage.ts` `parcelStack`); 2 of 3 boxes off their spot before the robot drives (the robot's own drive doesn't count). Replaced "Every fix reliable". |
| QFN | bench right end (2.6, −0.6) → back-wall socket under the bolt sign behind the inspection box (9.3, −7.6), 12 m | the low drawer unit and the AOI's corner | `ship` (the bring-up test powers the board; CHECK is a layout rule check and needs no power) | **Toss the parts crate onto the bench**: delivered by a throw that came to rest ≥ 3 m from where Pip let go. Replaced "Every board works reliably". |
| Observatory | bench right end (2.75, −1.2) → back-wall socket left of the gallery (−1.4, −7.6), 10.5 m | the bench's back corner, behind the bench | `log` | **Roll the motor cart into the far wall**: the un-held cart against an outer wall at least 9 m from the receiver. Replaced "Every decode reliable". |
| Spectrum | behind the dispatch desk (−2.6, 1.35) → left-wall socket by the storeroom walk (−10.6, 0.6), 11 m | behind the desk, bending round the green cart | `send` (after the pod check, so "pod not on the pad" still wins) | **Knock the smoking toaster down**: the toaster is now a real (asleep) body on the tea counter (`spectrum/room.ts`); once it is off the counter `SMOKE.r` is set to 0, so smoke stops being a loss on every later send (and on the map), and the puffs fade out. Replaced "Every delivery reliable". |

Every lead has to be dragged round something (bench corner, AOI, tyre stack, cart) and runs at 0.7–0.85 strain on the
clean route (white→yellow), so a sloppy route goes orange/red and overstretching it slingshots the clutter beside it.

## Verification

| Check | How |
|---|---|
| Cable visible, dead at start, rope 8–14 m, every station | `tests/station-cable.spec.ts` "every bench has a drawn mains lead and starts dead" (6 levels); start + survey shots per station |
| Plug in, then a sign-off, per station | `station-cable.spec.ts` (arcade pinball signed off, garage job 1 logged, QFN SHIP refused dead then reaching its test live, observatory decode 1 logged, spectrum delivery 1) and every `station-*` spec now plugs in first (`tests/station-lead.ts` `plugBench`) and still reaches `won` (QFN's three boards included) |
| Dead bench refuses with no mistake | arcade (power), garage (pulse), QFN (ship), spectrum (send) in specs; observatory log by the same code path |
| A yank drops power, no mistake | arcade spec: power on, walk to the wall, pick the plug up → `powered` false, mistakes 0, re-seat |
| Slingshot moves a prop > 1 m in a station room | arcade spec: sprint past the lead's length, Q → a prop moves > 1 m and a `slingshot` beat |
| Each chaos bonus earned by play | arcade barge into the pyramid; garage barge through the parcels; QFN crate lobbed from 4 m; observatory cart shoved into the front wall; spectrum cone lobbed at the toaster from 2 m (smoke radius 0) |
| Nothing earned at rest | `tools/fix-stationcable/idle.mjs` (found and fixed: the pyramid settles a few cm into itself, so the knock-off margins are 0.3 m drop / 0.35 m slide) |

## Test results
- `npm.cmd test`: 134/134. `npm.cmd run build`: OK.
- Station specs (`station-arcade`, `-arcade-rush`, `-garage`, `-qfn`, `-observatory`, `-spectrum`): 14/14 pass, each plugging the bench in first.
- New `station-cable.spec.ts`: 7/7 (the QFN test was reworked after one failure; rerun passes).
- `smoke` 5/5, `layout` all pass (the arcade/arcade-rush beanbag overlap with the claw box was found and fixed), `routes`:
  all pass except `meeting single reel only reaches when overstretched at a sprint`, which **fails identically on the
  untouched base commit b5000a3** (checked by running it there): pre-existing, not from this change.

## Skipped / not done
- Observatory: the noisy motor cable as the dragged cable (replacing the ROUTE lever with a physical reroute) is not
  simple: the job logic reads `rerouted` from the lever and the receiver line is drawn as two fixed tubes. I built the
  mains lead there too, as the brief allowed.
- Removing the "Sit at the bench (E)" steps, varying the room beat between sub-jobs, the pod lob and pod-damage/cost
  changes (other R5-079 sub-fixes): out of scope for this pass.

## Needs shared change
- `src/ui/game-ui.ts` `updateActions()`: the F (cable) button's `ready` state is still forced off in every station
  (`else if(g.station||g.hub)cableReady=false;`). Change it to `else if(g.hub||(g.station&&!g.level.stationCable))cableReady=false;`
  so F lights up by the bench's plug and at the socket, like on the job floors.
- `src/ui/objectives.ts` `promptFor()`: nothing needed (stations hand the plug prompts through `game.leadPrompt()`).
- `docs/PROGRESS.md`: add a line under the station rooms: "Each station's bench has a mains lead: drag it from the reel
  by the bench to the wall socket before the bench can power or test; each room has one chaos bonus."

## Open questions for the product owner
1. The lead is plugged in once per run; nothing pulls it out except Pip. Should a coworker (the arcade kid, a mechanic)
   ever trip over it and unplug it mid-job, as a recurring room beat?
2. The chaos bonuses replaced each station's "Every X reliable" bonus (it is implied by the "Elegant" bonus). Rush lost
   "Fuse tripped no more than once" instead. OK?
3. Spectrum: knocking the toaster off removes the smoke for the rest of the run, which makes delivery 3 easier (visible
   or near IR can then work). That is the truthful consequence; is the easier delivery acceptable as the chaos reward?
