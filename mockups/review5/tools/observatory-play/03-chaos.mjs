import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,atBench:s.atBench,paused:s.paused,dmg:s.damage,cost:s.cost,alarmed:s.alarmed,fastest:+s.fastestProp.toFixed(1),player:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)],st:{job:s.station.job,cartD:s.station.cartDistance,moved:s.station.cartMoved,snr:s.station.reading?.snr,mist:s.station.mistakes}};};
const motor=async()=>{const s=await g.snap();const m=s.items.find(i=>i.id==='motor');return [+m.pos.x.toFixed(2),+m.pos.y.toFixed(2),+m.pos.z.toFixed(2)];};
await g.advance(.5);
// DR-03: first 30 s, grab nearest prop & throw
await g.walk(-5.6,4.4,.5);log('near chair',JSON.stringify(await txt()));await g.key('KeyE',.2);log('grab',JSON.stringify(await st()));
await g.key('KeyQ',.05);await g.advance(.3);log('throw chair',JSON.stringify(await st()));await g.shot(P+'50-chair-throw');await g.advance(1);
// Push the cart by walking into it (no grab)
let m0=await motor();await g.walk(-3.7,.6,.3);await g.walk(-3.7,-1.6,.2,3);log('push cart',JSON.stringify(m0),'->',JSON.stringify(await motor()),JSON.stringify(await st()));
// Grab cart and throw it (Q) toward +x
await g.walk(-3.7,0.2,.6);await g.key('KeyE',.3);log('held',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.walk(-2.4,1.2,.3);await g.walk(-1.6,1.8,.2);
await g.key('KeyQ',.05);await g.advance(.25);await g.shot(P+'51-cart-thrown');await g.advance(1.5);log('after throw',JSON.stringify(await motor()),JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'52-cart-landed');
await g.zoom(-1500);await g.shot(P+'53-cart-landed-zoom9');await g.zoom(1500);
// Rampage through clutter at a sprint
for(const [x,z] of [[-8.8,6.2],[-9.3,5.4],[-1,5.6],[3.4,4.8],[8.8,6.2],[8.8,1],[3.2,-1.2]]){await g.walk(x,z,.4,8);}
log('rampage',JSON.stringify(await st()));await g.shot(P+'54-after-rampage');
// throw a box at the astronomer in the gallery (6.2,-5.2)
await g.walk(5.2,-3.4,.5,8);log('near?',JSON.stringify(await txt()));await g.key('KeyE',.2);log('grab',JSON.stringify(await st()));await g.walk(5.8,-4.2,.2,3);await g.key('KeyQ',.05);await g.advance(.5);log('threw at npc',JSON.stringify(await st()));await g.shot(P+'55-throw-at-astronomer');
await g.advance(1);
// Now solve cleanly; grade check
await g.walk(0,-1.55,.4,15);await g.key('KeyE',.6);log('sat',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.act('pick','C');await g.act('slot','shunt');await g.act('value',{slot:'shunt',value:1.5e-6});await g.act('route');await g.act('log');
log('log1',JSON.stringify(await st()),JSON.stringify(await txt()));
// stand up and press R in room (restart?)
await g.key('KeyE',.3);log('stood',JSON.stringify(await st()));
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(3000);
const after=await g.page.evaluate(()=>({ready:document.body.dataset.ready,screen:document.body.dataset.screen,snap:window.__circuitCrew?.snapshot?.()}));log('after R',JSON.stringify({ready:after.ready,screen:after.screen,running:after.snap?.running,job:after.snap?.station?.job,time:after.snap?.time}));
await g.shot(P+'56-after-R-in-room');
log('errors',JSON.stringify(await g.close()));
