import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Circuit Crew HQ: the atrium every job's door opens off (src/hub/lobby.ts). Not a job itself.
const props:PropSpec[]=[
  {kind:'plant',x:-5,z:-1.2},{kind:'plant',x:5,z:-1.2},{kind:'plant',x:-12.6,z:7.4},{kind:'plant',x:9.8,z:7.6},
  {kind:'cooler',x:-4.2,z:6.8},{kind:'bin',x:4.6,z:6.6},{kind:'box',x:-9,z:6.4,color:'#c98f5a'},{kind:'box',x:-8.4,z:7.2,color:'#d7a56d'},
  {kind:'chair',x:-2,z:4.8,color:'#3f7fd6'},{kind:'chair',x:2.2,z:4.9,color:'#e5484d'},{kind:'beanbag',x:8.6,z:5.8,color:'#4f7d6a'},
  {kind:'cone',x:-3.4,z:7.8},{kind:'mug',x:.9,z:1.3,color:'#e5484d'},{kind:'paper',x:-3.4,z:2.8},{kind:'paper',x:3.3,z:-2.4},
];
// Door approach points (src/hub/lobby.ts doorSlots: six on the back wall, three on the side wall).
const DOORS:[number,number][]=[...[0,1,2,3,4,5].map(k=>[-11.6+k*4.64,-8.9] as [number,number]),...[0,1,2].map(k=>[-13.9,-5.5+k*4.6] as [number,number])];
const npcs:NpcSpot[]=[{x:-1.4,z:.6,standing:true,acc:['headphones'],yaw:0,mood:'happy'},{x:-7,z:2.2,standing:true,acc:['mug']},{x:6.8,z:1.6,standing:true,acc:['glasses','tie']}];
export const lobby:Level={id:'lobby',name:'CIRCUIT CREW HQ',number:'HQ',tagline:'Every door is a job. Pick one.',badge:'jobs',hub:true,
  width:30,depth:20,spawn:{x:0,z:5.5},anchor:{x:-13,z:8},target:{x:0,z:0},length:10,obstacles:[],props,npcs,
  // HQ clutter (R5-159): lounge corners, plants, parcels and a reading nook round the atrium, so the hub is a
  // toy box. A lane runs from the spawn to every door and the Workshop, and each door's approach and leaf
  // sweep stays clear.
  clutter:{seed:8,step:2.1,max:130,jitter:.6,fillSkip:.25,recipes:['lounge','plants','crates','cooler','reading','bins','lounge','crates','cart'],fill:['box','box','bin','cone'],
    colors:['#5ED6CC','#7B6FE0','#e5484d','#2f5fb8','#4f7d6a'],
    lanes:[...DOORS.map(([x,z])=>({points:[[0,5.5],[x,z]] as [number,number][],r:1.25})),...DOORS.map(([x,z])=>({points:[[x,z],[x,z]] as [number,number][],r:1.9})),
      {points:[[0,5.5],[7.5,5.5]],r:1.3},{points:[[7.5,5.5],[7.5,5.5]],r:1.8},{points:[[-4,0],[4,0]],r:2.6}]}};
