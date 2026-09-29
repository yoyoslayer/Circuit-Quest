# Puzzle design — "Lunch Rush" (Kitchen Wing, Chapter 1)

**Goal (shown as pictograms only):** get one tray of lunch baked, carried by the conveyor, and lifted upstairs.
Chain: OVEN bakes → CONVEYOR carries tray → LIFT raises it. The fridge must not spoil meanwhile.

## The rules the room enforces (the "physics")
| Thing | Behaviour |
|---|---|
| Supply cart A, Supply cart B | Each has 2 output sockets and ONE breaker: total draw above 5 bars trips it (needle on the cart). |
| Thin cable (white reels, ×3, light, carry by hand) | Safe up to 3 bars. Above that it heats: warm → glowing → scorched and dead. |
| Thick cable (black/yellow, ×1, on a heavy dolly) | Safe up to 10 bars. Heavy: must be rolled, slows you down. Only one exists. |
| Splitter blocks (bin of 3) | One in, three out. Everything downstream adds up on the input cable. |
| Oven | 3 bars steady (its thin lead is at its limit). Must stay powered ~20 s to bake (dial on the front). |
| Fridge | 2 bars. Unpowered, its thermometer climbs; at red the food spoils (job fails, retry). Already warming at start. |
| Conveyor | 1.5 bars, 3-bar kick when starting. |
| Lift winch | 3 bars running, **9-bar kick for 1 s when starting**. |
| Capacitor cart (in the dark storeroom) | Supplies a short kick locally. Only helps the cable **between it and the load** if it sits **at the load end**. |
| Lamps (storeroom, kitchen) | 0.5 bars each. The storeroom is pitch dark until its lamp is powered — sockets and parts can't be seen/grabbed in the dark. |
| Water puddle (fridge leak, runs out through the kitchen door) | Cable in water = short → breaker trips. Mop it, or lay a cable bridge over it. |
| Swinging kitchen door | Auto-closes; pinches and cuts a cable through it. Wedge it open (doorstop crate). |
| Cleaner bots on a painted loop in the corridor | Snag and drag any cable lying across their line. Use cable bridges on the line, or route around. |
| Pushable shelf | Blocks the storeroom door from the kitchen side of the storeroom. |

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
Breaker pops + cart needle slams red; thin cable glows then blackens and smokes; bot drags a cable off its socket; door snaps a cable; food turns sad-green icon on the fridge; tray burns if left in the oven too long.

*Numbers are prototype tuning values, not real equipment specs.*
