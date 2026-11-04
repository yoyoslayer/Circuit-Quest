import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
const S=async l=>{const s=await g.snap();const t=s.station;log(l,'t',s.time.toFixed(1),JSON.stringify({atB:s.atBench,held:s.held,tray:t.trayReady,pw:t.powered,live:t.live,trip:t.tripped,soak:t.soak,done:t.soakDone,mis:t.mistakes,trips:t.trips,spent:t.spent,idx:t.index}),JSON.stringify(await txt(g)));return s;};
// a) bench before tray
await g.walk(1.2,-1.3,.5);await g.walk(0,-1.55,.4);await S('at stand no tray');await g.key('KeyE',.4);await S('E no tray');await g.shot(P+'50-bench-no-tray');
await g.key('Digit3',.2);await S('3 no tray');await g.key('KeyP',.2);await S('P no tray');
await g.key('Escape',.3);await S('esc');
// b) fetch tray and THROW it at the bench
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.5);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.5);await g.walk(.6,.9,.4);
// face the bench: walk a tiny bit toward it
await g.walk(.4,.3,.3);await S('aim');
await g.key('KeyQ',1.5);let s=await S('thrown');log('tray pos',JSON.stringify(s.items));await g.shot(P+'51-tray-thrown-at-bench');
// pick it up again near where it landed
const tp=s.items[0].pos;await g.walk(tp.x,tp.z+.9,.5);await S('near thrown tray');await g.key('KeyE');await S('regrab');await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);await S('delivered');
await g.walk(0,-1.55,.4);await g.key('KeyE',.4);
// c) DR-19: power -> trip -> fix -> P
await g.key('KeyP',.3);await S('P trip');await g.key('KeyX');await g.key('Digit3');await g.key('KeyA');await S('fixed while tripped');
await g.key('KeyP',.3);await S('P after fix (retry)');await g.advance(3);await S('3s later');await g.shot(P+'52-retry-P-powered-off');
await g.key('KeyP',.3);await S('P again');await g.advance(1.2);await S('mid soak');await g.key('KeyP',.2);await S('P during "Play test"');await g.shot(P+'53-P-during-playtest');
// e) brute force with power on: rapid swaps
await g.key('KeyP',.1);
await g.key('KeyA',.05);
for(const k of ['Digit1','Digit2','Digit3','Digit4']){await g.key(k,.05);await g.key('KeyA',.3);const s=await g.snap();log('bf',k,(s.station.reading.iLoad*1000).toFixed(1),'mis',s.station.mistakes,'trips',s.station.trips);await g.key('KeyA',.05);}
await S('after brute force');
// f) R at bench
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(3000);
const ready=await g.page.evaluate(()=>document.body.dataset.ready);log('after R ready',ready);
try{const s2=await g.page.evaluate(()=>window.__circuitCrew.snapshot());log('after R',s2.time,s2.atBench,s2.running,s2.station?.trayReady);}catch(e){log('snap fail',e.message)}
await g.shot(P+'54-after-R-at-bench');
log('errors',JSON.stringify(await g.close()));
