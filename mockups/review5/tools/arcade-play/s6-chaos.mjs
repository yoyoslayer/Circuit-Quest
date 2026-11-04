import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.3);
const near=async()=>(await txt(g)).prompt;
// DR-03: first 30 s, grab nearest prop and throw it
let s=await g.snap();log('spawn',JSON.stringify(s.player));
const b={x:-2.6,z:5.6};for(const [x,z] of [[-3,5.8],[-2.6,6],[-3.2,4.2],[-4.2,4.4]]){await g.walk(x,z,.3,4);const p=await near();log('try',x,z,p);if(p&&p.includes('Grab')){b.x=x-.9;b.z=z-.2;break;}}log('near',await near());await g.key('KeyE',.2);s=await g.snap();log('held',s.held);
await g.walk(b.x+.9,b.z-1.5,.3);await g.key('KeyQ',.3);s=await g.snap();log('throw fastest',s.fastestProp.toFixed(1),'t',s.time.toFixed(1));await g.shot(P+'60-first-throw');await g.advance(1);s=await g.snap();log('after',s.damage,'alarmed',s.alarmed);
// DR-04: throw next to a coworker: npc at (-8,-2.45). Pick a chair near (-8.8,-1.5)
await g.walk(-7.6,-1.2,.4);log('near',await near());await g.key('KeyE',.2);s=await g.snap();log('held2',s.held);await g.walk(-7.4,-2.0,.3);await g.key('KeyQ',.05);await g.advance(.5);s=await g.snap();log('coworker throw: alarmed',s.alarmed,'dmg',s.damage);await g.shot(P+'61-throw-near-coworker');
// Tray: get it, then throw behind the pinball cabinet
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.5);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4],[-4,1],[-6.2,-3.6]])await g.walk(x,z,.5);await g.walk(-6.6,-4.4,.3);s=await g.snap();log('aim at',JSON.stringify(s.player),s.held);
await g.key('KeyQ',2);s=await g.snap();log('tray thrown',JSON.stringify(s.items[0].pos));await g.shot(P+'62-tray-thrown-back');
await g.advance(8);s=await g.snap();log('tray after 8s',JSON.stringify(s.items[0].pos));
await g.walk(-7.8,-5.2,.3,8);s=await g.snap();log('pip closest',JSON.stringify(s.player),'prompt',await near());await g.zoom(-1500);await g.orbit(0,-200);await g.shot(P+'63-tray-after-throw-back');
log('errors',JSON.stringify(await g.close()));
