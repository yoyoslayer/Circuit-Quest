import {launch} from '../cap.mjs';import {txt,toBench} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
await toBench(g,log);
const st=async(l)=>{const s=await g.snap(),x=s.station;log(l,'t',s.time.toFixed(1),JSON.stringify({setup:x.setup,held:x.held,pw:x.powered,live:x.live,trip:x.tripped,cool:x.cooling,soak:x.soak,done:x.soakDone,mis:x.mistakes,trips:x.trips,spent:x.spent,iLoad:x.reading&&+(x.reading.iLoad*1000).toFixed(1)}),JSON.stringify(await txt(g)));return s;};
// New player: does what the prompt says (P Power on) on the broken start.
await st('cab0 start');
await g.key('KeyP',.3);await st('P as prompted');await g.shot(P+'30-cab0-power-as-prompted');
await g.advance(.4);await g.shot(P+'31-cab0-trip-0.7s');
await g.key('KeyP',.1);await st('P again while cooling (prompt says P Fuse cooling)');
await g.advance(2.6);await st('after cool, power state');
// Brute force with power on: remove the block, try 100, 220.
await g.key('KeyP',.1);await st('power on again');await g.advance(.3);
await g.key('KeyA',.1);await g.advance(.5);await st('removed 47 live (wire only)');await g.shot(P+'32-wire-only-live');
await g.advance(2.6);
await g.key('Digit2',.1);await g.key('KeyA',.1);await g.advance(1.2);await st('100 live');await g.shot(P+'33-100-live');
await g.advance(1.5);await st('after 100');
await g.key('KeyA',.1);await g.key('Digit3',.1);await g.key('KeyA',.1);if(!(await g.snap()).station.powered)await g.key('KeyP',.1);await g.advance(1.2);await st('220 live');await g.shot(P+'34-220-live');
await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyA',.1);if(!(await g.snap()).station.powered)await g.key('KeyP',.1);await g.advance(2.4);await st('470 live');
// Enter before passed? and leave bench mid-soak.
await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyA',.1);await g.advance(.6);await g.key('Enter',.1);await st('Enter mid-soak');
await g.key('KeyE',.3);await st('left bench mid-soak');await g.advance(2);await st('away 2s');await g.shot(P+'35-left-bench-soak-done');
// Look at the bench cabinet + kid from outside
await g.walk(-1.6,-.4,.4);await g.zoom(-1500);await g.orbit(-250,0);await g.shot(P+'36-bench-cabinet-kid');await g.zoom(800);
await g.walk(0,-1.55,.4);await g.key('KeyE',.4);await g.key('Enter',.3);await st('signed after away');
// Keys at the bench that are not bench keys: Space, Q, Tab, C
await g.key('Space',.4);let s=await st('space at bench');log('pose',JSON.stringify(s.pose),'player y',s.player.y.toFixed(2));
await g.key('Tab',1.2);await g.shot(P+'37-tab-at-bench');await st('tab at bench');await g.key('Tab',1);
await g.key('KeyQ',.2);await st('Q at bench');
// R at the bench (next to E): does it restart the run?
const before=(await g.snap()).time;await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(3000);
try{await g.page.waitForSelector('body[data-ready="true"]',{timeout:20000});}catch{}
s=await g.snap().catch(e=>({err:String(e)}));log('after R at bench',before.toFixed(1),'->',JSON.stringify({t:s.time,running:s.running,atBench:s.atBench,served:s.station?.served?.length}));
await g.shot(P+'38-after-R');
log('errors',JSON.stringify(await g.close()));
