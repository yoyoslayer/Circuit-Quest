import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Signal Observatory: a night-blue dome room, 30 × 20 m (review 6: was 22 × 16). The signal bench
// runs across the middle with the roof receiver's rack at its left end; the noisy motor cart is
// parked right beside the rack. The dome and telescope sit back left, the spectrum gallery along the
// back wall. The bigger room adds a star-atlas library behind the dome, a radio-dish model in the
// back right corner, an orrery table on the right, a celestial globe by the door and a night-shift
// tea corner along the front. The job (bench, cart, rack, reel) stays where it was; everything that
// stands against a wall moved out with it (back and front walls 2 m, side walls 4 m).
const props:PropSpec[]=[
  // The noisy motor cart is a job item, so its tray wears job yellow (R5-101).
  {kind:'cart',id:'motor',x:-3.7,z:-1.1,color:'#ffc629'},
  // Star-chart crates by the front corners, stools and clutter (all of it can be knocked about).
  ...[[-13.4,8.6],[-12.6,8.7],[-13.5,7.8],[12.6,8.3],[13.5,8.2]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#8b7be8'})),
  {kind:'chair',x:-1.8,z:1.4,color:'#8b7be8'},{kind:'chair',x:1.6,z:1.6,color:'#3f7fd6'},{kind:'chair',x:5.8,z:2.4,color:'#6cc58a'},{kind:'chair',x:-5.6,z:3.9,color:'#3f7fd6'},
  {kind:'plant',x:-13.6,z:-1.2},{kind:'plant',x:14.1,z:-4.6},{kind:'plant',x:13.4,z:9.1},{kind:'bin',x:4.1,z:-1.3},{kind:'bin',x:-12.8,z:2.2},
  {kind:'cabinet',x:13.4,z:.6},{kind:'cabinet',x:13.4,z:1.5},{kind:'bookshelf',x:6.2,z:9.3},{kind:'beanbag',x:-6.8,z:3.2,color:'#6f6ab8'},{kind:'beanbag',x:-5.8,z:2.6,color:'#7a6ae0'},
  {kind:'cone',x:-3,z:4.6},{kind:'cone',x:3.4,z:4.8},{kind:'mug',x:4.4,z:8.2,y:1.1},{kind:'paper',x:-4.2,z:1.8},{kind:'paper',x:2.2,z:3.1},{kind:'paper',x:.6,z:5.4},
  {kind:'desk',x:4.6,z:8.4,variant:2},{kind:'monitor',x:4.6,z:8.6,y:1.2,variant:2},{kind:'chair',x:4.6,z:7.4,color:'#b392f0'},
  {kind:'cart',x:8.4,z:5.2,color:'#8b7be8'},{kind:'lamp',x:-13.2,z:4.4},
  // Star-atlas library behind the dome: two tall shelves on the left wall, a reading desk and its lamp.
  {kind:'bookshelf',x:-14.4,z:-8.8,rotation:Math.PI/2},{kind:'bookshelf',x:-14.4,z:-6.75,rotation:Math.PI/2},
  {kind:'desk',x:-11.6,z:-7.4,rotation:Math.PI/2,variant:1},{kind:'paper',x:-11.5,z:-7.7,y:.99},{kind:'mug',x:-11.6,z:-6.9,y:1.08,color:'#9b7bf0'},{kind:'chair',x:-10.6,z:-7.3,rotation:-Math.PI/2,color:'#6f6ab8'},
  {kind:'lamp',x:-13.4,z:-4.4},{kind:'box',x:-12.9,z:-9.3,color:'#c98f5a'},
  // Atlas shelf on the right wall by the radio-dish model.
  {kind:'bookshelf',x:14.4,z:-2.6,rotation:-Math.PI/2},{kind:'stool',x:13.2,z:-2.2,color:'#8b7be8'},
  // Night-shift tea corner along the front wall: a desk with the urn, a water cooler, mugs and a bin.
  {kind:'desk',x:-1.6,z:9.1,variant:3},{kind:'coffee',x:-2.1,z:9.1,y:1.3},{kind:'mug',x:-1.2,z:9.0,y:1.08,color:'#d9d0ff'},{kind:'mug',x:-.9,z:9.2,y:1.08,color:'#c9a46a'},
  {kind:'cooler',x:.4,z:9.3},{kind:'bin',x:1.3,z:9.2},{kind:'chair',x:-1.4,z:7.9,color:'#7a6ae0'},
];
// The bench's mains lead (R5-079): its reel stands at the bench's right end; the wall socket is on the
// back wall left of the gallery, so the lead goes round the bench's back corner behind it. The back
// wall moved 2 m back, so the socket did too and the lead grew from 10.5 m to 12 m (the same slack).
const lead={anchor:{x:2.75,z:-1.2},plug:{x:3.3,z:-.45},target:{x:-1.4,z:-9.6},length:12,route:[[3.3,-.45],[2.95,-1.8],[2.95,-3.8],[-1.4,-8.85]] as [number,number][]};
// Three astronomers: one at the telescope, one in the gallery, one reading by the star chart.
const npcs:NpcSpot[]=[
  // (The telescope astronomer stands just off the dome platform, so its base isn't sunk in the step: R5-021.)
  {x:-3.4,z:-5.7,standing:true,acc:['glasses'],yaw:-2.2},{x:6.2,z:-7.2,standing:true,acc:['bun'],yaw:Math.PI,mood:'happy'},{x:-11.2,z:1,standing:true,acc:['headphones'],yaw:-1.2,mood:'sleepy'},
];
export const observatory:Level={id:'observatory',name:'SIGNAL OBSERVATORY',number:'06',tagline:'A garbled message from the roof. Filter it, keep the latch, tune the whip.',badge:'signal',station:'observatory',
  width:30,depth:20,spawn:{x:-6.4,z:6.2},anchor:{x:-14,z:6},target:{x:0,z:-1.55},length:10,stationCable:lead,obstacles:[],props,npcs,
  // Observatory clutter: reading corners, desks, shelves of star atlases; the cart's run from the
  // receiver and the walk to the bench stay clear. The grid is a little looser than before (2.4 m),
  // so the bigger room breathes instead of filling up at the same density.
  clutter:{seed:6,fill:['box','box','litter'],max:220,step:2.4,recipes:['pod','shelf','reading','lounge','pod','plants','crates','cabinets'],colors:['#4a4380','#9b7bf0','#c9a46a','#6f6ab8','#e9dcc0'],jitter:.6,fillSkip:.25,
    lanes:[{points:lead.route,r:1.1},{points:[[-6.1,-7.3],[-6.1,-7.3]],r:2.9},{points:[[-6.4,6.2],[-3.7,-.1],[-6,3.5],[0,-1.55]],r:1.2},{points:[[-6.4,6.2],[0,-1.55]],r:1.1},
      // Keep-outs: the exhibit gallery along the back wall stays a gallery, and the bench camera's view past the table stays clear (R5-312).
      {points:[[-.2,-8.8],[9.8,-8.8]],r:1.5},{points:[[-3.5,-3.4],[3.5,-3.4]],r:1.3},
      // The new set pieces keep room round them, and the main walks between them stay wide (review 6).
      {points:[[9,1],[9,1]],r:1.9},{points:[[12,-6.8],[12,-6.8]],r:2.3},{points:[[12,-6.8],[9.4,-4.4]],r:1.2},{points:[[-10.4,6.4],[-10.4,6.4]],r:1.4},
      {points:[[-12.3,-9],[-12.3,-3.8],[-8.6,-2.4]],r:1.1},{points:[[2.95,-3.8],[10.6,-4.2]],r:1.1},{points:[[-6.4,6.2],[9,1]],r:1.1},{points:[[0,-1.55],[0,7.6],[-1.6,7.9]],r:1.1},
      // The cart's chaos run from the reading rug into the front wall stays clear.
      {points:[[-6,3.5],[-6.3,9.4]],r:1.1}]}};
