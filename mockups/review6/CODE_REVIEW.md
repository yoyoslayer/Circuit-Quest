# Code review (review 6), verified findings

Each finding was checked by two independent refuters (a code trace and a reachability check).

## Confirmed by both (60)

### recent-1 [P1] Camera ray starts at the eased focus (not Pip); when the focus is inside a fixed collider toi is 0 and the camera is forced to 0.8 m, on top of Pip or inside the solid

- File: src/game.ts:733
- Scenario: Lobby, default view (zoom 23, yaw .4): walk from spawn up to the reception desk (collider `solid(g,4,1.05,1.1,0,.52,-.6)`, lobby.ts:66) and keep holding W. With Pip at about (-1,z=.3) the lead puts the focus at about (-1.13,.4,-.17), inside the desk box (z -1.15..-.05, top 1.045). toi=0, wanted = focus+0.8*u = about (-.87,.8,.45), 0.2 m from Pip's centre: the camera swoops from ~17 m into Pip's body. Same for any pillar (0.9 m square, 3 m), fixed counter or interior wall Pip walks into with the camera behind him; with a thin 0.25 m interior wall at close zoom the focus pops out the far side and the 0.8 m floor puts the camera inside the wall. Second route: Meeting at max zoom-out (38, follow .62): walking through about (0.1,-5.3) puts the focus inside pillar-1's base at (.15,-2.9) and the camera dives from ~29 m to 0.8 m at a pillar 2.4 m away from Pip.
- Fix: Cast from Pip (player translation at chest height), not from `focus`, or cast with solid=false / skip colliders that contain the origin; when toi is below the minimum distance do not clamp up to 0.8 m past the hit (keep the unobstructed position or clamp to the hit).
- Verdicts: confirmed, confirmed

### recent-2 [P1] Camera ray stops at colliders that do not block the view: the invisible upper half of interior walls and the boardroom's transparent glass front

- File: src/game.ts:733
- Scenario: Meeting, right at spawn (-10,-5.8), default zoom 22: orbit so the camera is west of Pip (yaw about -PI/2). The ray from the focus (about (-9.5,.4,-5.45)) rises ~0.61 m per metre and meets the closet wall plane x=-11.775 at y about 1.8 m: above the visible 1.35 m wall, below the 2.6 m collider top. The camera is pulled from ~17 m to ~2.4 m although the view over the low wall is clear. Also Meeting: Pip inside the boardroom at about (10.2,-4) with the default yaw .14: the ray crosses the glass front (z=-2, x 9.3..11) at y about 1.5 m, so the camera is squeezed to ~1.8 m inside the boardroom; stepping in line with the doorway gap (x 11..13.8) releases it, so the camera swoops in and out as Pip moves around the table at the job's goal. Lunch (interior walls everywhere, decor.ts:261) is affected throughout.
- Fix: Give the ray its own blocker set (pillars, tall visible furniture) or add the interior-wall, glass and NPC colliders to cameraIgnore; alternatively test the hit point's height against the wall's visible height before pulling in.
- Verdicts: confirmed, confirmed

### recent-3 [P2] 'the back wall between two doors is still solid' cannot fail: Pip's position clamp, not the wall collider, satisfies every assertion

- File: tests/lobby.spec.ts:21
- Scenario: Delete the back wall's colliders entirely, or make between() leave a 5 m hole next to the arcade door: the test still passes with identical values (player.z = -9.5, arrived false, level 'lobby'). The regression the test is named for (a wall segment missing after the gap refactor) is not detected. The sibling test's comment 'walking to z -9.75 is through the opening' is likewise untrue: Pip stops at -9.5 and only the trigger band (dn .375..45) makes it pass.
- Fix: Assert on the collider itself, e.g. castRay/intersection at (door.x+1.2, 1, -10) hits a fixed collider and at (door.x, 1, -10) does not, or throw a prop at both spots and check which one leaves the room; or drop the clamp margin for the hub and let the wall do the stopping.
- Verdicts: confirmed, confirmed

### recent-4 [P2] camera-clear test samples a camera that is still easing in real time, so its result depends on machine speed

- File: tests/camera-clear.spec.ts:11
- Scenario: Step i=9 -> i=10 at the Meeting spawn (-10,-5.8): at i=9 nothing blocks and the camera sits ~9 m out at about (-13.2,4.9,-13.5); at i=10 the ray hits the closet wall (x=-11.775, 2.6 m collider) and wanted becomes about (-11.6,1.9,-7.4), 0.25 m short of the wall. While the camera travels the chord between them it is still west of the wall plane; from roughly 60% to 89% of the way the focus->camera segment crosses the wall below 2.6 m, so the test's castRay returns a hit and `bad` gets 10. Whether the sample lands before, inside or after that window is decided by real elapsed time (about 150-370 ms at rate 6/s), i.e. by CI/laptop speed: the test can fail with correct game code, and on a slow renderer it can pass while never observing the settled position it claims to check.
- Fix: Make the sample deterministic: after setting yaw/zoom call `G.updateCamera(10)` (or loop updateCamera with a fixed dt until the position stops changing) before measuring, or compare against the computed `wanted` rather than the eased camera position.
- Verdicts: confirmed, confirmed

### recent-5 [P2] SEE_OFF on the hose material also removes every cable from the ambient-occlusion pass

- File: src/render/actors.ts:22
- Scenario: At quality 2 (AO on), lay the cable across the floor in Meeting or look at the Lunch cables: before affdb7a the cable was drawn into the AO depth/normal buffers and got a contact shadow where it lies on the floor and wraps a pillar; now it is skipped, so the star prop loses its grounding shadow and the AO computed for whatever is behind it (e.g. the dark band at a wall base or under a desk) is composited over the cable's pixels.
- Fix: Use a separate marker for 'skip AO' (e.g. userData.noAO on Pip and the plug, as other meshes already do) instead of keying post.ts on defines.SEE_OFF, or exclude the hose material explicitly from that check.
- Verdicts: confirmed, confirmed

### game-a-01 [P1] Putting a carried prop down while still walking launches it faster than a deliberate throw

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:344
- Scenario: Pick up a monitor (E), walk with W held, press E to put it down without stopping. Instead of dropping at Pip's feet it shoots forward at about 20 m/s, hits a desk or wall, and l.650 (`prop.lastSpeed>5.5&&(FRAGILE.has(...)||prop.lastSpeed>9)`) books a breakage: damage +1, cost +130, coworkers alarmed. A tidy put-down is graded as destruction, against hard rule 5 (clean solution first).
- Fix: Do not hand the released prop straight back to the controller while it overlaps Pip: remember it (e.g. `this.released={p,until:this.time+.3}`) and extend the l.627 predicate to skip it until it is clear. Also consider releasing it at the un-lagged carry target with Pip's current velocity instead of zero, or carrying it further than 0.10 m clear of the capsule.
- Verdicts: confirmed, confirmed

