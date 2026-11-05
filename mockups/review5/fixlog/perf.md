# Fix log: draw calls, particles, outline (area `perf`)

Ports 4203 (Playwright) and 4213 (vite). Scripts are in `tools/fix-perf/`: `draws.mjs` (per-room draw calls), `tops.mjs` and `why3.mjs` (what is still unmerged and why), `batches.mjs`, `checks.mjs` (prop hide/grab, bench frozen vs `?nofreeze`), `shots.mjs` (before/after), `fx4.mjs`/`fx7.mjs` (steam and dust).

Note for the next agent: `vite.config.ts` ignores `**/.claude/**`, so a dev server started inside an agent worktree **never sees edits**. Restart vite after every change, or you will measure stale code.

## Draw calls (R5-026)

Method: `snapshot().drawCalls` is every pass of one frame (shadow map, scene, OutlineEffect ink, and the GTAO re-render at q2). It is taken at the start camera 0.5 s after Start, on the host GPU (cap.mjs default). q2 is forced with `circuit-crew-quality=2`, and q0 is `?manual` without fullfx. "Batches" is the number of instanced prop batches.

| Room | q2 before | q2 after | q0 before | q0 after | prop batches before → after |
|---|---|---|---|---|---|
| lobby | 1027 | 668 | 779 | 517 | 111 → 23 |
| playground | 776 | 461 | 589 | 352 | 99 → 23 |
| meeting | 1590 | 928 | 1146 | 631 | 236 → 68 |
| lunch | 1573 | 1092 | 1177 | 787 | 146 → 40 |
| arcade | 1423 | 922 | 1105 | 730 | 152 → 35 |
| arcade-rush | 1417 | 916 | 1099 | 722 | 152 → 35 |
| garage | 1254 | 737 | 985 | 586 | 120 → 27 |
| qfn | 895 | 633 | 681 | 489 | 85 → 21 |
| observatory | 1451 | 879 | 1102 | 685 | 172 → 50 |
| spectrum | 1215 | 811 | 941 | 638 | 116 → 29 |

Totals fall 30–41% at q2 and 28–45% at q0. At q0, playground and qfn are under 500 and lobby is just over it. The rest are 586–787. What is left (from `tops.mjs`):
- **Pip: 51 meshes in every room**, drawn in 3–4 passes, so about 150–200 calls. These need merging per pivot in `pipRig.ts` (not my file; see shared changes).
- Room groups owned by other files: the lobby hub (68 meshes, `lobby.ts`), the lunch runtime and level groups (`lunch-runtime.ts`), the arcade cabinets (48, `arcade/room.ts`), and the garage robot (36, animated).
- The station parts the bench still holds and animates (clickables, tray parts, signs with their own canvas textures).

## Entries

