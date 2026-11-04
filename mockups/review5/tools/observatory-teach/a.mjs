import {launch} from '../cap.mjs';
const K='observatory-teach';
const g=await launch('observatory',{fullfx:true});
const log=(...a)=>console.log(...a);
await g.advance(1);await g.shot(`${K}-01-start`);
log('start',JSON.stringify((await g.snap()).station?.reading?.snr), await g.page.locator('.objective').innerText().catch(()=>''));
log('prompt', await g.page.locator('.prompt').innerText().catch(()=>'-'));
await g.survey();await g.shot(`${K}-02-survey`);await g.key('Tab',.8);
// walk to the cart
await g.walk(-3.7,-.1,.6);await g.advance(.3);await g.shot(`${K}-03-at-cart`);
log('prompt at cart', await g.page.locator('.prompt').innerText().catch(()=>'-'));
await g.key('KeyE',.3);let s=await g.snap();log('held',s.held);await g.shot(`${K}-04-holding-cart`);
await g.walk(-6,3.5,.6);await g.advance(.2);await g.shot(`${K}-05-cart-far`);
log('prompt far', await g.page.locator('.prompt').innerText().catch(()=>'-'));
await g.key('KeyE',.4);s=await g.snap();log('cartMoved',s.station.cartMoved,s.station.cartDistance,'snr',s.station.reading.snr);
// to bench
await g.walk(0,-1.55,.4);await g.advance(.2);await g.shot(`${K}-06-bench-approach`);
await g.key('KeyE',1.2);s=await g.snap();log('atBench',s.atBench);
await g.shot(`${K}-07-bench-view-job1`);
log('panel', (await g.page.locator('.station-panel').innerText().catch(()=>'')).replace(/\n/g,' | '));
log('prompt bench', await g.page.locator('.prompt').innerText().catch(()=>'-'));
// log with plain cable (cart moved, not rerouted): tier?
let r=await g.act('log');s=await g.snap();log('plain log',JSON.stringify(r),s.station.job,s.station.mistakes,JSON.stringify(s.station.logged));
await g.advance(.2);await g.shot(`${K}-08-job1-plain-log`);
log('toast', await g.page.locator('.station-toast').innerText().catch(()=>'-'));
await g.close().then(e=>log('errors',JSON.stringify(e)));
