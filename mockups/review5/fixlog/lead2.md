# Lead, round 3 (2026-11-05): merges, game.ts shared changes, remaining P1s

## Merges
- `review5/models-wip` → f0653b0. Conflicts in `game.ts` combined:
  - glass panes stay fixed while using per-prop collider shapes;
  - coworkers keep the juice reactions (crash look, Pip notice, cheer) plus chairs, capsules and the 3-bang cap;
  - the layout audit skips every prop collider and coworker capsule.
  - Checked the new Pip from 4 angles and in the haul and carry shots; it looks right.
- `review5/colour-wip` → 7c668fb. Kept the pin and stool prefabs and the monitor back housing. The spare-parts corner's second carton moved 12 cm out; it caused the layout failures in garage and playground.

## Fixes
| ID | Change | Files | Checked |
|---|---|---|---|
| R5-130 (P1, rest) | Standing coworkers are cable obstacles (0.9 m boxes near the route), so the cable bends round them. A taut cable (strain > .3) rubbing within 0.6 m makes them jump with a "!" (throttled to 0.7 s). Seated coworkers are left out, so desk pods don't turn into mazes. Cartons stay sweepable rather than wrapping: making them wrap stopped the playground cable lying across the box row it slingshots (routes spec). | `src/game.ts` simulateCable | routes, objectives |
| R5-085 (P1) | A job item thrown in a station room is offered to the bench once it comes to rest (speed < .6 m/s, 0.25 s or more after the throw), exactly like a put-down. If it's accepted: confetti, a cheer and the milestone sting, and the landing's breakage (if any) is refunded. | `src/game.ts` (`thrownItem`, `landThrow`) | `tools/fix-r2/throw.mjs`: Rush tray `trayReady true`, damage 0; QFN crate `partsReady true`, damage 0; [shot](../shots-full/fix-r2-throw-arcade-rush.png) |
| R5-035 (P1) | Rush stories are symptoms only ("The fuse keeps cutting out.", "The fuse clicks the moment it's switched on.", "Stays dark, even with fresh blocks.", "Glaring…"). Every rush cabinet starts at tier 0, so none passes as found, and a dim cabinet only appears when the LED is too dim to see. A backwards cabinet starts with a near-miss chain (one block at its neighbour value), so flipping alone doesn't finish it. | `src/stations/arcade/logic.ts`, `logic.test.ts` | unit tests: tier 0 at start, flip-only isn't elegant, stories never name the cause |
| Held props vs Pip | While a prop is carried it's in its own collision group, which skips Pip's capsule. Turning round with the robot or a cart swings it past him instead of leaving it stuck behind. This fixed the Garage stand drop in `station-garage.spec` (robot ended 2.9 m from the stand) and the Lunch cooler-box walk. | `src/game.ts` (`held` getter/setter, `PIP_GROUPS`/`HELD_GROUPS`) | `tools/fix-r2/garage.mjs`: onStand true |
| R5-307 | Tried raising the floor collider to y 0, then reverted: it broke the Lunch cart reset (`lunch-rules.spec` "insulated cable…"). Still open. | - | - |
| R5-360 | The anchor reel stands side-on to the default camera on an A-frame with a base, crank and guide ring; the axle is at .44. | `src/game.ts` | smoke, layout |
| R5-175 | The grab reticle hides while a hub prompt (a door, the Workshop) is up. | `src/game.ts` | lobby spec |
| R5-284/361 | A plugged-in cable is teal (live) or grey-teal (dead), never a strain-ramp colour; the hose radius is .075 (was .1). | `src/game.ts` | smoke |
| Lobby | The greeter coworker moved from (−1.4, .6), in the lane to every door, to just behind the spawn. Coworkers have been solid since the models merge, so the lobby spec walk got stuck on her. | `src/levels/lobby.ts` | lobby spec |

## Already covered (no change needed)
- R5-032: the idle hint is already static chevrons.
- R5-017 (heavy-carry upright reset): the carry branch already eases the held prop to an upright, Y-only rotation.