### game-a-02 [P1] Gamepad left stick still walks Pip while seated at a bench or in the lobby picker

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:621
- Scenario: With a controller, sit at any station bench and move the bench cursor with the left stick. Pip walks away from the bench behind the bench camera (shoving props, changing heading away from `station.facing`) while `atBench` stays true; on standing up (B) he is somewhere else in the room. The right stick also changes `yaw`/`pitch` under the bench view. The same happens in the lobby with the Workshop picker open.
- Fix: Read the pad before the `menu`/`atBench` zeroing, or wrap the pad block in `if(!this.menu&&!this.atBench)` (skip the yaw/pitch part there too).
- Verdicts: confirmed, confirmed

### game-a-03 [P2] Delivered station items that were made Fixed can be 'picked up' again and spin in place

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:321
- Scenario: QFN: carry the parts crate to the end of the bench and press E (it snaps onto the bench and is fixed). Press E again from where you stand: Pip 'picks up' the fixed crate (pop sound, `held` set). The crate stays on the bench but turns to face Pip's heading as he walks, Pip is slowed by `speed/=1+mass/25`, and at the bench E now puts the crate 'down' instead of sitting (l.332 needs `!this.held`). The Garage robot on its test stand behaves the same and, as a cart, also blocks jumping (l.287 `!this.heavy(this.held)`).
- Fix: In nearest() skip props whose body is not dynamic unless they are the re-grabbable ones (wedge, strip, extension), or let a station veto a grab the way `lunch.canGrab` does.
- Verdicts: confirmed, confirmed

### game-a-04 [P2] Gamepad A during the 1.4 s win beat reloads the page before the result card appears

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:296
- Scenario: Play with a controller. A is jump on the floor and the mouse button at a bench, so it is pressed constantly. Seat the plug (or make the last bench click), then press A once more within about 1.4 s: the page reloads to the title screen with no autostart, and the grade card is never shown (the best is recorded, but the player does not see it). Same on a Lunch fail before the fail card shows.
- Fix: Drop the reload from Game.pollPad and let the UI act on A only when `screen` is 'result' or 'fail' (calling `ui.restart()`), or gate l.296 on `document.body.dataset.complete` / a short delay after `winAt`.
- Verdicts: confirmed, confirmed

### game-a-05 [P2] Meeting: the seated plug's position is copied once and goes stale when the strip is placed or moved afterwards

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:490
- Scenario: Meeting, order A: carry the plug to the boardroom door first and press F. It 'plugs in' with sparks into thin air at (target.x, 0.28, target.z). Then fetch the strip and set it down: the projector circuit closes, but the plug and cable end keep hovering beside the strip, about 0.7 m from its inlet. Order B: seat the plug in the strip, then pick the strip up and carry it off: the plug stays floating where the inlet was and the cable keeps its plugged-in tint; throwing the strip so it rests within 1.4 m of the door closes the circuit again with the plug nowhere near it.
- Fix: While `connected` in a strip level, re-derive `plugPosition` from `seatAt()` each step when the strip is placed, and unseat the plug (connected=false, plug dropped at the door) when the strip is picked up or leaves its spot.
- Verdicts: confirmed, confirmed

### game-a-06 [P2] Mouse grab and orbit rely on pointerdown/pointerup per button, which do not fire for a second button

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:273
- Scenario: Hold the right mouse button to orbit the camera and left-click to grab or put down: nothing happens (no pointerdown for the second button), so mouse grabbing is dead for as long as the camera is being dragged. Releasing right first while left is still down fires no pointerup, so `orbit` stays true and the camera keeps turning with only the left button held. At a bench: left-drag a part, tap the right button, release left then right: the final pointerup has `e.button===2`, so the station never gets 'up' and the part stays stuck to the cursor.
- Fix: Handle chorded changes in pointermove (act on `e.button` 0/2 when it is not -1), or drive orbit and grab from `e.buttons` and mousedown/mouseup, which do fire per button.
- Verdicts: confirmed, confirmed

### game-a-07 [P2] Snap-placing or respawning a moving prop reads as a crash, because lastSpeed is not cleared

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:346
- Scenario: Meeting: carry the power strip to the boardroom door and press E while still moving (it snaps from up to 2.6 m away, so this is the usual case when sprinting). The strip is set down neatly, yet coworkers within 3.5 m pop a '!' with the alarm voice, a thud plays and impact dust puffs, as if it had been thrown. Same when the Garage robot or QFN crate snaps into place at a sprint. For respawn: a fragile prop that leaves the floor area at over 5.5 m/s (l.655) is sent home and on the next step is counted broken there (damage +1 and its repair cost), with the alarm at its home spot.
- Fix: Set `prop.lastSpeed=0` wherever code stops or teleports a body (l.346, respawn(), consume(), the station snap helpers), as spectrum's park() does.
- Verdicts: confirmed, confirmed

### game-a-08 [P2] Bench drags are not pointer-captured, so releasing off the canvas leaves the drag stuck on

- File: C:\Users\yousi\Circuit-Quest\src\game.ts:271
- Scenario: At the Spectrum or Observatory bench, start dragging a part or knob, move the cursor over the prompt pill or pause button (or outside the browser window) and release. The canvas never sees pointerup, so when the cursor comes back the part keeps following it with no button held until the next click, which can drop it somewhere unintended.
- Fix: Call `canvas.setPointerCapture(e.pointerId)` on the bench pointerdown, and also end the drag on `pointercancel`/`lostpointercapture` and when a move arrives with `e.buttons===0`.
- Verdicts: confirmed, confirmed

### game-b-1 [P1] New camera pull-in collapses to 0.8 m (often inside the solid) whenever the focus point is in or next to a fixed collider

- File: src/game.ts:733
- Scenario: Meeting, default zoom 22 / yaw .14 (wanted distance 17). (a) Hold W into the south face of pillar-1 (.15,-2.9): focus becomes (0.15,0.5,-2.56), inside the pillar -> toi 0 -> camera target is 0.8 m from that point, i.e. on top of Pip; the view slams from 17 m to 0.8 m. (b) Stand idle 0.4 m north of the same pillar: toi 0.18 -> camera placed 0.8 m along the ray = 0.6 m inside the pillar, the exact thing the feature is meant to prevent. (c) Walk the z=-5 lane past the pillar: distance pumps 17 -> 1.34 -> 17 within ~0.2 s. (d) Zoom fully out (38) with Pip at (.15,-8.3): focus is 3.5 m away from Pip at (0.17,0.09,-4.77), the ray hits the pillar and the camera drops from 29.4 to 1.59 m although nothing is near Pip. tests/camera-clear.spec.ts only orbits at the Meeting spawn at zoom 12, so none of this is covered.
- Fix: Cast from Pip (chest height), not from the lerped focus; treat toi below a minimum (or an origin inside a shape, e.g. solid=false / skip) as no hit instead of clamping up to 0.8; never place the camera farther than toi-margin; restrict the predicate to tall room geometry (exclude npc colliders, prop bodies such as glass, and solids whose top is below the sight line), and smooth the pulled-in distance so it cannot pump.
- Verdicts: confirmed, confirmed

