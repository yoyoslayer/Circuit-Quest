import {launch} from '../cap.mjs';import {hook,ui,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
for(const [label,key,d] of [['q03','KeyQ',.95],['f12','KeyF',2.4],['f20','KeyF',2.75]]){
const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.5);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[3.5,-5.2]])await g.walk(x,z);
// face the socket: walk straight at it, stop when plug is ~d-0.65 from socket
await g.walk(7-d,-6,.12,10);const u=await ui(g);L(label,'before',u,'plug->socket',Math.hypot(u.plug[0]-7,u.plug[1]+6).toFixed(2));
if(label==='q03'){await g.zoom(-1500);await g.shot(`${K}-07-pg-before-Q-0p3`);}
await g.key(key,.4);const s=await g.snap();const u2=await ui(g);L(label,'after',key,'connected',u2.connected,'electrical',s.electrical,u2);
if(label==='q03')await g.shot(`${K}-08-pg-after-Q-0p3`);
L(await g.close());}
