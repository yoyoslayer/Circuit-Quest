import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Robot Garage: a big, bright service garage (30 × 20 m since review 6). The bench runs across the
// middle with the rolling-road test stand behind it; the delivery robot waits on its charging pad at
// the back right, in front of the spare-parts racks; the delivery dock is back left, beside the roll
// cages of outgoing parcels. Along the left wall: the parts bench and the tyre rack; the power pillar
// with the bench's socket stands by the tyre stack. A robot sits up on the service lift on the right.
// The robot's route (painted lane) loops the middle, so the clutter stays off it.
// The walls moved 4 m out at each side and 2 m front and back; the job (bench, stand, pad, lead) kept
// its coordinates, and everything that stood by a wall moved out with it (written W-… / D-… here).
const W=15,D=10;
const props:PropSpec[]=[
  {kind:'cart',id:'robot',x:6.4,z:-5.2,rotation:Math.PI/2,color:'#2fb3a6'},
  // Parcels waiting along the left wall, spare parts crates, and shop clutter (all of it can be knocked about).
  ...[[-W+1,-4.2],[-W+1.1,-3.4],[-W+.9,-5],[-W+1.7,-4.6]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  ...[[W-2.4,D-1.4],[W-1.6,D-1.1],[W-1.5,D-2]].map(([x,z],i)=>({kind:'box' as const,x,z,rotation:i*.3-.3,color:i%2?'#b9875a':'#c98f5a'})),
  {kind:'coolbox',x:-5.6,z:D-1.6,color:'#e9f0f2'},// An oil drum and a parts trolley (no cable reel or dolly: this room has no cable, R5-104).
  {kind:'bin',x:-4.4,z:D-1.2,color:'#e5484d'},{kind:'cart',x:W-1.7,z:4.1,rotation:Math.PI/2,color:'#9aa3b2'},
  {kind:'cabinet',x:W-.8,z:-.6,color:'#9fb8c8'},{kind:'cabinet',x:W-.8,z:.2,color:'#9fb8c8'},
  // The foreman's desk, front right, further from the bench than in the small room.
  {kind:'desk',x:9.6,z:7.4,variant:3},{kind:'monitor',x:9.6,z:7.6,y:1.2,variant:2},{kind:'chair',x:9.6,z:6.4,color:'#2fb3a6'},
  {kind:'mug',x:9.2,z:7.3,y:1.1},{kind:'paper',x:10,z:7.2,y:1.05},
  {kind:'chair',x:-2.6,z:5.2,color:'#3f7fd6'},{kind:'chair',x:1.8,z:5.6,color:'#2b4a55'},
  {kind:'plant',x:-W+2.6,z:D-.8},{kind:'plant',x:W-.8,z:D-1},{kind:'plant',x:1.9,z:-D+.7},
  {kind:'bin',x:-5.2,z:-.6},{kind:'bin',x:2.9,z:-.4},{kind:'cone',x:-6.6,z:-3.4},{kind:'cone',x:5.6,z:4.4},{kind:'cone',x:5.8,z:-.8},{kind:'cone',x:-4.8,z:4.3},
  {kind:'mop',x:-5.1,z:-D+.9},{kind:'cart',x:-1,z:D-1.4,color:'#5f8fa8'},
  {kind:'paper',x:-3.4,z:4.6},{kind:'paper',x:.8,z:4.2},{kind:'paper',x:5.2,z:3.6},
  // By the service lift: a carton of the lifted robot's parts and a cone at the lift's corner.
  {kind:'box',x:10.5,z:-3.8,rotation:.2,color:'#d7a56d'},{kind:'cone',x:13.7,z:-6.2},
  // At the parts bench under the left pegboard: its chair, and a bin by the tyre rack.
  {kind:'chair',x:-W+2.4,z:-.6,color:'#3f7fd6'},{kind:'bin',x:-W+.8,z:2.1},
];
// The parcel stack on the robot's route (R5-079 chaos bonus): bowl it over before the robot drives.
// It stands by the bench lead's line, so a slingshot off the lead can do it too.
export const parcelStack:PropSpec[]=[{kind:'box',x:-7.35,z:1,color:'#d7a56d'},{kind:'box',x:-6.65,z:1,rotation:.08,color:'#c98f5a'},{kind:'box',x:-7,z:1,y:.95,rotation:-.12,color:'#e0b47a'}];
props.push(...parcelStack);
// The bench's mains lead (R5-079): its reel stands at the bench's left end; the socket is on the power
// pillar past the tyre stack, where the old left wall stood. It stays there in the bigger room: a
// socket on the new wall would need a lead past the station cap (14 m), so the cable act keeps its
// 12.5 m lead, its slack and its route. The lead crosses the robot's painted route and bends round the tyres.
const lead={anchor:{x:-2.75,z:-1.3},plug:{x:-2.6,z:-.45},target:{x:-10.55,z:5.75},length:12.5,route:[[-2.6,-.45],[-4.5,1.9],[-8.5,4],[-8.9,5.6],[-9.75,5.8]] as [number,number][]};
// Four mechanics: one at the tool chest, one by the charging bays, one having a tea by the desk, one
// at the service lift.
const npcs:NpcSpot[]=[
  {x:-3.6,z:-D+1.7,standing:true,acc:['cap'],mood:'happy',yaw:Math.PI*.9},{x:8.2,z:-3.4,standing:true,acc:['glasses'],yaw:-Math.PI*.7},
  {x:10.6,z:6.1,standing:true,acc:['headphones','mug'],mood:'sleepy',yaw:-Math.PI/2},
  {x:12,z:-3.3,standing:true,acc:['glasses'],yaw:Math.PI},
];
export const garage:Level={id:'garage',name:'ROBOT GARAGE',number:'04',tagline:'The robot resets its brain every time it stops. Tame the kick.',badge:'robot',station:'garage',
  width:W*2,depth:D*2,spawn:{x:-1.2,z:3.4},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,stationCable:lead,obstacles:[],props,npcs,
  // Shop clutter around the fixtures; the robot's painted route and the walk from the door to the
  // charging pad, the test stand and the bench stay clear, with wider aisles than the old room's.
  // The same cap over almost twice the floor, so the clusters stand further apart.
  clutter:{seed:4,fill:['box','box','cone','box','litter'],max:220,step:2.1,recipes:['crates','cones','parts','cart','cabinets','crates','parts','crates','cart','cones'],colors:['#3f7fd6','#e5484d','#2b4a55','#9fb8c8'],jitter:.6,fillSkip:.15,
    lanes:[{points:lead.route,r:1.1},{points:[[.7,-4.45],[3.6,-4.45],[3.9,1.9],[-6.4,2.3],[-8.1,-1.2],[-8.1,-7.6]],r:1.3},
      {points:[[-1.2,3.4],[6.4,-4.2],[3.4,-4],[2.5,-4.4],[2.9,-4],[2.9,-1.1],[0,-1.55]],r:1.2},
      // Keep-out round the test stand and behind the bench, so the bench camera sees the stand, not a cabinet column (R5-312).
      {points:[[-2.8,-4.6],[2.8,-4.6]],r:1.4},{points:[[-3.5,-2.6],[3.5,-2.6]],r:1.2},
      // The back wall is 2 m further off now: keep the floor behind the stand clear too, up to the
      // top of the bench camera's view (z ≈ −7.4), so no cabinet stack rises behind the stand.
      {points:[[-2.4,-6.1],[2.8,-6.1]],r:1.3},
      // The aisle behind the charging bays (in front of the parts racks), round to the service lift.
      {points:[[3.6,-7.2],[10.2,-7.2],[10.2,-2.4]],r:1.1},
      // The working aisle along the left wall: the parts bench, the tyre rack and the power pillar.
      {points:[[-12.4,-3.4],[-12.4,6.8]],r:1.1}]}};
