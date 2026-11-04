import {launch} from '../cap.mjs';import {hud} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(2.2);
await g.walk(-8.1,-5.75,.25);log(JSON.stringify(await hud(g)));
await g.key('KeyE',.2);let s=await g.snap();log('held',s.held);
// face +x toward the seated coworker at about (-6.85,-5.98)
await g.advance(.15,['KeyD']);s=await g.snap();log('pip',JSON.stringify(s.player));
await g.zoom(-900);
await g.key('KeyQ',0);
for(let i=0;i<4;i++){await g.advance(.06);await g.shot(`${K}-${81+i}-throw-frame${i}`);}
await g.advance(.5);s=await g.snap();log('alarmed',s.alarmed,'dmg',s.damage);
console.log('errors',JSON.stringify(await g.close()));
