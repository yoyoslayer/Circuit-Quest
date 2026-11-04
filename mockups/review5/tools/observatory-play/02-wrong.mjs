import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,atBench:s.atBench,dmg:s.damage,cost:s.cost,alarmed:s.alarmed,fastest:+s.fastestProp.toFixed(1),player:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)],st:{job:s.station.job,cartD:s.station.cartDistance,moved:s.station.cartMoved,snr:s.station.reading?.snr,mist:s.station.mistakes,spent:s.station.spent,held:s.station.held,series:s.station.series,shunt:s.station.shunt}};};
await g.advance(.5);
// 1 Bench first, cart never moved
await g.walk(0,-1.55,.4);log('bench first',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'30-bench-first-room');
await g.key('KeyE',.6);log('sat early',JSON.stringify(await txt()));await g.shot(P+'31-bench-cart-still-near');
await g.key('Enter',.1);await g.shot(P+'32-fail-0.1');log('fail',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.advance(.6);await g.shot(P+'33-fail-0.7');
// keys that are not bench keys
for(const k of ['KeyF','Space','KeyQ','Tab','KeyP','Digit4']){await g.key(k,.2);log('key',k,JSON.stringify(await st()),JSON.stringify(await txt()));}
await g.shot(P+'34-after-random-keys');
// slot with nothing
log('slot empty',JSON.stringify(await g.act('slot','series').then(r=>r.ok)));
// pick L and leave bench holding it
await g.act('pick','L');await g.key('Escape',.3);log('left holding L',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'35-left-bench-holding-can');
// Chaos: grab cart and throw it
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);log('held cart',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.zoom(-1500);await g.shot(P+'36-carry-cart-zoom9');await g.zoom(1500);
await g.walk(-3.2,1.5,.3);
await g.key('KeyQ',.05);await g.advance(.2);await g.shot(P+'37-cart-thrown-air');await g.advance(1.5);log('after throw',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'38-cart-after-throw');
// sprint-tackle into clutter: walk fast through crates area
const before=(await g.snap()).damage;
await g.walk(-8.8,6.4,.4);await g.walk(-9.3,5.2,.3);await g.walk(8.8,6.2,.4);log('rampage',JSON.stringify(await st()));
// grab chair, throw at astronomer near telescope
await g.walk(-1.8,2.0,.5);log('near chair',JSON.stringify(await txt()));await g.key('KeyE',.2);await g.walk(-3.6,-2.9,.3);await g.key('KeyQ',.05);await g.advance(.5);log('threw at npc',JSON.stringify(await st()));await g.shot(P+'39-throw-near-astronomer');
await g.advance(1.5);
// back to the bench: is cart still counted, is job ok
let s=await g.snap();log('motor item',JSON.stringify(s.items.find(i=>i.id==='motor')));
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);log('sat again',JSON.stringify(await st()),JSON.stringify(await txt()));
// Job 1 via LC (expensive) then job2: shunt C sweep only
await g.act('pick','C');await g.act('slot','shunt');for(const v of [1e-6,1.5e-6,2.2e-6,3.3e-6]){await g.act('value',{slot:'shunt',value:v});const r=(await g.snap()).station.reading;log('job1 C',v,r.snr,r.level.toFixed(2));}
await g.act('value',{slot:'shunt',value:2.2e-6});await g.key('Enter',.3);log('log1',JSON.stringify(await st()),JSON.stringify(await txt()));
const res=[];for(const v of [1e-8,1e-7,4.7e-7,1e-6,2.2e-6,4.7e-6,6.8e-6,1e-5]){await g.act('value',{slot:'shunt',value:v});const r=(await g.snap()).station.reading;res.push([v,r.snr,+r.level.toFixed(2)]);}
log('job2 shunt-C only sweep',JSON.stringify(res),JSON.stringify(await txt()));
// series R, C (latch), L
await g.act('pick','C');await g.act('slot','series');await g.advance(.2);log('series C',JSON.stringify((await g.snap()).station.reading.latch),JSON.stringify(await txt()));await g.shot(P+'40-series-cap-latch-off');
await g.key('Enter',.1);await g.shot(P+'41-latch-fail-toast');log('latch fail',JSON.stringify(await st()),JSON.stringify(await txt()));
s=await g.snap();log('final',JSON.stringify({damage:s.damage,cost:s.cost,mist:s.station.mistakes}));
log('errors',JSON.stringify(await g.close()));
