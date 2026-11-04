import {launch} from '../cap.mjs';
const P='meta-settings-errors-';
const pauseOpen=async g=>{await g.page.locator('[data-ui="pause"]').click();await g.page.waitForTimeout(800);};
const resume=async g=>{await g.page.locator('.pause-screen [data-ui="resume"]').click();await g.advance(.3);};
const soundState=g=>g.page.evaluate(()=>{const b=document.querySelector('.pause-screen [data-ui="sound"]');return {pressed:b.getAttribute('aria-pressed'),icon:b.querySelector('use').getAttribute('href'),ls:localStorage.getItem('circuit-crew-muted'),label:b.innerText}});
// --- Mute persistence: meeting, mute, reload, check; then lobby door
let g=await launch('meeting');await g.page.evaluate(()=>{localStorage.removeItem('circuit-crew-muted');localStorage.removeItem('circuit-crew-fov');});
await g.advance(.5);await pauseOpen(g);console.log('before',await soundState(g));
await g.page.locator('.pause-screen [data-ui="sound"]').click();await g.page.waitForTimeout(400);console.log('after click',await soundState(g));
await g.shot(P+'50-pause-muted');
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(.3);await pauseOpen(g);console.log('after reload',await soundState(g));await g.shot(P+'51-pause-after-reload');
// unmute again? keep muted and go to lobby via Jobs
await g.page.locator('.pause-screen [data-ui="jobs-reload"]').click();await g.page.waitForTimeout(4000);
console.log('url',await g.page.evaluate(()=>location.search+' '+document.body.dataset.screen));
console.log('lobby muted ls',await g.page.evaluate(()=>localStorage.getItem('circuit-crew-muted')));
// title screen: is there any sound toggle?
console.log('title sound buttons',await g.page.evaluate(()=>[...document.querySelectorAll('[data-ui="sound"]')].map(b=>b.closest('.screen')?.dataset.screen+':'+getComputedStyle(b).display)));
await g.page.evaluate(()=>localStorage.setItem('circuit-crew-muted','0'));
console.log('errors',await g.close());
// --- C camera reset in playground
g=await launch('playground');await g.advance(1);await g.shot(P+'52-playground-home');
await g.orbit(400,120);await g.zoom(-900);await g.shot(P+'53-playground-orbited');
await g.key('KeyC',1.2);await g.shot(P+'54-playground-after-C');
await g.survey();await g.shot(P+'55-playground-survey');await g.key('KeyC',1.2);await g.shot(P+'56-playground-survey-then-C');
// lens comparison, each followed by C
for(const [i,n] of [[0,'54-wide'],[1,'32-close']]){await pauseOpen(g);await g.page.locator('.pause-screen [data-ui="lens"]').click();await g.page.waitForTimeout(300);await resume(g);await g.key('KeyC',1.5);await g.shot(`${P}5${7+i}-playground-home-fov${n}`);}
await pauseOpen(g);await g.page.locator('.pause-screen [data-ui="lens"]').click();await resume(g);
console.log('fov ls',await g.page.evaluate(()=>localStorage.getItem('circuit-crew-fov')));
console.log('errors',await g.close());
