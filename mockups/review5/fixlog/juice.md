# Payoff, juice and world reactions fix log (review 5, batch B4)

Branch base: `claude/nifty-knuth-519jg0` @ ec09d01 (reset before any edits).

Files: `src/game.ts` (win, push-in, hitstop, flash, beats, coworker reactions, prop impact/break tiers, glass panes, Lunch fail beat), `src/render/audio.ts`, `src/render/particles.ts`, `src/stations/shared.ts`, the sign-off / fault / payoff lines of each `src/stations/*/station.ts`, `tests/station-garage.spec.ts`, `mockups/review5/tools/fix-juice/*.mjs`.

Shared pieces added (used across the entries below):
- `Game.freeze(s)` (hitstop, counted in `snapshot().hitstops`; `drive.advance()` ignores it, as the verifier asked), `Game.flash(color)` (a ≤120 ms full-screen flash, a DOM overlay made in game.ts), `Game.beat(kind)` (a juice log in `snapshot().beats`), `Game.cheerNear(at)`.
- Particles hold still during a hitstop (`fx.update(0)`), so the frame after a big moment still shows it. New particle kind `puff`: small, low, short, unoutlined, drifting sideways.
- `shared.ts`: `signOff(game, station, color, last, at?)` (milestone chime unless this step finishes the job, 0.05 s hitstop, confetti) and `fault(game, hold)` (hitstop + coral flash).
- `audio.ts`: `milestone()`, `win()` (kick, low arpeggio, held 5-note chord, crowd, music duck), `duck()`, `paused()`, `fail(kind)`, `fridgeWarn()`, `breakerTrip()`, `short(water)`, `ptcTrip()`, `fuseBang()`, `verdictFail(kind)`, `reject()`, `seat()`, `whirr()`, `docked()`, `slip()`; `knock()` is rate-limited.

## Fixed

