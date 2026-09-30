# Review fixes: Codex continuation, 2026-09-29

This continuation combines `claude/nifty-knuth-519jg0` (25136ee) with
`claude/review-fixes-wip` (5ee646c) using their Git history. The shared bench UI,
portrait camera, lobby readability, Via Rush clock/result and true draw-call
reporting from the published branch are preserved.

## Changes

- QFN: edits clear obsolete problem rings; the board title clears tall components.
- Waterworks: closer bench framing, larger labels, visible CHECK caption and
  correctly rendered subscripts in the console, panels, toasts and hover hints.
- Observatory: readable rod captions, cable clear of the ANTENNA label, consistent
  wire-link terminology and a capitalised decode hint.
- Arcade/Garage: quieter confetti, celebrations behind the bench camera, a visible
  Garage fuse RESET control and fresh toasts when sitting down.
- Archive: the hidden-terminal prompt names M, and the toast follows the shared
  bench placement. Phones have Search, Datasheet and Work order tabs; selecting
  evidence opens its citation slots. Search results remain available on phones.
- Station costs use ordinary credits; prompts name actual key bindings. Spawn
  clutter was moved so the first hint points toward the station's physical task.
- Portrait bench framing includes both tool racks. The Via ROW stepper sits at
  the front of the counter, clear of its order panel.
- Stand up is a native button that receives touch input instead of passing taps
  through to the canvas; keyboard activation also works.

## Verification

- Production build and all 142 unit tests pass.
- All 50 browser checks passed: 47 in the full two-worker run, then three in a
  focused single-worker rerun (`npm run smoke -- --last-failed --workers=1
  --timeout=120000`). Two cable routes exceeded the original 60-second limit under
  concurrent software rendering; both passed in 24–29 seconds when rerun alone.
  The new QFN check exposed the touch exit bug above; it passed after the fix.
- `tools/bench-review.mjs` prepared all eleven station routes (including Via Rush),
  captured 1440×900 and 390×844 views, and reported no page errors. Selected
  captures are checked in below; all captures and draw-call counts are written to
  the ignored `artifacts/bench-review/` folder.
- New browser coverage fills and requests a complete Archive work order by touch,
  checks desktop resizing and terminal reopening, and taps real QFN PEN/CHECK
  controls after verifying both racks are in the phone viewport.

| Station | Desktop | Phone |
|---|---|---|
| QFN | [Bench](screenshots/bench-qfn.jpg) | [Both tool racks](screenshots/bench-qfn-phone.jpg) |
| Archive | [Terminal](screenshots/bench-archive.jpg) | [Search](screenshots/bench-archive-phone.jpg), [Datasheet](screenshots/bench-archive-phone-datasheet.jpg), [Work order](screenshots/bench-archive-phone-order.jpg) |
| Waterworks | [Bench](screenshots/bench-waterworks.jpg) | Captured by the review script |
| Observatory | [Bench](screenshots/bench-observatory.jpg) | Captured by the review script |
| Arcade | [Bench](screenshots/bench-arcade.jpg) | Captured by the review script |
| Garage | [Bench](screenshots/bench-garage.jpg) | Captured by the review script |

## Still open

Static room batching remains the next performance task: the capture pass reports
about 829–1,262 calls in rooms and 413–900 at prepared desktop benches on this
renderer. These counts are not an FPS claim for integrated graphics. The shared
button style, cross-station reset behaviour and Spectrum floor-mark cleanup remain
in `NEXT_STEPS.md`. More Rush modes and the capstone are later features.

Phone framing and two touch workflows are checked here; readability and fine
interaction on a physical phone, blind playtests, cable feel and real laptop
performance still need human checks.
