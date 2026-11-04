import {launch} from '../cap.mjs';
const P='verify-observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText,panelHidden:document.querySelector('.station-panel')?.hidden}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),atBench:s.atBench,dmg:s.damage,cost:s.cost,dc:s.drawCalls,held:s.held,survey:undefined,st:{job:s.station.job,cartD:s.station.cartDistance,moved:s.station.cartMoved,snr:s.station.reading?.snr,lvl:s.station.reading?.level,shunt:s.station.shunt,series:s.station.series,mist:s.station.mistakes,scope:s.station.scope,knob:s.station.knob,logged:s.station.logged}};};
await g.advance(1);log('start',JSON.stringify(await st()),JSON.stringify(await txt()));
// Sit WITHOUT moving the cart (F4)
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);log('sat',JSON.stringify(await txt()));
// F13: F at bench
await g.key('KeyF',.2);log('after F at bench atBench=',(await g.snap()).atBench);
await g.key('KeyE',.6);log('re-sat atBench=',(await g.snap()).atBench);
// job1 with cart near: LC low-pass (from spec) -> tier 2
for(const [n,a] of [['pick','L'],['slot','series'],['value',{slot:'series',value:.01}],['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:1e-6}],['route'],['log']])await g.act(n,a);
await g.advance(.4);log('log1 (cart not moved)',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.shot(P+'01-card-after-log1-cart-unmoved');
// F5 prompt at job2 start: hover nothing
await g.page.mouse.move(5,450);await g.advance(.2);log('job2 prompt',JSON.stringify(await txt()));
// F0: in job 2? no - redo F0 in a fresh run below. F9: knob drag in pixels. Shunt can currently 1uF. Find the knob screen pos via raycast probing.
const probe=await g.page.evaluate(()=>{return null});
// Stand up (Esc), press R (F1)
const origin=await g.page.evaluate(()=>performance.timeOrigin);
await g.page.keyboard.press('Escape');await g.advance(.3);log('stood up atBench=',(await g.snap()).atBench);
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);
let o2=null;try{await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});o2=await g.page.evaluate(()=>performance.timeOrigin);}catch(e){log('wait err',e.message)}
log('timeOrigin before/after',origin,o2,'reloaded=',origin!==o2);
try{const s=await g.page.evaluate(()=>window.__circuitCrew.snapshot());log('after R',JSON.stringify({running:s.running,job:s.station.job,time:s.time}));}catch(e){log(e.message)}
log('errors',JSON.stringify(await g.close()));
