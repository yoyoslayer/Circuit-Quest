import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Fabrication Bay: an assembly shop. The QFN layout bench stands mid-room; the SMT line (stencil
// printer, pick-and-place, reflow oven, inspection box) and the packing table line the back wall; the
// parts crate waits by the stock shelf on the left wall. 30 x 20 m (review 6: bigger rooms); the bench
// and its reel kept their spots, everything on a wall moved out with it.
const props:PropSpec[]=[
  {kind:'box',id:'parts',x:-12.8,z:2.2,color:'#ffc629'},
  // Stock boxes, carts and clutter (all of it can be knocked about).
  ...[[-13.6,5.4],[-12.5,5.9],[-13.7,-1.2],[-12.6,-1.8],[-11.2,7.8]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'cart',x:-9.4,z:6.2,color:'#8f96d8'},{kind:'cart',x:4.8,z:-4.2,color:'#9aa3dc'},
  {kind:'chair',x:9.6,z:6.9,color:'#8f96d8'},{kind:'chair',x:11.4,z:6.9,color:'#e5484d'},{kind:'chair',x:-3.4,z:2.8,color:'#b392f0'},{kind:'chair',x:3.9,z:1.2,color:'#6cc58a'},
  {kind:'plant',x:-14.2,z:9},{kind:'plant',x:14.2,z:9},{kind:'plant',x:14.1,z:-4.6},{kind:'bin',x:-3.6,z:-.4},{kind:'bin',x:4.2,z:-.2},{kind:'bin',x:13.6,z:2.4},
  {kind:'cone',x:-2.2,z:4.4},{kind:'cone',x:2.6,z:5.2},{kind:'cabinet',x:14.2,z:-2.4},
  {kind:'mug',x:-2.8,z:3},{kind:'paper',x:-5.6,z:1.3},{kind:'paper',x:1.4,z:3.2},{kind:'paper',x:6.1,z:7.1},{kind:'paper',x:-1.2,z:7.6},
  {kind:'box',x:-13.3,z:-3.6,color:'#b9875a'},{kind:'box',x:13.1,z:-5.2,rotation:.3,color:'#e0b47a'},
];
// The bench's mains lead (R5-079): its reel stands at the bench's right end; the wall socket is under
// the bolt sign on the back wall, tucked behind the inspection box, so the lead bends round the AOI.
// The back wall moved 2 m out, so the socket and the last leg did too (length 12 -> 14).
const lead={anchor:{x:2.6,z:-.6},plug:{x:3.3,z:0},target:{x:9.3,z:-9.6},length:14,route:[[3.3,0],[6.2,-2.6],[8.6,-3.2],[9,-5.2],[9,-7.4],[9.2,-8.9]] as [number,number][]};
// Crew at the machines, the stock shelf and the layout desks.
const npcs:NpcSpot[]=[
  {x:-4.6,z:-7.6,standing:true,acc:['glasses'],yaw:Math.PI},{x:4.6,z:-7.6,standing:true,acc:['cap'],yaw:Math.PI,mood:'happy'},
  {x:9.6,z:7.7,standing:true,acc:['headphones'],yaw:Math.PI},{x:-10.6,z:.4,standing:true,acc:['bun'],yaw:-Math.PI/2,mood:'sleepy'},
];
export const qfn:Level={id:'qfn',name:'FABRICATION BAY',number:'05',tagline:'Slide the parts, draw the tracks, ship three boards.',badge:'qfn',station:'qfn',
  width:30,depth:20,spawn:{x:-9.6,z:3.4},anchor:{x:-14,z:8},target:{x:0,z:-.5},length:10,stationCable:lead,obstacles:[],props,npcs,
  // Fab bay clutter: parts carts, reels and crates around the bench (no office desks, bookshelves or
  // filing towers: the room's own ESD benches, reel towers and drawers carry the fab look); the walk
  // from Pip's start to the stock shelf and the bench stays clear. A wider grid step than the old
  // 22 x 16 room, so the bigger floor reads roomier rather than just fuller.
  clutter:{seed:5,fill:['crates','box','litter','bin'],max:220,step:2.1,jitter:.7,fillSkip:.2,recipes:['crates','cart','parts','crates','cart','crates'],colors:['#8f96d8','#e5484d','#3f7fd6','#e9e7f7'],families:{cart:['#9aa3dc','#8f96d8']},
    lanes:[{points:lead.route,r:1.1},{points:[[-9.6,3.4],[-12.8,2.95],[1.3,-.6],[0,-.5]],r:1.25},
      // Keep-outs: the machine apron in front of the SMT line and the packing table (the room's showpieces), the bench
      // with its camera view (R5-312), and the rework island's working sides. Side-wall fill can still sit by the walls.
      {points:[[-13,-6.6],[13,-6.6]],r:1.4},{points:[[-2.6,-2.2],[3.6,-2.2]],r:2.3},{points:[[-7.6,5.2],[-4.4,5.2]],r:.7},{points:[[-7.6,7.6],[-4.4,7.6]],r:.7}]}};
