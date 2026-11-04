import {launch} from './hook.mjs';
const g=await launch('playground');await g.advance(.3);await g.drain('start');
const ctx=await g.page.evaluate(()=>({muted:localStorage.getItem('circuit-crew-muted')}));console.log('ctx',JSON.stringify(ctx));
await g.key('KeyF');await g.drain('pick up plug (F)');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z,.5);await g.drain('walk with cable');
await g.page.keyboard.press('KeyF');await g.drain('plug in (F)');
const hs=await g.page.evaluate(()=>0);await g.advance(.05);await g.shot('juice-audio-01-playground-plugin');
await g.walk(6.6,-5.9,.4);await g.drain('walk to switch');
await g.page.keyboard.press('KeyE');await g.drain('switch on (E) -> win');await g.advance(.15);await g.shot('juice-audio-02-playground-win-0.15s');
await g.advance(1.5);await g.page.waitForTimeout(1500);await g.drain('win +1.5s');await g.page.waitForTimeout(1200);await g.drain('result card');await g.shot('juice-audio-03-playground-result');
// unplug / slingshot / prop break in a fresh run
console.log('errors',await g.close());
const h=await launch('playground');await h.advance(.3);await h.drain('start2');
await h.key('KeyF');await h.walk(9,3.7);await h.drain('walk');await h.advance(2.5,['KeyW','ShiftLeft']);await h.drain('overstretch sprint');
await h.page.keyboard.press('KeyQ');await h.drain('slingshot Q');await h.advance(.1);await h.shot('juice-audio-04-playground-slingshot');await h.advance(1.5);await h.drain('slingshot aftermath (breaks/alarm)');
// mute check
await h.page.evaluate(()=>document.querySelector('[data-ui="sound"]')?.click());const m=await h.page.evaluate(()=>localStorage.getItem('circuit-crew-muted'));console.log('muted after click',m, await h.page.evaluate(()=>document.querySelector('[data-ui="sound"]')?.getAttribute('aria-label')));
await h.page.reload();await h.page.waitForSelector('body[data-ready="true"]');const m2=await h.page.evaluate(()=>({ls:localStorage.getItem('circuit-crew-muted'),pressed:document.querySelector('[data-ui="sound"]')?.getAttribute('aria-pressed')}));console.log('after reload',JSON.stringify(m2));
await h.page.evaluate(()=>{localStorage.setItem('circuit-crew-muted','0');});
console.log('errors',await h.close());
