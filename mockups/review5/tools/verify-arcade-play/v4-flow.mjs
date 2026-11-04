import {launch} from '../cap.mjs';import {txt} from '../arcade-play/common.mjs';
const P='verify-arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.3);
let s=await g.snap();log('snapshot keys',Object.keys(s).join(','));
// #14: sit at bench before tray
await g.walk(1.2,-1.3,.5);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
log('#14 at bench no tray',JSON.stringify(await txt(g)));
await g.key('Escape',.5);log('#14 after stand',JSON.stringify(await txt(g)));
const dots=await g.page.evaluate(()=>[...document.querySelectorAll('.objective .dots b')].map(b=>b.className).join(','));log('#14 dots',dots);
await g.shot(P+'08-card-after-sitting-without-tray');
// #18: walk into the sleepy blob at (-6.5,-5.2)
const r=await g.walk(-6.5,-5.2,.1,8);log('#18 walk into npc',JSON.stringify(r.state.player),'arrived',r.arrived);
await g.zoom(-2000);await g.shot(P+'09-pip-into-npc-zoom9');await g.zoom(1000);
// #6: get tray, throw at the bench from in front
for(const [x,z] of [[-4,1],[-5.5,6.4],[-7.2,5.8]])await g.walk(x,z,.5);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.5);await g.walk(.4,.3,.3);
s=await g.snap();const d0=s.damage;log('#15 prompt far',JSON.stringify((await txt(g)).prompt),'heading?');
await g.key('KeyQ',3);s=await g.snap();log('#6 thrown tray pos',JSON.stringify(s.items?.[0]?.pos),'trayReady',s.station.trayReady,'damage',d0,'->',s.damage,'cost',s.cost);
await g.survey();await g.shot(P+'10-thrown-tray-survey');await g.survey();
log('errors',JSON.stringify(await g.close()));
