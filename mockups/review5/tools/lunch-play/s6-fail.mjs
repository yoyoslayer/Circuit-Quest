import {launch} from '../cap.mjs';
const P='lunch-play-f';
let g=await launch('lunch',{fullfx:true});
await g.advance(85);let s=await g.snap();console.log('t85 temp',s.lunch.job.temperature.toFixed(2));await g.shot(P+'01-fridge-warm-85s');
await g.walk(-2,-1,.6);await g.walk(-4.5,-2,.6).catch(()=>{});s=await g.snap();console.log('near fridge',JSON.stringify(s.player),'temp',s.lunch.job.temperature.toFixed(2));
await g.advance(Math.max(0,118-s.time));await g.shot(P+'02-fridge-sad-118s');
await g.advance(4);s=await g.snap();console.log('failed',s.lunch.job.failed,'won',s.won,'t',s.time.toFixed(1));
await g.page.waitForTimeout(400);await g.shot(P+'03-spoil-beat');
await g.page.waitForSelector('body[data-failed="true"]',{timeout:15000});await g.shot(P+'04-spoil-card');
console.log('failtext',await g.page.evaluate(()=>document.querySelector('.fail-screen')?.innerText));
const t0=Date.now();await g.page.keyboard.press('KeyR');
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});
// wait until running
for(let i=0;i<100;i++){const r=await g.page.evaluate(()=>window.__circuitCrew?.snapshot().running);if(r)break;await g.page.waitForTimeout(100);}
console.log('retry to running ms',Date.now()-t0,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
await g.shot(P+'05-after-retry');
console.log('errors',await g.close());