| ID | Pri | What changed | Files | Verified by |
|---|---|---|---|---|
| R5-077 | P1 | **Win shot frames Pip and the payoff together** (verifier version). `Game.winFrame()` picks the view across the Pip→payoff line, 0.45 rad toward Pip's side, on the side nearest the current orbit; then the nearest distance (≥7 m stations, ≥8 m floors) at which Pip's feet and head and the payoff (±) all project inside NDC x −0.7…0.04, y −0.55…0.62 (left of the result card, inside the centre 70%), with the target shifted so the pair sits left. Cached per aspect/lens. The camera swings to it for 1.6 s, then the orbit is the player's again. `winFocus()` per station: garage = robot at the dock, observatory = dome, spectrum = pod on the last pad, arcade = lit back wall; qfn keeps the table. No teleporting Pip. | game.ts, stations | `tools/fix-juice/wins.mjs`: all 8 rooms print Pip feet/head and focus inside the box (e.g. meeting Pip −0.61…−0.68, screen 0.02; garage robot −0.69, Pip 0.03). Shots `fix-juice-win-*` |
| R5-080 | P1 | Arcade: while a play test runs (and for a 1.2 s beat after sign-off) the bench camera eases to lookX −1.8, distance 7.2, pitch 0.85 (camera-render verifier), so the serviced cabinet, marquee, kid and board are in frame; eases back after. Sign-off bursts confetti and a flash from the cabinet's marquee, with a hitstop. On a trip or pop the kid jumps with arms up. | arcade/station.ts | Shot `fix-juice-arcade-soak` (cabinet, PINBALL marquee, kid, board, meter all in frame) |
| R5-082 | P1 (partial) | Garage: on the stand the robot's head turns 1.2 rad to the bench (body and wheels stay on the rollers), so its face and red reboot eyes read from the bench camera; a reboot spins the head once round, eyes scale ×1.4, 10 stars at head height. Head faces forward again to drive. | garage/station.ts | Shot `fix-juice-garage-avalanche` (face toward the camera) |
| R5-029 | P1 | Garage kickback: no air arc across the MOSFET (garage-teach option A, truthful): the switch body itself flashes orange-hot (hot ×1.25, under the bloom threshold) and cools over the beat, a 0.35 m heat glow at ≤0.35 opacity, a point light ≤1.2 at 1 m, orange sparks and a small puff. Per-frame random intensity/opacity lines removed (verifier). | garage/station.ts | Shot `fix-juice-garage-avalanche`: SWITCH, NODE and the ACROSS SWITCH socket stay readable |
| R5-087 | P1 (partial) | Served beat: garage keeps the passed board fitted on screen while its five TEST cycles run (state still advances at once; any action ends the beat), and the last pass sends the robot off only after its cycles finish. Arcade holds the play-test framing 1.2 s after sign-off on the marquee confetti. Spectrum and QFN already had a held beat. Observatory: not done. | garage, arcade station.ts; garage spec | Garage spec updated (driving starts 3.4 s after the last TEST); passes |
| R5-093 | P1 | Three tiers: step bell (objectives, unchanged), `milestone()` (two-note up-chime + one crew cheer) for every bench sign-off/ship/log/send, the Meeting extension attach and the pin strike; `win()` a longer fanfare with a low kick, held chord, crowd and a music duck. A station's last step skips the milestone so only the win plays. | audio.ts, shared.ts, game.ts, stations | Code review; garage/arcade specs pass |
| R5-094 | P1 | Hitstops: win 0.12, plug-in 0.09 (now via `freeze`), slingshot 0.06, pin strike 0.06, glass 0.08, arcade trip/pop 0.07, garage fuse 0.07, bench verdict fails 0.06, sign-offs 0.05, Lunch fail 0.15. `snapshot().hitstops` counts them. | game.ts, shared.ts, stations | `wins.mjs` prints `hitstops:1` after the win; `reacts.mjs` after the glass |
| R5-095 | P1 | Win: soft full-screen flash, plus a flash, floor ring, 8 stars and confetti on the payoff (`winFocus`, not the bench stand). Faults: a coral ≤120 ms flash with the hitstop (arcade trip/pop, garage fuse, failed verdicts, QFN send-back, Lunch fail). Lunch fail also gets a flash and an 8-puff dust ring at the fridge/oven. | game.ts, shared.ts, stations | `reacts.mjs` beats log shows `flash` |
| R5-096 | P1 | `startDrive()` clears `cycleT`/`kickT`; `land()` returns while driving; the drive has a soft whirr every 0.45 s and a docked clunk + chime. | garage/station.ts | Garage spec passes |
| R5-097 | P1 | Two tiers in the prop impact branch: a knock (>4 m/s, sudden stop) startles coworkers within 3.5 m with a thud/clatter and a puff, no damage or cost, once per prop per second; a break only for fragile kinds (glass, monitor, mug, plant, printer, coffee, lamp) or any prop above 9 m/s. Not done: a visible cracked/tilted variant. | game.ts | Specs (Break nothing bonus on clean routes) |
| R5-090 | P1 | Meeting glass panes are Fixed bodies; a per-step check shatters a pane when a dynamic prop faster than 3 m/s reaches its box (+0.15 m) or Pip sprints (>5.5) into it: 14 shards, a flash, the smash, boardroom alarm (5 m), 0.08 s hitstop, damage +1 and cost 250. Panes are excluded from grabbing. A walk into a pane does nothing. | game.ts | `reacts.mjs`: sprint → pane gone, damage 0→1, cost 250; walk → pane stays; shot `fix-juice-glass-break` |
| R5-108 | P1 (partial) | Plug-in sparks make coworkers within 5 m bounce and cheer (`cheerNear`); the machine switch spark alarms within 1.5 m; bench faults alarm within 5 m (was 3). Kid startle in the arcade. Meeting breaker trip reaction: needs meeting-strip.ts (below). | game.ts, stations | Code review |
| R5-089 | P1 (partial) | Coworkers react to Pip himself: sprinting within 1.4 m makes one jump (alarm, voice), a stroll past earns an "hm", each at most every 6 s. Gag props on the clean lanes and the Playground reel length: not done (level data). | game.ts | `reacts.mjs`: sprint past a Playground coworker → alarmed 1 |
| R5-088 | P1 (partial) | Lunch: the fridge is heard warming (compressor stutter every 4 s from temperature 0.7, a 660 Hz double beep every 2 s from 0.9); on failure a sad trombone with a fridge clunk or a sizzle, the music drops out, a 0.15 s hitstop and a coral flash. Not done: oven warning sprite, HUD icon flash (lunch-runtime/ui). | game.ts, audio.ts | `reacts.mjs`: `fail` beat, `failAt` = fridge |
| R5-119 | P1 (partial) | Lunch fail: Pip no longer dances (rig `won` false), turns to look at the fridge or oven, and the camera frames Pip with the fail spot (`failAt` feeds `winFocus`); coworkers don't do the win bounce. Slump pose: needs pipRig.ts. | game.ts | `reacts.mjs`; shot `fix-juice-lunch-fail` (the card blurs the room after 1.2 s) |
| R5-120 | P1 (partial) | Named fault cues: arcade PTC trip = `ptcTrip()` (tick + rising hum), garage dead short = `fuseBang()`; failed verdicts have their own timbre (`verdictFail`: reset bonk for garage, falling sine for observatory/spectrum, double buzz for a failed QFN check). `breakerTrip()` and `short(water)` exist for the Lunch and Meeting call sites (below). | audio.ts, stations | Code review |
| R5-156 | P1 (partial) | The new win framing puts the Playground camera beside Pip looking past him at the lamp, so the lamp head is never between camera and Pip. The glow/light values live in decor.ts (below). | game.ts | Shot `fix-juice-win-playground` (Pip clear and readable, lamp in frame) |
| R5-169 | P2 | `fastestProp` excludes the held prop and disabled ones; `snapshot().beats` logs impact/break/spark/confetti/alarm/slingshot/flash/win/fail. | game.ts | `reacts.mjs` prints beats |
| R5-219 | P2 (partial) | QFN send-back: rubber-stamp thunk + two-pulse reject buzzer, hitstop + coral flash, the parts hop back into the jig (`dropIn`), alarm 5 m. Not done: part-specific red rings. | qfn/station.ts | Code review |
| R5-228 | P2 (partial) | Music ducks under the win fanfare, drops out on a Lunch fail, sits low while paused. No new songs. | audio.ts, game.ts | Code review |
| R5-230 | P2 (partial) | Startle lasts 1.6 s; the coworker looks at the crash for 0.5 s, then turns to Pip; an onset hop of 0.25 m; a lower second voice per extra three startled. Grudge counter: not done. | game.ts | Code review |
| R5-231 | P2 | Slingshot alarms every cable segment midpoint (3 m) and every flung prop's start (2 m). | game.ts | Code review |
| R5-240 | P2 | Arcade LED halo capped at 0.6 m / 0.5 opacity, LED light at 1.2; popped blocks and LEDs give 3–4 sideways `puff`s (≤0.3 opacity, ~0.6 s) instead of a rising smoke ball. | arcade/station.ts, particles.ts | Code review |
| R5-247 | P2 | Station toasts hide when Pip stands up (arcade, qfn, observatory, spectrum). | stations | Specs |
| R5-260 | P2 | Wrap knock rate-limited to one per 0.3 s; unwrapping plays a soft `slip()` at most every 0.5 s. | audio.ts, game.ts | Code review |
| R5-261 | P2 | Bench slots play `seat()` (two dry clicks) instead of the plug-seated chime (arcade, garage, observatory). | audio.ts, stations | Code review |
| R5-327 | P2 | Impact dust is 3 floor-level `puff`s, pushed away from any coworker within 1 m. | game.ts | Code review |

