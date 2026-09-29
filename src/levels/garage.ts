import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Robot Garage: a bright service garage. The bench runs across the middle with the rolling-road
// test stand behind it; the delivery robot waits on its charging pad at the back right; the
// delivery dock is back left. The robot's route (painted lane) loops the room, so the clutter
// stays off it.
const props:PropSpec[]=[
  {kind:'cart',id:'robot',x:6.4,z:-5.2,rotation:Math.PI/2,color:'#2fb3a6'},
  // Parcels waiting at the dock, spare parts crates, and shop clutter (all of it can be knocked about).
  ...[[-10,-3.2],[-9.9,-2.4],[-10.1,-4],[-9.3,-3.6]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  ...[[8.6,6.6],[9.4,6.9],[9.5,6]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#2fb3a6':'#c98f5a'})),
  {kind:'coolbox',x:-5.6,z:6.4,color:'#e9f0f2'},{kind:'reel',x:-4.4,z:6.8,color:'#ffc629'},{kind:'dolly',x:9.3,z:4.1},
  {kind:'cabinet',x:10.2,z:-.6,color:'#9fb8c8'},{kind:'cabinet',x:10.2,z:.2,color:'#9fb8c8'},
  {kind:'desk',x:6.6,z:5.9,variant:3},{kind:'monitor',x:6.6,z:6.1,y:1.2,variant:2},{kind:'chair',x:6.6,z:4.9,color:'#2fb3a6'},
  {kind:'mug',x:6.2,z:5.8,y:1.1},{kind:'paper',x:7,z:5.7,y:1.05},
  {kind:'chair',x:-2.6,z:5.2,color:'#ffc629'},{kind:'chair',x:1.8,z:5.6,color:'#2b4a55'},
  {kind:'plant',x:-10.2,z:6.9},{kind:'plant',x:10.2,z:7},{kind:'plant',x:1.9,z:-7.3},
  {kind:'bin',x:-5.2,z:-.6},{kind:'bin',x:2.9,z:-.4},{kind:'cone',x:-6.6,z:-3.4},{kind:'cone',x:5.6,z:4.4},{kind:'cone',x:5.8,z:-.8},{kind:'cone',x:-4.8,z:4.3},
  {kind:'mop',x:-6.8,z:-6.9},{kind:'cart',x:-1,z:6.6,color:'#ffc629'},
  {kind:'paper',x:-3.4,z:4.6},{kind:'paper',x:.8,z:4.2},{kind:'paper',x:5.2,z:3.6},
];
// Three mechanics: one at the tool chest, one by the charging bays, one having a tea by the desk.
const npcs:NpcSpot[]=[
  {x:-3.6,z:-6.3,standing:true,acc:['cap'],mood:'happy',yaw:Math.PI*.9},{x:8.2,z:-3.4,standing:true,acc:['glasses'],yaw:-Math.PI*.7},
  {x:7.6,z:4.6,standing:true,acc:['headphones','mug'],mood:'sleepy',yaw:-Math.PI/2},
];
export const garage:Level={id:'garage',name:'ROBOT GARAGE',number:'09',tagline:'The robot resets its brain every time it stops. Tame the kick.',badge:'robot',station:'garage',
  width:22,depth:16,spawn:{x:-1.2,z:3.4},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};
