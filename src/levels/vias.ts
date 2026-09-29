import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Via Foundry: a small fab shop. The service counter runs across the room with the customer
// lane behind its window; machines line the back wall; the blanks crate waits on the rack.
const props:PropSpec[]=[
  {kind:'box',id:'blanks',x:-7,z:3.3,color:'#3f9a62'},
  // Stock and clutter along the rack and the work floor (all of it can be knocked about).
  ...[[-9.6,3.1],[-9.4,6.4],[-7.9,6.4],[-6.4,6.5]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'cart',x:-4.4,z:5.6,color:'#5f8fa8'},{kind:'cart',x:5.6,z:4.8,color:'#e5484d'},
  {kind:'chair',x:-2.4,z:1.2,color:'#ffc94d'},{kind:'chair',x:2.6,z:1.4,color:'#3f7fd6'},{kind:'chair',x:6.4,z:1.6,color:'#6cc58a'},
  {kind:'plant',x:-9.4,z:-.8},{kind:'plant',x:9.3,z:6.8},{kind:'bin',x:-3.2,z:-.6},{kind:'bin',x:3.4,z:-.4},
  {kind:'cabinet',x:9.2,z:1.2},{kind:'cabinet',x:9.2,z:2.2},{kind:'cone',x:-1.2,z:3.6},{kind:'cone',x:1.4,z:3.9},
  {kind:'mug',x:4.6,z:6.4},{kind:'paper',x:-5.4,z:2.1},{kind:'paper',x:3.1,z:2.8},{kind:'paper',x:.4,z:5.6},
  {kind:'desk',x:4.8,z:6.6,variant:3},{kind:'monitor',x:4.8,z:6.8,y:1.2,variant:1},{kind:'chair',x:4.8,z:5.6,color:'#b392f0'},
];
// Customers (one per order), then two workers at the machines.
const npcs:NpcSpot[]=[
  {x:0,z:-3.6,standing:true,acc:['cap'],mood:'happy'},{x:2.4,z:-4.5,standing:true,acc:['glasses']},{x:3.5,z:-4.5,standing:true,acc:['bun']},
  {x:4.6,z:-4.5,standing:true,acc:['headphones']},{x:5.7,z:-4.5,standing:true,acc:['tie','glasses'],mood:'sleepy'},
  {x:-6.6,z:-5.6,standing:true,acc:['sprout'],yaw:Math.PI},{x:7.4,z:-6.2,standing:true,acc:['tuft'],yaw:Math.PI},
];
export const vias:Level={id:'vias',name:'VIA COUNTER',number:'03',tagline:'Five orders at the window. Drill, plate, serve.',badge:'via',station:'vias',
  width:22,depth:16,spawn:{x:-6,z:4},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};
