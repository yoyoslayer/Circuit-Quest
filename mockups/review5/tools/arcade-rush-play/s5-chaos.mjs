import {launch} from '../cap.mjs';import {txt,toTray} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
const tray=async()=>{const s=await g.snap();return s.items.find(i=>i.id==='blocks');};
// DR-03: first physical thing: grab the nearest prop and throw it.
let s=await g.snap();log('t',s.time.toFixed(1),JSON.stringify(await txt(g)));
await g.walk(-2.6,3.9,.6);log('near cone',JSON.stringify(await txt(g)));await g.key('KeyE',.2);s=await g.snap();log('held',s.held);
await g.key('KeyQ',.15);s=await g.snap();log('thrown fastest',s.fastestProp.toFixed(1),'alarmed',s.alarmed,'t',s.time.toFixed(1));await g.shot(P+'50-first-throw');
await g.advance(1);s=await g.snap();log('dmg after throw',s.damage);
// Tray chaos: pick up, carry halfway, throw toward the bench.
await toTray(g,log);await g.key('KeyE',.2);log('holding tray',JSON.stringify(await txt(g)));await g.shot(P+'51-holding-tray');
await g.walk(-7.2,5.8,.5);await g.walk(-5.5,6.4,.5);await g.walk(-2,1.6,.5);
// face the bench and throw
await g.advance(.2,['KeyW']);log('before throw',JSON.stringify(await tray()));
await g.key('KeyQ',.1);await g.advance(1.5);let tr=await tray();s=await g.snap();log('tray after throw',JSON.stringify(tr),'trayReady',s.station.trayReady,'dmg',s.damage,JSON.stringify(await txt(g)));
await g.shot(P+'52-tray-thrown');
await g.zoom(-1200);await g.shot(P+'53-tray-thrown-close');await g.zoom(1200);
// pick it up again and try to wedge it behind the storeroom shelf
await g.walk(tr.pos.x,tr.pos.z,1.0);await g.key('KeyE',.2);s=await g.snap();log('regrab',s.held);
await g.walk(-5.5,6.4,.5);await g.walk(-7.2,6.2,.5);await g.walk(-8.6,6.4,.4);
s=await g.snap();log('at shelf',JSON.stringify(s.player));
// throw it up onto/over the shelf towards the back wall
await g.page.keyboard.down('KeyS');await g.advance(.15,['KeyS']);await g.page.keyboard.up('KeyS');
await g.key('KeyQ',.1);await g.advance(2);tr=await tray();log('tray after shelf throw',JSON.stringify(tr));await g.shot(P+'54-tray-shelf-throw');
await g.advance(8);tr=await tray();log('tray +8s',JSON.stringify(tr));await g.shot(P+'55-tray-shelf-+8s');
log('prompt',JSON.stringify(await txt(g)));
log('errors',JSON.stringify(await g.close()));
