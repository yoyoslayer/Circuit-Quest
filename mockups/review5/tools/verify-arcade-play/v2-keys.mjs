import {launch} from '../cap.mjs';import {toBench,txt} from '../arcade-play/common.mjs';
const P='verify-arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
await toBench(g,log);await g.advance(.3);
const st=async(l)=>{const s=await g.snap();const t=await txt(g);log(l,JSON.stringify({p:s.station.powered,live:s.station.live,trip:s.station.tripped,soak:s.station.soak,done:s.station.soakDone,mis:s.station.mistakes,trips:s.station.trips,idx:s.station.index,atBench:s.atBench,time:+s.time.toFixed(2),py:+(s.player?.y??-1).toFixed?.(2)}),'prompt:',t.prompt);return s;};
// A: power -> trip -> fix while cooling -> press P (as prompt says)
await g.key('KeyP',.4);await st('after P trip');
await g.key('KeyX');await g.key('Digit3');await g.key('KeyA');await st('fixed while cooling');
await g.key('KeyP',.1);await st('after retry P');await g.advance(3);await st('3s later');
await g.shot(P+'04-retry-P-after-trip');
// recover: power on, start play test, then press P during play test
await g.key('KeyP',1.5);await st('powered again 1.5s');
await g.key('KeyP',.1);await st('P during play test');
await g.key('KeyP',3.4);await st('playtest done');
// Space at bench
const before=await g.snap();
await g.page.keyboard.down('Space');await g.advance(.25);await g.page.keyboard.up('Space');const sp=await g.snap();log('space player y before/after',JSON.stringify(before.player),JSON.stringify(sp.player));
await g.shot(P+'05-space-at-bench');await g.advance(1);
// Tab at bench
await g.key('Tab',1.2);const tb=await g.snap();log('tab survey',tb.survey,'atBench',tb.atBench);await g.shot(P+'06-tab-at-bench');await g.key('Tab',1);
// sign off cabinet 1, then R
await g.key('Enter',.2);await st('signed');
const nav=g.page.waitForNavigation({timeout:8000}).then(()=>'reloaded').catch(()=>'no reload');
await g.page.keyboard.press('KeyR');log('R ->',await nav);
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000}).catch(()=>{});
const s2=await g.snap().catch(e=>({err:String(e)}));log('after R',JSON.stringify({time:s2.time,served:s2.station?.served?.length,atBench:s2.atBench,running:s2.running}));
log('errors',JSON.stringify(await g.close()));
