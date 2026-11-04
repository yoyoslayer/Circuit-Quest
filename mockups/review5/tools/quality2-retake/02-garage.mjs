// Garage kickback arc (DR-66 PULSE at +0.1/+0.4/+1.0 s) and rim vs norim at quality 2, each with a q0 twin of the same sim frame.
import {launch2,q} from './cap2.mjs';
const K='quality2-retake';let nn=40;
const g=await launch2('garage',{fullfx:true},'2');
const setQ=async v=>{await g.page.evaluate(v=>window.__game.view.setQuality(v),v);await g.page.evaluate(()=>window.__game.render(0));};
const pair=async(state)=>{const n=String(nn++).padStart(2,'0');await setQ(2);await g.page.waitForTimeout(600);await g.shot(`${K}-${n}-garage-${state}`);await setQ(0);await g.shot(`${K}-${n}-garage-${state}-q0`);await setQ(2);console.log(n,state,JSON.stringify(await q(g)));};
await g.advance(1);
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);console.log('atBench',(await g.snap()).atBench);
await g.advance(.5);await pair('bench');
await g.act('pulse');await g.advance(.1);await pair('arc-0.1');
await g.advance(.3);await pair('arc-0.4');
await g.advance(.6);await pair('arc-1.0');
console.log('errors',JSON.stringify(await g.close()));
// rim vs norim, both quality 2, zoom 9 at spawn
for(const [tag,query] of [['rim',''],['norim','norim']]){const h=await launch2('garage',{fullfx:true,query},'2');await h.advance(1);await h.zoom(-1500);await h.page.waitForTimeout(1500);await h.shot(`${K}-50-garage-zoom9-${tag}`);
  await h.page.evaluate(()=>window.__game.view.setQuality(0));await h.advance(.05);await h.shot(`${K}-50-garage-zoom9-${tag}-q0`);console.log(tag,await h.close());}
