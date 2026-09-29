import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Spectrum Delivery: a bright research hall. The dispatch desk and the transmitter tower stand
// front centre; the brick storeroom is back left, the shuttered glass lab back right, the copper-mesh
// quiet room front right, with the smoky tea corner between. The receiver pod waits on its dock by
// the entrance; two mirror boards stand by the exhibits case. Geometry lives in stations/spectrum/logic.
const props:PropSpec[]=[
  {kind:'coolbox',id:'pod',x:-6.4,z:5.2,color:'#fbf3e2'},
  {kind:'whiteboard',id:'mirror1',x:-3.4,z:-5.5,color:'#dfe8f0'},
  {kind:'whiteboard',id:'mirror2',x:-.9,z:-5.5,color:'#dfe8f0'},
  // Storeroom stock (kept to the back and right so the doorway path stays clear).
  ...[[-6.2,-7.4],[-5.4,-7.3],[-5.4,-6.5],[-5.5,-4.2]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'cart',x:-7.6,z:-4.1,color:'#c98f5a'},
  // Lab: stools, a bin, a plant in the sunshine.
  {kind:'chair',x:4.2,z:-6.3,color:'#5b9cf0'},{kind:'chair',x:9.1,z:-7.3,color:'#6cc58a'},{kind:'plant',x:2.7,z:-4},{kind:'bin',x:3.1,z:-6},{kind:'cabinet',x:10.3,z:-7.4,color:'#dfe3ea'},
  // Hall: chairs, plants, cones and clutter (all of it can be knocked about).
  {kind:'plant',x:-10.3,z:7.1},{kind:'plant',x:.2,z:7.2},{kind:'plant',x:-4,z:-2.7},
  {kind:'chair',x:-4.4,z:4.6,color:'#ffc94d'},{kind:'chair',x:-7.2,z:2.3,color:'#e5484d'},{kind:'chair',x:3.9,z:6.8,color:'#8b7be8'},
  {kind:'bin',x:-1.2,z:5.6},{kind:'bin',x:-8.4,z:-1.9},{kind:'cone',x:-8.8,z:3.6},{kind:'cone',x:4.6,z:1},{kind:'cone',x:5.1,z:.4},
  {kind:'box',x:-9.5,z:6.8,color:'#e5484d'},{kind:'box',x:-8.7,z:7.1,color:'#ffc94d'},{kind:'box',x:-2.4,z:7.2,color:'#5b9cf0'},
  {kind:'cart',x:-7.8,z:.6,color:'#3fae6a'},{kind:'lamp',x:-3.2,z:6.9},
  {kind:'mug',x:3,z:5.6},{kind:'paper',x:-2.8,z:5.2},{kind:'paper',x:1.2,z:1.4},{kind:'paper',x:-6.2,z:-1.1},{kind:'paper',x:6.6,z:-.9},
  // Quiet room: a reading desk.
  {kind:'desk',x:7.4,z:7.1,variant:3},{kind:'chair',x:7.4,z:6.2,color:'#8b7be8'},{kind:'plant',x:6.1,z:7.3},
];
// Four coworkers: the storeroom keeper, a lab scientist, a reader in the quiet room, and whoever burnt the toast.
const npcs:NpcSpot[]=[
  {x:-9.8,z:-6.6,standing:true,acc:['cap'],yaw:.6},{x:3.4,z:-4.7,standing:true,acc:['glasses'],yaw:2.6,mood:'happy'},
  {x:6.3,z:5.5,standing:true,acc:['headphones'],mood:'sleepy',yaw:2.2},{x:3.8,z:5.7,standing:true,acc:['mug'],mood:'alarm',yaw:-2.6},
];
export const spectrum:Level={id:'spectrum',name:'SPECTRUM DELIVERY',number:'12',tagline:'Brick, glass, metal, smoke. Pick the band that gets through.',badge:'spectrum',station:'spectrum',
  width:22,depth:16,spawn:{x:-8,z:5.6},anchor:{x:-10.6,z:-7.7},target:{x:-3.5,z:3.55},length:10,obstacles:[],props,npcs};
