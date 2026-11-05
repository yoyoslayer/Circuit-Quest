# Review 5 fix log: Big Meeting (batch R-meeting)

Branch based on `claude/nifty-knuth-519jg0` (reset to the tip before any work).
Shots: `mockups/review5/shots-full/fix-meeting-*.png` (local only). Scripts in `mockups/review5/tools/fix-meeting/`: `look.mjs` (parts `strip`, `projector`, `reticle`, `corner`, `tower`), `proj.mjs` (projector states), `reach.mjs` (R5-164 walk vs sprint reach, `LEN=` override), `tower.mjs` and `ret.mjs` (debug dumps).

Note: `tools/entry.mjs` prints "not found" for every ID on Windows, because REVIEW.md has CRLF line endings and the script searches for `\n### ID\n`. Stripping `\r` after reading fixes it (I used a scratch copy).

## Fixed

| ID | P | What changed | Files | Verified |
|---|---|---|---|---|
| R5-012 | P1 | No code change needed: the R5-003 see-through oval and the R5-005 signed-distance cutaway already cover the closet corner. | — | `look.mjs corner`: 8 yaws × default and low pitch at (−11.3, −7.4), zoom 9. Pip is visible in all 16 frames, and the centre 400×400 luma std is 42.9–56.1 (the failing frame was 1.3). Contact sheet `fix-meeting-corner-contact.png`. |
| R5-030 | P1 | The strip is the hub. The generic socket box is hidden in Meeting and Lunch (`game.ts`). The seated plug sits in the strip's inlet end (`Game.seatAt()` → `MeetingStrip.seatAt()`), and so does the ghost plug. The cyan ring hides once the cable is in. The urn, heater and projector cords are drawn from the strip's live transform to plug heads in outlets 2, 3 and 0. Unplugged, a cord lies coiled with its head on the floor. The old decor projector lead is removed. The reset cap and the new flag sit on the strip's own red switch. | game.ts, meeting-strip.ts, decor.ts | Shot 02: three plug heads in the strip, the reel plug in its end, no black box, no ring. Shot 06: urn cord coiled, its outlet empty. Specs pass. |
| R5-039 | P1 | The trip shows its cause: a spark burst, then a smoke column at 0.6, 1.0 and 1.4 m (above Pip's silhouette). A tall red flag pops up on the strip, the board lamp turns red, and a one-sentence toast (4 s) names the cause: "The strip cut out: everything plugged into it added up past its limit." A repeat trip with nothing unplugged double-buzzes and says "Still too much on the strip." The reset now needs Pip within 0.8 m of the strip and nearer it than the projector switch, so E at the switch is never a silent reset. Nothing lights on the unpowered loads (verifier). The card and marker part needs `objectives.ts` (see "Needs shared change"). | meeting-strip.ts | New spec: at the switch after the trip, the pill doesn't offer Reset; reset at the strip re-trips after the dwell (trips 2), and the toast says "Still too much". Shot 05: toast, TRIPPED board, flag. |
| R5-040 | P1 | Cable pulses run on supply current (`draw>0 && !tripped`), not on the projector's state. In Meeting a plugged but dead cable is dull gold (#b9ad86). Each appliance cord and the projector lead has its own small pulses while its load runs (strip → load). | game.ts drawCable, meeting-strip.ts | Spec: after plug-in, `strip.pulses` is true with draw 4.5 (projector off); tripped, it is false. Shots 02, 04 (cyan on cords), 05 (dull cable, no pulses). |
| R5-041 | P1 | Opt-in thermal breaker, local to the strip (verifier). `src/sim/thermal.ts` has `heat += (I/limit)²−1` per second and trips at 0.5, which is about 2.4 s at 1.1×. It cools under the limit. The magnetic instant trip stays in the Circuit at 3×limit (the strip sets `limit=15`). `MeetingStrip.step(dt)` heats on the last tick's draw and trips the source. While over the limit but not yet tripped, the strip hums (rising tone), the board flashes past the line and the loads flicker. A projector on an overloaded strip doesn't win: the win in `game.ts` is gated on `!strip.overloaded`. DR-36 comment in thermal.ts. electrical.ts is untouched, so Lunch keeps its instant cut-outs. | sim/thermal.ts (new), sim/thermal.test.ts (new), meeting-strip.ts, game.ts | Unit tests: 5.5 A not tripped at 1 s and tripped by 3 s; never trips at or under the limit; cools down. Spec: 0.3 s after the switch `overloaded` is true and `tripped` false; at 3 s it is tripped. Shot 04: board reads 5.5 A past the line. |
| R5-042 | P1 | The load board (below) reads the live current: 0.0 A while tripped, with a red TRIPPED tag and lamp. The demand of everything plugged in and switched on stays drawn as hatched ghost segments, so unplugging shrinks it visibly. The shared `Gauge` is not used any more, so kit.ts is unchanged. | meeting-strip.ts | Spec: tripped → draw 0, demand 5.5; after unplugging the urn → demand 3. Crop `fix-meeting-06-urn-unplugged-tripped-crop.png`: 0.0 A, TRIPPED, ghost bar well left of the 5 A line. |
| R5-062 | P1 | The arc gauge is replaced by a load board: the live amps as a number, a stacked bar with one segment per plugged load (length ∝ draw, with an icon: urn, heater, projector) against a thick ink 5 A line with a "5 A" plaque, and a pale-red zone past it. Rating plates on the urn (2.5 A), heater (2 A) and projector (1 A). Comment at the top of meeting-strip.ts rewritten. Not done: item 3 (phone charger 0.2 A, projector 1.2 A). | meeting-strip.ts | Crops `fix-meeting-04-dwell-crop.png` (three segments, projector past the line, 5.5 A) and the -06 crop. |
| R5-098 | P1 (partial) | A chaos target: a tower of five supply cartons at the aisle end, (8, −2.35), right beside the cable's route to the boardroom. `MeetingStrip.towerDown()` is true when the top carton is off and 3 of 5 have moved or tipped; then confetti, a jingle and a flinch. Tower cartons don't count as damage (`game.ts` damage check). Not done: the bonus swap on the job card (objectives.ts), and the harder releasePlug snap (generic cable code). | levels/meeting.ts, meeting-strip.ts, game.ts | New spec "meeting slingshot topples the paper tower": walk the sprint route, sprint 2 s, Q → `towerDown` true. `tower.mjs`: cartons moved 0.3–0.96 m. |
| R5-122 | P1 | The `reticle.rotation.x=-π/2` line is removed, so the brackets lie flat. Each corner moves out to the marked prop's footprint (prefab size + 0.2 m), and the arms keep their size (scaling the whole ring stretched the arms into sticks on the 2.5 m glass panes). The pulse is a uniform scale. | game.ts | Shot 12: four flat corners hug the strip on the floor. `ret.mjs`: the reticle has no x rotation. |
| R5-142 | P1 | The board stands on its own floor stand beside the strip, at (13.2, −1.7), clear of the door gap's walking line. It has a round foot, a pole, an ink housing with a hood lip, a finished `#3a3d55` back plate, and a collider. It is built on `game.root`, so it can redraw, and it is 1.35× the old gauge. | meeting-strip.ts | Shots 02, 04, 05: the board sits on its stand with its outline on a solid. |
| R5-144 | P1 | No back-wall windows behind the boardroom (`x>9.3&&x<16.5` skipped). The screen is pulled forward to z −9.70 in a white frame, with a pull bar and a roller case. The clock is radius 0.30 (face 0.27, ticks at 0.2). The slide colour is 1.0 (was 1.25), the 4 m glow is replaced by a small one at the projector lens, and the beam opacity is 0.07. | decor.ts | Shot 07 (win push-in): the slide, red trend line and bars are clean, with no window bars over them. |
| R5-164 | P2 | Not fixed (see Skipped). Measured with `reach.mjs`: walking stops 2.23 m from the target (the snap needs < 2.2), and a sprint gets to 1.92. At 22.4 m the walk stops at 3.01 m, but the sprint only reaches 2.69 and can't seat. | — | — |
| R5-179 | P2 | The nearest appliance within 1.25 m wins (was the first within 1.3 m). | meeting-strip.ts | Spec: at (15.2, −1.15) the pill says heater; at (13.9, −1.15) it says urn. |
| R5-201 | P2 | Borrowing the coffee reel disconnects the server cable first (`connected=false`, lead open). | game.ts | New spec: plugged (draw 4.5) → borrow → `strip.draw` is 0. |
| R5-202 | P2 | The kettle is now a tea urn (it sits on its thermostat all day, so a steady 2.5 A is truthful). It has a steel body, lid, knob, side handles, tap, water window, base plate and a red "on" lamp. The white halo sprites are gone (urn and heater). Steam puffs stay. | meeting-strip.ts | Crops of shots 04 and 06: the urn reads as an urn, with no fog ball. |
| R5-203 | P2 | DR-36 comment in meeting.ts that frames the route as site reels + rated inline coupler + strip with a breaker. Doc updated. The coupler rating plate (prefabs.ts) is not done. | levels/meeting.ts, docs | Code check. |
| R5-281 | P2 | The projector has a rocker that tilts with `switchedOn` and a status LED (off / amber = on with no power / green = running) on its back face, plus a "1 A" plate. With the thermal dwell, switching on with the plug already in hums for about 2 s first. | meeting-strip.ts | Shot 10: amber LED with the projector switched on before power (small at zoom 9). |
| R5-303 | P2 | Both decor carton stacks have a collider (`solid(.75,1.1,.75)`), and the plant moved from (8, 8.6) to (8.6, 8.2). | decor.ts, levels/meeting.ts | Layout spec for Meeting passes. |
| R5-329 | P2 (partial) | The closet extinguisher stands on the floor (y 0.25), with a neck, valve, lever, hose and label. The pillar extinguishers are in `pillar()` (decor.ts:58), outside my lines. | decor.ts | Shot 12: canister on the floor with its hose. |
| R5-355 | P2 | Appliances are built on `game.root` (not decorRoot), so the lamp and grille swaps work after `freeze()`. Urn model (see R5-202). Cords are a slack CatmullRom with a plug head; unplugged, they coil (torus) with the head beside them. | meeting-strip.ts | Shots 02 and 06. |
| R5-356 | P2 | Projector: a rounded body on four feet, a lens barrel with a metal ring and a glass disc, vents on both sides, a focus dial, plus the R5-281 rocker and LED. Screen in a frame with a case and pull bar. The generic socket box isn't shown in Meeting any more. | decor.ts, meeting-strip.ts | Shots 04, 10. |

Tests updated: `tests/routes.spec.ts`:
- `switchProjector` now waits through the dwell and asserts overloaded → tripped, draw 0 with demand 5.5, pulses off, the toast, demand 3 after the unplug, and the Reset pill. The reset spot is now (12.3, −1.45).
- New tests: the re-trip loop plus nearest-load prompts, coffee-reel disconnect, and slingshot topples the tower.
- The clean route now goes up x 6.6 instead of 7.8, to pass beside the tower.

## Skipped

- **R5-164** (P2): the sprint only adds about 0.3 m of reach over a walk. So shortening the reel (meeting.ts) breaks the sprint route, and the gap can only be widened by lowering the spring `k` in `Rope.pull` (src/sim/cable.ts), which is outside my files. The spec's `> 2.3` margin stays thin.
- **R5-204** (P2): the bonus swap and the result-card trip count are in objectives.ts and game-ui.ts (shared). The optional second boardroom socket is not built.
- **R5-237** (P2): the strip riding on the cable is a new interaction that needs objectives.ts step changes. Not done.
- **R5-280** (P2): NAMES lives in objectives.ts (shared).
- **R5-304** (P2): prefabs.ts (desk clutter).
- **R5-357** (P2): prefabs.ts (sofa, ping-pong, bookshelf, a new coffeetable kind).
- **R5-062 item 3**: phone charger plus a 1.2 A projector. Not done, so either unplug still fixes the overload.

## Needs shared change

1. **objectives.ts, JOBS.meeting step 3 (R5-123, R5-039a):** make the text and marker state-aware. `MeetingStrip.stripAt()` is now public.
   ```ts
   {text:'Get the projector running',done:g=>g.won,at:g=>g.strip?.tripped?g.strip.stripAt():g.level.switchAt},
   ```
   Optionally render a transient "The strip has cut out" line in the card's flash style while `g.strip?.tripped`.
2. **objectives.ts, JOBS.meeting bonuses (R5-098b, R5-204):**
   - Replace 'Break fewer than 5 things' with 'Topple the carton tower' (`ok:g=>!!g.strip?.towerDown()`) or 'Don't trip the strip' (`ok:g=>(g.strip?.trips??0)===0`).
   - Keep 'Finish before 4:00' and 'Leave the coffee machine alone'.
   - tests/objectives.spec.ts still expects 3 stars.
3. **objectives.ts NAMES (R5-280):** add `vending:'vending machine',glass:'glass panel',coffee:'coffee machine',pingpong:'ping-pong table',supply:'supply',lamp:'lamp'`. Make the fallback `near.spec.kind`, not 'thing'. Add a unit test that every `PropKind` has a name.
4. **game-ui.ts won() (R5-204):** show 'Strip trips: N' (`g.strip?.trips`) on the Meeting result card.
5. **cable.ts (R5-164):** lower `k` in `Rope.pull` to about 3 (a walk-to-sprint gap of about 0.87 m), then shorten the Meeting reel to about 22.4 m in meeting.ts and retune the slingshot energy (over²·60). Then make the spec assert ≥ 3 m.
6. **decor.ts `pillar()` (R5-329):** add a bracket, strap, hose and label to the pillar extinguishers (line 58).
7. **prefabs.ts (R5-203/R5-304/R5-357):** a rating plate on the coupler; the desk cable tail rerouted away from the pedestal; ping-pong lines and net, sofa cushions, book heights, a 'coffeetable' kind.
8. **game.ts idle hint dots (R5-040 part 3):** the 40 cyan dots still flow on an open circuit. Replace them with static chevrons, so that moving dots always mean current.

## Open questions

- The trip toast reuses the `.station-toast` style in the HUD layer (class `meeting-toast`). If the lead prefers the card's flash style for this, the sentence can move to objectives.ts.
- The board shows a few characters of text ("4.5 A", "5 A", "TRIPPED"). That is device text, like a meter face, not a floating label. Say if the product owner wants it icon-only.
- `game.ts` changes outside the strictly Meeting-only paths, all small and in place:
  - the socket box is hidden for Lunch too (R5-030's lunch part);
  - the reticle line and its corner placement (R5-122);
  - the pulse "live" flag, which is the same as before for the Playground.
