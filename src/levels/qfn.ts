import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Fabrication Bay: an assembly shop. The QFN layout bench stands mid-room; the pick-and-place,
// reflow oven and inspection box line the back wall; the parts crate waits by the stock shelf.
const props:PropSpec[]=[
  {kind:'box',id:'parts',x:-8.8,z:2.2,color:'#ffc629'},
  // Stock boxes, carts and clutter (all of it can be knocked about).
  ...[[-9.6,5.2],[-8.5,5.6],[-9.7,-1.4],[-8.6,-1.9],[-7.4,6.4]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#b9bfeb':'#d7a56d'})),
  {kind:'cart',x:-5.6,z:4.8,color:'#8f96d8'},{kind:'cart',x:4.6,z:-3.6,color:'#ffc629'},
  {kind:'chair',x:6.6,z:4.9,rotation:Math.PI,color:'#8f96d8'},{kind:'chair',x:8.4,z:4.9,rotation:Math.PI,color:'#ffc94d'},{kind:'chair',x:-3.4,z:1.6,color:'#b392f0'},{kind:'chair',x:3.9,z:1.2,color:'#6cc58a'},
  {kind:'plant',x:-10.2,z:6.8},{kind:'plant',x:10.2,z:6.8},{kind:'plant',x:10.1,z:-3.8},{kind:'bin',x:-3.6,z:-.4},{kind:'bin',x:4.2,z:-.2},{kind:'bin',x:9.6,z:2.2},
  {kind:'cone',x:-2.2,z:4.4},{kind:'cone',x:2.6,z:5.2},{kind:'cabinet',x:10.2,z:-1.9},
  {kind:'mug',x:-2.8,z:3},{kind:'paper',x:-5.6,z:1.3},{kind:'paper',x:1.4,z:3.2},{kind:'paper',x:5.1,z:6.1},{kind:'paper',x:-1.2,z:6.6},
  {kind:'box',x:-9.3,z:-3.4,color:'#4c9f76'},{kind:'box',x:9.1,z:-4.4,color:'#b9bfeb'},
];
// Crew at the machines and the layout desks.
const npcs:NpcSpot[]=[
  {x:-4.6,z:-5.6,standing:true,acc:['glasses'],yaw:Math.PI},{x:4.6,z:-5.6,standing:true,acc:['cap'],yaw:Math.PI,mood:'happy'},
  {x:6.6,z:5.6,standing:true,acc:['headphones'],yaw:Math.PI},{x:-6.8,z:.6,standing:true,acc:['bun'],yaw:-Math.PI/2,mood:'sleepy'},
];
export const qfn:Level={id:'qfn',name:'FABRICATION BAY',number:'04',tagline:'Slide the parts, draw the tracks, ship three boards.',badge:'qfn',station:'qfn',
  width:22,depth:16,spawn:{x:-6.6,z:3.2},anchor:{x:-10,z:6},target:{x:0,z:-.5},length:10,obstacles:[],props,npcs};
