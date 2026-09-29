# Art, camera, UI and sound direction

## Visual target

Use the **user's Agent Office screenshot** as the principal composition reference: an intimate three-quarter room view, warm planked floor, cream walls, chunky rounded furniture, small approachable figures, crisp dark outlines and restrained flat lighting. Its readable spaces matter more than individual furniture shapes. Add Good Job!'s clear physical props, busy office-object comedy and immediate room reactions; add Gang Beasts' soft toy silhouettes, wobbly motion and communal slapstick. The new game's own identity is oversized tactile electronic infrastructure: bright cable reels, transparent layer cutaways, chunky sockets, animated current indicators, instrument faces and machines whose state changes the room.

These are references for mood and mechanics. Design original characters, props, room layouts, icons, animation and UI; do not lift game assets, branding or distinctive character designs. The supplied Agent Office source is MIT licensed and retains its license; check the licenses of its dependencies and any external fonts/assets before shipping.

## Scene recipe

- Low-poly silhouettes with gentle rounded edges; hand-readable proportions, few thin decorative details. Draw sockets, switches and terminals larger than scale reality so their meaning survives camera distance.
- A consistent dark ink edge, approximately `#2b2d42` as seen in the repo's rendering implementation; three-step toon shading, soft grounded shadow and warm ambient light. Use outline thickness that reads at a mid-room camera, then test at split-screen scale. Avoid shiny hyperreal materials and photoreal PCB macro shots.
- Building shell: warm cream walls, honey wood or matte colored industrial floor, soft sage/teal/red accents and distinct wing color identities. Circuit props: copper orange, power yellow, signal cyan, ground deep blue/green, fault coral. Colors must have paired glyph/pattern/sound cues so color-blind players can distinguish them.
- Emissive effect is reserved for powered wires, status lamps, screen glass and selected “aha” moments; never cover the room in neon. Wires animate by moving small pulses only when current flows. A stopped pulse at a break and a fast pulse toward a short are useful visual shorthand; engineering view still shows actual values.
- Characters are original compact technicians with large mitt-like hands, expressive posture and squishy secondary movement. Their hands must clearly grasp both chunky props and tiny tool handles. One character should be identifiable without relying on shirt hue alone.
- Keep the world safe, funny and materially responsive: wobbling signs, bouncing reels, toppled chairs, startled service workers, satisfying latches and cartoon breaker snaps. Electrical failure is communicated without gore, unsafe instruction or irreversible destruction.

## Camera and readable scale

Frame a useful zone of roughly one room plus doorway. When dragging a cable, bias toward both avatar and target port. Allow free orbit, soft occlusion fade and an overhead hold-to-peek for dense arrangements. At the QFN fixture and via cutaway, ease into an angled close view of a *physical object*; player actions still move the world model. Avoid a fake website or full-screen diagram as the standard puzzle frame. The archive computer is deliberately a contained exception.

Prefer 1–3 dominant manipulable objects in the player's immediate focus, with secondary props supporting discovery. A circuit path should be traceable through space at a glance. Use silhouettes and floor markings to distinguish snap sockets from background clutter. Label persistent machine ratings in-world, and provide a close-reading mode for numbers.

## Interface hierarchy

The default HUD is light: current job sentence, tool icon, contextual control hint, active warning and teammate ping. No permanent textbook panel. Interaction focus shows object name, port role and action. A wrist/clipboard page can display one annotated sketch, last meter reading and optional “why” explanation. Meters are hand props first; their numbers are replicated legibly near the center only while held/aimed. A small post-job card shows “What changed / What we measured / What principle you used” plus optional deeper reading. End card language should be short enough not to interrupt another run.

Use distinct diegetic indicators: a breaker handle position, audible relay click, appliance animation, thermal coloring on an optional camera, scope trace in signal rooms. Important states must also appear in captions or overlay for players who cannot hear or see a particular cue. Localized text can expand without breaking label geometry.

## Animation and sound

Movement should have gentle inertia and floppy anticipation, while the interaction target remains precise. A heavy cart takes effort to start and can coast; the power cable goes taut; a capacitor bank hums and briefly brightens during a transient; a via press clunks; a wrong annular ring inspection goes *plink* and produces a clear scrap marker. Devices provide diagnostic rhythms: a steady motor, rhythmic brownout, high-pitched overload whine, relay reset click, static that softens after filtering. Mix comedy sounds below the information-bearing device sounds. Music changes with room restoration, then leaves enough space for listening to signals and clock timing. Reduced-motion and reduced-flash settings must preserve electrical state communication.

## Asset list for first playable

One player + alternate palette/accessory; two connected rooms and atrium sightline; supply cart, two cable reels and cable bridges, metal shelf, distribution cabinet, breaker, two lamps, lift motor/cab, portable meter and probe, tool wheel, signage, doors and status lights. Each interactable needs idle/focus/held/connected/fault/reset states. Include LOD or instancing for repeated fixtures. Create a reusable material palette, outline settings and shadow style before populating rooms.

## Image index

| File in `images/` | Origin | Intended use / caveat |
| --- | --- | --- |
| `00_user_reference_agent_office.png` | User screenshot | Primary viewpoint and color/material reference; third-party project screenshot, not new game art. |
| `01_initial_cozy_office.png` | Generated here | Early soft look exploration; more polished than target. |
| `02_outline_office_revision.png` | Generated here | Stronger outline and compact room study. |
| `03_facility_hub.png` | Generated here | Central repair-floor mood and technician scale. |
| `04_lamp_resistor_bench.png` | Generated here | Early electrical interaction; redesign as a room-spanning lamp wall. |
| `05_pcb_repair_bench.png` | Generated here | PCB surface look; place it within walkable fabrication bay. |
| `06_qfn_layout.png` | Generated here | Spatial placement exploration; make the board large and physically accessible. |
| `07_via_service_counter.png` | Generated here | Customer queue and layer cutaways; final gameplay is a walkable production line. |
| `08_datasheet_archive.png` | Generated here | One intentional computer task, followed by physical part replacement. |
| `09_pipe_pressure_room.png` | Generated here | Thevenin/Norton intuition through pumps, valves and gauges. |
| `10_signal_observatory.png` | Generated here | Signal/spectrum set dressing and coil movement. |

These images were generated as concept art. Text, pad geometry, traces, part values and wiring may be inaccurate; never implement electrical rules by tracing the illustration. Their composition reflects earlier concept stages, while `GAME_VISION.md` and `MISSIONS.md` are the current gameplay direction.
