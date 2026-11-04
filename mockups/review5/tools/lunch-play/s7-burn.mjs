import {launch} from '../cap.mjs';
const P='lunch-play-b';
const g=await launch('lunch',{fullfx:true});
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
const R=async(pts,r=.5)=>{for(const [x,z] of pts)await W(x,z,r);};
await W(-3,7,.4);await g.key('KeyE');await W(0,1.4);await g.key('KeyE');await g.advance(.5);
await W(2,8,.4);await g.key('KeyE');await W(.3,2,.45);await g.advance(4);await W(2,2);await g.key('KeyE');
await W(-10,7.5,.3);await g.key('KeyF');await R([[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.5);
await R([[.3,-1.3],[.3,2.4]]);await W(-10.8,2,.4);await g.key('KeyF');await R([[.3,2.4],[.3,-1.3]]);await W(-3.8,-1.7,.4);await g.key('KeyF');
let s=await g.snap();await g.advance(Math.max(0,21-s.lunch.job.bake));s=await g.snap();console.log('baked',s.lunch.job.tray,s.time.toFixed(1));
// Pip stands at oven waiting: tray hidden? check visibility
await W(-2.4,-5.4,.5);await g.zoom(-800);await g.shot(P+'01-baked-tray-close');
// try to pick up tray with F instead of E (wrong key)
await g.key('KeyF');s=await g.snap();console.log('F at tray -> held',s.held,s.lunch.held);
if(s.lunch.held){await g.key('KeyF');}
await g.zoom(800);
await g.advance(61);s=await g.snap();console.log('ovenWait',s.lunch.job.ovenWait.toFixed(1),'tray',s.lunch.job.tray);await g.shot(P+'02-burn-warning');
await g.advance(30);s=await g.snap();console.log('burned?',s.lunch.job.tray,s.lunch.job.failed);
await g.page.waitForTimeout(200);await g.shot(P+'03-burn-beat');
await g.page.waitForSelector('body[data-failed="true"]',{timeout:15000});await g.shot(P+'04-burn-card');
const t0=Date.now();
await Promise.all([g.page.waitForNavigation({timeout:60000}),g.page.keyboard.press('KeyR')]);
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});
const tReady=Date.now()-t0;
for(let i=0;i<200;i++){const r=await g.page.evaluate(()=>window.__circuitCrew?.snapshot().running);if(r)break;await g.page.waitForTimeout(50);}
console.log('retry ready ms',tReady,'running ms',Date.now()-t0,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
await g.shot(P+'05-after-retry');
console.log('errors',await g.close());
