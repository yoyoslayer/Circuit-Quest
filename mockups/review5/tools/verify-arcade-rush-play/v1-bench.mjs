import {launch} from '../cap.mjs';import {txt,toBench} from '../arcade-rush-play/common.mjs';
const P='verify-arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
let s=await g.snap();log('start dc',s.drawCalls,'t',s.time.toFixed(1));
await g.shot(P+'01-start');
await toBench(g,log);
const st=async(l)=>{const s=await g.snap(),x=s.station;log(l,'t',s.time.toFixed(2),JSON.stringify({job:x.job,fix:x.fix,setup:x.setup,held:x.held,pw:x.powered,trip:x.tripped,soak:x.soak,done:x.soakDone,mis:x.mistakes,trips:x.trips,spent:x.spent,dmg:s.damage,cost:s.cost,dc:s.drawCalls}),JSON.stringify(await txt(g)));return s;};
await st('cab0 start');await g.shot(P+'02-bench-start');
// F3: press P on the broken start as prompted
await g.key('KeyP',.4);await st('P as prompted');
// F10: HUD tally reads?
log('hud tallies',await g.page.evaluate(()=>[...document.querySelectorAll('.tally,[data-tally],[class*=tally]')].map(e=>`${e.className}:${e.hidden}:${e.innerText.replace(/\n/g,' ')}`).join(' || ')));
await g.crop(P+'03-hud-after-trip',{x:0,y:0,width:520,height:200});
await g.key('KeyP',.1);await g.advance(2.8);await st('powered off, cooled');
// set the fix with power off: lift 47, take 470, place A
await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyA',.1);await st('470 placed off');
await g.key('KeyP',.1);await g.advance(1);await st('470 live 1s');
// F2: live swap at human speed (0.3 s between keys): lift A, take 470, place A
await g.key('KeyA',.3);await st('lifted live +0.3');await g.key('Digit4',.3);await g.key('KeyA',.3);await st('swap done');await g.shot(P+'04-after-live-swap');
// alternative order (place new first, then lift old): 2 S then A
await g.advance(3);await g.key('KeyP',.1);await g.key('KeyP',.1);await g.advance(.5);await st('re-powered');
await g.key('Digit2',.3);await g.key('KeyS',.3);await g.key('KeyA',.3);await st('swap via other slot (470->100)');
await g.advance(2.6);await st('100 live');
// back to fix and play test
await g.key('KeyS',.3);await g.advance(3);s=await st('wire only again?');
if(s.station.powered){await g.key('KeyP',.1);}
await g.advance(2.8);
s=await g.snap();
// rebuild fix power off
for(const [i,p] of s.station.setup.chain.entries())for(const _ of p)await g.key(['KeyA','KeyS','KeyD'][i],.1);
await g.key('Digit4',.1);await g.key('KeyA',.1);await g.key('KeyP',.1);await g.advance(2.3);await st('soak');
await g.shot(P+'05-soak-passed');
// F6: sign off and look
await g.key('Enter',0);await g.advance(.1);await g.shot(P+'06-signoff+0.1');await g.advance(.3);await g.shot(P+'07-signoff+0.4');await st('after signoff');
// F5: Space at bench
const y0=(await g.snap()).player.y;await g.key('Space',.25);s=await g.snap();log('space at bench y',y0.toFixed(2),'->',s.player.y.toFixed(2),'pose',JSON.stringify(s.pose),'atBench',s.atBench);
await g.advance(1);
const before=(await g.snap());log('before R t',before.time.toFixed(1),'served',before.station.served.length);
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);
try{await g.page.waitForSelector('body[data-ready="true"]',{timeout:20000});}catch{}
s=await g.snap().catch(e=>({err:String(e)}));log('after R',JSON.stringify({t:s.time,running:s.running,atBench:s.atBench,served:s.station?.served?.length}));
log('errors',JSON.stringify(await g.close()));