| ID | Change (files) | Verified |
|---|---|---|
| R5-026 (P1, partial: see the numbers above) | **Props:** `prefabs.ts` `makeProp` runs `freeze()` on each template once it is built. All plain toon parts merge into one vertex-coloured mesh per template, so every copy shares it and `batchProps` makes one batch for it. Textured, transparent, emissive and `noAO` parts stay separate and still batch across templates. Parts with `castShadow=false` join the body's bucket, because `batchProps` makes every batch cast anyway, so the flag only split the merge in two. `game.ts` `batchProps` is unchanged (it already keys on geometry+material). **Benches:** `kit.ts` `liveKeep(station,[game])` walks the station object's fields (arrays, maps, sets, plain records such as the clickables list) and keeps every Object3D it reaches, plus anything named. It also returns the non-cached materials the station holds. `freeze(group, keep, unbaked)` gained the `unbaked` set: meshes using those materials still merge, but per material and never baked, so recolouring (`gndMat`, `brakeMat`, hot lamps) still works. `freezeBench(root, station, game, inner)` calls `freeze` on the bench root, then inside groups the station only shows, hides or moves whole. Called at the end of each constructor in `stations/{arcade,garage,observatory,qfn,spectrum}/station.ts`. `inner` is: arcade binsGroup, each bin and motorLoop; garage's ground, star and shared wire runs and the motor/brake coils; observatory `top`. `?nofreeze` turns bench freezing off for comparison. | The table above. `checks.mjs` (meeting): after `consume(chair)` + `updateBatches()`, the chair's instance matrix is zero-scale and the other instances in its batch still show; `E` next to a box grabs it. Before/after shots of meeting, lunch and arcade at the same camera (`shots-full/fix-perf-{meeting,lunch,arcade}-{before,after}[-close].png`) match except for the darker, thicker outline (R5-375). Garage, observatory and arcade frozen vs `?nofreeze` (`fix-perf-bench-*`) look the same. Spec results are below. |
| R5-372 (P2, rest) | `actors.ts` `glossyToon` calls `rimShader(s)` first in its onBeforeCompile (skipped with `?norim`). Its cache key is `'glossyToonRim'+spec+size` (`'glossyToon'…` with `?norim`). So Pip's hat, gloves and boots, the cable hose and the motor cans get the rim. | Typecheck and build. The shader chains on the same `opaque_fragment` anchor before the spec mix. |
| R5-313 (P2) | `particles.ts` dust: no more outlined toon spheres. Each puff is a camera-facing quad (billboarded in `onBeforeRender`) with a per-puff transparent MeshBasicMaterial and the shared 64 px radial-gradient alphaMap. depthWrite is false and outlines are off. Opacity fades .45 → 0 over 0.45 s. The quad is flattened to 0.45 height. The tint is the given floor colour, 12% darker. It starts at 0.16–0.20 m radius with growth ×2.2. It drifts slowly and doesn't spin. | `fx4.mjs` crop `fix-perf-dust-crop.png`: four soft, low, flattened scuffs with no outline or sphere. Note: `?manual` keeps the render loop running in real time, so a shot taken after cap.mjs's 0.9 s wait finds the puffs already gone. Shoot straight after `advance`. |
| R5-314 (P2, particles side) | `particles.ts` smoke/steam: same soft billboard and alphaMap. Peak opacity is .28 (was .5), growth is at most ×2.2 (was ×3.4), and sideways drift is ±0.15 m/s with lighter damping, so puffs separate. The colour gets 40% of a cool grey-blue, so the faint puff still reads over cream walls and white appliances. **The spawn interval (450 → 700 ms) is in `game.ts`**, outside this area's part of game.ts: see shared change 2. | `fx7.mjs` (puffs forced magenta) shows them rising above the coffee machine, which stands behind the vending machine at this camera. At their real .28 opacity they are faint soft wisps (`fix-perf-steam-crop.png`) and never a disc. |
| R5-375 (P2) | `toon.ts` OutlineEffect default colour is `[.035,.037,.072]` (was `[.13,.135,.2]`) and thickness is `.0055` (was `.0036`). | After shots: silhouettes are visibly darker and about 2 px wide. Pip's own heavier override (`thickness .007`) is set when the GLB is traversed in game.ts, which is not my area (shared change 3). |

## Skipped

- Merging Pip's rigid parts per pivot: it needs `pipRig.ts` (Astra's file) or the GLB traversal in `game.ts` (the lead's). Nothing could be done from my files.
- Freezing inside clickables and other held groups (garage tray parts, flip buttons, spectrum keys). Station code reaches into their children (`spectrum` sets `k.children[0].material`, `qfn` rebuilds `boardRoot` and raycasts `partsRoot.children`), so merging inside them is not safe without a per-group review.
- Desk variants each have their own template (meeting: 33 desk batches). Splitting desks into a shared body plus per-variant clutter would save about 20 more batches. Not done, to keep the change small.

## Needs shared change

1. **Pip (pipRig.ts, Astra).** Merge each pivot's rigid child meshes into one vertex-coloured mesh per material class (`kit.ts` `freeze(pivot, o=>o is a pivot/bone)` works: it keeps any child that is itself kept, and glossy/vertex-coloured meshes stay separate). 51 meshes → about 12–15, about −110 calls per frame in every room.
2. **R5-314 steam rate, game.ts (lead).** In the coffee steam line (`Math.floor(this.last/450)`), change both `450`s to `700`. The kettle in `meeting-strip.ts:92` (about 3/s) should become one puff every 700 ms too.
3. **R5-375 hero line, game.ts GLB traversal (lead).** Optionally set `o.material.userData.outlineParameters={thickness:.007}` on Pip's materials, after `seeOff`, because seeOff clones the materials.
4. Lobby hub (`lobby.ts`, 68 meshes), lunch room groups (`lunch-runtime.ts`), arcade cabinets (`arcade/room.ts`): `freeze(group, keep)` once built, keeping the toggled lamps, doors and screens.

## Test results

- `npm.cmd test`: 133 passed. `npm.cmd run build`: ok.
- Browser (`layout.spec.ts`, `smoke.spec.ts`, `routes.spec.ts`, PW_PORT=4203): first full run 23 passed, 2 failed. `layout: spectrum` failed (data-ready timeout at boot, the same flake render.md reported) and passed on re-run: layout is 10/10. `routes: meeting single reel only reaches when overstretched at a sprint` fails with 2.272 vs > 2.3. **This is pre-existing**: the same test on an untouched worktree of 7c668fb gives exactly 2.2721616 (physics only, nothing in this change). After the last particle tweak, smoke was re-run: 5/5 passed, with `npm.cmd test` still at 133 and the build ok.

## Open questions

- The ~500 target at q0 needs Pip merged (shared change 1). With it, every room should land at about 400–680. Getting lunch, arcade and observatory under 500 also needs the room groups in shared change 4.
