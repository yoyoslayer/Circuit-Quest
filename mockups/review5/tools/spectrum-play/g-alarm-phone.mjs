import {launch} from '../cap.mjs';
import {ui,route,job1} from './common.mjs';
const K='spectrum-play';
let g=await launch('spectrum',{fullfx:true});
await g.advance(.5);
await route(g,[[-1,6.4]]);await g.walk(1.0,6.6,.3);console.log(JSON.stringify(await ui(g)));
await g.key('KeyE');let s=await g.snap();console.log('held',s.held);
await g.walk(2.2,6.2,.3);await g.advance(.2,['KeyD']);
await g.key('KeyQ',.05);
for(let i=0;i<6;i++){await g.advance(.1);s=await g.snap();console.log('t+',((i+1)/10).toFixed(1),'alarmed',s.alarmed,'fastest',s.fastestProp.toFixed(1),'damage',s.damage);}
await g.shot(`${K}-65-crate-thrown-at-tea-coworker`);
console.log('errors',JSON.stringify(await g.close()));
// phone
g=await launch('spectrum',{fullfx:true,width:390,height:844});
await g.advance(1);await g.shot(`${K}-90-phone-start`);
await g.survey();await g.shot(`${K}-91-phone-survey`);await g.survey();
await job1(g);
await g.walk(-6.3,3.6);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(1);
await g.key('Digit4',.2);
await g.shot(`${K}-92-phone-bench`);
console.log('phone ui',JSON.stringify(await ui(g)));
console.log('errors',JSON.stringify(await g.close()));