## Verification status (stopped early at the coordinator's request)

- `npm.cmd test` (124 passed) and `npm.cmd run build` pass.
- Browser specs: `station-garage` and `station-arcade` passed (4/4) after the garage/arcade changes. The full-suite run was stopped before it finished, so **the other specs have not been run against this branch yet**: lunch, lunch-rules, routes, objectives, layout, smoke, lobby, station-arcade-rush, station-observatory, station-qfn, station-spectrum. Run them first next session. The arcade 1.2 s post-sign-off framing hold went in after the arcade spec passed.
- The likeliest risks: `objectives`/`routes` "Break nothing" and alarm checks (new impact/break tiers, R5-097), the `layout` audit (glass panes are now Fixed bodies), and specs that read `.station-toast` after standing up (R5-247 hides it).

## Partly done: what remains

- R5-082: rotating the whole robot to −π/2+.35 with matching rollers and harness (room.ts). Only the head turns now.
- R5-087: the observatory LOG has no held beat. The arcade marquee/board swap to the next cabinet the moment you sign off; only the camera framing holds.
- R5-088 / R5-119 / R5-120 / R5-108 / R5-156: the call sites in other agents' files listed under "Needs shared change".
- R5-089: gag props near the clean lanes (non-damaging, out of the 1.2 m lanes) and the Playground reel at 18.7–18.8 m.
- R5-097: a visible cracked/tilted state for broken props.
- R5-219: red rings only on the part named in problems[0], and the connector chevron.
- R5-228: hub and bench songs. R5-230: grudge counter and shuffle-away.
- DR-04 spec (a spark or trip within 3 m of a coworker raises `snap().alarmed`): not written.

