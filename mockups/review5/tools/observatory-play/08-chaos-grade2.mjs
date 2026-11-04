import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),dmg:s.damage,cost:s.cost,atBench:s.atBench,st:{job:s.station.job,cartD:s.station.cartDistance,snr:s.station.reading?.snr,latch:s.station.reading?.latch,lvl:s.station.reading&&+s.station.reading.level.toFixed(2),ant:s.station.reading&&+s.station.reading.antenna.toFixed(2),mist:s.station.mistakes,spent:s.station.spent,logged:s.station.logged}};};
await g.advance(.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);log('held?',(await g.snap()).held);await g.walk(-2.4,1.2,.3);await g.walk(-1.6,1.8,.2);await g.key('KeyQ',.05);await g.advance(2);
log('thrown',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.walk(0,-1.55,.4,15);await g.key('KeyE',.6);log('sat',JSON.stringify(await st()));
await g.act('pick','C');await g.act('slot','shunt');await g.act('value',{slot:'shunt',value:1.5e-6});await g.act('route');await g.advance(.2);await g.act('log');await g.advance(.3);
log('log1',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'94-chaos-cart-log1-tier');
// job 2 latch fail
await g.act('pick','C');await g.act('slot','series');await g.advance(.3);await g.shot(P+'95-series-cap-latch-lamp');log('seriesC',JSON.stringify(await st()));
await g.act('log');await g.advance(.1);await g.shot(P+'96-latch-fail-0.1');log('latchfail',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.key('KeyE',.3);await g.survey();await g.shot(P+'97-latch-fail-room');await g.survey();
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
await g.act('pick','L');await g.act('slot','series');await g.act('value',{slot:'series',value:.01});await g.act('value',{slot:'shunt',value:1e-6});await g.act('log');await g.advance(.3);
log('log2',JSON.stringify(await st()),JSON.stringify(await txt()));
// job 3 brute force rods
for(const r of ['r3','r17','r75','r150']){await g.act('rod',r);const a=(await st()).st;log('rod',r,'flat',a.snr,a.ant);}
await g.act('orient');for(const r of ['r3','r17','r75','r150']){await g.act('rod',r);const a=(await st()).st;log('rod',r,'up',a.snr,a.ant);}
await g.act('rod','r17');await g.advance(.2);await g.shot(P+'98-rod17-upright');
await g.act('rod','r75');await g.act('log');await g.advance(4);
const s=await g.snap();log('final',JSON.stringify({won:s.won,time:s.time,damage:s.damage,cost:s.cost,mist:s.station.mistakes}));
log('result',JSON.stringify(await g.page.evaluate(()=>[...document.querySelectorAll('[class*=result]')].map(e=>e.innerText).join(' / ').slice(0,600))));
await g.shot(P+'99-chaos-result');
log('errors',JSON.stringify(await g.close()));
