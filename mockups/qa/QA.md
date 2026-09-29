# Circuit Crew: final QA sweep (2026-09-29)

Playwright Chromium with GPU flags, at 1440x900 and 390x844 touch. Real keys, mouse and wheel, plus the `&manual&fullfx` driver for the completion routes. **No page errors and no console errors anywhere.** The only warnings were the autoplay ones in item 13.

## Defects (highest priority first)

**P1: fix before ship**

1. **Tab does nothing on any menu.** Open `/` and press Tab three times: focus stays on `<body>`. The same happens on the pause, result and fail screens. Keyboard players can't reach the Jobs, sound or secondary tag buttons. Cause: `src/game.ts:139` calls `preventDefault()` on Tab on every screen, because Tab is the survey key. It should do that only while `screen==='play'`.
2. **C "reset camera" goes almost straight down, then jumps.** Start any job and press C: the camera goes near top-down (`02-C-reset-topdown.jpg`). A 4 px right-drag afterwards snaps it back to an angled view (`03-C-then-4px-drag-jump.jpg`). Cause: `src/game.ts:150` sets `pitch=.83` (a dead `pitch=0` comes just before it), but orbit clamps pitch to [-.3, .45] (`:146`). Tab survey pressed after C also inherits that pitch and crops the floor.
3. **Mute is forgotten after R, Restart or Next job.** Mute from pause, then press R or finish a job and click Next: sound is back on (`aria-pressed=false`). Cause: `Sound.muted` lives only in memory (`src/render/audio.ts`). Store it the way `circuit-crew-quality` is stored.

**P2: visible polish issues**

4. **Window light shafts wash Pip out.** Zoom in and walk toward the back wall in Big Meeting, or use the phone stick: Pip turns pale and see-through (`05-…`, `06-mobile-…`). Cause: the additive shaft planes in `src/levels/dressing.ts:34` (`windowShaft`) draw over Pip.
5. **Interior walls never fade.** In Lunch Rush, stand inside the kitchen near the corridor wall (about (-7.2,-0.3)): only the hat shows (`07-…`). Orbiting low in Big Meeting hides Pip behind the server-room wall (`10-…`). Cause: only pillars are pushed to `occluders` (`src/levels/decor.ts:53`). `interiorWall` (`:44`) walls are skipped by the fade in `src/game.ts:322`.
6. **Pip can end up under the action bar.** At default zoom, right-drag the orbit downward in Big Meeting: Pip lands at the bottom edge behind the HUD (`08-…`). Cause: the diorama `follow` factor (0.25–0.5, `src/game.ts:307`) doesn't keep Pip clear of the HUD.
7. **Survey (Tab) doesn't show the whole Big Meeting floor.** The vending side and the lounge are cut off at 1440x900 (`04-meeting-survey-cropped.jpg`). The survey distance is a fixed 36.5 (`src/game.ts:307`) and doesn't adapt to level size or aspect ratio.
8. **Smoke reads as stacked snowballs.** Coffee steam in Big Meeting (`09-coffee-steam-snowman.jpg`) and the scar smoke in Lunch Rush (`11-…`) show as a column of opaque toon icosahedra that grow to about 0.7 m. Source: the smoke branch in `src/render/particles.ts` and the 450 ms emitter at `src/game.ts:384`.

**P3: minor**

9. **Dead cable still flashes "connected".** In Lunch Rush, carry thin-2 through the door without wedging it; the door cuts it (cable goes black). Plugging it into the kitchen post still flashes the strain card gold (`11-lunch-dead-cable-connected-flash.jpg`). Cause: `src/ui/game-ui.ts:171` checks only that both ports are set, not `lead.dead`.
10. **Pip is missing from the Big Meeting win shot.** The push-in and result tag frame a foreground coworker and a pendant lamp (`12-meeting-result-no-pip.jpg`). Pip is outside the glass room. Source: `winFocus`/`pushing` in `src/game.ts:311,333`.
11. **Jobs row overflows at 1440 wide.** The third tag is cut off and the arrow buttons overlap tags (`01-jobs-1440-overflow.jpg`). Cause: the `wrap-160` threshold in `layoutJobs` (`src/ui/game-ui.ts:82`) turns on carousel mode even on desktop.
12. **Storeroom lamp shows through the darkness.** The lamp shade (about 2.2 m) sticks up through the dark storeroom lid (1.5 m) and renders bright (`13-…`). Source: `src/lunch-runtime.ts:52,96`.
13. **Autoplay warnings on autostart.** Opening a job URL that autostarts with no user gesture (`?go`, a fresh reload) logs 3–12 "AudioContext was not allowed to start" warnings. Audio still unlocks on the first input. Cause: `begin()` calls `audio.start()` (`src/game.ts:157`, `src/ui/game-ui.ts:47`); it could defer to the unlock handler.
14. KeyR on the title or Jobs screen reloads the page (harmless but pointless): `src/game.ts:150`.

**Note on the Lunch Rush repro in the brief:** as written (no wedge), the swinging door cuts thin-2 before it reaches the post, so nothing trips. The short and trip happen once the door is wedged first (E the wedge at (-3,7), drop it at (0,1.4)). That matches the door-cut rule, so it isn't a bug. See `21-ok-lunch-short-trip.jpg`.

## Verified working
- Title: Play, the Jobs button, KeyJ, Enter to begin, and the sound toggle (icon and `aria-pressed`).
- Jobs screen: arrows and A/D (wrap around), Enter, Esc, Home, click to select then click to start, and Start playing for all three jobs.
- In every level: walk, sprint, jump, E/Q grab and throw, F/Q cable, orbit and zoom limits, and Tab survey at the default pitch. Pause (resume, restart, jobs, sound) and R restart work.
- Playground completes with grade A. The result buttons all work, Enter picks Next, and the best grade shows on the Jobs shelf.
- Big Meeting: the coupler, then the extension (max 37.2), then plugging in wins; Enter on the result goes on to Lunch Rush.
- Lunch Rush: the short and breaker trip, and the spoil failure at about 125 s; Retry resets it. The thermometer HUD tracks temperature.
- Phone (390x844): title, jobs, stick, pause and the fail tag lay out correctly.
