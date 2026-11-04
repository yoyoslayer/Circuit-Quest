import {launch} from '../cap.mjs';
const P='garage-play-';const log=(...a)=>console.log(...a);
const g=await launch('garage',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
const st=async()=>{const s=await g.snap();const b=s.items.find(i=>i.id==='robot');return {t:+s.time.toFixed(1),held:s.held,atBench:s.atBench,bot:{x:+b.pos.x.toFixed(2),y:+b.pos.y.toFixed(2),z:+b.pos.z.toFixed(2)},onStand:s.station.onStand};};
await g.advance(.5);
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.3);await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
log('placed',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.key('KeyE',.3);log('E again at stand',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);log('at bench holding?',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'85-holding-fixed-robot-at-bench');
await g.key('KeyE',.4);log('E at bench',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.key('KeyE',.4);log('E at bench 2',JSON.stringify(await st()),JSON.stringify(await txt()));
// Restart with R mid-job
await g.page.keyboard.press('KeyR');await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});await g.page.waitForTimeout(500);
log('after R',await g.page.evaluate(()=>document.body.dataset.screen),JSON.stringify(await g.page.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.innerText).slice(0,5))));
await g.shot(P+'86-after-restart');
log('errors',JSON.stringify(await g.close()));
