import {launch} from '../cap.mjs';
const P='meta-settings-errors-';
const scr=g=>g.page.evaluate(()=>({screen:document.body.dataset.screen,failed:document.body.dataset.failed,complete:document.body.dataset.complete,url:location.search,ss:sessionStorage.getItem('circuit-crew:autostart')}));
const waitRunning=async(g,t0)=>{for(let i=0;i<400;i++){try{const s=await g.page.evaluate(()=>window.__circuitCrew?.snapshot?.().running&&document.body.dataset.ready==='true'&&document.body.dataset.screen==='play');if(s)return Date.now()-t0;}catch{}await g.page.waitForTimeout(50);}return -1;};
// 1) Playground win -> result card -> press R
let g=await launch('playground');await g.advance(.2);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);
await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE',.5);await g.advance(2);
await g.page.waitForTimeout(2500);
console.log('won',(await g.snap()).won,await scr(g));
await g.shot(P+'30-playground-result-card');
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);
console.log('after R on result:',await scr(g),'won',(await g.snap()).won);
await g.shot(P+'31-playground-result-after-R');
// Enter on result = next job? 
const t1=Date.now();await g.page.keyboard.press('Enter');await g.page.waitForTimeout(500);
const rt=await waitRunning(g,t1);console.log('Enter on result -> running in ms',rt,await scr(g));
console.log('pg errors',await g.close());
// 2) Lunch spoil -> fail card
g=await launch('lunch');await g.advance(.2);
const ts=Date.now();await g.advance(125);
for(let i=0;i<100;i++){const s=await scr(g);if(s.failed)break;await g.page.waitForTimeout(100);}
console.log('fail card after real ms',Date.now()-ts,await scr(g));
await g.shot(P+'32-lunch-spoil-card');
const tR=Date.now();await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(3000);
console.log('after R on fail card (3 s):',await scr(g),'won',(await g.snap()).won);
await g.shot(P+'33-lunch-spoil-after-R');
const tE=Date.now();await g.page.keyboard.press('Enter');
const et=await waitRunning(g,tE);console.log('Enter on fail -> running in ms',et,await scr(g));
await g.advance(.5);await g.shot(P+'34-lunch-after-retry');
console.log('lunch errors',await g.close());
