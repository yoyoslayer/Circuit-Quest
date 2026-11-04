import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(.3);
// DR-03: first 30 s physical comedy: grab nearest junk and throw it at the desk pod coworkers
await g.walk(-8.2,-4.6,.4);let s=await g.snap();log('nearest prompt',JSON.stringify(await hud(g)));
await g.key('KeyE');s=await g.snap();log('held',s.held);
await g.walk(-7.4,-4.6,.3);
await g.key('KeyQ',.05);s=await g.snap();log('thrown fastest',s.fastestProp.toFixed(1));
await g.advance(.5);s=await g.snap();log('after throw alarmed',s.alarmed,'dmg',s.damage,'t',s.time.toFixed(1));
await g.shot(`${K}-41-throw-at-coworkers`);
// shove into desk pod at sprint: knock stuff
s=await g.advance(1.5,['KeyD','ShiftLeft']);s=await g.snap();log('sprint into pod alarmed',s.alarmed,'dmg',s.damage,'fastest',s.fastestProp.toFixed(1));
await g.shot(`${K}-42-sprint-into-pod`);
// idle until 40 s (hint dots) — walk back near reel and wait
await g.walk(-9.5,-5.5,.5);s=await g.advance(Math.max(0,41-(await g.snap()).time));log('t',s.time.toFixed(1));
await g.shot(`${K}-43-idle-40s-hint-dots`);
await g.survey();await g.shot(`${K}-44-idle-hint-survey`);await g.survey();
// R key mid-run: does it reload instantly?
const before=(await g.snap()).time;await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(3000);
const after=await g.page.evaluate(()=>({ready:document.body.dataset.ready,screen:document.body.dataset.screen,t:window.__circuitCrew?.snapshot().time,running:window.__circuitCrew?.snapshot().running}));log('R pressed at',before.toFixed(1),'->',JSON.stringify(after));
await g.shot(`${K}-45-after-R`);
console.log('errors',JSON.stringify(await g.close()));
// Phone
g=await launch('meeting',{fullfx:true,width:390,height:844});await g.advance(.5);log('phone hud',JSON.stringify(await hud(g)));
await g.shot(`${K}-46-phone-start`);await g.survey();await g.shot(`${K}-47-phone-survey`);await g.survey();
await placeStrip(g);await g.advance(.3);await g.shot(`${K}-48-phone-door`);
console.log('errors',JSON.stringify(await g.close()));