### game-b-2 [P1] Gamepad stick still walks Pip (and turns the camera) while at a bench or with the lobby menu open

- File: src/game.ts:621
- Scenario: Open any station job with a controller, press X at the bench, then push the left stick to move the bench cursor: Pip (hidden while atBench) simultaneously walks off at 4.2 m/s in that direction, shoving props, and his heading is overwritten; pressing B to stand up leaves Pip somewhere else in the room. The right stick also keeps rotating yaw/pitch against the bench camera's ease-back, skewing the tuned bench framing. Same in the lobby: with the Workshop picker open (game.menu), the stick walks Pip away behind the modal.
- Fix: Read the pad before the menu/bench zeroing, or wrap the pad block in `if(!this.menu&&!this.atBench)` (keep only what is intended, e.g. nothing, at a bench).
- Verdicts: confirmed, confirmed

### game-b-3 [P1] Stale prop.lastSpeed after a put-down or respawn is graded as a crash (phantom damage, cost and coworker alarms)

- File: src/game.ts:650
- Scenario: 1) Sprint (Shift, 6.8 m/s) carrying a mug/plant/monitor/lamp/coffee machine (carry speed 6.8/(1+mass/25) = 5.7-6.8 > 5.5) and press E to set it down: next step lastSpeed ~6.7, speed ~0.3 -> damaged=true, damage+1, repair cost added, break beat, coworkers alarmed, although nothing hit anything; the damage and cost grades drop on a tidy action. 2) Merely walking (4.2 m/s) and putting down any item under 1.25 kg (mug, bin, coupler, the Meeting strip at 4.008 m/s when it is snapped to the door) fires the knock branch: clatter, dust and a 3.5 m coworker startle. 3) Throw a mug over the 1 m front lip: it leaves bounds at ~8 m/s, respawn() teleports it home with zero velocity, and the next step breaks it at its home spot and alarms the coworkers there; any prop that falls past y<-3 (~10 m/s > 9) is counted broken the same way, including required job items that rule 7 says come back safely.
- Fix: Set `prop.lastSpeed=0` wherever velocity is zeroed or the body is teleported: in the held setter / the drop branch of interact(), in respawn(), and on consume/park; or skip the impact test for one step after such an event.
- Verdicts: confirmed, confirmed

### game-b-4 [P2] Lunch fail shot never swings the camera in real play (winAt stays 0); only ?manual tests get the fitted yaw

- File: src/game.ts:718
- Scenario: Play Lunch normally and let the food spoil or the tray burn while the camera orbit is not already near the computed shot yaw (e.g. looking along the line from Pip to the fridge): the camera pushes to the fail target/distance with the player's old yaw, so Pip and the fridge/oven are not framed in the free part of the screen (they can overlap or sit under the fail card). In Playwright (?manual) the yaw snaps, so the fail-shot checks pass while the shipped behaviour differs.
- Fix: Stamp the time in lunchFailed() (e.g. `this.winAt=performance.now()` or a separate failShotAt) and use it for the 1.6 s swing window.
- Verdicts: confirmed, confirmed

### game-b-5 [P2] Pip's speed is measured per rendered frame over a 60 Hz sim, so walking past coworkers reads as sprinting on high-refresh displays

- File: src/game.ts:824
- Scenario: On a 144 Hz monitor a step lands on ~1 frame in 2.4; on that frame the displacement of 1/60 s is divided by 1/144 s, so a 4.2 m/s walk reads 10 -> clamped 9 (and 0 on the other frames). The frame on which a coworker first comes within 1.4 m is always a step frame, so strolling past any coworker triggers the sprint reaction (jump, "!" bubble, alarm voice) instead of the "hm" (R5-089); at 120 Hz anything above 2.75 m/s does. At 60 Hz the occasional 0-step/2-step frame pair does the same sporadically. Sprint footsteps and the walk cycle also run slow (clamped 9*60/144 = 3.75 m/s average) and the rig's speed input flickers between 0 and 9.
- Fix: Derive Pip's speed in step() from the controller's computed movement (the existing `pace` at L632) and store that for pipSpeed/stride/rig, or interpolate the rendered position and low-pass the speed.
- Verdicts: confirmed, confirmed

### game-b-6 [P2] Idle hint shows stale or origin-stacked chevrons when the lane route collapses to a single point

- File: src/game.ts:900
- Scenario: Playground (lane 0 ends at [6.6,-5.9], 0.41 m from the socket at 7,-6). Carry the plug past the lamp and drop it out of seating range but nearer the lane end than the previous lane point [5.8,-5.5], e.g. at about (8.8,-4.6) with Pip more than 2.2 m from the socket (strain ~0.95, so E just drops it). When the hint window opens (time>45 s, (time-45)%40<12) the route is `[from]`: instead of a chevron line from the plug to the socket, the chevrons appear piled at the room centre (0,0) on first use, or frozen along the previous route.
- Fix: In hintRoute always append the destination (`[from,...pts.slice(k+1),to]`), and in the chevron loop hide chevrons when path.length<2.
- Verdicts: confirmed, confirmed

### game-b-7 [P2] Fixed-step accumulator is capped at 5 steps but never clamped, so a slow spell is replayed later at up to 5x speed

- File: src/game.ts:918
- Scenario: On a machine that drops to ~10 fps for a while (hundreds of awake props after a big slingshot on a weak laptop, or a long shader-compile stall while running): each frame leaves 1/60 s of debt, e.g. 30 s at 10 fps banks 5 s. When the frame rate recovers to 60 fps the loop runs 5 steps per frame until the debt drains, so Pip, the cable and all physics run at 5x speed for ~1.25 s with input sampled once per 5 steps, typically flinging Pip or the plug past where the player was steering.
- Fix: After the loop, drop the excess: `if(this.accumulator>1/60)this.accumulator=0` (or `this.accumulator=Math.min(this.accumulator,1/60)`), or cap dt to 5/60.
- Verdicts: confirmed, confirmed

### game-b-8 [P2] Several cable/camera effects use per-frame constants (and keep running while paused), so they change with refresh rate

- File: src/game.ts:598
- Scenario: At 30 fps (33 ms frames) roughly half of the 700 ms boundaries fall outside the 16 ms window, so coworkers along a red-hot cable flinch irregularly or not at all; at 144 Hz the boundary test passes on 2-3 consecutive frames. Twang sparks spawn 2.4x as often at 144 Hz as at 60 Hz, and a slingshot/shatter camera shake lasts ~0.15 s at 144 Hz versus ~0.37 s at 60 Hz and ~0.73 s at 30 fps. Pausing with the plug held at strain>.97 leaves sparks spawning, and coworkers re-alarming every 700 ms, behind the pause menu while sim time is frozen.
- Fix: Use the real frame time (`this.last-dt*1000`, pass dt into drawCable), make the spark chance `1-Math.exp(-rate*dt)`, decay shake with `Math.exp(-dt*k)`, and skip the alarm/spark side effects in drawCable when paused.
- Verdicts: confirmed, confirmed

