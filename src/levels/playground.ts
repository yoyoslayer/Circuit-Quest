import type {Level} from './types';
// Review 6: the floor grew from 20 × 20 to 26 × 20 m (the side walls moved out 3 m each). The job in the
// middle (pillars, obstacle course, pins, lamp and socket) stays put; the reel, its wall outlet and the
// START square moved out 3 m with the left wall, and the cable grew 2.4 m to keep the clean route's slack.
// Measured on the clean route at the plug-in: ~18.05 of 19 m (strain .95) before; the reel's 3 m move adds
// ~2.3 m of taut path, so 21.4 m keeps strain ~.95 (21 m left only ~.66 m of slack, strain .97).
const H=13; // half the floor's width: the side walls stand at x = ±H.
export const playground:Level={id:'playground',name:'CABLE PLAYGROUND',number:'00',tagline:'A little tension goes a long way.',badge:'bolt',next:'meeting',width:H*2,depth:20,
  // A few crates, cones and a lounge corner round the edges; the drag to the lamp, the slingshot run
  // and the pins stay clear. Lane 0 is also the dashed guide on the floor (src/levels/decor.ts).
  clutter:{seed:1,step:2.6,recipes:['crates','cart','shelf','parts','lounge','cabinets','cooler','plants'],fill:['box','bin','cone','litter'],max:90,
    lanes:[{points:[[-9,5.4],[-5,-1],[-4,-4],[5.8,-5.5],[6.6,-5.9]],r:1.3},{points:[[-9,5.4],[9,3.7]],r:1.3},{points:[[9,-1],[9,8]],r:1.1},{points:[[4.4,5.3],[5.5,5.3]],r:1.3},
      // The reel's lead to its wall outlet, and the trainers' nook and cone slalom along the right wall.
      {points:[[-11,4],[-H+.1,4]],r:.7},{points:[[10.6,-2.4],[10.6,3.6]],r:.8},{points:[[10.4,4.6],[12.6,9.4]],r:1.1}]},
  spawn:{x:-9,z:5.4},anchor:{x:-11,z:4},target:{x:7,z:-6},switchAt:{x:7.95,z:-6.4},length:21.4,
  obstacles:[{id:'pillar-a',minX:-2,maxX:-.6,minZ:-2,maxZ:-.6},{id:'pillar-b',minX:2.5,maxX:3.9,minZ:2,maxZ:3.4}],
  props:[
    // The obstacle course: crate stacks and strewn chairs between the reel and the lamp, to drag
    // the cable through and fling. (The slingshot test pulls the cable taut across the z≈4.6 row.)
    {kind:'box',x:-4,z:4.6,rotation:.2},{kind:'box',x:-3.2,z:4.4,rotation:-.1},{kind:'box',x:-2.4,z:4.8,rotation:.35},{kind:'box',x:-3.7,z:4.55,y:.95,rotation:.5},{kind:'box',x:-2.7,z:4.65,y:.95,rotation:-.3},
    {kind:'box',x:1,z:1,rotation:.1},{kind:'box',x:1.8,z:1.3,rotation:-.4},{kind:'box',x:1.3,z:1.1,y:.95,rotation:.7},{kind:'box',x:-1.2,z:6.4,rotation:.25},
    {kind:'chair',x:-1,z:3.6,rotation:.4},{kind:'chair',x:.6,z:5,rotation:-.6},{kind:'chair',x:3,z:5.6,rotation:1},{kind:'chair',x:-4.6,z:1.6,rotation:2.1},{kind:'chair',x:4.4,z:-.4,rotation:-2.4},
    {kind:'cone',x:6,z:-2},{kind:'cone',x:6.6,z:-1.2},{kind:'cone',x:5.4,z:-1.2},{kind:'cone',x:-6,z:7.5},{kind:'cone',x:1,z:-6.5},{kind:'cone',x:3,z:-7.2},
    // By the pallets (decor.ts: back-left at x -W/2+3, front-right pair in the corner at W/2-.8 and W/2-1.95)
    // and the supply cage against the left wall (decor.ts, x -W/2+1.7).
    {kind:'bin',x:-H+3.7,z:-7.6},{kind:'box',x:-H+3.95,z:-8.5},
    // Wall-huggers, out with the walls.
    {kind:'bin',x:H-1.4,z:-3.4},{kind:'plant',x:-H+1.2,z:8.6},{kind:'plant',x:H-1.1,z:-8.6},
    // Six white pins in a bowling triangle: a target for anything a taut cable flings.
    ...([[4.4,5.3],[4.95,5],[4.95,5.6],[5.5,4.7],[5.5,5.3],[5.5,5.9]] as const).map(([x,z],i)=>({kind:'pin' as const,x,z,id:`pin-${i+1}`})),
    // New: the trainers' nook on the right wall: a drinks machine, a water cooler and a sofa facing the course.
    {kind:'vending',x:H-.6,z:-1.6,rotation:-Math.PI/2},{kind:'cooler',x:H-.55,z:-.3},{kind:'mug',x:H-.5,z:.25},
    {kind:'sofa',x:H-.7,z:2.4,rotation:-Math.PI/2,color:'#5f8fa8'},{kind:'plant',x:H-.55,z:4.1},
    // New: a cone slalom for practice drags down the front-right, ending at a stack of spare crates.
    ...([[10.6,5],[11.9,6.1],[10.6,7.2],[11.9,8.3]] as const).map(([x,z])=>({kind:'cone' as const,x,z})),
    {kind:'box',x:H-.8,z:9.2,y:.45,rotation:.1},{kind:'box',x:H-1.95,z:9.2,y:.45,rotation:-.2},{kind:'box',x:H-.8,z:9.2,y:1.08,rotation:.4},
    {kind:'box',x:H-1.95,z:9.2,y:1.08,rotation:.3},{kind:'box',x:H-3.05,z:9.35,rotation:.2},{kind:'box',x:H-3.05,z:9.35,y:.95,rotation:-.35},
    // New: the reel store along the left wall either side of the cage: a parts cart and two cabinets behind it,
    // a shelf of parts in front of it.
    {kind:'bookshelf',x:-H+.4,z:-3,rotation:Math.PI/2},{kind:'cabinet',x:-H+.5,z:-7.85},{kind:'cabinet',x:-H+.5,z:-7.05},
    {kind:'cart',x:-H+.75,z:-8.9,rotation:Math.PI/2},{kind:'box',x:-H+.75,z:-9.05,y:1,rotation:.3},{kind:'box',x:-H+1.9,z:-8.9,rotation:.3},
    // New: the trainers' sign-in desk by START, with its chair.
    {kind:'desk',x:-H+.6,z:7,rotation:Math.PI/2},{kind:'chair',x:-H+1.5,z:7,rotation:-Math.PI/2}],
  // Two trainers and a trainee watch from the sidelines.
  npcs:[{x:-6.6,z:-3.4,standing:true,color:'#8fd3c8',acc:['cap','mug'],yaw:.9},{x:4.8,z:8.7,standing:true,color:'#f78fd0',acc:['glasses'],mood:'happy',yaw:2.8},{x:11.4,z:.9,standing:true,color:'#c8a6f0',acc:['headphones'],yaw:-1.9}]};