## Not done
- R5-164 (cable pull spring and Meeting reel length): it's a P2 and a tuning risk. The 'single reel' spec margin is thin (2.27 m measured against a 2.3 m limit on one run).
- Lunch cable feel, `furnitureNear`, drum spin and seated Lunch NPCs (R5-086/145/146/302): these wait for the lunch2 merge, because they touch `lunch-runtime.ts`.

## Round 3, later
| ID | Change | Files | Checked |
|---|---|---|---|
| R5-033 (P1) | Story cabinets need different chains: the handheld's band is 3–9 mA, so it needs three 470s (battery about 101 h) instead of repeating the claw's pair. Rush never deals a cabinet whose best chain equals the previous cabinet's. | `src/stations/arcade/logic.ts`, `station.ts`, `logic.test.ts`, `tests/station-arcade.spec.ts` | unit tests (distinct answers, no back-to-back repeats); station-arcade spec |
| R5-130 follow-up | Only solid coworkers (the ones with a capsule) bend the cable. A coworker knocked off a chair used to become a cable obstacle by the Meeting route and stole the single reel's sprint reach. | `src/game.ts` | routes spec "single reel" |
| R5-069 (Lunch part) | Already in place: the fridge only starts warming when the kitchen door first opens. The rest of the entry, the job order and concept curve, is a product-owner question (below). | - | code read |

Merged: `lunch3` (bots snag a cable only where their path crosses it; seated Lunch coworkers, R5-302), `perf` (draw calls down 28–45%), and `astra/work` stages 1–3.

## Questions for the product owner
- R5-069: should the job order change so the concept curve doesn't spike at Lunch (job 02)? The review suggests moving Lunch later and reusing ideas between jobs. Nothing has been reordered yet.
- Grade pars (time, damage and cost limits) haven't been measured from real play. Both Astra and the lead kept the current limits.
| R5-257 (lead part) | One strain ramp, `STRAIN_RAMP`/`STRAIN_WARN`/`STRAIN_HOT` in `sim/cable.ts`: the hose and `strainColor` both use it, and the whole hose shows the strain (`.85+.15u`). The HUD bar and hum are Astra's files (see FIXED.md). | `src/sim/cable.ts`, `src/render/actors.ts`, `src/game.ts` | unit tests |
| R5-321 | A held plug pressed into furniture is pulled back toward Pip until it's outside every box, so the prop stays in the cable route and the cable bends round it. Footprints include the height axis. | `src/game.ts` | routes, smoke, objectives specs |
| R5-166 | New `tests/respawn.spec.ts`: the strip stranded in the sealed closet goes home, and a job item knocked out of the room comes straight back. | `tests/respawn.spec.ts` | 2 passed |
| R5-170 | Grab preference: the item under the job card's marker wins by 2.5 m, other job items by 1.5 m (still ahead of clutter), and bonus pins get no head start. | `src/game.ts` reach() | routes (coffee corner), station and lunch specs |
| R5-220 | The Rush shift clock starts when the tray reaches the bench (or after 20 s if the tray is never fetched), so the fetch no longer eats the shift. The time limit is RUSH_TIME+30. | `src/stations/arcade/station.ts`, `tests/astra-grading.spec.ts` | station-arcade-rush, astra-grading, station-cable specs |

Merged: `stationcable` (R5-079, a bench mains lead in every station plus a physical chaos bonus; `fixlog/stationcable.md`). The action bar keeps F in station rooms that have a lead.
| R5-264 | Lenses are now distinct framings: Close is ~15% tighter and Wide shows ~25% more room than Standard. Standard and the bench views are unchanged. | `src/render/lens.ts` | type check; the default lens is untouched, so specs are unaffected |
| R5-224 | Slingshot kicks (release and recoil) are capped at mass×14, so light litter leaves at ~14 m/s, not 50+. The direction is unchanged; Lunch's whip direction is in lunch-runtime. | `src/game.ts` | routes "slingshot" specs |
| R5-326 | `respawn(prop)`: a puff where the item was (clamped inside the room) and at home, plus a pop and a rising tone for job items. Used for stranded items and for falls out of the room. | `src/game.ts` | respawn spec |
| R5-161 | Covered by R5-004: at a bench every key the station doesn't use is swallowed (Space, Tab, F and R do nothing). The C-key orbit reset is in GameUI (Astra's). | - | R5-004 checks |
