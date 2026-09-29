# Research, source code and provenance

Research checked on 2026-09-28. Links are source references and do not imply endorsement or affiliation.

## Game references and specific borrowings

| Reference | Verified characteristic | Proposed use in Circuit Crew |
| --- | --- | --- |
| [Good Job! — Nintendo](https://www.nintendo.com/us/store/products/good-job-switch/) | Office-themed action puzzles, tasks such as restoring internet and cleaning goo, solo or local partner; physical equipment and multiple messy approaches. | Rooms are tools. Push, carry, route and move equipment to meet an observable service goal. Adapt the playful damage/mess feedback while keeping electrical errors causally understandable. |
| [Good Job! — Paladin Studios](https://www.paladinstudios.com/goodjob/) | Developer page describes bizarre department tasks, such as logistics and watering plants, with a friend. | Keep job briefings concrete and mechanics toy-like. |
| [Gang Beasts — official press pack](https://gangbeasts.game/press-pack) | Gelatinous characters, slapstick physics, hazardous stages, local/online melee and gang modes. | Borrow expressive physical comedy, toy-like presence and social improvisation; no combat requirement. |
| [Welcome to the Game II — Steam](https://store.steampowered.com/app/720250/Welcome_to_the_Game_II/) | A simulated operating system with browser, notes and search among pages in a horror/puzzle setting. | Adapt focused document hunting to datasheets in a small number of archive missions. The horror and long desktop play are not core goals. |

## Technical reference points

- [KiCad PCB Editor documentation](https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html): use official routing/via and design-rule language for educational review. Fabrication limits still come from the chosen board house and stackup.
- [TI discussion of decoupling](https://e2e.ti.com/blogs_/archives/b/precisionhub/posts/the-decoupling-capacitor-is-it-really-necessary): nearby capacitance and low-inductance current path matter for transient support. The game must model a limited transient, not a self-charging battery.
- [TI decoupling video](https://www.ti.com/video/6313253251112): trace length, vias, parasitics and return current matter when the QFN puzzle grows beyond simple proximity.
- Educational review should additionally check current datasheets for every specific part, package, absolute maximum/recommended conditions and oscillator design; fictional game documents should be internally consistent.

## Agent Office source snapshot

- Original: [AgentSystemLabs/agent-office](https://github.com/AgentSystemLabs/agent-office).
- Included snapshot: commit `ce83c7aebe7e8ae2220e3972258de0b31fa2c731`, under `reference/agent-office/`, with its MIT license. The project describes itself as a multiplayer cartoon 3D office for agent workers, not as an electronics education game.
- Package: TypeScript, Three.js, Vite client and Node/TypeScript server. Its `src/client/world/toon.ts` creates a cached `MeshToonMaterial` with a three-step nearest-filtered gradient texture (`90, 185, 255`), rounded boxes, canvas-texture signs and cards. `src/client/main.ts` uses Three.js `OutlineEffect` (`defaultThickness: 0.0032`, dark color `[0.17, 0.18, 0.26]`), shadow maps and a perspective camera. `src/client/world/office.ts` constructs floors, walls, furniture and colliders; `src/shared/layout.ts` shares layout constants with server validation; `src/client/world/character.ts` builds characters from procedural shapes and stateful animation. `src/client/world/sky.ts` handles lighting/weather. `src/client/style.css` is interface styling.
- Useful adaptation path: first reproduce a small room's material/outline/camera feel in a separate prototype. Add original game object prefabs and interaction verbs. Do not import the repo's worker, terminal, account or GitHub workflow as gameplay architecture. Pin source during visual prototyping to avoid accidental moving-target changes.
- License: the bundled repository's `LICENSE` says MIT, copyright 2026 AgentSystemLabs. Preserve its copyright and permission notice in any copy or substantial portion. Inspect third-party package, font, image and sound licenses separately before distribution. Generated concept images and the user's screenshot have distinct provenance from this repository.

## Accuracy notes for designers

An annular ring is the copper surrounding a drilled/plated hole, subject to manufacturer tolerance; fill and cap are separate fabrication/assembly choices. A stitching via connects a named net between planes/regions; “ground via” names a net/function, not an independent physical drilling type. An inductor resists change in current; ideal reactance depends on frequency, and real coils include resistance and parasitics. A capacitor's local energy storage can support a brief load event. Voltage and current are distinct quantities, and the truck/pipe analogies must be used with their explicit limits. Thevenin/Norton equivalence concerns terminal behavior of an appropriate network, not its internal construction. A crystal is a possible clock source for a controller, not a universal required component of every appliance.

## Build questions for the next review

1. Which platform and engine does the first prototype target? Run the interaction/cable spike before committing to the final stack.
2. Is two-player local co-op a launch requirement or a milestone after a strong solo slice? Design data for both now.
3. What age range and level of quantitative detail? Prototype a beginner-friendly default and an optional engineering view.
4. Who signs off electrical truth, fabricated PCB rule profiles and accessible instructional language?
5. Which single room proves the physical core in user tests? This handoff recommends West Wing Blackout.