### sim-1 [P1] Big Meeting allocates new glow materials every rendered frame, growing OutlineEffect's key table without bound (frame time climbs until reload)

- File: src/meeting-strip.ts:216
- Scenario: Play Big Meeting: set the strip at the door and plug the reel in. From then on the urn lamp and heater grille are 'on' (2 new materials per frame), plus the LED once the projector switch is on (3 per frame); while the strip is tripped it is LED + board lamp + reset cap (3 per frame). At 60 fps that is 120-180 permanent keys per second, so each minute adds roughly 1 ms to every later frame (more on a 144 Hz display). A player stuck on the tripped strip for 5 minutes, or who leaves the result screen up for 10 minutes (the projector, urn and heater stay 'on' after the win), pays about 6-13 ms extra per frame and the game drops below 60 fps; it only recovers on a page reload. Each frame also creates and discards 2-3 MeshBasicMaterials and 2-3 outline ShaderMaterials (GC churn).
- Fix: Create the glow materials once and reuse them: fixed ones as fields (urn on, heater on, LED green, grey is already cached by toon()), and for the pulsing ones keep one material per mesh and mutate its colour each frame (material.color.set(hex).multiplyScalar(k)) instead of calling hot() in render().
- Verdicts: confirmed, confirmed

### sim-2 [P2] A short leaves loads 'off' instead of 'brownout' (and depends on lead order), so Lunch's no-volt release never switches the motors off

