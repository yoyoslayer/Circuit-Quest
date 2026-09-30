import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Circuit Crew HQ: the atrium every job's door opens off (src/hub/lobby.ts). Not a job itself.
const props:PropSpec[]=[
  {kind:'plant',x:-5,z:-1.2},{kind:'plant',x:5,z:-1.2},
  {kind:'plant',x:-13,z:10},{kind:'plant',x:13,z:10},
  {kind:'cooler',x:-6,z:8},
];
const npcs:NpcSpot[]=[{x:-.9,z:-1.3,standing:true,acc:['headphones'],yaw:0,mood:'happy'},{x:-7,z:2.2,standing:true,acc:['mug']},{x:6.8,z:1.6,standing:true,acc:['glasses','tie']}];
export const lobby:Level={id:'lobby',name:'CIRCUIT CREW HQ',number:'HQ',tagline:'Every door is a job. Pick one.',badge:'jobs',hub:true,
  width:34,depth:28,spawn:{x:0,z:5.5},anchor:{x:-13,z:8},target:{x:0,z:0},length:10,obstacles:[],props,npcs};
