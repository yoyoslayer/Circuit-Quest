import {launch,now} from './hook.mjs';
const route=async(g,pts,r=.45)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
// A) short in the leak (water) and a thin-cable scorch
let g=await launch('lunch');await g.advance(.3);await g.drain('start');
await g.walk(-3,7,.4);await g.page.keyboard.press('KeyE');await g.walk(0,1.4);await g.page.keyboard.press('KeyE');await g.advance(.5);await g.drain('wedge door');
await g.walk(-10,7.5,.3);await g.page.keyboard.press('KeyF');await g.drain('take thick');
await route(g,[[1,3],[.2,-1.2],[-3.5,-3]]);await g.drain('walk thick');await g.page.keyboard.press('KeyF');await g.advance(.15);await now(g,'juice-audio-10-lunch-short-instant');await g.drain('plug thick through leak -> SHORT');
let s=await g.snap();console.log('b tripped',s.lunch.sources.find(x=>x.id==='b').tripped,'events',JSON.stringify(s.lunch.events.slice(-3)));
await g.advance(.8);await g.shot('juice-audio-11-lunch-short-settled');
console.log('errA',await g.close());
// B) overload trip of Supply A: fridge+... skip; C) spoil fail
g=await launch('lunch');await g.advance(.3);await g.drain('start');
for(let i=0;i<12;i++){await g.advance(10);}
s=await g.snap();console.log('t',s.time,'failed',s.lunch.job.failed,'fridge',JSON.stringify(s.lunch.job).slice(0,200));
await g.drain('wait 120s (warnings?)');
let n=0;while(!(await g.snap()).lunch.job.failed&&n<20){await g.advance(1);n++;}
await now(g,'juice-audio-12-lunch-spoil-instant');await g.drain('SPOIL moment');
await g.advance(.5);await g.page.waitForTimeout(1500);await g.drain('spoil +1.5s (fail card)');await g.shot('juice-audio-13-lunch-spoil-card');
console.log('failed attr',await g.page.evaluate(()=>document.body.dataset.failed));
console.log('errC',await g.close());