- File: src/sim/electrical.ts:32
- Scenario: Lunch: conveyor and lift are running from one cart. A cable in their feed gets wet in the leak (or a plugged cable's loose end is dropped in the puddle): the cart cuts out with a 'short'. The motors read 'off', not 'brownout', so enabled stays true. The player mops up and resets the cart: both motors restart by themselves in the same tick, their kicks add up (conveyor 3 + lift 9 minus the capacitor's share, over the 5-bar limit) and the cart trips again at once with a surge hint, although the player switched nothing on. After an overload trip the same motors correctly stay off.
- Fix: Make a short behave like any other trip for load state: on a wet lead, mark the source tripped and record the event but keep building routes for that source (or remember the previous tick's routes), so line 67 reports 'brownout' for every load it fed; alternatively have lunch-runtime disable every enabled motor whose source appears in this step's trip/short events instead of testing state==='brownout'.
- Verdicts: confirmed, confirmed

### sim-3 [P2] A bend that ends up inside an obstacle is never re-routed: the cable runs straight through the prop for as long as it sits there

- File: src/sim/cable.ts:32
- Scenario: Big Meeting: drag the cable round a pillar or a desk corner so it bends there, then shove a desk or cabinet (mass >= 3) onto that corner, or let the taut cable tip the chair it is wrapped on (its footprint box grows when tipped, game.ts furniture mapping) so the box now contains the bend. The cable is drawn straight through the furniture, its length and strain read too low, and it stays that way until the prop is moved off the point or the bend happens to unwrap.
- Fix: At the start of Rope.update drop every bend that lies strictly inside an obstacle before the unwrap pass, so the following detour/sweep re-routes prev -> next around the box; and/or in game.ts re-anchor each bend that sits on a prop's corner to that prop's current corner each step.
- Verdicts: confirmed, confirmed

### sim-4 [P2] The urn and heater can be 'unplugged' before the power strip exists at the door: prompt and E act on plugs that are drawn lying on the floor

- File: src/meeting-strip.ts:148
- Scenario: Start Big Meeting and walk to the boardroom door before fetching the strip. The tea urn's cord lies coiled on the floor, yet the pill says 'E Unplug the tea urn'. Press E: a pop, the boardroom says 'hm', nothing visible changes (the cord was already on the floor) and the pill flips to 'Plug in the tea urn'; strip.unplugged is now 1. When the strip and reel are later connected the urn silently stays off, the total is 3 A, the strip never trips and the level's overload lesson is skipped without the player having seen it.
- Fix: In the appliance branch of interact() and prompt() return false/null unless this.game.stripPlaced() (keep the reset branch as is), so plugs can only be pulled from a strip that is actually there.
- Verdicts: confirmed, confirmed

### lunch-splitter-direction [P1] A splitter-to-splitter cable only conducts one way round, depending on which plug end went in where

- File: src/lunch-runtime.ts:436
- Scenario: Cart A feeds splitter-1. Take thin-3, press F at cart B to pull its end 0 out, plug that end into splitter-2 (which feeds the fridge), then plug end 1 into splitter-1. Both plugs seat with the click and flash, but splitter-2 and everything on it stay dead and the switch prompt says '(nothing feeds it yet)'. Plugging the same cable with its ends swapped works. A cable has no direction, so this also breaks hard rule 10.
- Fix: For a both/both cable, orient the lead by which side is fed (e.g. reversed when `this.fed(cable.ports[1])&&!this.fed(cable.ports[0])`), or let Circuit traverse leads between two 'both' nodes in either direction.
- Verdicts: confirmed, confirmed

### lunch-strain-popout [P2] Over-strain pop-out always frees end 1 and leaves its plug where it was, so it still looks plugged in (or hangs in mid-air)

- File: src/lunch-runtime.ts:445
- Scenario: (a) thin-2 runs from cart A (end 0) to the kitchen post (end 1). Push cart A west until the route exceeds 1.25x the cable length: the far plug is silently unplugged but still sits in the post's socket, so the oven goes off with a plug that looks seated (hard rule 7). (b) A cable runs from cart A (end 0) to a splitter (end 1). Carry the splitter away: at 1.25x the plug comes off and hangs at chest height where the splitter was. (c) If end 0 is the one on the carried splitter, the far end 1 is unplugged instead and the cable stretches across the whole floor behind Pip.
- Fix: Unplug the end whose port moved (or the end nearest the last bend), then treat it like a release: drop that plug to floor height a little back along the route so it visibly leaves the socket.
- Verdicts: confirmed, confirmed

### lunch-plug-target-full [P2] plugTarget picks the nearest socket even when it is full or the wrong role, so F drops the cable next to a usable socket and the prompt promises a plug

- File: src/lunch-runtime.ts:288
- Scenario: The thick cable is already in the kitchen post socket (-4,-3), which has capacity 1. Bring a thin cable for the fridge socket (-4,-1.8), 1.2 m away, approaching from the oven side so the held plug is slightly nearer the post. The pill reads 'F  Plug into the kitchen power post'; pressing F drops the cable on the floor (or slingshots it if stretched) instead of seating it in the free fridge socket well inside the 1.4 m snap range. The same happens with an in-to-in or out-to-out nearest port beside a valid splitter.
- Fix: Move the capacity and role tests into plugTarget's filter so the nearest usable socket wins and promptAt and interact agree.
- Verdicts: confirmed, confirmed

### lunch-breaker-reset-first-cart [P2] E resets only the first cart in range, so a tripped cart B cannot be reset while cart A is also within 2 m

- File: src/lunch-runtime.ts:307
- Scenario: The carts start exactly 4 m apart (levels/lunch.ts: supply-a at z=3, supply-b at z=7) and are pushable. Nudge either cart toward the other, trip cart B, and stand between them: the pill says 'E  Reset the tripped breaker on cart B', but E finds the untripped cart A, skips the reset and falls through to a machine switch or to grabbing the nearest prop (usually a cart). B stays tripped until Pip stands more than 2 m from A.
- Fix: Use the same predicate as promptAt (include `.tripped` inside the find) and apply the double-tap guard to any cart in range.
- Verdicts: confirmed, confirmed

### lunch-cart-badge-cause [P2] A cart's fault badge shows the wrong cause: surge reverts to overload after 6 s, and an overloaded cart shows surge while another cart's surge hint is up

- File: src/lunch-runtime.ts:553
- Scenario: Switch on the lift with no capacitor: cart A trips on the 9-bar kick and its badge shows the surge glyph. If Pip takes longer than 6 s to get back from the winch and press reset (about 29 m, roughly 7 s at walking speed), the still-tripped cart switches to the overload glyph ('too much on one cart') although the steady load is fine. Conversely, if cart B was already tripped by a real overload, it shows the surge glyph for those 6 s.
- Fix: Record the cause per source when the trip event is processed (e.g. a Map<string,Fault> filled in the trips loop at lines 474-477) and read that in render().
- Verdicts: confirmed, confirmed

### lunch-leak-no-volt-release [P2] No-volt release is skipped when a cart cuts out from a leak, so motors restart by themselves on reset

- File: src/lunch-runtime.ts:478
- Scenario: Cart A runs the conveyor and the docked lift (4.9 bars). A cleaner bot drags the loose end of another cable that is still plugged into cart A through the corridor puddle: cart A cuts out with the leak badge. Move the plug and press reset: both motors restart at once without being switched on (conveyor 3-bar kick plus lift), which can immediately trip the cart again, this time blamed on a surge. After an ordinary overload trip the same motors correctly stay off.
- Fix: Note which motors were 'on' before the tick and, when the step produced a trip or short, disable any of them that is no longer 'on', instead of testing only for 'brownout'.
- Verdicts: confirmed, confirmed

### lunch-tray-grab-on-belt [P2] The tray stays grabbable after it is locked to the conveyor, leaving Pip 'holding' a tray that rides away

- File: src/lunch-runtime.ts:500
- Scenario: Drop the tray at the belt start so it snaps on, then press E again within 1.65 m of it (it outranks nearby clutter). Pip goes into the carry state with nothing in hand, the tray stays on (and rides along) the belt while being turned to Pip's heading each step, the pill tells the player to carry the tray to the conveyor, and the next E press is spent 'dropping' it instead of doing what the player intended, such as flipping a switch.
- Fix: Make canGrab return false for the tray once job.tray is 'conveyor', 'lift' or 'delivered'.
- Verdicts: confirmed, confirmed

### lunch-lit-ignores-z [P2] The portable lamp lights the storeroom from the far side of a solid wall

- File: src/lunch-runtime.ts:277
- Scenario: With the kitchen post fed and the storeroom lamp switched off at its switch (-10,-3), carry the portable lamp out through the kitchen door and west along the corridor past x=-7.8, for example next to the supply carts. lit() turns true: the storeroom darkness fades up, its port rings appear and everything in it becomes grabbable, although the lamp is in a different room behind a wall.
- Fix: Use the storeroom test on the lamp's position: `this.inStore(this.prop('portable-lamp')!.body.translation())`.
- Verdicts: confirmed, confirmed

### stations-a-1 [P1] Delivery robot crab-walks sideways and backwards for half its route (yaw read back with XYZ Euler)

- File: src/stations/garage/station.ts:474
- Scenario: Pass all three garage jobs and watch the payoff drive. On the 10.3 m leg across the room (3.9,1.9 to -6.4,2.3) the robot faces +z while sliding in -x (sideways). On the next leg to the dock lane it travels roughly backwards. It then spins about 170 degrees at the last corner. Happens on every run; about 4.4 s of the 9.5 s drive. tests/station-garage.spec.ts only checks driving/delivered, so nothing catches it.
- Fix: Read the yaw with `new T.Euler().setFromQuaternion(q,'YXZ')`, or keep the yaw in a field (`this.driveYaw`) and integrate that instead of reading it back from the body.
- Verdicts: confirmed, confirmed

### stations-a-2 [P2] A refused action during the served beat leaves the passed parts drawn in the sockets of the next job

- File: src/stations/garage/station.ts:265
- Scenario: Job 1: fit the diode across the motor, PULSE, TEST (pass). Within the 3.4 s beat press Backspace to clear the board for job 2 (or F, or click an empty socket). The diode stays drawn in ACROSS MOTOR indefinitely while the panel reads '0 PARTS FITTED' and the real slots are empty. Pressing PULSE then tests a bare board; pressing TEST would charge a mistake for a board that looks fitted. It only corrects on the next action that reaches redraw().
- Fix: Redraw when act() ends the beat: `if(this.beatSlots){this.beatSlots=undefined;this.redraw();}`.
- Verdicts: confirmed, confirmed

### stations-a-3 [P2] The robot fixed on the test stand can still be picked up with E, and then swivels in place

- File: src/stations/garage/station.ts:443
- Scenario: Set the robot on the stand, walk behind the bench to within 1.65 m of it (outside the 1.6 m bench radius) and press E. Pip goes into the carry state and the prompt flips to 'Set the robot on the stand'. The robot stays on the stand but rotates to follow Pip's heading, so the harness plug no longer meets its service port. E at the bench now drops instead of sitting. Pressing Q 'throws' it: landThrow() sees a fixed body and plays the delivered confetti, cheer and milestone chime, repeatable.
- Fix: Make the placed robot un-grabbable: have nearest()/interact() skip props whose body is not dynamic (or give Station a veto such as canGrab(prop)), so the 'wired to the test stand' prompt matches what E does.
- Verdicts: confirmed, confirmed

### stations-a-4 [P2] Pulling the bench lead powers the arcade bench off without redrawing: lever, power lamp and sign-off stamp stay lit

- File: src/stations/arcade/station.ts:453
- Scenario: Arcade (it has a mains lead): fix a cabinet until the play test passes (stamp green), leave the bench and pick up the bench plug with F. Back at the bench the POWER lever is still in the ON position, the power lamp and the sign-off stamp are still green, but the meter reads POWER OFF. Enter does nothing; P answers 'No power: the bench lead isn't plugged in' under a green lamp. It stays stale until some action reaches redraw().
- Fix: Call this.redraw() after powerOff() in the benchLive check and in popLed(), or move the lever, lamp and stamp updates into powerOff()/changed().
- Verdicts: confirmed, confirmed

### stations-a-5 [P2] Hidden flip buttons are still hit by the bench pointer

- File: src/stations/garage/station.ts:421
- Scenario: Sit at the garage bench with empty sockets (or a snubber fitted) and move the mouse over the bare board just left of ACROSS MOTOR (x -0.93), right of ACROSS SWITCH (x 0.64) or right of AT CONTROLLER (x 1.32). The cursor turns to a pointer and the key prompt changes from 'P Pulse the motor' to 'F Flip it round' over nothing; clicking does nothing, silently. During the served beat that click is also one of the refused actions that triggers stations-a-2.
- Fix: Filter the raycast list by visibility up the parent chain, as the arcade bench does.
- Verdicts: confirmed, confirmed

### stations-a-6 [P2] The job 3 long ground wire is swapped for the short one the moment the last TEST passes

- File: src/stations/garage/station.ts:159
- Scenario: Job 3 (cargo): fit the diode, switch to star ground, TEST. For the 3 s of test cycles before the robot drives off, the meandering shared ground wire that the job is about disappears and a short straight wire appears, while the current beads keep tracing the meander path over bare board.
- Fix: Fall back to the last job when all are done, e.g. `(this.current()??JOBS[JOBS.length-1]).shared>.1`, or use the beat's captured value while pendingDrive.
- Verdicts: confirmed, confirmed

### stations-a-7 [P2] Assertion that cannot fail: judge() never produces the word 'popped'

- File: src/stations/arcade/logic.test.ts:89
- Scenario: Change judge() so this hopper chain is reported as an instant failure in any wording, or so it passes with no problems: the test stays green either way, so the 'scorches rather than pops' rule it is meant to pin for the base job is not covered.
- Fix: Assert the behaviour directly, e.g. that read(job('hopper'),s(chain([100],[47]))).rHeat is above 1 and below HOUSE.blockPop, and that problems[0] matches the expected pin-rating message.
- Verdicts: confirmed, confirmed

### stations-b-1 [P1] QFN: a via dropped mid-stroke with V is erased again when the mouse is released in place

- File: src/stations/qfn/station.ts:427
- Scenario: Board 3: drag a GND track two cells from a pad, press V (the track is laid, the via appears, the layer flips to L2), then release the mouse without first dragging onto another cell. The up event sees a one-cell stroke on a via and runs 'erase': the via just placed disappears with the cut sound, leaving the L1 track with no via. Same if you press on an existing track, press V and release. The player has to keep dragging on layer 2 before letting go, or use V-then-click, for the via to survive.
- Fix: Mark the continuation stroke created by dropVia (e.g. `fresh:false`) and only run the tap-to-erase branch for a stroke that began with this press: `else if(s.fresh!==false&&this.isTrack(c,s.layer))this.act('erase',c)`.
- Verdicts: confirmed, confirmed

### stations-b-2 [P1] Observatory: the decoder speaker keeps playing while the game is paused, and mute cannot silence it

- File: src/stations/observatory/station.ts:406
- Scenario: Sit at the signal bench (speaker on by default) during job 2 and pause with the HUD pause button or pad Start, or just click another window (the blur handler at game.ts:261 pauses). The 4 kHz sawtooth buzz and the hiss carry on at their last gains for the whole pause; if the pause landed inside a Morse dash the 700 Hz tone is a continuous beep. Toggling sound off from the pause screen sets master gain to 0 but this chain does not pass through master, so it still plays until the game is resumed.
- Fix: Connect `out` to the engine's master/sfx bus instead of c.destination so mute applies, and silence it on pause from code that runs while paused (e.g. have Game.togglePause/blur call a station hook, or have audio.paused() zero a bench bus the speaker feeds).
- Verdicts: confirmed, confirmed

### stations-b-3 [P2] QFN: the last board never gets its bring-up test; the win fires one frame after SHIP

- File: src/stations/qfn/station.ts:552
- Scenario: Ship board 3 with a chip that works but runs hot (tier 1). The toast 'Works, but the LED driver runs at 109 °C and throttles itself...' is set and hidden within a frame, the 2.2 s bring-up (loop pulses, status LED blink, heat glow) that is supposed to show the flaw never plays, stackShipped() never runs so the third board never joins the stack, and `bringUp` stays set forever. Boards 1 and 2 get the full test; the board that teaches thermal vias does not.
- Fix: Report completion only after the test: `complete(){return this.shipped.length>=BOARDS.length&&!this.bringUp;}` (keep the early return in run() keyed on shipped.length), and update the e2e test to wait for the last bring-up.
- Verdicts: confirmed, confirmed

### stations-b-4 [P2] Spectrum: the transmitter tower, the beam and the mirror marks stay hidden in the win shot

- File: src/stations/spectrum/station.ts:487
- Scenario: Deliver the third message from the dispatch desk. The win camera pushes from Pip at the desk (-3.5, 3.55) toward winFocus(), the quiet-room pad (8.2, 4.8); the tower at (-0.4, 2.3) stands on that line but is invisible (its collider is still there), the floor mirror marks are gone and no beam is drawn to the pod, for the whole win shot and result card. The same stale state leaves the delivery `hold` unfinished (endHold never runs).
- Fix: Restore the room copies when Pip leaves the desk rather than on the next update, e.g. in setActive(false): `this.tower.visible=true;this.beam.visible=true;for(const m of this.markMeshes)m.visible=true;` (or move the three toggles into setActive).
- Verdicts: confirmed, confirmed

### stations-b-5 [P2] QFN decoupling: one unwired cap makes every cap assignment tie, so a correctly wired cap can read 'not wired'

- File: src/stations/qfn/logic.ts:288
- Scenario: Board 2: place C1 beside the chip's right-hand VDD/GND pins and wire both pads (a 2-cell loop, well under the 4-cell limit) before touching C2. The panel shows 'C1 loop: not wired' and 'C2 loop: not wired', no green loop outline is drawn (path is empty), and CHECK's note says 'No bypass cap is wired to U1's right-hand VDD/GND pins' although one is. Doing exactly the same with C2 shows '2 cells · ≤ 4' in green. The readout only corrects itself once the other cap is also wired.
- Fix: Make unreachable loops comparable instead of Infinity when scoring, e.g. `const f=(x:number)=>Number.isFinite(x)?x:1e4; const score=Math.max(...ls.map(f))*100+ls.reduce((a,z)=>a+f(z),0);` (or rank by number of reachable loops first).
- Verdicts: confirmed, confirmed

### stations-b-6 [P2] Observatory and Spectrum: the 'Elegant' bonus star shows as earned before anything has been logged or sent

- File: src/stations/observatory/station.ts:109
- Scenario: Start the Signal Observatory or Spectrum Delivery and look at the job card before doing anything: one of the three bonus stars is already filled, and the pause screen shows 'Elegant: ...' ticked. Log or send one merely reliable result and the star empties, i.e. the HUD takes away something the player never earned.
- Fix: Guard both like the QFN bench: `ok:()=>this.logged.length>0&&this.logged.every(...)` and `ok:()=>this.delivered.length>0&&this.delivered.every(...)`.
- Verdicts: confirmed, confirmed

### stations-b-7 [P2] QFN: parts can still be picked up during the bring-up test; a drag held across the board change throws

- File: src/stations/qfn/station.ts:405
- Scenario: Board 2: press Enter to ship, then within the 2.2 s test press on C2's body and drag. The part lifts and follows the cursor over the powered board the comment says hands stay off. Keep holding until board 3 drops in (it has no C2): every further mouse move throws `TypeError: Cannot read properties of undefined (reading 'position')` in ghost(), and the release throws on `place['C2'].at`. With a part id that exists on the next board (R1, C1, J1 from board 1 to 2) the stale drag instead moves the new board's part to wherever the cursor is on release.
- Fix: Ignore board input while the test runs (early in pointer(): `if(this.bringUp){this.hover.visible=false;return;}` after the clickable hover handling, and gate `body` on `!this.bringUp`), and clear `this.drag=this.stroke=this.hold=undefined` in finishBringUp().
- Verdicts: confirmed, confirmed

### render-1 [P1] Hard-stop stumble fires on any render frame that runs no physics step (frame-rate dependent)

- File: src/render/pipRig.ts:68
- Scenario: On a 75/120/144 Hz monitor, a render frame with no physics step reads speed 0. The frame with a step reads v·(1/60)/dt, which is 1.25–2.4 × v. So while Pip walks or sprints, hardStop goes true every few frames, bumpAge keeps resetting, and the body roll, knees and head jitter all the time (about 0.08 rad sawtooth at 75 Hz). At 60 Hz the same thing gives a full 0.45 s stumble whenever a frame lands with no step while Pip is going faster than 4.5 m/s, or when a hitstop fires mid-sprint (plugging in on the run, which hits plugFlash freeze(.09), a breaker trip or a shattered pane).
- Fix: Base the hard-stop test on the smoothed speed (`this.spd`, or keep a short running average over about 0.1 s), or have Game pass the controller's real velocity from the last physics step. Skip the check on frames with dt==0 or with no physics step.
- Verdicts: confirmed, confirmed

### render-2 [P1] Hiding Pip (and tiny parts) from the AO pass prints the background's AO onto them

- File: src/render/post.ts:30
- Scenario: At quality 2 (the default), walk Pip in front of a wall base, a desk edge or the corner of a cabinet. The dark contact crease behind him, multiplied by blendIntensity .85, is painted across his body as a grey band. That is the opposite of the stated intent ('so the hero stays clean toon instead of greyed', R5-167). The same happens to the cable (its hose material is SEE_OFF) and to glow sprites over dark corners.
- Fix: Keep the excluded objects out of AO in a way that also masks the blend. For example: put Pip, the cable and the other excluded meshes on a separate layer and draw them after the AO pass (an extra render pass with depth test against the scene). Or write a mask in the normal pass and make the blend shader skip masked pixels.
- Verdicts: confirmed, confirmed

### render-3 [P2] glossyToon materials lose their gloss and rim when cloned; seeOff clones Pip's hat, gloves and boots

- File: src/render/actors.ts:16
- Scenario: Load any level. Pip's hard hat, gloves and boots render as plain matte toon with no stepped specular highlight and no rim, unlike every other glossy prop. Any other code that clones a glossyToon material, such as the occluder fade helpers `fadeWith`/`fade` that call `m.clone()`, silently drops the gloss the same way.
- Fix: Make glossyToon a MeshToonMaterial subclass (as ToonMaterial is) that stores spec, size and seeExempt and puts onBeforeCompile and customProgramCacheKey back in its constructor and copy(). Or have seeOff copy `onBeforeCompile` and `customProgramCacheKey` onto the clone.
- Verdicts: confirmed, confirmed

### render-4 [P2] All live rings of one colour share one material, so a new ring takes the oldest ring's fade

- File: src/render/particles.ts:70
- Scenario: Two same-colour rings within 0.45 s, for example two QFN parts dropped in quick succession (each `burst(...,'#c7b8ff',1,'ring')`), two spectrum pods placed quickly, or a spectrum pad ring next to a plugFlash ring (both '#8ff3ea'). The new ring appears already almost faded (it uses the old ring's t near 0) and then pops to full opacity when the old ring dies.
- Fix: Give ring particles their own material per pooled mesh, as puffMaterial does for smoke and dust (mesh.userData), or clone the hotFlat material for each ring.
- Verdicts: confirmed, confirmed

### render-5 [P2] Pixel ratio is read once, so browser zoom or moving to another monitor leaves the game blurry

- File: src/render/toon.ts:152
- Scenario: On a laptop, drag the window from the 1× external monitor to the 2× built-in screen, or press Ctrl+'+' to 150% browser zoom. A resize fires, but the drawing buffer stays at innerWidth×old ratio, so the frame is upscaled and blurry (outlines and text plates turn soft) until the page is reloaded. Zooming out does the reverse and renders more pixels than needed, which costs frame rate.
- Fix: In resize, recompute `Math.min(devicePixelRatio,1.5)` (and the quality-0 cap) and call renderer.setPixelRatio / composer.setPixelRatio before setSize. Optionally also listen with matchMedia(`(resolution: ${devicePixelRatio}dppx)`) for DPR changes that do not resize the window.
- Verdicts: confirmed, confirmed

### render-6 [P2] Sign textures can be drawn before the Fredoka web font loads, then stay cached in the fallback font

- File: src/render/labels.ts:9
- Scenario: On a first visit with a cold cache, the lobby (the default level, the only caller of signPlate/labelTexture) is built before the woff2 arrives. Every sign is drawn and shrink-to-fit measured in system-ui, and because of the cache it is never redrawn for the session. The result changes from load to load (flaky by construction), and the in-game station canvases that use the same font stack have the same race.
- Fix: In boot(), `await document.fonts.load('700 48px "Fredoka Variable"')` (plus any other weights used) before building the Game. Or redraw the cached label textures on `document.fonts.ready` / `loadingdone`.
- Verdicts: confirmed, confirmed

### ui-1 [P1] Pad A in the 1.2–1.4 s between win/fail and the card reloads the page with no autostart flag, so the result card is lost and the player lands on the Jobs board

- File: src/game.ts:296
- Scenario: On a gamepad, A is also Jump. In Playground, jump around and plug in the lamp, then press A again within ~1.4 s of the lamp lighting (easy when mashing jump). The page reloads immediately: the grade card, stars and 'New best' never appear, and the player is dropped on the Jobs board instead of the result screen or a retry. The record was already written in won(), so the player never sees the grade it saved. On Lunch the same thing happens after a burn or spoil: you get the Jobs board instead of a retry.
- Fix: In Game.pollPad, ignore A after a win until the card is up, for example `if(this.won){if(i===0&&(gameUI(this)?.screen==='result'||gameUI(this)?.screen==='fail')){flagAutostart(this.level.id);location.reload();}return;}`. Or route the press through GameUI so the flag and the reload happen together.
- Verdicts: confirmed, confirmed

### ui-2 [P2] Arcade Rush shows a 'New best' star and bell on worse runs because a slightly shorter shift time counts as an improvement

- File: src/ui/store.ts:20
- Scenario: Run 1 of Arcade Rush: 10 cabinets served, grade A, g.time≈205. Run 2: only 3 served (grade C), but the tray was ready a little sooner, so g.time≈200. record() returns improved=true, so the result card shows the 'New best' star (screens.ts:195) and the bell plays (game-ui.ts:235), even though every row on the card is worse than the best.
- Fix: For Rush runs (served defined), leave time out of the improvement check (and out of the stored minimum). Count only served, damage, cost, grade, stars and crewGold.
- Verdicts: confirmed, confirmed

### ui-3 [P2] Lobby card hides jobs finished out of order and replays a stacked chord of step bells on every lobby load

- File: src/ui/objectives.ts:126
- Scenario: (a) In the lobby, enter Lunch (02) first and finish it. Back in the lobby the card still reads 'Step 1 of 8' with no finished dot, because 00 and 01 are not latched. Once 00 and 01 are done, all three tick together. (b) After finishing several jobs in order, every return to HQ (toJobs autostarts the lobby) latches every recorded step in the first frame: N bells play at the same instant (summed volume) and the card flashes, every time.
- Fix: For hub/persistent steps, seed `done` in the ObjectivesHUD constructor from step.done(g) with no bell or flash, and don't apply the in-order gate to the lobby (latch each step on its own).
- Verdicts: confirmed, confirmed

### ui-4 [P2] Lobby bonus checks re-read and JSON-parse localStorage about 130 times per frame

- File: src/hub/lobby.ts:54
- Scenario: Walk around the HQ lobby: each frame spends time on about 7,800 synchronous localStorage reads and JSON parses per second at 60 fps. On a laptop this eats into the frame budget and can push adaptQuality to lower the render quality in the lobby for no visual reason.
- Fix: Read the record once per frame or cache it in store.ts (invalidate on write()). Or compute campaignProgress once per update, or once at lobby load, since records can't change while you are in the lobby.
- Verdicts: confirmed, confirmed

### ui-5 [P2] Pad A on the result card restarts the job, while the card's primary button and Enter go to HQ

- File: src/ui/game-ui.ts:164
- Scenario: Finish the Big Meeting on a gamepad. The card highlights the HQ button as primary. Press A (the usual confirm button) and the job restarts from scratch instead of returning to HQ. A keyboard player pressing Enter on the same card goes to HQ.
- Fix: On result screens, make pad A click the same `.btn.primary` as Enter (call toJobs on result, restart on fail). Keep a separate pad button (for example Y or X) for retry.
- Verdicts: confirmed, confirmed

### levels-stale-return-door [P2] The return-door key goes stale when Pip leaves a job some other way than straight back to the lobby, so he respawns at the wrong door and that door replays its celebration

- File: src/hub/lobby.ts:86
- Scenario: In the lobby, walk through door 00 (Cable Playground); FROM_KEY is now 'playground'. Finish it and press 'next job' on the results card, which loads 01 Big Meeting without visiting the lobby. Finish or quit the Meeting and choose To jobs. The lobby reads the old 'playground' key: Pip appears at the Playground door, not the Meeting door. Because Playground is done, the return beat (lamp pop, sparks, 50 confetti and a jingle) plays for the Playground wing. If the Meeting was just finished for the first time, its wing gets no beat at all.
- Fix: Make the key say which job Pip is actually coming back from. Set it to game.level.id when leaving any job for the lobby (toJobs, and the results/pause 'jobs' actions), and clear it in the Game constructor for any non-hub level. A simpler alternative: store {id} on enter and drop it on load whenever the loaded level is not that id.
- Verdicts: confirmed, confirmed

### levels-lobby-door-lanes-stale [P2] Lobby clutter keep-out lanes are built from the old door layout, so the real doorways are protected only by luck of the seed

- File: src/levels/lobby.ts:11
- Scenario: Today, once arcade-rush is unlocked (B on 03), Pip walking to the Rush door kicks a cone that stands in its threshold. Its position also depends on where Pip spawns: coming back from Rush drops it, because clutter clears the moved spawn. Any change to seed, step, max, jitter or recipes (all tuning values) can put props straight in front of the Meeting, Lunch, Rush, Garage or side doorways, inside the 1.5 m E-prompt radius and the walk-in trigger strip. No test checks that the lanes match the slots.
- Fix: Define the door slots once: export slots() (or a DOOR_SLOTS list for the 30×20 lobby) from a shared module and build both hub/lobby.ts doors and lobby.ts lanes from it. Put each approach at slot +1.1 m into the room (back: z+1.1, side: x+1.1). Add a vitest that every Lobby door's `at` lies on a lane endpoint.
- Verdicts: confirmed, confirmed

## Split (one confirmed, one refuted) (2)

### recent-6 [P2] Walk-in door trigger has no intent or carry check: sliding along the wall past any unlocked door, or carrying a prop there, enters the job

- File: src/hub/lobby.ts:199
- Scenario: In the lobby, run along the back wall toward a far door while pressed against it (W+D): at the first unlocked door Pip passes (x within 0.5 m of -12.4, -9.1, -5.8, ...) the veil comes down and that job loads after 420 ms with no prompt, and the autostart flag skips its title. Likewise carrying or pushing a box to the wall beside a door (the hub is described as a toy box) drops the player into the job; pressing E in the same spot with the box in hand would only have dropped the box.
- Fix: undefined
- Verdicts: refuted, confirmed

### sim-5 [P2] 'conveyor then capped lift fits 5 bars' checks one 0.1 s tick; the same circuit trips one second later

- File: src/sim/electrical.test.ts:10
- Scenario: A developer changes charging or kick timing so the clean order (conveyor, then capped lift) trips right after the kick; this test still passes because it stops after one tick. The only thing keeping the real level solvable is lunch-runtime.ts:466 lowering chargeRate to .4 while the lift runs, which this test does not model (the line-35 test does).
- Fix: undefined
- Verdicts: confirmed, refuted

## Refuted by both (1)

### levels-lobby-wall-test-cannot-fail [] The 'back wall is still solid' smoke test cannot fail: the player position clamp, not the wall, stops Pip at z −9.5

- File: 
