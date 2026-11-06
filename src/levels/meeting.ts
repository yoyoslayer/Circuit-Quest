import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Review 6 rooms pass: the floor grew from 33 x 20 to 36 x 24 m (each side wall 1.5 m out, the back wall
// and front edge 2 m out). The job (printer stand, strip spot, wall reel, mail cart, coffee reel) stays
// where it was, so the cable distances are unchanged; the wall-huggers moved out with the walls, the desk
// rows spread apart (wider aisles), and the new space holds a third front pod, a huddle corner, a copier,
// catering by the boardroom door and a ping-pong corner in the lounge. Decor built for the old shell at
// absolute coordinates is refitted by src/levels/meeting-fit.ts.
// Pod chairs and desk mugs: saturated, but never job yellow or a coworker's colour, so a seated blob
// reads against its chair (DR-45, R5-101, R5-292).
const CHAIRS=['#e5484d','#2f5fb8','#4f7d6a','#c4553b'],MUGS=['#f4efe6','#e5484d','#3f7fd6','#6cc58a'];
const props:PropSpec[]=[],npcs:NpcSpot[]=[{x:-12.4,z:5.9,standing:true},{x:-12.7,z:2.8,standing:true}];
const PILLARS=[[-4.75,-2.9],[.15,-2.9],[5.1,-2.9],[-4.75,4.2],[.15,4.2]];
/** Desk pods (rug centres too, see meeting-fit.ts). The back row moved 1 m toward the back wall and the
 *  front row 1.2 m toward the front edge, so the main aisle and the cart lane are a metre wider. */
export const PODS:[number,number][]=[[-6,-5.5],[-1,-5.5],[4,-5.5],[-6,1.5],[-1,1.5],[4,1.5],[-6,8.8],[-.8,8.8],[4,8.8]];
/** True when a footprint centred at x,z (half sizes hx, hz) clears every pillar, with a little air. */
const clear=(x:number,z:number,hx:number,hz:number)=>PILLARS.every(([px,pz])=>Math.abs(x-px)>hx+.5||Math.abs(z-pz)>hz+.5);
for(const [px,pz] of PODS){
  for(const dx of [-.85,.85])for(const dz of [-.48,.48]){
    const x=px+dx,z=pz+dz,n=props.length,seat=props.filter(p=>p.kind==='desk').length;props.push({kind:'desk',x,z,variant:(dz<0?10:0)+n%5});
    props.push({kind:'monitor',x,z:z+(dz<0?.17:-.17),y:1.2,rotation:dz<0?Math.PI:0,variant:n%7});
    // The chair sits out from the desk's open side; next to a pillar it is pulled round the pillar's
    // far side. The bin goes by the desk's outer corner, unless a pillar stands there.
    const out=dz<0?-1:1,side=Math.sign(dx),chairX=clear(x,z+out,.31,.31)?x:x-side*.62;
    // The chair's backrest is at its local -z, so it faces +z: turn it toward its desk (R5-134).
    props.push({kind:'chair',x:chairX,z:z+out,rotation:dz<0?0:Math.PI,color:CHAIRS[seat%CHAIRS.length]});
    props.push({kind:'mug',x:x+.55,z,y:1.08,color:MUGS[seat%MUGS.length]},{kind:'paper',x:x-.38,z,y:.99},{kind:'paper',x:x+.22,z:z+out*.16,y:1.01});
    if(clear(x+side*.62,z+out*.62,.19,.19))props.push({kind:'bin',x:x+side*.62,z:z+out*.62});
    if(npcs.length<22)npcs.push({x:chairX,z:z+out});
  }
}
// Filing cabinets with archive boxes along the back wall (z -12: 2 m further back than before).
for(let i=0;i<18;i++){props.push({kind:'cabinet',x:-9+i*.85,z:-11.2});props.push({kind:'box',x:-9+i*.85,z:-11.2,y:1.95});}
for(const [x,z] of [[-9,-10],[8.6,-10.6],[-9.3,8.6],[8.6,8.2],[14,8],[17.35,-1.3],[-3,0],[-17.3,11.3],[15.4,-11.3]])props.push({kind:'plant',x,z});
for(let i=0;i<14;i++)props.push({kind:'box',x:-12+(i%3)*.75,z:-1+Math.floor(i/3)*.72});
props.push({kind:'printer',x:-10,z:-2},{kind:'vending',x:-16.9,z:1.5},{kind:'cooler',x:-15,z:7},{kind:'whiteboard',x:-10,z:5,rotation:.45});
// DR-36: the clean route (wall outlet, reel, coupler, second reel, strip) chains leads, which office
// safety rules forbid (OSHA 1910.303, ESFI). The game reads it as a site setup instead: two heavy-duty
// reels joined by a rated inline coupler feeding a strip with its own breaker. Never put the Lunch
// thin-cable lesson on chained leads.
// The boardroom's power strip is missing from its spot by the door: it sits on the printer stand.
props.push({kind:'strip',x:-8.6,z:-3.2,id:'strip'});
props.push({kind:'cart',x:-3,z:4.7,id:'mail-cart',color:'#8c96a8'},{kind:'reel',x:-3,z:4.7,y:1.03,id:'extension'},{kind:'coupler',x:-3.6,z:4.7,y:.9,id:'coupler'});
props.push({kind:'desk',x:-14,z:5,variant:5},{kind:'coffee',x:-14,z:5,y:1.3,id:'coffee'},{kind:'reel',x:-12.7,z:4.5,id:'coffee-reel'});
// Lounge: the ping-pong table moved into its new front corner, where two coworkers play instead of
// preparing for the meeting.
props.push({kind:'sofa',x:12,z:6.4,rotation:Math.PI},{kind:'beanbag',x:10,z:4.6,color:'#c4553b'},{kind:'beanbag',x:14.6,z:4.4,color:'#2f5fb8'},{kind:'desk',x:12.5,z:4.2,color:'#b98552'},{kind:'pingpong',x:14.4,z:10.4},{kind:'bookshelf',x:9,z:3,rotation:Math.PI/2});
props.push({kind:'beanbag',x:11,z:9.6,color:'#4f7d6a'},{kind:'stool',x:11.6,z:11.2,color:'#e5484d'},{kind:'stool',x:17.2,z:8.9,color:'#3f7fd6'});
npcs.push({x:12.55,z:10.4,standing:true,yaw:Math.PI/2},{x:16.25,z:10.4,standing:true,yaw:-Math.PI/2});
for(let i=0;i<8;i++){const x=i%2?13.2:10.8,z=-7.9+Math.floor(i/2)*1.05;props.push({kind:'chair',x,z,rotation:i%2?-Math.PI/2:Math.PI/2,color:'#3a3d55'});if(i<4)npcs.push({x,z});}
// The boardroom is 2 m deeper: the boss's chair at the head of the table, a shelf closing the glass
// wall's back end, a flip board of talking points, a water cooler.
props.push({kind:'chair',x:12,z:-9.25,rotation:0,color:'#2f5fb8'},{kind:'bookshelf',x:9.3,z:-10.86,rotation:Math.PI/2},{kind:'whiteboard',x:16.9,z:-6.5,rotation:-Math.PI/2},{kind:'cooler',x:17.3,z:-11.35});
npcs.push({x:12,z:-9.25});
for(let i=0;i<4;i++)props.push({kind:'box',x:-16.7+(i%2)*.8,z:7.6+Math.floor(i/2)*.8});
for(let i=0;i<3;i++)props.push({kind:'glass',x:9.3,z:-8.6+i*2.5,id:`glass-${i}`});
// Huddle corner (front left): two desks pushed together, four chairs, a whiteboard of slide sketches.
props.push({kind:'desk',x:-13.2,z:9.375,variant:15},{kind:'desk',x:-13.2,z:10.225,variant:5},{kind:'whiteboard',x:-15.9,z:9.8,rotation:Math.PI/2});
props.push({kind:'chair',x:-13.2,z:8.35,rotation:0,color:'#c4553b'},{kind:'chair',x:-13.2,z:11.25,rotation:Math.PI,color:'#4f7d6a'},{kind:'chair',x:-14.45,z:9.8,rotation:Math.PI/2,color:'#2f5fb8'},{kind:'chair',x:-11.95,z:9.8,rotation:-Math.PI/2,color:'#e5484d'});
props.push({kind:'mug',x:-13.55,z:9.55,y:1.08,color:'#3f7fd6'},{kind:'mug',x:-12.85,z:10.05,y:1.08,color:'#f4efe6'},{kind:'paper',x:-13.2,z:9.8,y:.99},{kind:'paper',x:-12.9,z:9.45,y:.99},{kind:'paper',x:-13.5,z:10.2,y:.99});
npcs.push({x:-13.2,z:8.35},{x:-11.95,z:9.8});
// Catering for the big meeting waits by the boardroom door: a table with a tray and mugs, a coolbox.
props.push({kind:'desk',x:17.2,z:2.6,rotation:Math.PI/2,variant:5},{kind:'tray',x:17.2,z:2.15,y:1.06,rotation:Math.PI/2},{kind:'mug',x:17.05,z:3.05,y:1.08,color:'#e5484d'},{kind:'mug',x:17.35,z:3.05,y:1.08,color:'#f4efe6'},{kind:'mug',x:17.2,z:3.3,y:1.08,color:'#6cc58a'},{kind:'coolbox',x:17.3,z:4.5,rotation:Math.PI/2});
// The copier by the boardroom, a carton of paper beside it (the handouts for the meeting).
props.push({kind:'printer',x:6.9,z:-11.35},{kind:'box',x:7.9,z:-11.35});
// The chaos target (R5-098): a tower of supply cartons at the aisle end, beside the cable's route to
// the boardroom. A slingshot, a dragged cable or a shove brings it down (MeetingStrip.towerDown).
export const TOWER:PropSpec[]=[{kind:'box',x:7.63,z:-2.35,y:.3},{kind:'box',x:8.37,z:-2.35,y:.3},{kind:'box',x:7.63,z:-2.35,y:.91},{kind:'box',x:8.37,z:-2.35,y:.91},{kind:'box',x:8,z:-2.35,y:1.52}];
props.push(...TOWER);
export const meeting:Level={id:'meeting',name:'BIG MEETING',number:'01',tagline:'Big meeting. Little technician.',badge:'projector',next:'lunch',deadline:240,width:36,depth:24,spawn:{x:-10,z:-5.8},anchor:{x:-11.4,z:-7.8},target:{x:12.3,z:-2.25},switchAt:{x:12,z:-4.4},length:23.2,props,npcs,
  // The server closet has no door: a strip, coupler or reel thrown over its wall comes back. It fills the
  // back-left corner of the bigger shell; its east wall (with the live outlet) stays by the reel.
  sealed:[{minX:-18,maxX:-11.775,minZ:-12,maxZ:-5.375}],
  obstacles:[...PILLARS.map(([x,z],i)=>({id:`pillar-${i}`,minX:x-.45,maxX:x+.45,minZ:z-.45,maxZ:z+.45})),
    {id:'closet-east',minX:-12.025,maxX:-11.775,minZ:-12,maxZ:-5.5},{id:'closet-front',minX:-18,maxX:-11.775,minZ:-5.625,maxZ:-5.375}]};