## Skipped

- R5-029 extras: the noise zap along the ground trace and the avalanche scorch counter.
- R5-087 observatory beat; R5-097 cracked/tilted variant meshes (props/prefabs work).
- R5-089 gag props, R5-229 coworker patrols, R5-232 paper flutter gag: level data and new prop behaviour in other agents' room code.
- R5-168 (Lunch E vs cable ends): lunch-runtime.ts is the lead's file.
- R5-219 part-specific rings, R5-228 new songs, R5-230 grudges.

## Needs shared change

- **meeting-strip.ts:82 (R5-108/120/094/095)**: on trip call `g.audio.breakerTrip(loadsDropped)`, `g.freeze(.08)`, `g.flash('#ff7a6b',.22)`, `g.alarm({x:12,z:-5.5},6)` and two `voice('groan')`; on unplug replace the three groans with one `voice('hm')`, and a `bell(988,.3,.03)` once the gauge is back under the limit.
- **lunch-runtime.ts:264 (R5-120/094)**: branch on `event.kind`: `'short'` → `g.audio.short(water)`, `'trip'` → `g.audio.breakerTrip()`; add `g.freeze(.08)`.
- **lunch-runtime.ts:156 (R5-094)**: replace `g.audio.plug();g.burst(...)` with `g.audio.plug();g.plugFlash(target.pos)` so Lunch plug-ins match the other floors.
- **lunch-runtime.ts BURN_WARNING (R5-088)**: a pulsing warning sprite over the oven at y 2.6 and double-rate smoke from the oven top; flash the HUD oven icon red (game-ui).
- **lunch-runtime.ts:186 (R5-168)**: with E, take the cable-end branch only when no prop is within 1.65 m (F stays cable-only), and show the E grab prompt.
- **render/pipRig.ts (R5-119)**: a `failed` input: arms down and forward (lx=rx≈−.3), head pitch +.35, no bounce, one .3 squash; game.ts already passes `won:false` and looks at the fail spot, so it only needs the pose.
- **levels/decor.ts:93 (R5-156)**: shade `hot('#fff0c0',1.4)`, glow `glow(game.root,…,1.2,.4)`, pointLamp intensity 6 (keep distance).
- **ui/game-ui.ts (R5-077 garage)**: hold the result card's panel ~1.2 s after a station win so the dock lamp and confetti read first.

## Open questions

- Win framing swings the camera to a side view for 1.6 s and then hands the orbit back; if a room's interior wall ends up between camera and pair, the see-through oval is off on win shots. None of the 8 rooms showed it at the clean-route end spots, but other end spots might.
- The fragile list for the break tier is a guess (glass, monitor, mug, plant, printer, coffee, lamp). Chairs, boxes and bins now only break above 9 m/s.
