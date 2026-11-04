import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const hook=g=>g.page.evaluate(async()=>{const m=await import('/src/game.ts');const o=m.Game.prototype.snapshot;m.Game.prototype.snapshot=function(){window.__G=this;return o.call(this);};window.__circuitCrew.snapshot();});
const state=g=>g.page.evaluate(()=>({screen:document.body.dataset.screen,survey:window.__G?.survey,paused:window.__G?.paused,running:window.__G?.running,won:window.__G?.won,mark:!!window.__mark,focus:document.activeElement?.getAttribute('data-ui')||document.activeElement?.tagName}));
async function press(g,label){await g.page.evaluate(()=>{window.__mark=1;});await hook(g);const before=await state(g);await g.page.keyboard.press('Tab');await g.page.waitForTimeout(300);const afterTab=await state(g);
  await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(1500);let afterR;try{afterR=await state(g);}catch(e){afterR={err:e.message};}
  log(label,JSON.stringify({before,afterTab,afterR,url:g.page.url()}));}
// (13) title hero + (11) title keys
let g=await launch('lobby',{start:false});await g.advance(.5);await g.shot(P+'13-title-hero');
await press(g,'TITLE');log('errors',JSON.stringify(await g.close()));
// Jobs board (?level=playground without autostart)
g=await launch('playground',{start:false});await g.advance(.3);await g.shot(P+'11a-jobs-board');await press(g,'JOBS');await g.shot(P+'11b-jobs-board-after-tab-r');log('errors',JSON.stringify(await g.close()));
// pause card
g=await launch('playground');await g.advance(.5);await g.key('Escape',0);await g.page.waitForTimeout(400);await g.shot(P+'11c-pause-card');await press(g,'PAUSE');await g.shot(P+'11d-pause-after-tab-r');log('errors',JSON.stringify(await g.close()));
// result card: playground clean win
g=await launch('playground');await g.advance(.3);await g.key('KeyF');for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE');await g.advance(4);
log('won',(await g.snap()).won);await g.shot(P+'11e-result-card');await press(g,'RESULT');await g.shot(P+'11f-result-after-tab-r');
// (12) L5: press the result card's Jobs button, then reload ?level=lobby
const jobs=g.page.locator('.screen[data-screen="result"] [data-ui="jobs"]');log('jobs btn',await jobs.count());
if(await jobs.count()){await jobs.first().click();await g.page.waitForSelector('body[data-ready="true"]');await g.page.waitForTimeout(800);log('after Jobs',g.page.url(),await g.page.evaluate(()=>document.body.dataset.screen));
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');await g.page.waitForTimeout(1200);log('after F5',g.page.url(),await g.page.evaluate(()=>document.body.dataset.screen));await g.shot(P+'12-lobby-reload-after-jobs');}
log('errors',JSON.stringify(await g.close()));
