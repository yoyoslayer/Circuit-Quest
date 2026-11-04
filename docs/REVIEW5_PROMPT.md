# Prompt: design review 5 (playability + 3D models)

Paste everything below the line into a new Claude Code session opened in this repo on your own
computer (e.g. `C:\Users\yousi\Circuit-Quest`). Run `git pull` first so you have the latest branch.

---

You are reviewing **Circuit Crew** (this repo, branch `claude/nifty-knuth-519jg0`). Read `AGENTS.md`
(hard rules), then `docs/NEXT_STEPS.md` and `docs/PROGRESS.md` for where the game stands. Earlier
reviews live in `mockups/review3/` and `mockups/review4/` (`DESIGN_A.md`, `DESIGN_B.md`); don't
re-report what they already fixed, but do re-check it.

**Goal:** a thorough design review whose output is a report *for a future coding session to execute*.
Do not fix anything in this session. Write the report to `mockups/review5/REVIEW.md`, put screenshots
in `mockups/review5/shots/`, then commit and push.

Use the multi-agent Workflow tool for this (ultracode): fan out reviewers per room and per
dimension, adversarially verify every finding against the code or a screenshot, run a completeness
pass, then synthesize. Use it only if the session supports it; otherwise do it yourself, room by room.

## What to judge (top goals, in order)

1. **Fun.** Is each room enjoyable for five minutes? Is the cable (the star, AGENTS rule 4) satisfying:
   strain colours, wrapping, slingshot? Is chaos rewarded, not punished? Pacing, dead time, tedium.
2. **Playable.** Can each job be finished? Soft-locks, blocked routes, unreachable items, controls
   that fight the player, camera problems, prompts that point at the wrong thing.
3. **Teaches through play.** Does each station make the electronics concept the *mechanic*, not text?
   Is the metaphor accurate at the level taught (AGENTS rule 10)? Do failures show *why*?
   Read each `src/stations/*/logic.ts` and flag simplifications that would mislead.
4. **Easy to understand.** Could a new player work out what to do from the objective card, icons,
   prompts and the scene alone (AGENTS rule 2: minimal text)? Where is there too much text, or too little?
5. **3D models.** For props (`src/props/prefabs.ts`), room dressing (`src/levels/dressing.ts`,
   `decor.ts`, `src/stations/*/room.ts`), Pip (`src/render/pipRig.ts`, `public/models/pip.glb`),
   coworker blobs (`src/render/actors.ts`), lobby doors (`src/render/portal.ts`, `src/hub/`):
   - detailed enough at the game camera and at bench close-ups?
   - match the art style (toon ramp, dark outlines, `concept/01_CURRENT_big_meeting_office.png`,
     `reference/render_kit/lib.js`, `mockups/look/LOOK.md`)?
   - overlapping/interpenetrating parts, objects floating or sunk into floors/walls?
   - buggy looks: z-fighting, missing outlines, stretched textures, wrong scale, flicker,
     things showing through walls, odd silhouettes (e.g. the Playground beanbags read as bread loaves).

## Rooms

HQ lobby, Playground, Big Meeting, Lunch Rush, Overheating Arcade (+ Arcade Rush), Robot Garage,
QFN bench, Signal Observatory, Spectrum Delivery. Level ids: `lobby playground meeting lunch arcade
arcade-rush garage qfn observatory spectrum`.

## How to run and look

- Windows PowerShell: use `npm.cmd` instead of `npm`. `npm.cmd install`, then the dev server:
  `npx.cmd vite --port 4173`. Open `http://127.0.0.1:4173/?level=<id>` in a browser.
- `?manual` exposes `window.__circuitCrew` (`snapshot()`, `drive.act/advance/walkTo/audit`) for
  scripted checks; add `&fullfx` for full effects. `?norim` turns off the new edge light.
- Screenshot tools (need the 4173 server): `node tools/debug/look.mjs <levels...>` (full effects,
  start camera), `tools/debug/bench-*.mjs` (bench close-ups), `tools/debug/gallery.mjs` (props),
  `tools/debug/doors.mjs` (lobby doors), `tools/debug/audit.mjs <levels...>` (prop count + start overlaps).
  Several tools launch Chromium with `--use-angle=swiftshader` (software rendering, slow); on your
  own GPU you can switch those args to the host GPU, as `tools/shot.mjs` does.
- The browser specs in `tests/*.spec.ts` script the intended solution of every room: read them to
  learn each solution. They run against `npm.cmd run build` + preview on 4187.
- Take enough shots per room: start view, survey view (Tab), each bench close-up, mid-solve and
  failure states, plus close-ups of models. View them yourself; don't guess from code alone.

## Report format (`mockups/review5/REVIEW.md`)

1. A one-paragraph verdict per goal above.
2. A per-room section: fun, playability, teaching, clarity and model notes.
3. **The fix list**, the main deliverable. One row per finding, ordered by priority:
   - ID, priority (P0 blocks play / P1 hurts fun or teaching / P2 polish), room, category
     (fun, playability, teaching, clarity, model-detail, art-style, overlap, visual-bug)
   - what is wrong, with evidence (file:line or screenshot path)
   - the concrete fix (files to change, what to change), and how to verify it (test or shot)
   - verdict from verification: CONFIRMED or PLAUSIBLE
4. Open questions for the product owner (only where a hard rule or design choice is unclear).

Keep AGENTS.md's hard rules in mind when proposing fixes (solo only, minimal text HUD, dense rooms,
the cable is the star, clean solution first, Good Job–style grading, forgiving interaction,
player-controlled camera, toon look, truthful electricity). Commit messages end with the
`Co-Authored-By` line your session gives you.
