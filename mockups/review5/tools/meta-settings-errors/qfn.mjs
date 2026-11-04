import {launch} from '../cap.mjs';
const P='meta-settings-errors-';
let g=await launch('qfn');await g.advance(.3);
await g.zoom(1500);await g.shot(P+'60-qfn-zoomed-out-38');
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE',1.2);
console.log('atBench',(await g.snap()).atBench);
let r=await g.act('ship');console.log('ship',JSON.stringify(r).slice(0,150));await g.advance(.05);
await g.shot(P+'61-qfn-sendback');
r=await g.act('check');console.log('check right after send-back',r.ok);
const c0=(await g.snap()).station.checks;await g.page.keyboard.press('KeyC');await g.advance(.3);console.log('C at bench checks',c0,'->',(await g.snap()).station.checks);
await g.shot(P+'62-qfn-after-C-check');
// Tab at the bench
await g.page.keyboard.press('Tab');await g.advance(.5);await g.shot(P+'63-qfn-bench-tab');
await g.page.keyboard.press('Escape');await g.advance(1.5);console.log('atBench',(await g.snap()).atBench);
await g.shot(P+'64-qfn-after-standup');
console.log('errors',await g.close());
// arcade fuse trip: inputs during trip
g=await launch('arcade');await g.advance(.3);
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.6);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.6);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.act('power');await g.advance(.3);let s=(await g.snap()).station;console.log('tripped',s.tripped);
await g.shot(P+'65-arcade-fuse-trip');
r=await g.act('slot','across');console.log('input during trip ok',r.ok);r=await g.act('pick',220);console.log('pick',r.ok);r=await g.act('slot',0);console.log('slot',r.ok);
s=(await g.snap()).station;console.log('tripped still',s.tripped,'cooling',s.cooling);
console.log('errors',await g.close());
