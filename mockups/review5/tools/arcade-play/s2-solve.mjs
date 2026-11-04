import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
await toBench(g,log);
const st=async(l)=>{const s=await g.snap();log(l,'t',s.time.toFixed(1),JSON.stringify({pw:s.station.powered,live:s.station.live,trip:s.station.tripped,soak:s.station.soak,done:s.station.soakDone,v:s.station.verdict,mis:s.station.mistakes,spent:s.station.spent,i:s.station.reading&&+(s.station.reading.iLoad*1000).toFixed(2),alarmed:s.alarmed}),JSON.stringify(await txt(g)));return s;};
// 1 pinball: press P with real key
await g.key('KeyP',.3);await st('pin power');await g.shot(P+'20-pinball-trip');
await g.advance(1);await st('pin +1');
await g.key('KeyX',.1);await g.key('Digit3',.1);await st('held 220');await g.shot(P+'21-holding-220');
await g.key('KeyA',.1);await st('placed');
await g.advance(2.6);await st('cooled');await g.advance(1.5);await st('mid soak');await g.shot(P+'22-pinball-playtest');
await g.advance(1.8);await st('soakdone');await g.shot(P+'23-pinball-passed');
await g.key('Enter',.3);await st('signed');await g.shot(P+'24-pinball-signoff');
await g.advance(1);await g.shot(P+'25-rhythm-start');await st('rhythm');
// 2 rhythm: flip, add 47, power
await g.key('KeyF',.1);await g.key('Digit1',.1);await g.key('KeyA',.1);await g.key('KeyP',.1);await g.advance(1);await st('rhythm mid');await g.shot(P+'26-rhythm-playtest');
await g.advance(2.5);await st('rhythm done');await g.key('Enter',.3);
// 3 claw: power with 220 -> pop
await g.shot(P+'27-claw-start');
await g.key('KeyP',.1);await g.advance(1.2);await st('claw heating');await g.shot(P+'28-claw-heating');
await g.advance(1.2);await st('claw popped');await g.shot(P+'29-claw-popped');
await g.key('Digit4',.1);await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyS',.1);await g.key('KeyP',.1);await g.advance(3.4);await st('claw done');await g.shot(P+'30-claw-passed');await g.key('Enter',.3);
// 4 handheld
await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyS',.1);await g.key('KeyP',.1);await g.advance(1.5);await st('hand mid');await g.shot(P+'31-handheld-playtest');await g.advance(2);await st('hand done');await g.key('Enter',.3);
// 5 hopper
await g.shot(P+'32-hopper-start');
await g.key('KeyP',.3);await st('hopper empty power');await g.advance(.3);await g.shot(P+'33-hopper-trip');
await g.advance(2.6);
await g.key('Digit4',.1);await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyS',.1);await g.advance(1.5);await st('hopper mid');await g.shot(P+'34-hopper-playtest');await g.advance(2);await st('hopper done');
await g.key('Enter',.3);let s=await st('final');log('won',s.won,'dmg',s.damage,'cost',s.cost);
await g.advance(.3);await g.shot(P+'35-win-pushin-0.3');
await g.page.waitForTimeout(2500);await g.advance(1.5);await g.shot(P+'36-win-result');
log('result',await g.page.evaluate(()=>document.querySelector('.result, [class*=result]')?.innerText));
log('errors',JSON.stringify(await g.close()));
