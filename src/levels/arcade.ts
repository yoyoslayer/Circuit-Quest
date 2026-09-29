import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Overheating Arcade: a neon-pastel hall. The service bench stands mid-room with the cabinet being
// fixed at its left end; the five broken cabinets line the back wall; the resistor tray waits on the
// storeroom counter in the front-left corner.
const props:PropSpec[]=[
  {kind:'tray',id:'blocks',x:-9.2,z:4.3,y:.98,color:'#ff7eb6'},
  // Stock boxes in the storeroom and clutter around the hall (all of it can be knocked about).
  ...[[-10.2,5.6],[-10.1,6.3],[-7.4,7.3],[-8.1,7.4],[-7.2,3.4]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#ffa6c9'})),
  {kind:'reel',x:-7.6,z:6.2,color:'#9b7bf0'},{kind:'bin',x:-10.2,z:3.2},
  // Stools, beanbags and players' stuff.
  ...[[-7.8,-5.6],[-5.2,-5.6],[4.6,-5.6],[7.2,-5.6],[8.6,-.6],[8.6,1.2],[8.6,3],[-8.8,-3.4],[-8.8,-1.5],[-8.8,.4]].map(([x,z],i)=>({kind:'chair' as const,x,z,color:['#ff7eb6','#6fe0c0','#ffd84d','#9b7bf0','#7cc8ff'][i%5]})),
  {kind:'beanbag',x:3.6,z:4.8,color:'#ff7eb6'},{kind:'beanbag',x:5,z:5.6,color:'#9b7bf0'},{kind:'beanbag',x:-3.4,z:6.4,color:'#6fe0c0'},
  {kind:'plant',x:-10.2,z:-6.6},{kind:'plant',x:10.2,z:-6.8},{kind:'plant',x:10.2,z:7},{kind:'plant',x:-5.8,z:7.2},
  {kind:'bin',x:3.2,z:-.8},{kind:'bin',x:-4.6,z:-.4},{kind:'cone',x:-2.6,z:3.4},{kind:'cone',x:2.4,z:3.8},
  {kind:'mug',x:6.4,z:6.4},{kind:'paper',x:-2.2,z:1.8},{kind:'paper',x:2.8,z:2.6},{kind:'paper',x:.6,z:5.2},{kind:'paper',x:6.6,z:-2.4},
  {kind:'desk',x:6.4,z:6.6,variant:3},{kind:'monitor',x:6.4,z:6.8,y:1.2,variant:6},{kind:'chair',x:6.4,z:5.6,color:'#ffd84d'},
  {kind:'cart',x:4.2,z:-3.6,color:'#9b7bf0'},{kind:'lamp',x:-4.6,z:-6.6},{kind:'cooler',x:10.1,z:5.2},
];
// Players at the working cabinets, and two technicians by the broken row.
const npcs:NpcSpot[]=[
  {x:8.9,z:-.6,standing:true,acc:['headphones'],mood:'happy',yaw:Math.PI/2},{x:-9,z:-1.5,standing:true,acc:['cap'],yaw:-Math.PI/2},
  {x:-6.5,z:-5.2,standing:true,acc:['glasses'],mood:'sleepy',yaw:Math.PI},{x:5.9,z:-5.3,standing:true,acc:['bun'],yaw:Math.PI},
];
export const arcade:Level={id:'arcade',name:'OVERHEATING ARCADE',number:'08',tagline:'Too bright, too hot, too dark. Pick the resistor.',badge:'led',station:'arcade',
  width:22,depth:16,spawn:{x:-3.5,z:5},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};
