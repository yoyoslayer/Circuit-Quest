import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Overheating Arcade: a neon-pastel hall. The service bench stands mid-room with the cabinet being
// fixed at its left end; the five broken cabinets line the back wall; the resistor tray waits on the
// storeroom counter in the front-left corner.
const props:PropSpec[]=[
  // The resistor tray is the job item, so it wears job yellow (R5-101).
  {kind:'tray',id:'blocks',x:-9.2,z:4.3,y:.98,color:'#ffc94d'},
  // Stock boxes in the storeroom and clutter around the hall (all of it can be knocked about).
  ...[[-10.2,5.6],[-10.1,6.3],[-7.4,7.3],[-8.4,6.2],[-7.2,3.4]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'box',x:-7.6,z:6.2,rotation:.5,color:'#b9875a'},{kind:'bin',x:-10.2,z:3.2},
  // Round bar stools pulled up to each cabinet's control deck (R5-347), 1 m out from the cabinet's
  // centre: the back row's at z -5.9 (further out where a pinball table or claw box stands in front), the right
  // wall's at x 8.7, the left wall's at x -8.9.
  // Then beanbags and players' stuff.
  ...[[-7.8,-5],[-5.2,-5.9],[4.6,-5.3],[7.2,-5.9],[8.7,-.6],[8.7,1.2],[8.7,3],[-8.9,-3.4],[-8.9,-1.5],[-8.9,.4]].map(([x,z],i)=>({kind:'stool' as const,x,z,color:['#ff7eb6','#6fe0c0','#ffb38a','#e5484d','#7cc8ff'][i%5]})),
  {kind:'beanbag',x:3.6,z:4.8,color:'#e0457f'},{kind:'beanbag',x:5,z:5.6,color:'#7cc8ff'},{kind:'beanbag',x:-2.4,z:7,color:'#6fe0c0'},
  {kind:'plant',x:-10.2,z:-6.6},{kind:'plant',x:10.2,z:-6.8},{kind:'plant',x:10.2,z:7},{kind:'plant',x:-5.8,z:7.2},
  {kind:'bin',x:3.2,z:-.8},{kind:'bin',x:-4.6,z:-.4},{kind:'cone',x:-2.6,z:3.4},{kind:'cone',x:2.4,z:3.8},
  {kind:'mug',x:6.4,z:6.4,y:1.1},{kind:'paper',x:-2.2,z:1.8},{kind:'paper',x:2.8,z:2.6},{kind:'paper',x:.6,z:5.2},{kind:'paper',x:6.6,z:-2.4},
  {kind:'desk',x:6.4,z:6.6,variant:3},{kind:'monitor',x:6.4,z:6.8,y:1.2,variant:6},{kind:'chair',x:6.4,z:5.6,color:'#7cc8ff'},
  {kind:'cart',x:4.2,z:-3.6,color:'#9aa3b2'},{kind:'lamp',x:-4.25,z:-6.6},{kind:'cooler',x:10.1,z:5.2},
];
// Players at the working cabinets, and two technicians by the broken row.
const npcs:NpcSpot[]=[
  {x:7.9,z:.3,standing:true,acc:['headphones'],mood:'happy',yaw:Math.PI/2},{x:-8,z:-2.45,standing:true,acc:['cap'],yaw:-Math.PI/2},
  {x:-6.5,z:-5.2,standing:true,acc:['glasses'],mood:'sleepy',yaw:Math.PI},{x:5.9,z:-5.3,standing:true,acc:['bun'],yaw:Math.PI},
];
export const arcade:Level={id:'arcade',name:'OVERHEATING ARCADE',number:'03',tagline:'Too bright, too hot, too dark. Pick the resistor.',badge:'led',station:'arcade',
  width:22,depth:16,spawn:{x:-3.5,z:5},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs,
  // Arcade clutter: beanbag corners, snack bins, ticket crates; the storeroom run and the walk to
  // the bench stay clear.
  // Cartons stay kraft; the pastels dress the fabric only (R5-158).
  clutter:{seed:3,fill:['box','box','bin','litter'],max:220,step:2.1,jitter:.6,fillSkip:.2,recipes:['lounge','crates','plants','reading','lounge','bins','crates','lounge'],colors:['#ff7eb6','#6fe0c0','#ffb38a','#7cc8ff','#e5484d'],
    lanes:[{points:[[-3.5,5],[-5.5,6.6],[-7.2,5.8],[-8.3,4.4]],r:1},{points:[[-8.3,4.4],[-7.2,5.8],[-5.5,6.4],[1.2,-1.3],[0,-1.55]],r:1.05}]}};
export const arcadeRush:Level={...arcade,id:'arcade-rush',name:'ARCADE RUSH',number:'03R',tagline:'Three minutes. Every cabinet is broken a new way.',requires:'arcade',next:undefined};
