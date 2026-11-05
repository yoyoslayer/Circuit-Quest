// Observatory fix check (R5-021/044/045/064/115/124/305/306/359). Needs: npx.cmd vite --port 4194 --strictPort
//   set BASE=http://127.0.0.1:4194 && node mockups/review5/tools/fix-observatory/01-check.mjs
import {launch} from '../cap.mjs';
const g=await launch('observatory');
const log=(...a)=>console.log(...a);
await g.advance(1);
// R5-021: walk into the dome's back shell from the side; the low ring must stop Pip.
log('walk side->behind shell',await g.walk(-3.3,-6.75,.4,12),await g.page.evaluate(()=>{const p=window.__game.player.translation();return {x:+p.x.toFixed(2),z:+p.z.toFixed(2)}}));
log('walk into shell',await g.walk(-5.4,-7.0,.3,12),await g.page.evaluate(()=>{const p=window.__game.player.translation();return {x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}}));
await g.shot('fix-observatory-01-pip-by-shell');
await g.orbit(600,0);await g.shot('fix-observatory-02-pip-by-shell-orbit');
// Inside through the open front, onto the platform step.
log('walk in front',await g.walk(-6.6,-4.2,.4,12),await g.page.evaluate(()=>{const p=window.__game.player.translation();return {x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}}));
await g.orbit(-600,0);
await g.shot('fix-observatory-03-dome-open');
// The receiver line on the floor, rack -> bench, past the cart bay.
await g.walk(-2.4,.4,.4,12);await g.orbit(260,0);await g.shot('fix-observatory-04-rack-bench-cable');
await g.orbit(-260,0);
// Move the cart and sit at the bench.
await g.walk(-3.7,-.1,.6);await g.key('KeyE');await g.walk(-6,3.5,.6);await g.key('KeyE',.4);
await g.shot('fix-observatory-05-cart-down');
log('prompt after cart',await g.page.locator('.prompt-pill').textContent().catch(()=>null));
await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
await g.act('pick','C');await g.act('slot','shunt');for(let k=0;k<7;k++)await g.key('ArrowRight',.05);await g.act('route');await g.advance(.6);
await g.shot('fix-observatory-06-bench-job1');
await g.crop('fix-observatory-06c-tag',{x:520,y:420,width:520,height:300});
await g.act('log');await g.advance(.8);
let s=await g.snap();log('after log1',s.station.job,s.station.series,s.station.shutter,s.station.scope,await g.page.locator('.prompt-pill').textContent().catch(()=>null));
await g.shot('fix-observatory-07-job2-start');
await g.key('Escape',.5);await g.walk(-4.2,-.6,.4,12);await g.orbit(-260,0);await g.advance(.6);await g.shot('fix-observatory-08-job2-shutter-shut');
await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
await g.act('pick','L');await g.act('slot','series');await g.act('value',{slot:'series',value:.01});await g.act('value',{slot:'shunt',value:1e-6});await g.advance(.6);
await g.shot('fix-observatory-09-bench-LC');
await g.crop('fix-observatory-09c-tags',{x:420,y:400,width:640,height:320});
await g.act('scope','step');await g.advance(1.5);await g.shot('fix-observatory-10-step');
// A resonance: 10 mH with 150 nF.
await g.act('scope','signal');await g.act('value',{slot:'shunt',value:1.5e-7});await g.advance(.5);await g.shot('fix-observatory-11-resonance');
await g.act('value',{slot:'shunt',value:1e-6});await g.act('log');await g.advance(.15);await g.shot('fix-observatory-12-gust-0.15');await g.advance(.6);await g.shot('fix-observatory-13-gust-0.75');
s=await g.snap();log('after log2',s.station.job,s.station.vertical,s.station.reading.snr,s.station.scope,await g.page.locator('.prompt-pill').textContent().catch(()=>null));
await g.key('Escape',.5);await g.walk(-4.2,-.6,.4,12);await g.orbit(-260,0);await g.advance(.6);await g.shot('fix-observatory-14-job3-shutter-open');
log('errors',await g.close());

