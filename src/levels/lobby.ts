import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Circuit Crew HQ: the atrium every job's door opens off (src/hub/lobby.ts). Not a job itself.
// 34 × 24 m (review 6, "make the rooms bigger"): the reception island and the Workshop arch stay put at the
// centre (the spawn steps 1.5 m in, to z 4, so the start view still takes in the back wall), the doors and
// everything against a wall move out with the walls, and the new floor round the
// atrium holds a crew café (left wall), a waiting sofa (front), a ping-pong table (front right) and a
// mailroom (right wall).
const W=34,D=24,HW=W/2,HD=D/2;
/** The wall's inner face sits SHELL_THICK/2 (12.5 cm) inside the room edge; wall-huggers stand 5 cm off it. */
const hug=(depth:number)=>HW-.125-.05-depth/2,hugZ=(depth:number)=>HD-.125-.05-depth/2;
const R=Math.PI/2;
const props:PropSpec[]=[
  // The atrium ring: plants flank the reception island; two chairs, a mug and paper by the spawn.
  {kind:'plant',x:-6.2,z:-1.4},{kind:'plant',x:6.2,z:-1.4},
  {kind:'chair',x:-2.4,z:5.2,color:'#3f7fd6'},{kind:'chair',x:2.6,z:5.3,color:'#e5484d'},
  {kind:'mug',x:.9,z:1.3,color:'#e5484d'},{kind:'paper',x:-3.4,z:2.8},{kind:'paper',x:3.3,z:-2.4},
  // Water cooler, bin and a cone on the walk out to the front.
  {kind:'cooler',x:-4.8,z:7.6},{kind:'bin',x:5.2,z:7.4},{kind:'cone',x:-3.8,z:9.2},
  // Crew café against the left wall: a vending machine, a counter with the coffee machine and mugs, stools.
  {kind:'vending',x:-hug(.8),z:4.4,rotation:R},
  {kind:'desk',x:-hug(.85),z:6.6,rotation:R},{kind:'coffee',x:-hug(.85)-.05,z:6.25,y:1.31,rotation:R},
  {kind:'mug',x:-hug(.85)+.1,z:6.85,y:1.08,color:'#5ED6CC'},{kind:'mug',x:-hug(.85)+.05,z:7.1,y:1.08,color:'#7B6FE0'},
  {kind:'stool',x:-14.9,z:6.1,color:'#5ED6CC'},{kind:'stool',x:-14.8,z:7.1,color:'#e5484d'},
  {kind:'bin',x:-hug(.38),z:8.1},{kind:'plant',x:-hug(.58),z:hugZ(.58)},
  // The waiting sofa by the front edge, facing the reception, with a reading lamp and beanbags.
  {kind:'sofa',x:-8.4,z:hugZ(1)-.1,rotation:Math.PI,color:'#2f5fb8'},{kind:'lamp',x:-10.4,z:hugZ(.65)},
  {kind:'beanbag',x:-11.3,z:9.2,color:'#4f7d6a'},{kind:'beanbag',x:-5.8,z:10.4,color:'#7B6FE0'},{kind:'paper',x:-8.2,z:9.6},
  // Parcels waiting for the mailroom.
  {kind:'box',x:-11,z:3.4,color:'#c98f5a'},{kind:'box',x:-10.3,z:4.1,color:'#d7a56d'},
  // Crew downtime: a ping-pong table in the front-right corner.
  {kind:'pingpong',x:12.4,z:9.6},{kind:'plant',x:hug(.58),z:hugZ(.58)},{kind:'beanbag',x:hug(.9)-.2,z:7.2,color:'#4f7d6a'},
  // Mailroom along the right wall: mail cabinets, the printer, a parcel cart and the jobs whiteboard.
  {kind:'cabinet',x:hug(.7),z:-4.6,rotation:-R,color:'#aab3c2'},{kind:'cabinet',x:hug(.7),z:-3.8,rotation:-R,color:'#c7ccd6'},
  {kind:'printer',x:hug(.75),z:-2.6,rotation:-R},{kind:'whiteboard',x:hug(.2),z:-.4,rotation:-R},
  {kind:'cart',x:14.4,z:-3.4,rotation:R,color:'#5f8fa8'},{kind:'box',x:14.4,z:-3.2,y:1.0,color:'#c98f5a'},
  {kind:'box',x:hug(.7),z:-5.8,color:'#d7a56d'},{kind:'bin',x:hug(.38),z:-1.5},
];
export interface DoorSlot {wall:'back'|'side'|'free';x:number;z:number}
/** Door slots, shared by the hub's doors (src/hub/lobby.ts) and the clutter lanes below: seven along the back
 *  wall, then two on the left wall near the back corner, then free-standing arches on the right. All follow
 *  the walls (W/D); the back doors are 3.6 m apart so the bigger wall reads less crowded. The start view
 *  (yaw .4) keeps all nine doors in it and clear of the job card (R5-241). */
