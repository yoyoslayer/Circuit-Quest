import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.3);
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.5);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.5);await g.walk(.6,.9,.4);await g.walk(.4,.3,.3);
log('prompt before throw',JSON.stringify(await txt(g)));
await g.key('KeyQ',2);let s=await g.snap();log('tray',JSON.stringify(s.items[0].pos),'dmg',s.damage,'cost',s.cost);
await g.survey();await g.shot(P+'90-tray-thrown-over-bench-survey');await g.survey();
// route around the right end of the bench
const legs=[[2.8,-0.8],[3.0,-4.4],[s.items[0].pos.x+.6,s.items[0].pos.z+.2]];
for(const [x,z] of legs){const r=await g.walk(x,z,.4,12);log('leg',x.toFixed(1),z.toFixed(1),r.arrived,JSON.stringify(r.state.player),'t',r.state.time.toFixed(1));}
log('prompt',JSON.stringify(await txt(g)));await g.shot(P+'91-behind-bench-fetch');
await g.key('KeyE',.2);s=await g.snap();log('held',s.held);
// carry back and drop at bench from behind
await g.walk(0.2,-3.6,.4,8);log('prompt behind',JSON.stringify(await txt(g)));await g.key('KeyE',.3);s=await g.snap();log('trayReady from behind',s.station.trayReady,'t',s.time.toFixed(1));
// bench camera orbit attempt
await g.walk(2.8,-3.5,.4,8);await g.walk(2.8,-0.8,.4,8);await g.walk(0,-1.55,.4,8);await g.key('KeyE',.5);
await g.orbit(-400,0,.8);await g.shot(P+'92-bench-orbit-attempt');
log('errors',JSON.stringify(await g.close()));
