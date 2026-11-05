# Brief for review 5 fix agents (round 2)

You are fixing design-review findings in **Circuit Crew**, a TypeScript + three.js + Rapier physics-comedy repair game that teaches simple electricity (Good Job!-style). You work in your own git worktree of the repo. The main checkout is `C:\Users\yousi\Circuit-Quest` and the branch is `claude/nifty-knuth-519jg0`. On Windows, use `npm.cmd`/`npx.cmd`, from Git Bash or PowerShell.

## Setup (do this first)
1. `git reset --hard claude/nifty-knuth-519jg0`. Your worktree may have been cut from an old `main`; the review's code and line numbers are on this branch. Check that `git log --oneline -1` shows the branch tip, and do this before you edit anything.
2. `cmd /c mklink /J node_modules C:\Users\yousi\Circuit-Quest\node_modules`. This shares the installed packages. Don't run npm install, and never delete the junction's contents.
3. Read `AGENTS.md`. Its hard rules:
   - solo only;
   - minimal text HUD, no floating world labels;
   - big dense rooms;
   - the cable is the star;
   - clean solution first, and chaos is never punished;
   - Good Job grading;
   - forgiving interaction;
   - player-controlled camera;
   - toon look (3-step ramp, dark outlines, restrained glow);
   - truthful electricity at the level taught.
4. Read `mockups/review5/FIXED.md` to see what is already fixed. Don't redo those.
5. The report is `mockups/review5/REVIEW.md`. It is huge, so don't read it whole. Print your entries with `node mockups/review5/tools/entry.mjs R5-123 --full`. The design rules are in `mockups/review5/RULES.md`.

## Scope
- Fix every **P1** in your list. Then do the P2s that are quick and in your files.
- **Desktop/laptop only.** The product owner deferred phone and touch work.
- A "Verifier correction" in an entry overrides the reviewer's fix.
- **Stay in your files.** Five other agents are working in parallel, and the lead is editing `src/ui/objectives.ts`, `src/ui/game-ui.ts`, `src/ui/screens.ts`, `src/sim/electrical.ts` and `src/lunch-runtime.ts`. If a fix needs a file outside your list, skip it and add it to "Needs shared change" in your log, with the exact change you would make.
- Keep each room's intended solution working (`tests/*.spec.ts`). If you change a rule, update the unit tests and specs to match the corrected behaviour.

## Verify
- `npm.cmd test` and `npm.cmd run build` must pass.
- Run the browser specs for your area only: `set PW_PORT=<your port>`, then `npx.cmd playwright test <specs> --reporter=line`. They use software rendering, so they are slow.
- For screenshots, run your own dev server in the background with `npx.cmd vite --port <your port> --strictPort`. Use `mockups/review5/tools/cap.mjs` (read its header) with env `BASE=http://localhost:<your port>`. Use `localhost`, not 127.0.0.1. `?manual` exposes `window.__game` for setting the camera (yaw, pitch, zoom). Put your scripts in `mockups/review5/tools/fix-<area>/` and name shots `fix-<area>-*`. Look at your shots with the Read tool before you claim a visual fix. Stop the server when you're done.
- A 403 on the Fredoka font comes from the junction and is harmless.

## Finish
- Write `mockups/review5/fixlog/<area>.md` with:
  - a table of each entry ID: what you changed (files) and how you verified it;
  - entries you skipped, and why;
  - needs shared change;
  - open questions.
- Commit on your worktree branch. End the message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push. Don't commit `node_modules` or `mockups/review5/shots-full/`.
- In your final reply give: the branch, the commit, the IDs you fixed and skipped, and the test results. Keep it short.
