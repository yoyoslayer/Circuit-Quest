# CIRCUIT CREW — game handoff, v0.1

**A playful, physical electronics adventure.** One to four tiny technicians live inside an eccentric, enclosed facility. They restore its rooms by hauling machines, dragging cables, redirecting energy, swapping parts, testing ideas and seeing the space change. Circuit and PCB concepts become useful tools for solving visible problems. The facility is a place to play even for someone who never intended to study engineering.

This is a concept and preproduction handoff, not a finished game or a claim of affiliation with any reference title. The drawings show mood and interaction proposals; their pictured wiring is not an electrical design. Validate any real-world numbers or fabrication rules before educational release.

## Start here

1. `GAME_VISION.md` — premise, pillars, progression, room layout, interaction rules and modes.
2. `MISSIONS.md` — physical mission briefs, learning goals, feedback and variants.
3. `IMPLEMENTATION.md` — systems architecture, electrical model, content schema, first playable plan and acceptance tests.
4. `ART_AND_AUDIO.md` — visual language, camera, interfaces, animation, sound and image notes.
5. `REFERENCES.md` — what the three games and source repo contribute, provenance, technical caveats and links.
6. `images/` — the user's source screenshot and ten generated concept images, indexed in `ART_AND_AUDIO.md`.
7. `reference/agent-office/` — source snapshot at commit `ce83c7aebe7e8ae2220e3972258de0b31fa2c731`, including its MIT `LICENSE`.

## One sentence for a new teammate

Build a readable, funny 3D repair playground where movement and rearrangement produce circuit behavior; the player learns by predicting a result, changing the actual room and testing it.

## The first vertical slice

Build **West Wing Blackout** before any PCB workstation. Two connected rooms, a power cart, reels of cable, a switchable source, a breakered distribution board, a stalled lift, two lamps, a motor and a handheld meter. The player physically positions equipment and routes power without creating a short or overload. The rooms light up and the lift moves. A second arrangement also works. This slice proves the core game, including camera, grab/carry/drag, snap ports, graph simulation, visible feedback, retry, hints and optional two-player cooperation.

## Product boundaries

- Target: PC first, controller and keyboard/mouse; one-player fully supported, two-player local or online as first multiplayer milestone, stretch to four.
- Perspective: third-person room-scale play. Short in-world zooms are for close inspection. A computer or board can be used for a minority of tasks.
- Tone: warm slapstick with readable consequences, no combat, death or horror.
- Learning arc: intuitive models first; measurements, units and formal circuit analysis grow out of situations the player already understands.
- Working title, exact engine and commercial scope remain decisions for the next prototype review.
