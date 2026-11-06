import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
import {TX,SPOTS,PADS,HATCH,HALL_W,HALL_D} from '../stations/spectrum/logic';
// The taught beam corridors, kept clear of clutter so no beam is drawn through a bookshelf: the tower
// to mirror A and on through the hatch to the lab pad, the quiet-room legs (direct and by mirror C),
// and the radio leg to the storeroom. Derived from the rules so they can't drift.
const xz=(p:{x:number;z:number}):[number,number]=>[p.x,p.z];
const beamLanes=[{points:[xz(TX),xz(SPOTS.A),[(HATCH.x0+HATCH.x1)/2,HATCH.z]] as [number,number][],r:.7},{points:[[(HATCH.x0+HATCH.x1)/2,HATCH.z-.1],xz(PADS.lab)] as [number,number][],r:.9},
  {points:[xz(TX),xz(PADS.quiet)],r:.6},{points:[xz(TX),xz(SPOTS.C),xz(PADS.quiet)],r:.7},{points:[xz(TX),xz(PADS.store)],r:.6}];
// Spectrum Delivery: a bright research hall (30 × 20 m). The dispatch desk and the transmitter tower
// stand front centre; the brick storeroom fills the back left corner, the shuttered glass lab the back
// right, the copper-mesh quiet room the front right, with the smoky tea corner between. The receiver
// pod waits on its dock by the entrance; two mirror boards stand mid-floor, in front of the exhibits case. The rooms' inner
// walls (the ones a beam meets) keep their places, so the deliveries are the same; the rooms run on to
// the hall's walls. Geometry lives in stations/spectrum/logic.
const props:PropSpec[]=[
  // The receiver pod is the job item you carry, so it wears job yellow (R5-101).
  {kind:'coolbox',id:'pod',x:-6.4,z:5.2,color:'#ffc629'},
  {kind:'whiteboard',id:'mirror1',x:-3.4,z:-5.5,color:'#dfe8f0'},
  {kind:'whiteboard',id:'mirror2',x:-.9,z:-5.5,color:'#dfe8f0'},
  // Storeroom stock (kept to the back and right so the doorway path stays clear), and the bulk store
  // in its far left bay: a pallet of cartons and a cart of returns.
  ...[[-6.3,-6.6],[-5.4,-9.3],[-5.4,-6.5],[-5.5,-4.2],[-12.6,-6.4],[-13.4,-6.6],[-12.9,-7.3],[-14.3,-4.1]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'box',x:-12.6,z:-6.4,y:.95,rotation:.3,color:'#e0b47a'},
  {kind:'cart',x:-7.6,z:-4.1,color:'#c98f5a'},{kind:'box',x:-12.6,z:-4.4,rotation:.5,color:'#b9875a'},{kind:'cart',x:-14.2,z:-6.9,rotation:Math.PI/2,color:'#9aa3b2'},
  // Lab: stools, a bin, a plant in the sunshine, a filing cabinet and stools at the far bench.
  {kind:'chair',x:4.2,z:-8.3,color:'#5b9cf0'},{kind:'chair',x:9.6,z:-9.3,color:'#6cc58a'},{kind:'plant',x:2.7,z:-4},{kind:'bin',x:3.1,z:-6},{kind:'cabinet',x:14.3,z:-9.4,color:'#dfe3ea'},
  {kind:'stool',x:12.1,z:-8.3},{kind:'stool',x:13.1,z:-8.4,color:'#5b9cf0'},{kind:'bin',x:11.7,z:-4},{kind:'plant',x:14.4,z:-3.9},
  // Hall: chairs, plants, cones and clutter (all of it can be knocked about).
  {kind:'plant',x:-14.3,z:9.1},{kind:'plant',x:.2,z:9.2},{kind:'plant',x:-4,z:-2.7},
  {kind:'chair',x:-4.4,z:4.6,color:'#5b9cf0'},{kind:'chair',x:-7.2,z:2.3,color:'#e5484d'},{kind:'chair',x:3.9,z:6.8,color:'#8b7be8'},
  {kind:'bin',x:-1.2,z:5.6},{kind:'bin',x:-8.4,z:-1.9},{kind:'cone',x:-8.8,z:3.6},{kind:'cone',x:4.6,z:1},{kind:'cone',x:5.1,z:.4},
  {kind:'box',x:-13.5,z:8.8,color:'#d7a56d'},{kind:'box',x:-12.7,z:9.1,color:'#c98f5a'},{kind:'box',x:-2.4,z:9.2,rotation:.3,color:'#b9875a'},
  {kind:'cart',x:-7.8,z:.6,color:'#3fae6a'},{kind:'lamp',x:-3.2,z:8.9},
  {kind:'mug',x:3,z:5.6},{kind:'paper',x:-2.8,z:5.2},{kind:'paper',x:1.2,z:1.4},{kind:'paper',x:-6.2,z:-1.1},{kind:'paper',x:6.6,z:-.9},
  // The visitors' bench under the band chart on the left wall, and filing by the storeroom corner.
  {kind:'sofa',x:-14.35,z:4.6,rotation:Math.PI/2,color:'#2f5fb8'},{kind:'plant',x:-14.4,z:2.6},{kind:'bin',x:-14.4,z:6.25},
  {kind:'cabinet',x:-14.4,z:-1.8,color:'#c7ccd6'},{kind:'cabinet',x:-14.4,z:-2.55,color:'#dcdfe6'},
  // The east aisle between the lab and the quiet room: the hall printer and a water cooler.
  {kind:'printer',x:14.4,z:-1.6},{kind:'cooler',x:14.5,z:.4},{kind:'paper',x:13.6,z:-.6},
  // Back wall: a plant past the roof ladder.
  {kind:'plant',x:1.5,z:-9.4},
  // Quiet room: a reading desk, bookshelves on the far wall and a beanbag corner.
  {kind:'desk',x:7.4,z:9.1,variant:3},{kind:'chair',x:7.4,z:8.2,color:'#8b7be8'},{kind:'plant',x:6.1,z:9.3},
  {kind:'bookshelf',x:14.55,z:3.4,rotation:Math.PI/2,color:'#b98552'},{kind:'bookshelf',x:14.55,z:5.6,rotation:Math.PI/2,color:'#c7ccd6'},
  {kind:'beanbag',x:11.4,z:9,color:'#c4553b'},{kind:'beanbag',x:12.5,z:9.2,color:'#4f7d6a'},{kind:'plant',x:10.3,z:9.3},
];
// The desk's mains lead (R5-079): its reel stands behind the dispatch desk; the socket is on the foot
// of the hall's distribution board, which stands where the storeroom walk turns. The board is a
// fixture of its own (not the wall), so the lead's length and route are the same as before the hall grew.
const lead={anchor:{x:-2.6,z:1.35},plug:{x:-3.3,z:1.15},target:{x:-10.6,z:.6},length:11,route:[[-3.3,1.15],[-6.4,1.45],[-8.6,1.5],[-9.9,.8]] as [number,number][]};
// Four coworkers: the storeroom keeper, a lab scientist, a reader in the quiet room, and whoever burnt the toast.
const npcs:NpcSpot[]=[
  {x:-9.8,z:-6.6,standing:true,acc:['cap'],yaw:.6},{x:3.4,z:-4.7,standing:true,acc:['glasses'],yaw:2.6,mood:'happy'},
  {x:6.3,z:5.5,standing:true,acc:['headphones'],mood:'sleepy',yaw:2.2},{x:3.8,z:5.7,standing:true,acc:['mug'],mood:'alarm',yaw:-2.6},
];
/** Main walks keep 2.2 m clear (lane r 1.1); the lead's run and the short spurs keep r .8. */
const WALK=1.1;
export const spectrum:Level={id:'spectrum',name:'SPECTRUM DELIVERY',number:'07',tagline:'Brick, glass, metal, smoke. Pick the band that gets through.',badge:'spectrum',station:'spectrum',
  width:HALL_W,depth:HALL_D,spawn:{x:-8,z:5.6},anchor:{x:-10.6,z:-7.7},target:{x:-3.5,z:3.55},length:10,stationCable:lead,obstacles:[],props,npcs,
  // Research-hall clutter around the walk routes Pip takes with the pod and the mirror boards. The
  // bigger hall spreads it out: about the same cap over more floor, and the fill pass dresses the new edges.
  clutter:{seed:9,fill:['box','box','litter','bin','cone'],max:220,step:1.9,fillStep:1.15,jitter:.6,fillBand:2.4,fillSkip:.2,recipes:['pod','shelf','crates','cart','reading','crates','plants','cart','bins','cabinets'],colors:['#9fd8c8','#e5484d','#2f5fb8','#4f7d6a','#c4553b'],
    lanes:[{points:lead.route,r:.8},{points:[[-8,5.6],[-6.4,6.4],[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]],r:WALK},{points:[[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6],[-3.5,3.55]],r:WALK},
      {points:[[-6.3,3.6],[-6.3,4.6]],r:.9},{points:[[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]],r:WALK},
      {points:[[10.2,-1.8],[-.9,-1.8],[-.9,-4.55]],r:WALK},{points:[[-.9,-1.6],[2.6,-.2],[1.5,1.2],[.6,4.2],[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6]],r:.8},
      {points:[[10.2,-4.4],[8.1,-5.35]],r:.8},{points:[[10.2,-4.4],[10.2,2.8],[9.4,3.9]],r:WALK},{points:[[10.2,.6],[4.5,-.6],[-.2,4.2],[-3.5,3.55]],r:.8},...beamLanes,
      // The east aisle and the front walk past the tea corner stay open too.
      {points:[[10.2,-1.4],[13,-1.4]],r:.9},{points:[[-8,5.6],[-3.5,7.4],[4.4,7.6]],r:.9},
      // Open floor the rooms keep: the west aisle past the distribution board, the lab's floor in front
      // of its benches, and the quiet room's reading rug.
      {points:[[-12.6,-2.4],[-12.6,8.4]],r:1},{points:[[3,-6.6],[13.4,-6.6]],r:1.5},{points:[[6.8,4.6],[12.6,4.6]],r:2},
      // The roof-hatch ladder's foot stays clear (R5-312).
      {points:[[.9,-9.6],[.9,-8]],r:.8}]}};
