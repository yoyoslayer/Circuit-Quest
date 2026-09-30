import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Via Foundry: a small fab shop. The service counter runs across the room with the customer
// lane behind its window; machines line the back wall; the blanks crate waits on the rack.
const props:PropSpec[]=[
  {kind:'cart',x:-9,z:7.5,color:'#668b91'},
  {kind:'box',x:-10,z:8.5,color:'#b39b78'},{kind:'box',x:-11.2,z:8.5,color:'#a48f6d'},
  {kind:'bin',x:-10,z:-5},{kind:'cabinet',x:11.5,z:-5.5},{kind:'cabinet',x:11.5,z:-7},
  {kind:'plant',x:12,z:9},
];
// Customers (one per order), then two workers at the machines.
const npcs:NpcSpot[]=[
  {x:0,z:-3.6,standing:true,acc:['cap'],mood:'happy'},{x:2.4,z:-4.5,standing:true,acc:['glasses']},{x:3.5,z:-4.5,standing:true,acc:['bun']},
  {x:4.6,z:-4.5,standing:true,acc:['headphones']},{x:5.7,z:-4.5,standing:true,acc:['tie','glasses'],mood:'sleepy'},
  {x:-6.6,z:-5.6,standing:true,acc:['sprout'],yaw:Math.PI},{x:7.4,z:-6.2,standing:true,acc:['tuft'],yaw:Math.PI},
];
export const vias:Level={id:'vias',name:'VIA COUNTER',number:'03',tagline:'Five orders at the window. Drill, plate, serve.',badge:'via',station:'vias',
  next:'vias-rush',width:32,depth:24,spawn:{x:0,z:8},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};
/** Rush: the same counter, three minutes of endless orders (unlocks after the story shift). */
export const viasRush:Level={...vias,id:'vias-rush',name:'VIA RUSH',number:'03R',tagline:'Three minutes. The queue never ends.',requires:'vias',next:undefined};
