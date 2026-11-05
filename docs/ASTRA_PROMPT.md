# Prompt for Astra (second agent on Circuit Crew)

Copy everything below the line into Astra.

---

You are joining **Circuit Crew**, a TypeScript + three.js r186 + Rapier physics-comedy repair game. It teaches simple electricity in the style of Good Job! The repo is `C:\Users\yousi\Circuit-Quest` (GitHub remote `origin`). Another agent (Claude) is working in that folder at the same time, on branch `claude/nifty-knuth-519jg0`. You two split the work by **files**, so neither of you overwrites the other. The product owner is asleep, so work through your stages one after another without stopping to ask. When a design decision is needed, pick the simplest option that keeps the hard rules in `AGENTS.md`, and write the question down (see Finish).

## 1. Setup (once). Never work in the main folder.
```
cd C:\Users\yousi\Circuit-Quest
git fetch origin
git worktree add C:\Users\yousi\Circuit-Quest-astra -b astra/work origin/claude/nifty-knuth-519jg0
cd C:\Users\yousi\Circuit-Quest-astra
cmd /c mklink /J node_modules C:\Users\yousi\Circuit-Quest\node_modules
```
- Do all your work in `C:\Users\yousi\Circuit-Quest-astra`, on branch `astra/work`.
- Don't run `npm install`.
- Never delete through the `node_modules` junction. If you must remove it, use `cmd /c rmdir node_modules`.
- On Windows, use `npm.cmd` / `npx.cmd`.
- Use dev and test ports **4190–4199** only. Claude uses 4173 and 4187.

## 2. Read first
1. `AGENTS.md`. Its hard rules are final.
2. `mockups/review5/FIXED.md`, especially "Where we stopped". It lists what is already fixed; don't redo those.
3. `mockups/review5/RULES.md`, the design rules.
4. `mockups/review5/REVIEW.md` is huge, so don't read it whole. Print single entries with `node mockups/review5/tools/entry.mjs R5-033 R5-035 --full`. A "Verifier correction" in an entry overrides the reviewer's fix.
5. `mockups/review5/fixlog/*.md`. The "Needs shared change" sections list exact edits other agents wanted in shared files. Do the ones in **your** files.

## 3. Your files (only edit these)
- `src/sim/grade.ts`
- `src/ui/store.ts`
- `src/ui/game-ui.ts`
- `src/ui/objectives.ts`
- `src/ui/screens.ts`
- `src/ui/lunch-hud.ts`
- `src/ui/*.css`
- `src/hub/lobby.ts`
- `src/render/pipRig.ts` and `src/render/actors.ts` (stage 3 only)
- new test files under `tests/` and `src/**/*.test.ts`
- `mockups/review5/fixlog/astra.md`
- `mockups/review5/tools/astra-*/`

**Claude's files (don't edit them):**
- `src/game.ts`
- `src/sim/cable.ts` and `src/sim/electrical.ts`
- `src/lunch-runtime.ts` and `src/meeting-strip.ts`
- `src/props/*`
- `src/levels/*`
- `src/stations/*`
- `src/render/*`, except the two files above
- `public/models/*`
- `tools/*`

If a fix needs one of Claude's files, don't edit it. Add the exact change under "Needs Claude" in your log, and Claude will do it. A time limit or grade threshold that lives in a level or station file counts as one of these. Exception: if your fix needs a tiny new hook (one field or one call), you may add it and say so in the log.

## 4. Stages (do them in order; after each one, run Finish and then start the next)
**Stage 1: grading and progression (review batch B5).** Entries: R5-033, R5-035, R5-069, R5-078, R5-079, R5-084, R5-085, R5-099, R5-112, R5-126, R5-150, R5-181, R5-220, R5-221, R5-238, R5-243, R5-251, R5-285. Skip any that FIXED.md or a fixlog marks done. Goals:
- An idle run never earns an A overall.
- The clean route earns A on every axis.
- A chaos route still wins, and chaos never fails.
- The result card shows your previous best.
- Rush with zero cabinets grades below A.

Add vitest tests for the grade rules.

**Stage 2: prompts, job card and text (batch B6).** Entries: R5-008, R5-102, R5-103, R5-105, R5-107, R5-109, R5-135, R5-174, R5-183, R5-198, R5-242, R5-245, R5-250, R5-252, R5-272, plus every "Needs shared change" item in the fixlogs that lands in your files (objectives steps and names, the Lunch conveyor and fridge steps, game-ui). Goals:
- The job card's current step and the on-screen prompt always name the same object.
- Text at a bench stays short, and no value appears twice.
- Labels are at least 14 px tall at 1440×900.

Bench hover text and monitor text live in station files, which are Claude's, so list those changes under "Needs Claude". Desktop only: phone and touch work is deferred.

**Stage 3: animation pass (Pip and coworkers).** First check that the models branch is merged: `git fetch origin` then `git merge-base --is-ancestor ddfed31 origin/claude/nifty-knuth-519jg0` (exit code 0 means it is). If it isn't merged yet, do Stage 4 first and come back. Then:
- Merge `origin/claude/nifty-knuth-519jg0` into `astra/work`.
- Improve Pip's animation in `src/render/pipRig.ts`: anticipation and follow-through on grab, throw and slingshot; a squash on landing; a stumble when bumped; a celebrate on win; a tired idle.
- Improve the coworkers' animation in `src/render/actors.ts`: idle fidgets, an alarmed jump, a happy bounce, and turning their head toward Pip.

Keep the toon style. You can't change `game.ts`, so use the `PipState` fields that already exist. If you need a new field (for example `bumped`), add it to `PipState` as optional and ask Claude to set it, under "Needs Claude". Take before and after screenshots and look at them.

**Stage 4: test coverage.** Write the Playwright specs the review asks for in B5 and B6:
- an idle run doesn't get an A;
- the clean route gets an A;
- the chaos route wins;
- the card step matches the prompt on every clean route;
- a word budget at each bench.

Fix them until they pass, or record them as known failures, with the reason, under "Needs Claude".

**Stage 5: anything left.** These are the P2 entries whose files are only in your list: `grep -n "| P2" mockups/review5/REVIEW.md` and check each entry's Files line. Do them until none are left, then stop.

## 5. Verify (every stage)
- `npm.cmd test` and `npm.cmd run build` must pass.
- Run browser specs with `set PW_PORT=4191` then `npx.cmd playwright test <specs> --reporter=line`. They use software rendering, so they're slow; run only the ones for your area, plus `smoke` and `layout`.
- For screenshots, start `npx.cmd vite --port 4192 --strictPort` in the background and use `mockups/review5/tools/cap.mjs` (read its header) with `BASE=http://localhost:4192`. `?manual` exposes `window.__game`. Look at your shots before you claim a visual fix. Stop the server when you're done.
- A 403 on the Fredoka font is harmless.

## 6. Finish (after every stage)
1. Update `mockups/review5/fixlog/astra.md`. Add a section for the stage with:
   - a table: entry ID, change, files, how you checked it;
   - skipped entries and why;
   - **Needs Claude** (exact edits in Claude's files);
   - **Questions for the product owner**.
2. Commit. Use small commits with clear messages, and end each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or your own attribution line). Don't commit `node_modules`, `dist` or `mockups/review5/shots-full/`.
3. `git push origin astra/work`. Never push to `claude/nifty-knuth-519jg0` or `main`. Claude merges your branch after each of its stages.
4. Before starting the next stage: `git fetch origin && git merge origin/claude/nifty-knuth-519jg0`. If there's a conflict in a file that's yours, keep both sides' intent. If it's in one of Claude's files, take Claude's version.
