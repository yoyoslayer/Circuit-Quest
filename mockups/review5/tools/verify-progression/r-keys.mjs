import {launch} from '../cap.mjs';
const K='verify-progression';
// 1) Garage bench: R reloads?
{const g=await launch('garage',{fullfx:true});
const R=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z);}};
await g.advance(.3);
await R([[6.4,-4.2]]);await g.key('KeyE');console.log('garage held',(await g.snap()).held);
await R([[3.4,-4],[2.5,-4.4]]);await g.key('KeyE',.3);
await R([[2.9,-4],[2.9,-1.1]]);await R([[0,-1.55]],.4);await g.key('KeyE');
await g.act('pulse');await g.advance(1);
let s=await g.snap();console.log('garage atBench',s.atBench,'t',s.time.toFixed(1),'onStand',s.station?.onStand);
await g.shot(`${K}-01-garage-bench-before-R`);
await g.page.evaluate(()=>{window.__m=1;});
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);
console.log('garage page survived R at bench?',await g.page.evaluate(()=>window.__m===1).catch(()=>false));
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});
s=await g.snap();console.log('garage after R atBench',s.atBench,'time',s.time,'running',s.running);
await g.shot(`${K}-02-garage-after-R`);
console.log('errors',JSON.stringify(await g.close()));}
// 2) Playground result card: R
{const g=await launch('playground',{fullfx:true});
await g.page.evaluate(()=>localStorage.clear());
await g.advance(.5);await g.key('KeyF',.1);
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]]){const r=await g.walk(x,z,.5);if(!r.arrived)console.log('stuck',x,z);}
await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE',.1);
let s=await g.snap();console.log('pg won',s.won,'time',s.time.toFixed(1));
await g.page.waitForSelector('body[data-complete="true"]',{timeout:15000});await g.page.waitForTimeout(2600);
await g.shot(`${K}-03-pg-result`);
await g.page.evaluate(()=>{window.__m=1;});
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2000);
console.log('pg survived R on result?',await g.page.evaluate(()=>window.__m===1).catch(()=>false),'screen',await g.page.evaluate(()=>document.body.dataset.screen).catch(()=>'?'));
await g.shot(`${K}-04-pg-result-after-R`);
console.log('ls',await g.page.evaluate(()=>localStorage.getItem('circuit-crew:best:v1')));
console.log('errors',JSON.stringify(await g.close()));}