export function doorSlots(width:number,depth:number){
  const out:DoorSlot[]=[];
  for(let k=0;k<7;k++)out.push({wall:'back',x:-width/2+2.6+k*3.6,z:-depth/2});
  for(let k=0;k<2;k++)out.push({wall:'side',x:-width/2,z:-depth/2+2.6+k*3.2});
  for(let k=0;k<6;k++)out.push({wall:'free',x:width/2-2.2,z:-depth/2+4.5+k*2.9});
  return out;
}
/** Where Pip stands to use a door: 1.1 m into the room from a wall door, in front of a free arch. */
export const doorApproach=(s:DoorSlot)=>s.wall==='back'?{x:s.x,z:s.z+1.1}:s.wall==='side'?{x:s.x+1.1,z:s.z}:{x:s.x-.8,z:s.z+.8};
/** The Workshop arch's use spot: free-standing on the right of the atrium, which stays at the centre, so the
 *  arch keeps its old place (7.5, 5.5) at 34 × 24 m and stays whole in the start view. */
export const workshopSpot=(width:number,depth:number)=>({x:width/2-9.5,z:depth/2-6.5});
/** Walk-in intent: Pip's heading (atan2(x,z), as Game.heading) points into the door's wall within 45°.
 *  The back wall is at -z, the side wall at -x. */
export const walksInto=(back:boolean,heading:number)=>(back?-Math.cos(heading):-Math.sin(heading))>Math.SQRT1_2;
// Every wall door's approach (the nine jobs use the seven back and two side slots).
const DOORS:[number,number][]=doorSlots(W,D).filter(s=>s.wall!=='free').map(s=>{const a=doorApproach(s);return [a.x,a.z];});
const SHOP=workshopSpot(W,D),SPAWN:[number,number]=[0,4];
// The greeter stands just behind the spawn, out of the lane to every door (coworkers are solid now);
// one crew member hangs by the café, one by the mailroom.
const npcs:NpcSpot[]=[{x:1.4,z:6.8,standing:true,acc:['headphones'],yaw:0,mood:'happy'},{x:-13.6,z:5.2,standing:true,acc:['mug']},{x:12.6,z:-2.2,standing:true,acc:['glasses','tie']}];
export const lobby:Level={id:'lobby',name:'CIRCUIT CREW HQ',number:'HQ',tagline:'Every door is a job. Pick one.',badge:'jobs',hub:true,
  width:W,depth:D,spawn:{x:SPAWN[0],z:SPAWN[1]},anchor:{x:-HW+2,z:HD-2},target:{x:0,z:0},length:10,obstacles:[],props,npcs,
  // HQ clutter (R5-159): lounge corners, plants, parcels and a reading nook round the atrium, so the hub is a
  // toy box. A lane runs from the spawn to every door and the Workshop, and each door's approach and leaf
  // sweep stays clear. The grid step grew with the room (2.1 → 2.4 m) so the clutter spreads over the whole
  // floor at about the same count, with wider aisles between clusters.
  clutter:{seed:8,step:2.4,max:140,jitter:.6,fillSkip:.25,recipes:['lounge','plants','crates','cooler','reading','bins','lounge','crates','cart'],fill:['box','box','bin','cone'],
    colors:['#5ED6CC','#7B6FE0','#e5484d','#2f5fb8','#4f7d6a'],
    lanes:[...DOORS.map(([x,z])=>({points:[SPAWN,[x,z]] as [number,number][],r:1.35})),...DOORS.map(([x,z])=>({points:[[x,z],[x,z]] as [number,number][],r:1.9})),
      {points:[SPAWN,[SHOP.x,SHOP.z]],r:1.4},{points:[[SHOP.x,SHOP.z],[SHOP.x,SHOP.z]],r:1.9},{points:[[-4.6,0],[4.6,0]],r:2.9},
      // Walks out to the café, the sofa and the mailroom stay open too.
      {points:[SPAWN,[-14,6.6]],r:1.1},{points:[SPAWN,[-8.4,9.6]],r:1.1},{points:[[SHOP.x,SHOP.z],[13.6,-3]],r:1.1}]}};
