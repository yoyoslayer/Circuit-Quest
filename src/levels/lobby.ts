import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Circuit Crew HQ: the atrium every job's door opens off (src/hub/lobby.ts). Not a job itself.
const props:PropSpec[]=[
  {kind:'plant',x:-5,z:-1.2},{kind:'plant',x:5,z:-1.2},{kind:'plant',x:-12.6,z:7.4},{kind:'plant',x:9.8,z:7.6},
  {kind:'cooler',x:-4.2,z:6.8},{kind:'bin',x:4.6,z:6.6},{kind:'box',x:-9,z:6.4,color:'#c98f5a'},{kind:'box',x:-8.4,z:7.2,color:'#d7a56d'},
  {kind:'chair',x:-2,z:4.8,color:'#3f7fd6'},{kind:'chair',x:2.2,z:4.9,color:'#e5484d'},{kind:'beanbag',x:8.6,z:5.8,color:'#b392f0'},
  {kind:'cone',x:-3.4,z:7.8},{kind:'mug',x:.9,z:1.3},{kind:'paper',x:-3.4,z:2.8},{kind:'paper',x:3.3,z:-2.4},
];
const npcs:NpcSpot[]=[{x:-.9,z:-1.3,standing:true,acc:['headphones'],yaw:0,mood:'happy'},{x:-7,z:2.2,standing:true,acc:['mug']},{x:6.8,z:1.6,standing:true,acc:['glasses','tie']}];
export const lobby:Level={id:'lobby',name:'CIRCUIT CREW HQ',number:'HQ',tagline:'Every door is a job. Pick one.',badge:'jobs',hub:true,
  width:30,depth:20,spawn:{x:0,z:5.5},anchor:{x:-13,z:8},target:{x:0,z:0},length:10,obstacles:[],props,npcs};
