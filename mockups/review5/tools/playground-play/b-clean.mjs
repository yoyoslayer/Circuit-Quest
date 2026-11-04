// playground-play B: the clean solution step by step (tests/routes.spec.ts route), with timing.
import {launch} from '../cap.mjs';
import {hud,props,brief} from './lib.mjs';
const K='playground-play';
const g=await launch('playground',{fullfx:true});
await g.advance(.3);
const ps=await props(g);
const count={};for(const p of ps)count[p.kind]=(count[p.kind]??0)+1;console.log('kinds',JSON.stringify(count));
console.log('reels/splitters',JSON.stringify(ps.filter(p=>['reel','splitter','coupler','strip','plug'].includes(p.kind))));
const log=async tag=>{const s=await g.snap();console.log(tag,JSON.stringify(brief(s)),JSON.stringify(await hud(g)));return s;};
await log('start');
await g.key('KeyF',.2);await log('after F');await g.shot(`${K}-10-holding-plug`);
const legs=[[-5,-1],[-4,-4],[5.8,-5.5]];let t0=(await g.snap()).time;
for(const [i,[x,z]] of legs.entries()){const r=await g.walk(x,z);const s=await log(`leg${i} arrived=${r.arrived}`);console.log('  leg time',(s.time-t0).toFixed(2));t0=s.time;
  await g.shot(`${K}-1${i+1}-leg${i}`);}
await g.key('KeyF',.3);await log('after plug F');await g.shot(`${K}-14-plugged`);
await g.walk(6.6,-5.9,.4);await log('at switch');await g.shot(`${K}-15-at-switch`);
await g.key('KeyE',.05);await log('after E');
await g.page.waitForTimeout(300);await g.shot(`${K}-16-win-instant`);
await g.page.waitForTimeout(1200);await g.shot(`${K}-17-win-pushin`);
await g.page.waitForTimeout(2500);await g.shot(`${K}-18-result`);
const res=await g.page.evaluate(()=>document.querySelector('.result-screen')?.innerText);console.log('result',JSON.stringify(res));
console.log('errors',JSON.stringify(await g.close()));
