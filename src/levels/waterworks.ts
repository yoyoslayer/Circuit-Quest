import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// The Waterworks: a pump room. The test bench stands mid-room with the glass case of the hidden
// network; the header tank and pumps line the back wall; the load-wheel cart waits in the stores.
const props:PropSpec[]=[
  {kind:'cart',id:'wheels',x:-7.2,z:3.6,color:'#43b8c4'},
  // Stock and clutter (all of it can be knocked about).
  ...[[-10,4.2],[-9.9,5],[-6.8,6.8],[-6,6.7],[-10,2.4]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'coolbox',x:-5.4,z:5.6,color:'#e9f0f2'},{kind:'reel',x:-4.6,z:6.6,color:'#43b8c4'},
  {kind:'cooler',x:9.6,z:.4},{kind:'cabinet',x:9.6,z:2.2,color:'#9fb8c8'},{kind:'cabinet',x:9.6,z:3.1,color:'#9fb8c8'},
  {kind:'desk',x:6.2,z:5.8,variant:3},{kind:'monitor',x:6.2,z:6,y:1.2,variant:2},{kind:'chair',x:6.2,z:4.8,color:'#43b8c4'},
  {kind:'mug',x:5.8,z:5.7,y:1.1},{kind:'paper',x:6.6,z:5.6,y:1.05},
  {kind:'chair',x:-2.4,z:1.6,color:'#ffc94d'},{kind:'chair',x:2.8,z:1.9,color:'#2c3e66'},{kind:'chair',x:3.8,z:-4.2,color:'#e5684d'},
  {kind:'plant',x:-10,z:-1.2},{kind:'plant',x:9.8,z:7},{kind:'plant',x:1.9,z:-7.2},
  {kind:'bin',x:-4.2,z:-.8},{kind:'bin',x:3.9,z:-.6},{kind:'cone',x:-3.6,z:-5.4},{kind:'cone',x:2.9,z:-5.6},{kind:'cone',x:.8,z:3.9},
  {kind:'mop',x:-2.2,z:-6.9},
  {kind:'paper',x:-5.2,z:2.4},{kind:'paper',x:1.6,z:3},{kind:'paper',x:4.6,z:-2.2},
  {kind:'cart',x:4.6,z:3.2,color:'#2c3e66'},{kind:'box',x:8.8,z:-4.4,color:'#c98f5a'},{kind:'box',x:9.4,z:-3.6,color:'#d7a56d'},
];
// Three engineers: one at the tank, one at the pumps, one in the stores.
const npcs:NpcSpot[]=[
  {x:-6.4,z:-4.4,standing:true,acc:['cap'],mood:'happy',yaw:Math.PI*.8},{x:6.4,z:-4.9,standing:true,acc:['glasses'],yaw:Math.PI},
  {x:-9.4,z:5.1,standing:true,acc:['headphones'],mood:'sleepy',yaw:Math.PI/2},
];
export const waterworks:Level={id:'waterworks',name:'THE WATERWORKS',number:'06',tagline:'Two ports, a hidden network, and two carts that must act the same.',badge:'waterwheel',station:'waterworks',
  width:22,depth:16,spawn:{x:-3.5,z:4.6},anchor:{x:-10,z:6},target:{x:0,z:-1.5},length:10,obstacles:[],props,npcs};
