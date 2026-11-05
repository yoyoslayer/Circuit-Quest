# Puzzle design — "Lunch Rush" (Kitchen Wing, Chapter 1)

**Goal (shown as pictograms only):** get one tray of lunch baked, carried by the conveyor, and lifted upstairs.
Chain: OVEN bakes → CONVEYOR carries tray → LIFT raises it. The fridge must not spoil meanwhile.

## The rules the room enforces (the "physics")
| Thing | Behaviour |
|---|---|
| Supply cart A, Supply cart B | Each has 2 output sockets and ONE breaker: total draw above 5 bars trips it (needle on the cart). |
| Thin cable (white, ×3, light, carry by hand; three rings on each plug) | Safe up to 3 bars. Above that it smoulders dark red and smokes, then is scorched and dead. Lengths 32 m (A, the lift feed), 24 m (A) and a short 14 m spare on B, so a sloppy route strains and can slingshot. |
| Thick cable (black/yellow, ×1, on a heavy dolly; ten rings on each plug) | Safe up to 10 bars, 22 m. Heavy: slows you down; its dolly trails about 2.8 m behind along the cable and rolls clear of the doorway when let go. Only one exists. |
| Splitter blocks (bin of 3) | One in, three out. Everything downstream adds up on the input cable. |
| Oven | 3 bars steady (its thin lead is at its limit). Must stay powered ~20 s to bake (dial on the front). |
| Fridge | 2 bars. Unpowered, its thermometer climbs once the kitchen door first opens (about 160 s from there to spoiled); at red the food spoils (job fails, retry). Its socket ring pulses yellow while it warms unfed. |
| Conveyor | 1.5 bars, 3-bar kick when starting. |
| Lift winch | 3 bars running, **9-bar kick for 1 s when starting**. |
| Capacitor cart (in the dark storeroom) | Wired inline: the lift's feed plugs into the cart, and the cart's own lead docks into the winch when parked within 2 m. It starts **empty** and charges only from current it really draws (1 bar while the lift is off, 0.4 while it runs, about 6 s to hold one kick); its four cans show the charge and empty visibly at the kick. |
| Lamps (storeroom, kitchen) | 0.5 bars each. The storeroom is pitch dark until its lamp is powered — sockets and parts can't be seen/grabbed in the dark. |
| Water puddle (fridge leak, pools round the fridge socket and runs out through the kitchen door) | Intact insulated cable lying in water is fine. Water reaching **bare metal** trips the cart (earth leakage): a plug or socket standing in the puddle (the fridge socket is in it), a live lead's loose plug dropped in it, or a cable a cleaner bot has scuffed. Mop it, or lay a cable bridge over it. |
| Swinging kitchen door | Auto-closes; pinches and cuts a cable through it (splice it for 15, but only once the door is wedged). Wedge it open (doorstop crate); the doorstop can't be pulled out while live cables run through. |
| Cleaner bots on a painted loop in the corridor | Snag and drag any cable lying across their line (scuffing its insulation). Use cable bridges on the line, or route around. |
| Pushable shelf | Blocks the storeroom door from the kitchen side of the storeroom. |

The numbers are in the world, not in text: every appliance wears a plaque of bar pips (filled for the running draw, a spike and hollow pips for a start-up kick; the kitchen post's plaque shows its sum, 4), each cart carries its letter and five budget pips lit by what it gives now (the HUD dials show the same pips), and plugs carry rating rings.

## Why it is a real puzzle (the insights)
1. **Budget:** everything together wants 10.5 bars (oven 3, fridge 2, lamps 1, conveyor 1.5, lift 3); the carts give 5 + 5, and not in the right split. You can't run it all at once → **prioritise & sequence**. The fridge is a *time battery*: unplug it while the oven bakes, then plug it back.
2. **Surges:** the lift's 9-bar kick trips any cart. Only the capacitor cart fixes it — and only if placed **next to the winch**.
3. **Placement beats brute force:** with the capacitor at the winch, a *thin* cable is enough for the lift (3 bars running). That frees the one thick cable for the kitchen feed, which carries oven + both lamps (4 bars) — too much for thin. Oven + lamps + fridge would be 6 → B trips, hence the fridge time-battery.
4. **Splitters add up:** feeding oven + lamps through one thin cable scorches it. Players usually learn this the hard way once.
5. **Order of access:** capacitor cart is in the dark storeroom → first power its lamp → first get a cable into the kitchen → first deal with door + puddle.
6. **Physical routing:** cables must avoid the puddle, the door, and the bots' line; reel lengths are finite, so routes matter.

## Intended solution (one of several)
1. Wedge the kitchen door, bridge (or mop) the puddle.
2. Roll the thick reel: Supply B → corridor → kitchen splitter → oven + kitchen lamp + storeroom lamp (4 bars; adding the fridge would trip B).
3. Storeroom lights up → push the shelf aside → haul the capacitor cart out.
4. Unplug the fridge while the oven bakes (watch the thermometer).
5. Supply A out-1 → thin cable → over two cable bridges on the bots' line → lift room → winch, **capacitor cart parked at the winch**.
6. Supply A out-2 → thin cable → conveyor motor. **Start the conveyor before the lift**: conveyor kick 3 + lift running 3 = 6 would trip A; the other order is 1.5 + 3 = 4.5 because the capacitor eats the lift's kick.
7. Tray out of oven → conveyor → lift → up. Unplug storeroom lamp, re-plug fridge.

## Alternates the room allows
- Empty the fridge into the **cooler box** (storeroom) and forget the fridge entirely.
- Put the lift on B and the kitchen on A (mirror).
- Skip the storeroom lamp by carrying the kitchen lamp in (it's pluggable, not fixed).
- Mop the puddle instead of bridging it.

## Failure feedback (all in-world)
Each fault has its own glyph where it happened (cart overload, motor start-up surge, water at a plug, overheated cable, door-pinched cable), and the first time each happens one line in the prompt pill names the physical cause. A motor on a cart that cuts out drops out with it: after a reset it stays off until switched on again, one at a time.
Breaker pops + cart needle slams red; thin cable glows then blackens and smokes; bot drags a cable off its socket; door snaps a cable; food turns sad-green icon on the fridge; tray burns if left in the oven too long.

*Numbers are prototype tuning values, not real equipment specs.*
