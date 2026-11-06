import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Overheating Arcade: a neon-pastel hall, 30 × 20 m (review 6: the room grew from 22 × 16; the job
// stayed put, everything on a wall moved out with it). The service bench stands mid-room with the
// cabinet being fixed at its left end; the five broken cabinets line the back wall; the resistor tray
// waits on the storeroom counter in the front-left corner. Round the hall: a photo booth in the back-left
// corner, a twin racer, an air-hockey table, a lounge corner, a skee-ball pair and a vending machine.
const props:PropSpec[]=[
  // The resistor tray is the job item, so it wears job yellow (R5-101).
  {kind:'tray',id:'blocks',x:-9.2,z:4.3,y:.98,color:'#ffc94d'},
  // Stock boxes in the storeroom and clutter around the hall (all of it can be knocked about).
  ...[[-12.8,5],[-12.5,6.2],[-8,8.6],[-8.7,7.4],[-7.2,3.4],[-11.6,3.6]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'box',x:-11.4,z:8,rotation:.5,color:'#b9875a'},{kind:'bin',x:-14.3,z:3.2},
  {kind:'cart',x:-10.4,z:6.6,rotation:.4,color:'#9aa3b2'},{kind:'mop',x:-14.2,z:8.4},
  // Round bar stools pulled up to each cabinet's control deck (R5-347), 1 m out from the cabinet's
  // centre: the back row's at z -7.9 (further out where a pinball table or claw box stands in front), the right
  // wall's at x 12.7, the left wall's at x -12.9.
  ...[[-9.4,-7],[-6.2,-7.9],[5.2,-7.3],[8.4,-7.9],[12.7,-.6],[12.7,1.2],[12.7,3],[12.7,-6.6],[-12.9,-3.4],[-12.9,-1.5],[-12.9,.4]].map(([x,z],i)=>({kind:'stool' as const,x,z,color:['#ff7eb6','#6fe0c0','#ffb38a','#e5484d','#7cc8ff'][i%5]})),
  // A beanbag left behind the bench, in lobbing range of the prize pyramid (R5-079 chaos bonus).
  {kind:'beanbag',x:3.2,z:-7,color:'#9b7bf0'},
  // The lounge corner on the lilac rug: a sofa for waiting parents, beanbags and a reading lamp.
  {kind:'sofa',x:8,z:2.7,color:'#e0457f'},{kind:'beanbag',x:6.9,z:4.7,color:'#e0457f'},{kind:'beanbag',x:9,z:5,color:'#7cc8ff'},{kind:'lamp',x:9.9,z:3.4},
  {kind:'beanbag',x:-2.4,z:8.2,color:'#6fe0c0'},
  {kind:'plant',x:-11.6,z:-9.3},{kind:'plant',x:14.3,z:-9.2},{kind:'plant',x:14.3,z:9.3},{kind:'plant',x:-5.2,z:9.2},
  {kind:'bin',x:3.2,z:-.8},{kind:'bin',x:-4.6,z:-.4},{kind:'cone',x:-2.6,z:3.4},{kind:'cone',x:2.4,z:3.8},
  {kind:'paper',x:-2.2,z:1.8},{kind:'paper',x:2.8,z:2.6},{kind:'paper',x:.6,z:5.2},{kind:'paper',x:6.6,z:-2.4},
  // The attendant's desk by the front edge, a drinks cooler beside it, and a snack machine on the back wall.
  {kind:'desk',x:9.4,z:8.8,variant:3},{kind:'monitor',x:9.4,z:9,y:1.2,variant:6},{kind:'chair',x:9.4,z:7.8,color:'#7cc8ff'},{kind:'mug',x:9.4,z:8.6,y:1.1},
  {kind:'cooler',x:11.2,z:9.3},{kind:'vending',x:11.4,z:-9.45},
  {kind:'cart',x:4.2,z:-3.6,color:'#9aa3b2'},{kind:'lamp',x:-4.25,z:-8.6},
];
// The bench's mains lead (R5-079): its reel stands at the bench's right end and the wall socket is under
// the bolt sign on the back wall, so the lead goes round the bench's back corner and behind it, past the
// prize shelf. The back wall moved 2 m out with the bigger room, so the lead is 1.2 m longer (the run
// behind the bench grew by that much) and keeps the same ~0.5 m of slack over its clean route. Clutter keeps off the walk (r 1.1, so things still lie
// near enough to slingshot).
const lead={anchor:{x:2.6,z:-1.5},plug:{x:2.55,z:-.65},target:{x:-2.2,z:-9.6},length:11.7,route:[[2.55,-.65],[2.9,-1.6],[2.9,-4.0],[-2.2,-8.85]] as [number,number][]};
// Players at the working cabinets and the air-hockey table, and two technicians by the broken row.
const npcs:NpcSpot[]=[
  {x:11.9,z:.3,standing:true,acc:['headphones'],mood:'happy',yaw:Math.PI/2},{x:-12,z:-2.45,standing:true,acc:['cap'],yaw:-Math.PI/2},
  {x:-7.5,z:-7.2,standing:true,acc:['glasses'],mood:'sleepy',yaw:Math.PI},{x:6.5,z:-7.3,standing:true,acc:['bun'],yaw:Math.PI},
  {x:10.6,z:-3.6,standing:true,mood:'happy',yaw:-Math.PI/2},
];
export const arcade:Level={id:'arcade',name:'OVERHEATING ARCADE',number:'03',tagline:'Too bright, too hot, too dark. Pick the resistor.',badge:'led',station:'arcade',
  width:30,depth:20,spawn:{x:-3.5,z:5},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,stationCable:lead,obstacles:[],props,npcs,
  // Arcade clutter: beanbag corners, snack bins, ticket crates; the storeroom run, the walk to the
  // bench and the aisles in front of the cabinet rows stay clear.
  // Cartons stay kraft; the pastels dress the fabric only (R5-158).
  clutter:{seed:3,fill:['box','box','bin','litter'],max:220,step:2.1,jitter:.6,fillSkip:.2,recipes:['lounge','crates','plants','reading','lounge','bins','crates','lounge'],colors:['#ff7eb6','#6fe0c0','#ffb38a','#7cc8ff','#e5484d'],
    lanes:[{points:lead.route,r:1.1},{points:[[1.4,-8.75],[1.4,-8.75]],r:1.1},{points:[[-3.5,5],[-5.5,6.6],[-7.2,5.8],[-8.3,4.4]],r:1.1},{points:[[-8.3,4.4],[-7.2,5.8],[-5.5,6.4],[1.2,-1.3],[0,-1.55]],r:1.1},
      // The storeroom's north door to the bench, and the aisles along the back, left and right cabinet rows.
      {points:[[-7.6,1.8],[-.6,-1.4]],r:1.1},{points:[[-11.8,-6.2],[11.8,-6.2]],r:1.1},{points:[[-11.6,-6.2],[-11.6,1.6]],r:1.1},{points:[[11.6,-7.4],[11.6,4]],r:1.1}]}};
export const arcadeRush:Level={...arcade,id:'arcade-rush',name:'ARCADE RUSH',number:'03R',tagline:'Three minutes. Every cabinet is broken a new way.',requires:'arcade',next:undefined};
