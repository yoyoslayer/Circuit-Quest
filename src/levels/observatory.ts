import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Signal Observatory: a night-blue dome room. The signal bench runs across the middle with the
// roof receiver's rack at its left end; the noisy motor cart is parked right beside the rack.
// The dome and telescope sit back left, the spectrum gallery along the back wall.
const props:PropSpec[]=[
  {kind:'cart',id:'motor',x:-3.7,z:-1.1,color:'#5f8fa8'},
  // Star-chart crates, stools and clutter (all of it can be knocked about).
  ...[[-9.4,6.6],[-8.6,6.7],[-9.5,5.8],[8.8,6.6],[9.5,6.2]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#8b7be8'})),
  {kind:'chair',x:-1.8,z:1.4,color:'#8b7be8'},{kind:'chair',x:1.6,z:1.6,color:'#ffc94d'},{kind:'chair',x:5.2,z:2.2,color:'#6cc58a'},{kind:'chair',x:-5.6,z:3.9,color:'#3f7fd6'},
  {kind:'plant',x:-9.6,z:-1.2},{kind:'plant',x:9.5,z:-2.4},{kind:'plant',x:9.4,z:7.1},{kind:'bin',x:3.2,z:-1.2},{kind:'bin',x:-8.8,z:2.2},
  {kind:'cabinet',x:9.4,z:.6},{kind:'cabinet',x:9.4,z:1.5},{kind:'bookshelf',x:6.2,z:7.3},{kind:'beanbag',x:-6.8,z:3.2},{kind:'beanbag',x:-5.8,z:2.6,color:'#8b7be8'},
  {kind:'cone',x:-3,z:4.6},{kind:'cone',x:3.4,z:4.8},{kind:'mug',x:4.4,z:6.2},{kind:'paper',x:-4.2,z:1.8},{kind:'paper',x:2.2,z:3.1},{kind:'paper',x:.6,z:5.4},
  {kind:'desk',x:4.6,z:6.4,variant:2},{kind:'monitor',x:4.6,z:6.6,y:1.2,variant:2},{kind:'chair',x:4.6,z:5.4,color:'#b392f0'},
  {kind:'cart',x:6.8,z:4.4,color:'#8b7be8'},{kind:'lamp',x:-9.2,z:4.4},
];
// Three astronomers: one at the telescope, one in the gallery, one reading by the star chart.
const npcs:NpcSpot[]=[
  {x:-4.4,z:-4.4,standing:true,acc:['glasses'],yaw:-2.4},{x:6.2,z:-5.2,standing:true,acc:['bun'],yaw:Math.PI,mood:'happy'},{x:-7.6,z:1.4,standing:true,acc:['headphones'],yaw:-1.2,mood:'sleepy'},
];
export const observatory:Level={id:'observatory',name:'SIGNAL OBSERVATORY',number:'07',tagline:'A garbled message from the roof. Filter it, keep the latch, tune the whip.',badge:'signal',station:'observatory',
  width:22,depth:16,spawn:{x:-6.4,z:6.2},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};
