import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('lobby',{fullfx:true});
await g.advance(.5);
const d=(await g.snap()).hub.doors.find(d=>d.id==='meeting');
await g.walk(d.at.x,d.at.z,.4);await g.advance(.3);
const t0=Date.now();
await Promise.all([g.page.waitForURL(/level=meeting/),g.page.keyboard.press('KeyE')]);
await g.page.waitForTimeout(250);await g.page.screenshot({path:'mockups/review5/shots/'+K+'-41-door-to-meeting-loading.png'});
await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
const t1=Date.now();console.log('door->meeting ready ms',t1-t0);
await g.page.waitForTimeout(300);await g.page.screenshot({path:'mockups/review5/shots/'+K+'-42-meeting-first-frame.png'});
const s=await g.page.evaluate(()=>window.__circuitCrew.snapshot());console.log('running',s.running,'time',s.time.toFixed(2),'screen',await g.page.evaluate(()=>document.body.dataset.screen));
// pause -> Jobs -> lobby
await g.page.keyboard.press('Escape');await g.page.waitForTimeout(400);
const t2=Date.now();await Promise.all([g.page.waitForURL(/level=lobby/),g.page.locator('.pause-screen [data-ui="jobs-reload"]').click()]);
await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});console.log('meeting->lobby ready ms',Date.now()-t2);
await g.page.waitForTimeout(500);const s2=await g.page.evaluate(()=>window.__circuitCrew.snapshot());console.log('lobby player',JSON.stringify(s2.player));
console.log('errors',JSON.stringify(await g.close()));
