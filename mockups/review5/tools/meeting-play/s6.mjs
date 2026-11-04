import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(.3);
// A) Plug in before the strip is placed
await g.key('KeyF');await route(g,[[-8,-5],[-1,-1.5],[6,-1.2]]);s=await g.advance(1.5,['KeyD','ShiftLeft']);
var s=await g.snap();log('A at door w/o strip',JSON.stringify(await hud(g)),'strain',s.rope.strain.toFixed(2));
await g.key('KeyF',.3);s=await g.snap();log('A plugged no strip',JSON.stringify({c:s.electrical,hp:s.holdingPlug,sp:s.stripPlaced}),JSON.stringify(await hud(g)));
await g.shot(`${K}-61-plugged-without-strip`);
// B) Slingshot: grab the plug back, overstretch in the pod, let go
await g.key('KeyF',.2);s=await g.snap();log('B regrab',s.holdingPlug,'strain',s.rope.strain.toFixed(2));
s=await g.advance(1.2,['KeyS','ShiftLeft']);s=await g.snap();log('B stretched strain',s.rope.strain.toFixed(2),'pos',JSON.stringify(s.player));
await g.shot(`${K}-62-slingshot-windup`);
const pre=(await g.snap()).items;await g.key('KeyQ',.05);await g.shot(`${K}-63-slingshot-release`);
await g.advance(1.2);s=await g.snap();log('B after sling fastest',s.fastestProp.toFixed(1),'dmg',s.damage,'cost',s.cost,'alarmed',s.alarmed,'plug at',JSON.stringify(s.rope));
await g.shot(`${K}-64-slingshot-aftermath`);
console.log('errors',JSON.stringify(await g.close()));
// C) Coffee reel after being connected
g=await launch('meeting',{fullfx:true});await g.advance(.3);await placeStrip(g);await route(g,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
await route(g,[[-8,-5],[-1,-1.5],[6,-1.2]]);await g.advance(1.5,['KeyD','ShiftLeft']);await g.key('KeyF',.3);s=await g.snap();log('C connected',s.electrical,JSON.stringify(s.strip));
await route(g,[[6,-1.2],[-8,-1.4],[-10,3.5]]);await g.walk(-12,4.5,.4);log('C coffee prompt',JSON.stringify(await hud(g)));await g.key('KeyE',.3);s=await g.snap();
log('C after coffee',JSON.stringify({hp:s.holdingPlug,draw:s.strip.draw,len:s.rope.length.toFixed(1),max:s.rope.maxLength,app:s.strip.appliances}));
await g.shot(`${K}-65-coffee-after-connected`);
// walk to switch while holding coffee plug far from strip
await route(g,[[-9,5.3],[6.9,5.3],[8,-1.3],[12.3,-1.2],[12.3,-3.2]],.4);s=await g.snap();log('C at switch',JSON.stringify(await hud(g)),'hp',s.holdingPlug,'strain',s.rope.strain.toFixed(2));
await g.key('KeyE',.3);s=await g.snap();log('C switch',s.won,s.electrical,JSON.stringify(s.strip));
await g.shot(`${K}-66-coffee-switch`);
console.log('errors',JSON.stringify(await g.close()));
// D) deadline
g=await launch('meeting',{fullfx:true});await g.advance(.3);await g.walk(-8,-1.4);await g.advance(246-(await g.snap()).time);s=await g.snap();log('D late t',s.time.toFixed(0),'alarmed',s.alarmed,JSON.stringify(await hud(g)));
await g.shot(`${K}-67-past-deadline`);
console.log('errors',JSON.stringify(await g.close()));
