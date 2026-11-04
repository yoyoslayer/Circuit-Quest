import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('playground',{fullfx:true});
await g.advance(.5);
await g.key('KeyF',.1);
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]]){const r=await g.walk(x,z,.5);if(!r.arrived)console.log('stuck',x,z);}
await g.key('KeyF',.3);
await g.walk(6.6,-5.9,.4);await g.key('KeyE',.1);
let s=await g.snap();console.log('won',s.won,'time',s.time.toFixed(1),'dmg',s.damage,'cost',s.cost);
await g.advance(.6);await g.shot(`${K}-11-pg-win-push`);
await g.page.waitForSelector('body[data-complete="true"]',{timeout:15000});
await g.page.waitForTimeout(2600);
await g.shot(`${K}-12-pg-result-card`);
console.log('result text',await g.page.locator('.result-screen').innerText());
console.log('ls',await g.page.evaluate(()=>localStorage.getItem('circuit-crew:best:v1')));
// press R on result card: does it restart?
const u0=g.page.url();await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(1500);
console.log('after R url same?',g.page.url()===u0,'won still',(await g.snap()).won, 'screen',await g.page.evaluate(()=>document.body.dataset.screen));
await g.shot(`${K}-13-pg-result-after-R`);
// go back to lobby via Jobs button
const jobs=g.page.locator('.result-screen [data-ui="jobs-reload"]');console.log('jobs buttons',await jobs.count());
await Promise.all([g.page.waitForURL(/level=lobby/),jobs.first().click()]);
await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
await g.page.waitForTimeout(2500);
console.log('lobby screen',await g.page.evaluate(()=>document.body.dataset.screen),'running',(await g.snap()).running);
await g.shot(`${K}-14-lobby-after-pg`);
s=await g.snap();console.log('hub',JSON.stringify(s.hub.doors.map(d=>[d.id,d.done,d.locked])));
console.log('card',await g.page.locator('.objective').innerText().catch(()=>''));
await g.page.keyboard.press('Tab');await g.page.waitForTimeout(2000);await g.shot(`${K}-15-lobby-after-pg-survey`);
console.log('errors',JSON.stringify(await g.close()));
